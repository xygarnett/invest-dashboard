import React from 'react';
import { fmtMoney, Money, Pct, typeColor, DateChip, isNil } from '../lib/format.jsx';

export function AssetCards({ data }) {
  const s = data.summary || {};
  const rows = data.holdings || [];
  const meta = data.meta || {};
  const cash = rows.find((h) => h.type === '现金');
  const stocks = rows.filter((h) => h.type === '股票');
  const posCount = rows.filter((h) => h.type !== '现金').length;

  // 当日盈亏：仅累计「有当日行情」的标的（股票）。基金净值未更新不得当作零收益 → 不计入。
  const dayRows = stocks.filter((h) => !isNil(h.dayGain));
  const daySum = dayRows.length ? dayRows.reduce((a, h) => a + Number(h.dayGain || 0), 0) : null;

  const cards = [
    {
      label: '总资产（含现金）',
      main: <span>{fmtMoney(s.totalValue)}</span>,
      sub: `${posCount} 项持仓 · 成本 ${fmtMoney(s.totalCost)}`,
    },
    {
      label: '当日盈亏',
      main: <Money v={daySum} signed />,
      sub: dayRows.length ? `股票口径（${dayRows.length} 只）；基金净值未更新，未计入` : '暂无可用当日行情',
    },
    {
      label: '持仓盈亏',
      main: (
        <span>
          <Money v={s.totalGain} signed />
          <span className="kpi-rate"> <Pct v={s.totalRate} /></span>
        </span>
      ),
      sub: `持仓成本 ${fmtMoney(s.totalCost)}`,
    },
    {
      label: '可用现金',
      main: <span>{cash ? fmtMoney(cash.value) : '—'}</span>,
      sub: '股票账户现金 · 不计入持仓数',
    },
  ];

  return (
    <div id="overview">
      <div className="kpi-row">
        {cards.map((c) => (
          <div className="kpi-card" key={c.label}>
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value">{c.main}</div>
            <div className="kpi-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="date-chips">
        <DateChip label="股票行情" value={`${meta.updated || '—'} ${meta.market || ''}`.trim()} />
        <DateChip label="基金净值日期" value="—（看板数据未含）" warn />
        <DateChip label="持仓数量/成本与现金" value={snapshotDate(meta) || '—'} warn />
      </div>
      {meta.asOf ? <div className="card-hint" style={{ marginTop: 8, lineHeight: 1.6 }}>数据口径：{meta.asOf}</div> : null}
    </div>
  );
}

function snapshotDate(meta) {
  const m = /券商台账\s*(\d{4}-\d{2}-\d{2})/.exec(meta.asOf || '');
  return m ? m[1] : null;
}

export function Allocation({ data }) {
  const rows = data.holdings || [];
  const total = rows.reduce((a, h) => a + Number(h.value || 0), 0) || 1;
  const groups = ['基金', '股票', '现金']
    .map((t) => {
      const val = rows.filter((h) => h.type === t).reduce((a, h) => a + Number(h.value || 0), 0);
      return { type: t, val, pct: (val / total) * 100, n: rows.filter((h) => h.type === t).length };
    })
    .filter((g) => g.n > 0);

  return (
    <div>
      {groups.map((g) => (
        <div className="alloc-row" key={g.type}>
          <span className="alloc-dot" style={{ background: typeColor[g.type] || '#94a3b8' }} />
          <span className="alloc-name">{g.type}</span>
          <span className="alloc-bar">
            <span className="fill" style={{ width: g.pct.toFixed(1) + '%', background: typeColor[g.type] || '#94a3b8' }} />
          </span>
          <span className="alloc-pct">{g.pct.toFixed(1)}%</span>
          <span className="alloc-val">{fmtMoney(g.val)}</span>
        </div>
      ))}
      <div className="card-hint" style={{ marginTop: 4 }}>
        合计 {fmtMoney(total)} · 基金/股票按市值、现金按余额
      </div>
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
            {a.openDate || '—'} 开户 · 数据区间 {a.period || '—'}
          </div>
        </div>
      </div>
      <table className="tbl">
        <tbody>
          <tr>
            <td>期末资产（历史快照）</td>
            <td>{fmtMoney(a.endAsset)}</td>
          </tr>
          <tr>
            <td>银证净流入</td>
            <td>{fmtMoney(a.netInflow)}</td>
          </tr>
          <tr>
            <td>至今账户盈亏</td>
            <td><Money v={a.accountGain} signed /></td>
          </tr>
          <tr>
            <td>当前可用现金</td>
            <td>{cash ? fmtMoney(cash.value) : '—'}</td>
          </tr>
        </tbody>
      </table>
      <div className="date-chips">
        <DateChip label="账户快照区间" value={a.period || '—'} />
      </div>
    </div>
  );
}
