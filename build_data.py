# -*- coding: utf-8 -*-
"""生成 dashboard/data.json（单一数据文件，字段名固定）。
用法：python build_data.py

数据来源（全部外置，本脚本内**无任何会过期的硬编码数据**）：
  - holdings_snapshot.json  持仓行（唯一持仓来源；含现金行与 m1/m6/cumGain/ratio 口径，由 16:45/20:30 任务维护）
  - static_data.json        低频/静态：account（账户历史汇总）/brokerYearly/insurance/priceHistory/stockCostRef/stockNames
  - meta.json               时间戳口径 meta.updated / meta.asOf / meta.market（缺失即阻断，不用猜测时间）
  - fund_nav.json / trades.json / advice.json   外部数据文件（缺失即阻断）
  - ../holdings.json        已实现收益 realizedGain 来源（缺失即阻断）

阻断策略：任一数据源缺失/解析失败/字段非法 → 打印错误并 exit(2)，**不生成** data.json。
更新方式：改对应源文件后重跑本脚本；不得在本脚本内回填静态数据。
"""
import io, json, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)


def load(name):
    p = os.path.join(BASE, name)
    with io.open(p, encoding='utf-8') as f:
        return json.load(f)


def fail(msg):
    print('BUILD_BLOCKED: ' + msg, file=sys.stderr)
    sys.exit(2)


# ---------- 持仓：唯一来源 holdings_snapshot.json（无静态回退） ----------
try:
    snap = load('holdings_snapshot.json')
except Exception as e:
    fail('holdings_snapshot.json 不可读: %s' % e)
holdings = snap.get('holdings')
if not holdings or not isinstance(holdings, list):
    fail('holdings_snapshot.json 缺少非空 holdings 数组')
required = ('name', 'code', 'type', 'cost', 'value', 'gain', 'gainRate',
            'dayGain', 'cumGain', 'm1', 'm6', 'ratio')
for h in holdings:
    missing = [k for k in required if k not in h]
    if missing:
        fail('holdings 行 %s 缺少字段 %s' % (h.get('code', '?'), ','.join(missing)))

# ---------- 静态数据：static_data.json（无静态回退） ----------
try:
    sd = load('static_data.json')
except Exception as e:
    fail('static_data.json 不可读: %s' % e)
for k in ('account', 'brokerYearly', 'insurance', 'priceHistory', 'stockCostRef', 'stockNames', 'stockCodes'):
    if not sd.get(k):
        fail('static_data.json 缺少字段 %s' % k)
if not isinstance(sd['priceHistory'], list):
    fail('static_data.priceHistory 必须为数组')
for row in sd['priceHistory']:
    if 'date' not in row or 'rows' not in row:
        fail('static_data.priceHistory 存在缺 date/rows 的行: %s' % row)

account = sd['account']
brokerYearly = sd['brokerYearly']
insurance = sd['insurance']
priceHistory = sd['priceHistory']
stockCostRef = sd['stockCostRef']
stockNames = sd['stockNames']
stockCodes = list(sd['stockCodes'])
unknown = [c for c in stockCodes if c not in stockNames]
if unknown:
    fail('stockCodes 含未在 stockNames 中登记的代码: %s' % unknown)

# 成本参考的「数量/现价」自动跟随当前持仓，避免与 holdings 脱节
# （成本价 costPrice 与回本线 breakeven 仍为静态值，不由本脚本推算）
held = {}
for h in holdings:
    if h.get('type') == '股票' and (h.get('quantity') or 0) > 0:
        held[h['code']] = h
synced = []
for s in stockCostRef:
    h = held.get(s.get('code'))
    if h:
        s['qty'] = h['quantity']
        s['last'] = round(h['value'] / h['quantity'], 2)
        synced.append(s['code'])
stale_ref = [s.get('code') for s in stockCostRef if s.get('code') not in held]
print('costRef 数量/现价已按持仓同步:', synced)
if stale_ref:
    print('NOTE: stockCostRef 含非当前持仓代码（不自动清理，需人工确认）:', stale_ref)

# ---------- 时间戳口径：meta.json（缺失即阻断，不用修改时间猜测） ----------
try:
    meta = load('meta.json')
except Exception:
    fail('meta.json 缺失：无法确定 meta.updated/asOf/market，阻断生成（请先由数据任务写入 meta.json）')
for k in ('updated', 'asOf', 'market'):
    if not meta.get(k):
        fail('meta.json 缺少字段 %s' % k)
if '·' not in meta.get('market', '') and '股' not in meta.get('market', ''):
    fail('meta.json market 字段格式异常: %s' % meta.get('market'))

# ---------- 外部数据文件（缺失即阻断） ----------
try:
    fundNav = load('fund_nav.json')
except Exception as e:
    fail('fund_nav.json 不可读: %s' % e)
try:
    trades = load('trades.json').get('trades')
except Exception as e:
    fail('trades.json 不可读: %s' % e)
if trades is None:
    fail('trades.json 缺少 trades 数组')
try:
    advice = load('advice.json').get('advice')
except Exception as e:
    fail('advice.json 不可读: %s' % e)
if advice is None:
    fail('advice.json 缺少 advice 数组')

# ---------- 已实现收益：券商台账 holdings.json（唯一来源） ----------
try:
    with io.open(os.path.join(ROOT, 'holdings.json'), encoding='utf-8') as f:
        hj = json.load(f)
    realizedGain = hj['realizedGain']
except Exception as e:
    fail('../holdings.json 不可读或无 realizedGain: %s' % e)

# ---------- 汇总（由 holdings 计算，不信任预存 summary） ----------
totalCost = round(sum(h['cost'] for h in holdings), 2)
totalValue = round(sum(h['value'] for h in holdings), 2)
totalGain = round(totalValue - totalCost, 2)
totalRate = round(totalGain / totalCost * 100, 2) if totalCost else 0
totalCombined = round(totalGain + realizedGain, 2)
combinedRate = round(totalCombined / totalCost * 100, 2) if totalCost else 0

data = {
    'meta': {'updated': meta['updated'], 'asOf': meta['asOf'], 'market': meta['market']},
    'summary': {
        'totalCost': totalCost, 'totalValue': totalValue, 'totalGain': totalGain,
        'totalRate': totalRate, 'realizedGain': realizedGain,
        'totalCombined': totalCombined, 'combinedRate': combinedRate,
        'holdingsCount': len(holdings),
    },
    'holdings': holdings,
    'account': account,
    'brokerYearly': brokerYearly,
    'stockCostRef': stockCostRef,
    'stockNames': stockNames,
    'stockCodes': stockCodes,
    'priceHistory': priceHistory,
    'fundNav': fundNav,
    'trades': trades,
    'advice': advice,
    'insurance': insurance,
}

out = os.path.join(BASE, 'data.json')
with io.open(out, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('data.json written,', len(json.dumps(data, ensure_ascii=False)), 'chars')
print('totalValue =', totalValue, '| totalGain =', totalGain, '| holdings =', len(holdings),
      '| meta.updated =', data['meta']['updated'])
