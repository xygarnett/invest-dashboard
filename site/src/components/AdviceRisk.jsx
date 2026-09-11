import React, { useState } from 'react';
import { fmtPct, DateChip, isNil, WarnIcon } from '../lib/format.jsx';
import { fundNavDates } from './Overview.jsx';

/* 操作单有效性：只读上游 status 原值，不做任何日期推算、不自动延长有效期。
   上游 advice.json 明确的状态枚举为 已确认生效/生效/接近触发/已触发/待复核，
   其中只有「已确认生效」「生效」表示生效；status 缺失时显示「待复核」。 */
const EFFECTIVE_STATUS = ['已确认生效', '生效'];
const isEffective = (st) => EFFECTIVE_STATUS.includes(String(st || '').trim());
const statusLabel = (st) => {
  const s = String(st || '').trim();
  return s || '待复核';
};
const statusClass = (st) => {
  if (isEffective(st)) return 'st-effective';
  if (String(st || '').includes('待') || !String(st || '').trim()) return 'st-pending';
  return 'st-other';
};

export function AdviceRisk({ data }) {
  const advice = [...(data.advice || [])].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const meta = data.meta || {};
  const rows = data.holdings || [];
  const s = data.summary || {};

  const latest = advice[0] || null;
  const history = advice.slice(1);
  const [showHistory, setShowHistory] = useState(false);

  // ---- 风险提示（全部由既有数据推导，缺失即标 —；不使用 Emoji） ----
  const risks = [];
  const snap = /券商台账\s*(\d{4}-\d{2}-\d{2})/.exec(meta.asOf || '');
  if (snap) {
    risks.push({
      ic: 'warn',
      t: '数据时效',
      d: `持仓数量/成本与现金为券商台账 ${snap[1]}；当日权益与成交未回传，正式交易数量以数据源为准。`,
    });
  }
  const navDates = fundNavDates(rows);
  risks.push({
    ic: 'warn',
    t: '基金净值日期',
    d: navDates
      ? `基金净值日期为 ${navDates}（各基金取值可能不同，来源于计算当前市值所用的同一条净值记录）；基金当日盈亏不计入「股票当日盈亏」，避免把「未更新」当成零收益。`
      : '看板未取得基金净值日期，基金当日收益按「—」处理且不计入当日盈亏，避免把「未更新」当成零收益。',
  });
  const pnlRows = rows.filter((h) => !isNil(h.ratio) && h.type !== '现金');
  if (pnlRows.length) {
    const top = pnlRows.reduce((a, b) => (Number(a.ratio) >= Number(b.ratio) ? a : b));
    risks.push({ ic: 'warn', t: '集中度', d: `单一标的最大占比 ${Number(top.ratio).toFixed(1)}%（${top.name}）。` });
  }
  const deepLoss = rows.filter((h) => !isNil(h.gainRate) && Number(h.gainRate) <= -20 && h.type !== '现金');
  if (deepLoss.length) {
    risks.push({
      ic: 'warn',
      t: '浮亏超 20%',
      d: deepLoss.map((h) => `${h.name} ${fmtPct(h.gainRate)}`).join('、') + '（按持仓成本口径）。',
    });
  }
  if (latest && !isEffective(latest.status)) {
    risks.push({
      ic: 'warn',
      t: '操作单未确认生效',
      d: `${latest.date} 批次上游状态为「${statusLabel(latest.status)}」，未自动执行、本页也不自行延长或判定有效期。`,
    });
  }

  return (
    <section className="card" id="adviceRisk">
      <div className="card-head">
        <div className="card-title">今日建议与风险</div>
        <div className="card-hint">状态与日期取自上游操作单，本页不做有效期判定</div>
      </div>

      {latest ? (
        <div className={'advice-item' + (isEffective(latest.status) ? '' : ' pending')}>
          <div className="advice-head">
            <span className="advice-date">{latest.date}</span>
            <span className={'advice-status ' + statusClass(latest.status)}>{statusLabel(latest.status)}</span>
            {latest.version ? <span className="advice-version">{latest.version}</span> : null}
            <span className="card-hint">
              {isEffective(latest.status) ? '上游状态：生效' : '上游状态：未确认生效'}
            </span>
          </div>
          <div className="advice-summary">{latest.summary}</div>
          {latest.plan ? <div className="advice-plan">执行要点：{latest.plan}</div> : null}
        </div>
      ) : (
        <div className="advice-none">暂无操作单记录（上游 advice.json 为空）。</div>
      )}

      <div className="sub-block">
        <div className="sub-title">风险提示</div>
        <div className="risk-list">
          {risks.map((r, i) => (
            <div className="risk-item" key={i}>
              <span className="risk-ic">
                <WarnIcon />
              </span>
              <span>
                <span className="risk-t">{r.t}：</span>
                {r.d}
              </span>
            </div>
          ))}
        </div>
        <div className="note-line">以上为数据与流程状态提示，非投资建议。当前持仓盈亏合计 {fmtPct(s.totalRate)}。</div>
      </div>

      <div className="date-chips">
        <DateChip label="操作单最新批次" value={latest ? latest.date : '—'} warn={!latest} />
        <DateChip label="看板数据更新" value={meta.updated || '—'} />
      </div>

      {history.length ? (
        <div className="sub-block">
          <button className="link-btn" type="button" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? '▾ 收起历史操作单' : `▸ 查看历史操作单（${history.length} 条，状态原样展示）`}
          </button>
          {showHistory ? (
            <div className="advice-history">
              {history.map((a) => (
                <div className="advice-item hist" key={a.date + a.version}>
                  <div className="advice-head">
                    <span className="advice-date">{a.date}</span>
                    <span className={'advice-status ' + statusClass(a.status)}>{statusLabel(a.status)}</span>
                    {a.version ? <span className="advice-version">{a.version}</span> : null}
                  </div>
                  <div className="advice-summary">{a.summary}</div>
                  {a.plan ? <div className="advice-plan">执行要点：{a.plan}</div> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
