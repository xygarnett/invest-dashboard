import React, { useState } from 'react';
import { fmtMoney, fmtNum, fmtPct, Money, tone, DateChip, isNil } from '../lib/format.jsx';

/* ---------- 成本参考（整行宽度） ---------- */
export function CostRef({ data }) {
  const rows = data.stockCostRef || [];
  const asOf = data.meta || {};
  const snap = /券商台账\s*(\d{4}-\d{2}-\d{2})/.exec(asOf.asOf || '');
  const notes = [...new Set(rows.map((r) => r.breakevenNote).filter(Boolean))].join('；');
  return (
    <div className="card" id="costRef">
      <div className="card-head">
        <div className="card-title">
          持仓股票成本参考 <span className="card-hint">· 成本口径与快照日期见下</span>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>标的</th>
              <th>数量</th>
              <th>成本均价</th>
              <th>回本成本</th>
              <th>现价</th>
              <th>口径说明</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code}>
                <td>
                  <span className="nm">{r.name}</span>
                  <div className="code">{r.code}</div>
                </td>
                <td>{fmtNum(r.qty, 0)}</td>
                <td>{fmtNum(r.costPrice, 4)}</td>
                <td>{isNil(r.breakeven) ? '—' : fmtNum(r.breakeven, 4)}</td>
                <td>{fmtNum(r.last, 2)}</td>
                <td className="cell-left">{r.breakevenNote || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="date-chips">
        <DateChip label="成本快照" value={snap ? snap[1] : asOf.updated || '—'} warn={!snap} />
        <DateChip label="成本口径" value={notes || '—'} />
      </div>
      <div className="card-hint" style={{ marginTop: 6 }}>
        回本成本为含税费估算，仅供参考；数量与现价随持仓自动同步。
      </div>
    </div>
  );
}

/* ---------- 券商历史累计 ---------- */
export function BrokerYearly({ data }) {
  const by = data.brokerYearly || {};
  const years = Object.keys(by).sort();
  const max = Math.max(1, ...years.map((y) => Math.abs(Number(by[y]) || 0)));
  return (
    <div>
      {years.map((y) => {
        const v = Number(by[y]) || 0;
        const w = (Math.abs(v) / max) * 100;
        return (
          <div className="year-row" key={y}>
            <span className="year-lbl">{y}</span>
            <span className="year-bar">
              <span className="fill" style={{ width: w.toFixed(1) + '%', background: v >= 0 ? '#dc2626' : '#059669' }} />
            </span>
            <span className={'year-amt ' + tone(v)}>{fmtMoney(v, 0)}</span>
          </div>
        );
      })}
      <div className="date-chips">
        <DateChip label="账户历史快照" value={(data.account || {}).period || '—'} />
      </div>
    </div>
  );
}

/* ---------- 行情历史（默认最近日期，早期折叠） ---------- */
export function PriceHistory({ data }) {
  const [expanded, setExpanded] = useState(false);
  const ph = data.priceHistory || [];
  const codes = data.stockCodes || [];
  const names = data.stockNames || {};
  const shown = expanded ? ph : ph.slice(-3);
  const startIdx = ph.length - shown.length;

  return (
    <div className="card" id="priceHistory">
      <div className="card-head">
        <div className="card-title">
          行情历史 <span className="card-hint">· 日线收盘（前复权）</span>
        </div>
        <button className="link-btn" type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '▾ 仅看最近 3 个交易日' : `▸ 展开更早记录（共 ${ph.length} 个交易日）`}
        </button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>日期</th>
              {codes.map((c) => (
                <th key={c}>{names[c] || c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => {
              const gi = startIdx + i;
              return (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  {codes.map((c) => {
                    const cur = (row.rows || {})[c];
                    const prev = gi > 0 ? ((ph[gi - 1].rows || {})[c] || {}).close : null;
                    const pct = cur && prev ? ((cur.close - prev) / prev) * 100 : null;
                    return (
                      <td key={c}>
                        {cur ? fmtNum(cur.close, 2) : '—'}
                        {pct === null ? '' : ' '}
                        {pct === null ? null : <span className={tone(pct)} style={{ fontSize: 11 }}>{fmtPct(pct, 2)}</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="date-chips">
        <DateChip label="行情数据截至" value={ph.length ? ph[ph.length - 1].date : '—'} warn />
        <DateChip label="基金净值历史" value="—（本页未展示，见上方净值日期缺失说明）" warn />
      </div>
    </div>
  );
}

/* ---------- 交易记录（默认最近 5 条，长备注可展开） ---------- */
export function Trades({ data }) {
  const all = data.trades || [];
  const [showAll, setShowAll] = useState(false);
  const [openNote, setOpenNote] = useState(null);
  const rows = showAll ? all : all.slice(0, 5);
  const latest = all.length ? all[0].date : '—';

  return (
    <div className="card" id="trades">
      <div className="card-head">
        <div className="card-title">
          交易记录 <span className="card-hint">· 默认最近 5 条</span>
        </div>
        {all.length > 5 ? (
          <button className="link-btn" type="button" onClick={() => { setShowAll((v) => !v); setOpenNote(null); }}>
            {showAll ? '▾ 收起，仅看最近 5 条' : `▸ 查看全部（${all.length} 条）`}
          </button>
        ) : null}
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>日期</th>
              <th>标的</th>
              <th>操作</th>
              <th>价格</th>
              <th>数量</th>
              <th>金额</th>
              <th>已实现</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const long = (t.note || '').length > 34;
              const shownNote = !long || openNote === i ? t.note : t.note.slice(0, 34) + '…';
              return (
                <tr key={t.date + t.code + i}>
                  <td>{t.date}</td>
                  <td>
                    <span className="nm">{t.name}</span>
                    <div className="code">{t.code}</div>
                  </td>
                  <td className={String(t.action || '').includes('卖') ? 'text-down' : String(t.action || '').includes('买') ? 'text-up' : ''}>
                    {t.action}
                  </td>
                  <td>{fmtNum(t.price, t.price < 10 ? 3 : 2)}</td>
                  <td>{fmtNum(t.quantity, 2)}</td>
                  <td>{fmtMoney(t.amount)}</td>
                  <td>{isNil(t.realizedGain) ? '—' : <Money v={t.realizedGain} signed />}</td>
                  <td className="cell-left" style={{ maxWidth: 360 }}>
                    <span className={openNote === i ? 'wrap-cell' : ''} style={{ whiteSpace: openNote === i ? 'normal' : 'nowrap' }}>
                      {shownNote}
                    </span>
                    {long ? (
                      <>
                        {' '}
                        <button className="link-btn" type="button" onClick={() => setOpenNote((v) => (v === i ? null : i))}>
                          {openNote === i ? '收起' : '展开'}
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="date-chips">
        <DateChip label="成交记录最新" value={latest} />
        <DateChip label="共" value={`${all.length} 条`} />
      </div>
    </div>
  );
}
