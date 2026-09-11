import React, { useState } from 'react';
import { fmtPct, daysBetween, tone, isNil } from '../lib/format.jsx';

// 有效操作单口径：状态须为「已确认生效 / 生效」，且批次日期距最新数据日不超过 MAX_AGE 天。
// 不做任何自动延长；超期即视为历史。
const EFFECTIVE_STATUS = ['已确认生效', '生效'];
const MAX_AGE_DAYS = 3;

const badgeStyle = (status) => {
  if (EFFECTIVE_STATUS.includes(status)) return { background: '#ecfdf5', color: '#047857' };
  if (String(status || '').includes('待')) return { background: '#fef3c7', color: '#b45309' };
  return { background: '#f1f5f9', color: '#64748b' };
};

export function AdviceRisk({ data }) {
  const advice = data.advice || [];
  const meta = data.meta || {};
  const asOf = meta.updated;
  const rows = data.holdings || [];
  const s = data.summary || {};

  const effective = advice.filter((a) => EFFECTIVE_STATUS.includes(a.status));
  const graded = effective.filter((a) => {
    const d = daysBetween(a.date, asOf);
    return d !== null && d <= MAX_AGE_DAYS;
  });
  const current = graded[0] || null;
  const staleEffective = !current && effective.length ? effective[0] : null;

  const [showHistory, setShowHistory] = useState(false);
  const history = advice.filter((a) => !current || a.date !== current.date);

  // ---- 风险提示（全部由既有数据推导，缺失即标—） ----
  const risks = [];
  const snap = /券商台账\s*(\d{4}-\d{2}-\d{2})/.exec(meta.asOf || '');
  if (snap) {
    risks.push({
      ic: '⚠️',
      t: '数据时效',
      d: `持仓数量/成本与现金为券商台账 ${snap[1]}；当日权益与成交未回传，正式交易数量以数据源为准。`,
    });
  }
  risks.push({
    ic: '⚠️',
    t: '基金净值日期缺失',
    d: '看板数据未包含基金净值日期，基金当日收益按「—」处理、不计入当日盈亏，避免把「未更新」误当零收益。',
  });
  const pnlRows = rows.filter((h) => !isNil(h.ratio) && h.type !== '现金');
  if (pnlRows.length) {
    const top = pnlRows.reduce((a, b) => (Number(a.ratio) >= Number(b.ratio) ? a : b));
    risks.push({ ic: 'ⓘ', t: '集中度', d: `单一标的最大占比 ${Number(top.ratio).toFixed(1)}%（${top.name}）。`, info: true });
  }
  const deepLoss = rows.filter((h) => !isNil(h.gainRate) && Number(h.gainRate) <= -20 && h.type !== '现金');
  if (deepLoss.length) {
    risks.push({
      ic: '⚠️',
      t: '浮亏超 20%',
      d: deepLoss.map((h) => `${h.name} ${fmtPct(h.gainRate)}`).join('、') + '（按持仓成本口径）。',
    });
  }
  const pending = advice.find((a) => String(a.status || '').includes('待'));
  if (pending) {
    risks.push({ ic: '⏳', t: '待人工裁决', d: `${pending.date} 批次状态为「${pending.status}」，未自动执行、未自动延长有效期。` });
  }

  return (
    <div className="card" id="adviceRisk">
      <div className="card-head">
        <div className="card-title">
          今日建议与风险 <span className="card-hint">· 仅有单据才视为「当前有效」</span>
        </div>
      </div>

      {current ? (
        <div className="advice-item">
          <div className="advice-head">
            <span className="advice-date">{current.date}</span>
            <span className="advice-status advice-badge-current">{current.status}</span>
            <span className="advice-version">{current.version}</span>
            <span className="card-hint">当前有效</span>
          </div>
          <div className="advice-summary">{current.summary}</div>
          {current.plan ? <div className="advice-plan">执行要点：{current.plan}</div> : null}
        </div>
      ) : (
        <div className="advice-none">
          <div className="t">暂无有效建议</div>
          <div>
            有效期口径：状态须为「已确认生效／生效」，且批次日期距最新数据日（{asOf || '—'}）不超过 {MAX_AGE_DAYS} 个自然日。
            {staleEffective
              ? `最新一条「已确认生效」为 ${staleEffective.date}，距今 ${daysBetween(staleEffective.date, asOf)} 天，已超期，不再作为当前有效操作单。`
              : '当前无任何「已确认生效」记录。'}
          </div>
          <div style={{ marginTop: 4 }}>系统不自动延长有效期；如需继续执行，请重新出具并确认新的操作单。</div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div className="card-title" style={{ fontSize: 14, marginBottom: 10 }}>风险提示</div>
        <div className="risk-list">
          {risks.map((r, i) => (
            <div className={'risk-item' + (r.info ? ' info' : '')} key={i}>
              <span className="risk-ic">{r.ic}</span>
              <span>
                <span className="risk-t">{r.t}：</span>
                {r.d}
              </span>
            </div>
          ))}
        </div>
        <div className="card-hint" style={{ marginTop: 8 }}>
          以上为数据与流程状态提示，非投资建议。当前持仓盈亏合计 {fmtPct(s.totalRate)}。
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="link-btn" type="button" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? '▾ 收起历史建议' : `▸ 查看历史建议（${history.length} 条，标注「历史／待复核」）`}
        </button>
        {showHistory ? (
          <div style={{ marginTop: 10 }}>
            {history.map((a) => (
              <div className="advice-item hist" key={a.date}>
                <div className="advice-head">
                  <span className="advice-date">{a.date}</span>
                  <span className="advice-status" style={badgeStyle(a.status)}>{a.status}</span>
                  <span className="advice-version">{a.version}</span>
                  <span className="advice-status advice-badge-hist">历史／待复核</span>
                </div>
                <div className="advice-summary">{a.summary}</div>
                {a.plan ? <div className="advice-plan">执行要点：{a.plan}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
