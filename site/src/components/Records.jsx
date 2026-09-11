import React, { useState } from 'react';
import { fmtMoney, fmtNum, fmtPct, Money, Nil, tone, DateChip, isNil } from '../lib/format.jsx';

/* ---------- 成本参考（整行宽度） ---------- */
export function CostRef({ data }) {
  const rows = data.stockCostRef || [];
  const meta = data.meta || {};
  const snap = /券商台账\s*(\d{4}-\d{2}-\d{2})/.exec(meta.asOf || '');
  const notes = [...new Set(rows.map((r) => r.breakevenNote).filter(Boolean))].join('；');
  return (
    <section className="card" id="costRef">
      <div className="card-head">
        <div className="card-title">持仓股票成本参考</div>
        <div className="card-hint">数量与现价随持仓自动同步 · 口径与快照日期见下方标识</div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl tbl-cost">
          <thead>
            <tr>
              <th className="cell-left">标的</th>
              <th>数量</th>
              <th>成本均价</th>
              <th>回本成本</th>
              <th>现价</th>
              <th className="cell-left">口径说明</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code}>
                <td className="cell-left">
                  <div className="nm-wrap">{r.name}</div>
                  <div className="code">{r.code}</div>
                </td>
                <td className="num">{fmtNum(r.qty, 0)}</td>
                <td className="num">{fmtNum(r.costPrice, 4)}</td>
                <td className="num">{isNil(r.breakeven) ? <Nil /> : fmtNum(r.breakeven, 4)}</td>
                <td className="num strong">{fmtNum(r.last, 2)}</td>
                <td className="cell-left note-cell">{r.breakevenNote || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="date-chips">
        <DateChip label="成本快照" value={snap ? `券商台账 ${snap[1]}` : meta.updated || '—'} warn={!snap} />
        <DateChip label="成本口径" value={notes || '—'} />
      </div>
      <div className="note-line">回本成本为含税费估算，仅供参考。</div>
    </section>
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
              <span className="fill" style={{ width: w.toFixed(1) + '%', background: v >= 0 ? '#DC2626' : '#059669' }} />
            </span>
            <span className={'year-amt num ' + tone(v)}>{fmtMoney(v, 0)}</span>
          </div>
        );
      })}
      <div className="date-chips">
        <DateChip label="账户历史快照" value={(data.account || {}).period || '—'} />
      </div>
    </div>
  );
}

/* ---------- 行情历史（默认最近 3 个交易日，早期折叠；截止日期取真实数据） ---------- */
export function PriceHistory({ data }) {
  const [expanded, setExpanded] = useState(false);
  const ph = data.priceHistory || [];
  const codes = data.stockCodes || [];
  const names = data.stockNames || {};
  const shown = expanded ? ph : ph.slice(-3);
  const startIdx = ph.length - shown.length;
  const lastDate = ph.length ? ph[ph.length - 1].date : null;

  return (
    <section className="card" id="priceHistory">
      <div className="card-head">
        <div className="card-title">行情历史</div>
        <div className="card-hint">日线收盘（前复权）· 仅展示已取得的交易日</div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl tbl-ph">
          <thead>
            <tr>
              <th className="cell-left">日期</th>
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
                  <td className="cell-left">{row.date}</td>
                  {codes.map((c) => {
                    const cur = (row.rows || {})[c];
                    const prev = gi > 0 ? ((ph[gi - 1].rows || {})[c] || {}).close : null;
                    const pct = cur && prev ? ((cur.close - prev) / prev) * 100 : null;
                    return (
                      <td key={c} className="num">
                        {cur ? fmtNum(cur.close, 2) : <Nil />}
                        {pct === null ? null : <span className={'pct-inline ' + tone(pct)}>{fmtPct(pct, 2)}</span>}
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
        <DateChip label="行情数据截至" value={lastDate || '—'} warn={!lastDate} />
        <DateChip label="交易日数" value={`${ph.length} 个`} />
      </div>
      {ph.length > 3 ? (
        <button className="link-btn" type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '▾ 仅看最近 3 个交易日' : `▸ 展开更早记录（共 ${ph.length} 个交易日）`}
        </button>
      ) : null}
    </section>
  );
}

/* ---------- 交易记录（默认最近 5 条，长备注点击展开） ---------- */
export function Trades({ data }) {
  const all = data.trades || [];
  const [showAll, setShowAll] = useState(false);
  const [openNote, setOpenNote] = useState(null);
  const rows = showAll ? all : all.slice(0, 5);
  const latest = all.length ? all[0].date : '—';

  return (
    <section className="card" id="trades">
      <div className="card-head">
        <div className="card-title">交易记录</div>
        <div className="card-hint">默认最近 5 条</div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl tbl-trades">
          <thead>
            <tr>
              <th className="cell-left">日期</th>
              <th className="cell-left">标的</th>
              <th className="cell-left">操作</th>
              <th>价格</th>
              <th>数量</th>
              <th>金额</th>
              <th>已实现</th>
              <th className="cell-left">备注</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const note = String(t.note || '');
              const long = note.length > 34;
              const shownNote = !long || openNote === i ? note : note.slice(0, 34) + '…';
              return (
                <tr key={t.date + t.code + i}>
                  <td className="cell-left">{t.date}</td>
                  <td className="cell-left">
                    <div className="nm-wrap">{t.name}</div>
                    <div className="code">{t.code}</div>
                  </td>
                  <td className="cell-left">{t.action}</td>
                  <td className="num">{fmtNum(t.price, t.price < 10 ? 3 : 2)}</td>
                  <td className="num">{fmtNum(t.quantity, 2)}</td>
                  <td className="num">{fmtMoney(t.amount)}</td>
                  <td className="num">{isNil(t.realizedGain) ? <Nil /> : <Money v={t.realizedGain} signed />}</td>
                  <td className="cell-left note-cell">
                    <span className={openNote === i ? 'note-open' : 'note-closed'}>{shownNote}</span>
                    {long ? (
                      <button className="link-btn inline" type="button" onClick={() => setOpenNote((v) => (v === i ? null : i))}>
                        {openNote === i ? '收起' : '展开'}
                      </button>
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
        <DateChip label="记录条数" value={`${all.length} 条`} />
      </div>
      {all.length > 5 ? (
        <button
          className="link-btn"
          type="button"
          onClick={() => {
            setShowAll((v) => !v);
            setOpenNote(null);
          }}
        >
          {showAll ? '▾ 收起，仅看最近 5 条' : `▸ 查看全部（${all.length} 条）`}
        </button>
      ) : null}
    </section>
  );
}
