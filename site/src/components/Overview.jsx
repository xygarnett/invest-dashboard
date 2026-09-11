import React from 'react';
import { fmtMoney, Money, Pct, Nil, typeColor, DateChip, isNil } from '../lib/format.jsx';

/* 基金净值日期：直接取「计算当前市值所用净值记录」的日期（持仓快照 navDate）；
   任一只缺失即整项显示「—」，不推测、不填充。 */
export function fundNavDates(rows) {
  const funds = (rows || []).filter((h) => h.type === '基金');
  if (!funds.length) return null;
  if (funds.some((h) => !h.navDate)) return null;
  return [...new Set(funds.map((h) => h.navDate))].sort().join('、');
}

export function snapshotDate(meta) {
  const m = /券商台账\s*(\d{4}-\d{2}-\d{2})/.exec((meta || {}).asOf || '');
  return m ? m[1] : null;
}

export function AssetCards({ data }) {
  const s = data.summary || {};
  const rows = data.holdings || [];
  const meta = data.meta || {};
  const cash = rows.find((h) => h.type === '现金');
  const stockRows = rows.filter((h) => h.type === '股票');
  const posCount = rows.filter((h) => h.type !== '现金').length;

  // 股票当日盈亏：仅累计「有当日行情」的股票。基金净值未更新不得当作零收益 → 不计入。
  const dayRows = stockRows.filter((h) => !isNil(h.dayGain));
  const daySum = dayRows.length ? dayRows.reduce((a, h) => a + Number(h.dayGain || 0), 0) : null;
  const fundRows = rows.filter((h) => h.type === '基金');
  const fundPending = fundRows.length > 0;

  const cards = [
    {
      label: '总资产（含现金）',
      main: <span className="kpi-plain">{fmtMoney(s.totalValue)}</span>,
      sub: `${posCount} 项持仓（不含现金） · 成本 ${fmtMoney(s.totalCost)}`,
    },
    {
      label: '股票当日盈亏',
      chip: fundPending ? '基金待更新' : null,
      main: <Money v={daySum} signed />,
      sub: dayRows.length
        ? `仅含 ${dayRows.length} 只有当日行情的股票；基金净值未更新，未计入`
        : '暂无可用当日行情',
    },
    {
      label: '持仓盈亏',
      main: (
        <span className="kpi-plain">
          <Money v={s.totalGain} signed />
          <span className="kpi-rate">
            {' '}
            <Pct v={s.totalRate} />
          </span>
        </span>
      ),
      sub: `持仓成本 ${fmtMoney(s.totalCost)} · 已实现 ${fmtMoney(s.realizedGain)}`,
    },
    {
      label: '可用现金',
      main: <span className="kpi-plain">{cash ? fmtMoney(cash.value) : <Nil />}</span>,
      sub: '单独列示 · 不计入持仓数与筛选',
    },
  ];

  const navDates = fundNavDates(rows);

  return (
    <section id="overview">
      <div className="kpi-row">
        {cards.map((c) => (
          <div className="kpi-card" key={c.label}>
            <div className="kpi-label">
              {c.label}
              {c.chip ? <span className="kpi-chip">{c.chip}</span> : null}
            </div>
            <div className="kpi-value">{c.main}</div>
            <div className="kpi-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="date-chips">
        <DateChip label="股票行情" value={`${meta.updated || '—'} ${meta.market || ''}`.trim()} />
        <DateChip label="基金净值日期" value={navDates || '—'} warn={!navDates} />
        <DateChip label="持仓数量·成本·现金" value={snapshotDate(meta) ? `券商台账 ${snapshotDate(meta)}` : '—'} warn={!snapshotDate(meta)} />
        <DateChip label="账户历史快照" value={(data.account || {}).period || '—'} />
      </div>
      {meta.asOf ? <div className="note-line">数据口径：{meta.asOf}</div> : null}
    </section>
  );
}

export function Allocation({ data }) {
  const rows = data.holdings || [];
  const total = rows.reduce((a, h) => a + Number(h.value || 0), 0) || 1;
  const classes = [...new Set(rows.map((h) => h.type))];
  const order = ['基金', '股票', '现金'].filter((t) => classes.includes(t));
  const groups = order.map((t) => {
    const val = rows.filter((h) => h.type === t).reduce((a, h) => a + Number(h.value || 0), 0);
    return { type: t, val, pct: (val / total) * 100, n: rows.filter((h) => h.type === t).length };
  });

  return (
    <div>
      {groups.map((g) => (
        <div className="alloc-row" key={g.type}>
          <span className="alloc-dot" style={{ background: typeColor[g.type] || '#94A3B8' }} />
          <span className="alloc-name">{g.type}</span>
          <span className="alloc-bar">
            <span className="fill" style={{ width: g.pct.toFixed(1) + '%', background: typeColor[g.type] || '#94A3B8' }} />
          </span>
          <span className="alloc-pct">{g.pct.toFixed(1)}%</span>
          <span className="alloc-val">{fmtMoney(g.val)}</span>
        </div>
      ))}
      <div className="note-line">合计 {fmtMoney(total)} · 基金/股票按市值、现金按余额</div>
    </div>
  );
}

export function AccountSummary({ data }) {
  const a = data.account || {};
  const rows = data.holdings || [];
  const cash = rows.find((h) => h.type === '现金');
  return (
    <div>
      <div className="acct-card">
        <div className="acct-icon">券</div>
        <div className="acct-info">
          <div className="acct-name">{a.name || '—'}</div>
          <div className="acct-meta">
            {a.openDate || '—'} 开户
            <span className="dot-sep">·</span>
            数据区间 {a.period || '—'}
          </div>
        </div>
      </div>
      <table className="tbl tbl-kv">
        <tbody>
          <tr>
            <td>期末资产（历史快照）</td>
            <td className="num">{isNil(a.endAsset) ? <Nil /> : fmtMoney(a.endAsset)}</td>
          </tr>
          <tr>
            <td>银证净流入</td>
            <td className="num">{isNil(a.netInflow) ? <Nil /> : fmtMoney(a.netInflow)}</td>
          </tr>
          <tr>
            <td>至今账户盈亏</td>
            <td className="num">
              <Money v={a.accountGain} signed />
            </td>
          </tr>
          <tr>
            <td>当前可用现金</td>
            <td className="num">{cash ? fmtMoney(cash.value) : <Nil />}</td>
          </tr>
        </tbody>
      </table>
      <div className="date-chips">
        <DateChip label="账户历史快照" value={a.period || '—'} />
      </div>
    </div>
  );
}
