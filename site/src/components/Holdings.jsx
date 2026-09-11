import React, { useState } from 'react';
import { fmtMoney, fmtNum, fmtPct, Money, Pct, tone, typeTag, unitPrice, priceDec, DateChip, isNil, quoteLink } from '../lib/format.jsx';

const FILTERS = ['全部', '股票', '基金'];

function qtyText(h) {
  if (isNil(h.quantity)) return '—';
  return h.type === '基金' ? fmtNum(h.quantity, 2) : fmtNum(h.quantity, 0);
}

function priceText(h) {
  const p = unitPrice(h);
  return p === null ? '—' : fmtNum(p, priceDec(h.type));
}

function Details({ h }) {
  const avg = !isNil(h.cost) && !isNil(h.quantity) && Number(h.quantity) ? Number(h.cost) / Number(h.quantity) : null;
  const items = [
    ['持仓成本', isNil(h.cost) ? '—' : fmtMoney(h.cost)],
    [h.type === '基金' ? '成本净值' : '成本均价', avg === null ? '—' : fmtNum(avg, priceDec(h.type))],
    ['累计盈亏', isNil(h.cumGain) ? '—' : fmtMoney(h.cumGain)],
    ['近1月', isNil(h.m1) ? '—' : fmtPct(h.m1)],
    ['近6月', isNil(h.m6) ? '—' : fmtPct(h.m6)],
  ];
  return (
    <div className="detail-grid">
      {items.map(([k, v], i) => (
        <div className="detail-item" key={k}>
          <div className="detail-k">{k}</div>
          <div className={'detail-v ' + (i === 2 ? tone(h.cumGain) : '')}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export function Holdings({ data }) {
  const [filter, setFilter] = useState('全部');
  const [open, setOpen] = useState(null);
  const rows = (data.holdings || []).filter((h) => (filter === '全部' ? true : h.type === filter));
  const meta = data.meta || {};
  const counts = FILTERS.map((f) => ({
    f,
    n: f === '全部' ? (data.holdings || []).length : (data.holdings || []).filter((h) => h.type === f).length,
  }));

  const toggle = (code) => setOpen((c) => (c === code ? null : code));

  return (
    <div className="card" id="holdings">
      <div className="card-head">
        <div className="card-title">
          持仓明细 <span className="card-hint">· 点击行可展开成本等详情</span>
        </div>
        <div className="filter-chips">
          {counts.map((c) => (
            <button key={c.f} type="button" className={filter === c.f ? 'active' : ''} onClick={() => { setFilter(c.f); setOpen(null); }}>
              {c.f}（{c.n}）
            </button>
          ))}
        </div>
      </div>

      <div className="date-chips" style={{ marginTop: 0, marginBottom: 12 }}>
        <DateChip label="股票行情" value={`${meta.updated || '—'} ${meta.market || ''}`.trim()} />
        <DateChip label="基金净值日期" value="—（看板数据未含）" warn />
      </div>

      {/* 桌面：表格 */}
      <div className="tbl-wrap holdings-table-view">
        <table className="tbl">
          <thead>
            <tr>
              <th>标的</th>
              <th>数量/份额</th>
              <th>现价/净值</th>
              <th>市值</th>
              <th>持仓盈亏</th>
              <th>仓位</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <React.Fragment key={h.code + h.type}>
                <tr className="hold-row" onClick={() => toggle(h.code)}>
                  <td>
                    <span className="nm">{h.type === '现金' ? h.name : quoteLink(h.name, h.code)}</span>
                    <div className="code">
                      {h.code && h.code !== '-' ? h.code : '—'} · <span className={'tag ' + (typeTag[h.type] || '')}>{h.type}</span>
                      <span className="expander"> {open === h.code ? '▾' : '▸'}</span>
                    </div>
                  </td>
                  <td>{qtyText(h)}</td>
                  <td>{priceText(h)}</td>
                  <td>{fmtMoney(h.value)}</td>
                  <td>
                    <Money v={h.gain} signed /> <span className="card-hint"><Pct v={h.gainRate} /></span>
                  </td>
                  <td>{isNil(h.ratio) ? '—' : Number(h.ratio).toFixed(1) + '%'}</td>
                </tr>
                {open === h.code ? (
                  <tr className="detail-td">
                    <td colSpan={6}>
                      <Details h={h} />
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手机：卡片 */}
      <div className="hold-cards">
        {rows.map((h) => (
          <div className="hold-card" key={'c' + h.code + h.type}>
            <div className="hold-card-head">
              <div>
                <div className="hold-card-name">{h.name}</div>
                <div className="hold-card-code">
                  {h.code && h.code !== '-' ? h.code + ' · ' : ''}
                  <span className={'tag ' + (typeTag[h.type] || '')}>{h.type}</span>
                </div>
              </div>
              <div className="hold-card-pnl">
                <div className={tone(h.gain)}>{isNil(h.gain) ? '—' : fmtMoney(h.gain)}</div>
                <div className="card-hint">{fmtPct(h.gainRate)}</div>
              </div>
            </div>
            <div className="hold-card-grid">
              <div>
                <div className="hold-card-k">数量/份额</div>
                <div className="hold-card-v">{qtyText(h)}</div>
              </div>
              <div>
                <div className="hold-card-k">现价/净值</div>
                <div className="hold-card-v">{priceText(h)}</div>
              </div>
              <div>
                <div className="hold-card-k">市值</div>
                <div className="hold-card-v">{fmtMoney(h.value)}</div>
              </div>
              <div>
                <div className="hold-card-k">仓位</div>
                <div className="hold-card-v">{isNil(h.ratio) ? '—' : Number(h.ratio).toFixed(1) + '%'}</div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="link-btn" type="button" onClick={() => toggle(h.code)}>
                {open === h.code ? '▾ 收起详情' : '▸ 成本等详情'}
              </button>
            </div>
            {open === h.code ? <Details h={h} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
