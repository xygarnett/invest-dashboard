import React, { useState } from 'react';
import {
  fmtMoney, fmtNum, fmtPct, Money, Pct, Nil, tone, unitPrice, priceDec, isNil, quoteLink, sortRows,
} from '../lib/format.jsx';
import { ownerOf, riskOf, atrOf } from '../lib/derive.js';

/* 默认列（用户规格）：名称 / Core·V11 标签 / 仓位 / 市值 / 浮动盈亏 / 风险状态
   数量、成本、ATR 等移入展开详情 */
const COLS = [
  { key: 'name', label: '名称', kind: 'string', align: 'left' },
  { key: '_owner', label: '策略', kind: 'string' },
  { key: 'ratio', label: '仓位', kind: 'number' },
  { key: 'value', label: '市值', kind: 'number' },
  { key: 'gain', label: '浮动盈亏', kind: 'number' },
  { key: '_risk', label: '风险状态', kind: 'string' },
];

function OwnerTag({ owner }) {
  if (!owner) return <Nil />;
  return <span className={'tag ' + (owner === 'V11' ? 'tag-v11' : 'tag-core')}>{owner}</span>;
}

function RiskCell({ risk }) {
  if (!risk) return <Nil />;
  if (risk.tone === 'warn') return <span className="tag tag-risk">{risk.label}</span>;
  return <span className="text-neutral">{risk.label}</span>;
}

function Details({ h, data }) {
  const avg = !isNil(h.cost) && !isNil(h.quantity) && Number(h.quantity) ? Number(h.cost) / Number(h.quantity) : null;
  const isFund = h.type === '基金';
  const atr = atrOf(data, h);
  const items = [
    ['数量/份额', isNil(h.quantity) ? <Nil /> : isFund ? fmtNum(h.quantity, 2) : fmtNum(h.quantity, 0), false],
    ['持仓成本', isNil(h.cost) ? <Nil /> : fmtMoney(h.cost), false],
    [isFund ? '成本净值' : '成本均价', avg === null ? <Nil /> : fmtNum(avg, priceDec(h.type)), false],
    ['累计盈亏', isNil(h.cumGain) ? <Nil /> : fmtMoney(h.cumGain), true],
    ['近1月', isNil(h.m1) ? <Nil /> : fmtPct(h.m1), false],
    ['近6月', isNil(h.m6) ? <Nil /> : fmtPct(h.m6), false],
    ['ATR 止损', atr ? atr : <span className="htm-nd">暂无数据</span>, false],
    [isFund ? '净值日期' : '行情日期', isFund ? (isNil(h.navDate) ? <span className="htm-nd">暂无数据</span> : h.navDate) : ((data.meta || {}).updated || '—'), false],
  ];
  return (
    <div className="detail-grid">
      {items.map(([k, v, toned]) => (
        <div key={k}>
          <div className="detail-k">{k}</div>
          <div className={'detail-v ' + (toned ? tone(h.cumGain) : '')}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export function HoldingsTable({ data, compact = false }) {
  const all = data.holdings || [];
  const [filter, setFilter] = useState('全部');
  const [open, setOpen] = useState(null);
  const [sort, setSort] = useState({ key: null, dir: 'desc' });

  const cash = all.find((h) => h.type === '现金') || null;
  const scoped = all.filter((h) => h.type !== '现金');
  const present = [...new Set(scoped.map((h) => h.type))];
  const CANON = ['股票', '基金'];
  const types = CANON.filter((t) => present.includes(t)).concat(present.filter((t) => !CANON.includes(t)));
  const filters = ['全部', ...types];
  const counts = filters.map((f) => ({ f, n: f === '全部' ? scoped.length : scoped.filter((h) => h.type === f).length }));

  const enriched = scoped.map((h) => ({
    ...h,
    _price: unitPrice(h),
    _owner: ownerOf(data, h),
    _risk: riskOf(data, h) ? riskOf(data, h).label : null,
  }));
  const visible = filter === '全部' ? enriched : enriched.filter((h) => h.type === filter);
  const rows = sort.key ? sortRows(visible, sort.key, sort.dir, COLS.find((c) => c.key === sort.key).kind) : visible;

  const rowKey = (h) => h.code + '|' + h.type;
  const toggle = (k) => setOpen((c) => (c === k ? null : k));
  const onSort = (col) => {
    setSort((prev) =>
      prev.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: col.kind === 'string' ? 'asc' : 'desc' }
    );
  };

  return (
    <div>
      {!compact ? (
        <div className="filter-chips" style={{ marginBottom: 12 }}>
          {counts.map((c) => (
            <button
              key={c.f}
              type="button"
              className={filter === c.f ? 'active' : ''}
              onClick={() => {
                setFilter(c.f);
                setOpen(null);
              }}
            >
              {c.f}（{c.n}）
            </button>
          ))}
        </div>
      ) : null}

      <div className="tbl-wrap holdings-table-view">
        <table className="tbl tbl-holdings">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={'sortable' + (c.align === 'left' ? ' cell-left' : '') + (sort.key === c.key ? ' sorted' : '')}
                  onClick={() => onSort(c)}
                  title="点击排序"
                >
                  {c.label}
                  <span className="sort-ind">{sort.key === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <React.Fragment key={rowKey(h)}>
                <tr className="hold-row" onClick={() => toggle(rowKey(h))}>
                  <td className="cell-left">
                    <div className="nm-wrap">{quoteLink(h.name, h.code, h.type)}</div>
                    <div className="code">
                      {h.code && h.code !== '-' ? h.code : '—'}
                      <span className={'tag ' + (h.type === '基金' ? '' : '')}>{h.type}</span>
                    </div>
                  </td>
                  <td>
                    <OwnerTag owner={h._owner} />
                  </td>
                  <td className="num">{isNil(h.ratio) ? <Nil /> : Number(h.ratio).toFixed(1) + '%'}</td>
                  <td className="num strong">{fmtMoney(h.value)}</td>
                  <td className="num">
                    <Money v={h.gain} signed /> <span className="pct-inline"><Pct v={h.gainRate} /></span>
                  </td>
                  <td>
                    <RiskCell risk={riskOf(data, h)} />
                  </td>
                </tr>
                {open === rowKey(h) ? (
                  <tr className="detail-tr">
                    <td colSpan={COLS.length}>
                      <Details h={h} data={data} />
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
          <div className="hold-card" key={'c' + rowKey(h)}>
            <div className="hold-card-head">
              <div className="hold-card-title">
                <div className="hold-card-name">{h.name}</div>
                <div className="hold-card-code">
                  {h.code && h.code !== '-' ? h.code + ' · ' : ''}
                  {h.type}
                  <OwnerTag owner={h._owner} />
                </div>
              </div>
              <div className="hold-card-pnl">
                <div className={'num ' + tone(h.gain)}>{isNil(h.gain) ? '—' : fmtMoney(h.gain)}</div>
                <div className="card-hint">{fmtPct(h.gainRate)}</div>
              </div>
            </div>
            <div className="hold-card-grid">
              <div>
                <div className="hold-card-k">仓位</div>
                <div className="hold-card-v">{isNil(h.ratio) ? <Nil /> : Number(h.ratio).toFixed(1) + '%'}</div>
              </div>
              <div>
                <div className="hold-card-k">市值</div>
                <div className="hold-card-v">{fmtMoney(h.value)}</div>
              </div>
              <div>
                <div className="hold-card-k">风险状态</div>
                <div className="hold-card-v"><RiskCell risk={riskOf(data, h)} /></div>
              </div>
              <div>
                <div className="hold-card-k">现价/净值</div>
                <div className="hold-card-v">
                  {h._price === null ? <Nil /> : fmtNum(h._price, priceDec(h.type))}
                </div>
              </div>
            </div>
            <button className="link-btn" type="button" onClick={() => toggle(rowKey(h))}>
              {open === rowKey(h) ? '▾ 收起详情' : '▸ 数量/成本/ATR 等详情'}
            </button>
            {open === rowKey(h) ? <Details h={h} data={data} /> : null}
          </div>
        ))}
      </div>

      {cash ? (
        <div className="cash-line" style={{ marginTop: 16, padding: '12px 14px', background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="tag">现金</span>
          <span style={{ fontWeight: 600 }}>{cash.name}</span>
          <span className="card-hint">单独列示，不计入持仓数量与筛选</span>
          <span className="card-hint" style={{ marginLeft: 'auto' }}>余额</span>
          <span className="cash-val num">{fmtMoney(cash.value)}</span>
          <span className="card-hint">占比</span>
          <span className="cash-val num">{isNil(cash.ratio) ? <Nil /> : Number(cash.ratio).toFixed(1) + '%'}</span>
        </div>
      ) : null}
    </div>
  );
}
