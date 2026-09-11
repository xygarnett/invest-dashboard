# -*- coding: utf-8 -*-
"""看板批次发布器（canonical，唯一发布入口）。

作用：把当日 21:00 验收批次一次性写入 `advice.json` + `meta.json`，
      再调用 `build_data.py` 由数据源统一重建 `data.json`。
      这样可以保证 advice / meta / data 三者**永不失步**（此前是每日各写一次的一次性脚本，易脱节）。

用法（推荐载荷式，避免命令行转义问题）：
    python publish_batch.py --payload batch.json
    python publish_batch.py --payload batch.json --dry-run

    batch.json 结构：
    {
      "date": "2026-09-11",                 # 批次/交易日（必填）
      "version": "V2.7.0-v11-...",          # 规则版本（必填）
      "status": "已验收·待人工裁决",          # 状态（必填）
      "summary": "...",                      # 收盘审核结论（必填）
      "plan": "...",                         # 执行要点（必填）
      "asOf": "...",                         # meta.asOf（必填）
      "market": "A股 · 已收盘（09-11周五交易日）",  # meta.market（必填）
      "metaUpdated": "2026-09-11"            # meta.updated（可选，默认=date）
    }

参数式（等价，适合少量字段）：
    python publish_batch.py --date ... --version ... --status ... \
        --summary ... --plan ... --asof ... --market ... [--meta-updated ...]

行为与保证：
  - advice.json：按 date 去重；不存在则前插到 advice[0]；updated = "<date> 21:30"；保留 note 等既有键
  - meta.json  ：只更新 updated/asOf/market，保留 schema/note 等既有键
  - 然后调用 build_data.py 重建 data.json（生成器失败 → 整体失败）
  - 全部为原子写（临时文件 + os.replace），任一校验失败 → exit(2) 且不改动任何文件
  - 幂等：同一批次重复执行，三个文件内容不变
"""
import argparse
import io
import json
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
ADVICE = os.path.join(BASE, 'advice.json')
META = os.path.join(BASE, 'meta.json')
BUILD = os.path.join(BASE, 'build_data.py')

REQUIRED = ('date', 'version', 'status', 'summary', 'plan', 'asOf', 'market')


def fail(msg):
    print('PUBLISH_BLOCKED: ' + msg, file=sys.stderr)
    sys.exit(2)


def load_json(path, required=True):
    if not os.path.exists(path):
        if required:
            fail('缺少文件 %s' % path)
        return None
    try:
        with io.open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        fail('%s JSON 解析失败: %s' % (os.path.basename(path), e))


def atomic_dump(path, obj):
    tmp = path + '.tmp'
    with io.open(tmp, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write('\n')
    os.replace(tmp, path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--payload', help='批次 JSON 文件路径')
    for k in REQUIRED:
        ap.add_argument('--' + k.lower() if k != 'asOf' else '--asof')
    ap.add_argument('--meta-updated')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    if a.payload:
        batch = load_json(os.path.abspath(a.payload))
    else:
        batch = {}
        for k in REQUIRED:
            v = getattr(a, 'asof' if k == 'asOf' else k.lower())
            if v:
                batch[k] = v
        if a.meta_updated:
            batch['metaUpdated'] = a.meta_updated

    missing = [k for k in REQUIRED if not batch.get(k)]
    if missing:
        fail('批次缺少必填字段: %s' % ','.join(missing))
    date = batch['date']
    meta_updated = batch.get('metaUpdated') or date

    advice_entry = {
        'date': date,
        'version': batch['version'],
        'status': batch['status'],
        'summary': batch['summary'],
        'plan': batch['plan'],
    }

    advice = load_json(ADVICE)
    entries = advice.get('advice')
    if not isinstance(entries, list):
        fail('advice.json 缺少 advice 数组')
    dup = [i for i, e in enumerate(entries) if e.get('date') == date]
    if dup:
        new_advice = list(entries)
        new_advice[dup[0]] = advice_entry
        action = '覆盖已有同日条目(idx=%d)' % dup[0]
    else:
        new_advice = [advice_entry] + entries
        action = '前插新条目'
    advice['advice'] = new_advice
    advice['updated'] = '%s 21:30' % date

    meta = load_json(META)
    meta['updated'] = meta_updated
    meta['asOf'] = batch['asOf']
    meta['market'] = batch['market']
    if 'schema' not in meta:
        meta['schema'] = 'meta-v1'

    print('批次日期 = %s | meta.updated = %s | %s' % (date, meta_updated, action))
    if a.dry_run:
        print('DRY-RUN：未写入任何文件。')
        return

    atomic_dump(ADVICE, advice)
    atomic_dump(META, meta)
    print('advice.json / meta.json 已原子写入。')

    r = subprocess.run([sys.executable, BUILD], capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        print(r.stdout, file=sys.stderr)
        print(r.stderr, file=sys.stderr)
        fail('build_data.py 失败（exit=%d），data.json 未被更新为半成品' % r.returncode)
    print(r.stdout.strip())


if __name__ == '__main__':
    main()
