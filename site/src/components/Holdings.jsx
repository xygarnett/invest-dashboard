import React, { useState } from 'react';
import {
  fmtMoney, fmtNum, fmtPct, Money, Pct, Nil, tone, unitPrice, priceDec, DateChip, isNil, quoteLink, sortRows,
} from '../lib/format.jsx';
import { fundNavDates, snapshotDate } from './Overview.jsx';

/* 列定义：与原看板一致，数值列可排序；展开详情行随所在标的一起排序 */
const COLS = [
  { key: 'name', label: '标的', kind: 'string' },
  { key: 'quantity', label: '数量/份额', kind: 'number' },
  { key: '_price', label: '现价/净值', kind: 'number' },
  { key: 'value', label: '市值', kind: 'number' },
  { key: 'gain', label: '持仓盈亏', kind: 'number' },
  { key: 'ratio', label: '仓位', kind: 'number' },
];

function qtyText(h) {
  if (isNil(h.quantity)) return <Nil />;
  return h.type === '基金' ? fmtNum(h.quantity, 2) : fmtNum(h.quantity, 0);
}

function priceText(h) {
  const p = unitPrice(h);
  return p === null ? <Nil /> : fmtNum(p, priceDec(h.type));
}

function Details({ h, meta }) {
  const avg = !isNil(h.cost) && !isNil(h.quantity) && Number(h.quantity) ? Number(h.cost) / Number(h.quantity) : null;
  const isFund = h.type === '基金';
  const items = [
    ['持仓成本', isNil(h.cost) ? <Nil /> : fmtMoney(h.cost), false],
    [isFund ? '成本净值' : '成本均价', avg === null ? <Nil /> : fmtNum(avg, priceDec(h.type)), false],
    ['累计盈亏', isNil(h.cumGain) ? <Nil /> : fmtMoney(h.cumGain), true],
    ['近1月', isNil(h.m1) ? <Nil /> : fmtPct(h.m1), false],
    ['近6月', isNil(h.m6) ? <Nil /> : fmtPct(h.m6), false],
    [
      isFund ? '净值日期' : '行情日期',
      isNil(isFund ? h.navDate : (meta || {}).updated) ? <Nil /> : isFund ? h.navDate : meta.updated,
      false,
    ],
  ];
  return (
    <div className="detail-grid">
      {items.map(([k, v, toned]) => (
        <div className="detail-item" key={k}>
          <div className="detail-k">{k}</div>
          <div className={'detail-v ' + (toned ? tone(h.cumGain) : '')}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export function Holdings({ data }) {
  const all = data.holdings || [];
  const meta = data.meta || {};
  const [filter, setFilter] = useState('全部');
  const [open, setOpen] = useState(null);
  const [sort, setSort] = useState({ key: null, dir: 'desc' });

  // 现金单列：不参与筛选，也不计入持仓数量（数量动态计算，无硬编码）
  const cash = all.find((h) => h.type === '现金') || null;
  const scoped = all.filter((h) => h.type !== '现金');
  // 类别按钮顺序固定为「全部 / 股票 / 基金」，其余类别（如有）附加在后；数量始终由数据动态计算
  const present = [...new Set(scoped.map((h) => h.type))];
  const CANON = ['股票', '基金'];
  const types = CANON.filter((t) => present.includes(t)).concat(present.filter((t) => !CANON.includes(t)));
  const filters = ['全部', ...types];
  const counts = filters.map((f) => ({
    f,
    n: f === '全部' ? scoped.length : scoped.filter((h) => h.type === f).length,
  }));

  const enriched = scoped.map((h) => ({ ...h, _price: unitPrice(h) }));
  const visible = filter === '全部' ? enriched : enriched.filter((h) => h.type === filter);
  const rows = sort.key ? sortRows(visible, sort.key, sort.dir, COLS.find((c) => c.key === sort.key).kind) : visible;

  const toggle = (k) => setOpen((c) => (c === k ? null : k));
  const onSort = (col) => {
    setSort((prev) =>
      prev.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: col.kind === 'string' ? 'asc' : 'desc' }
    );
  };
  const rowKey = (h) => h.code + '|' + h.type;

  const navDates = fundNavDates(all);
  const snap = snapshotDate(meta);

  return (
    <section className="card" id="holdings">
      <div className="card-head">
        <div className="card-title">持仓明细</div>
        <div className="card-hint">点击列头排序 · 点击行展开成本等详情</div>
      </div>

      <div className="filter-chips">
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

      <div className="date-chips">
        <DateChip label="股票行情" value={`${meta.updated || '—'} ${meta.market || ''}`.trim()} />
        <DateChip label="基金净值日期" value={navDates || '—'} warn={!navDates} />
        <DateChip
          label="持仓数量·成本"
          value={snap ? `券商台账 ${snap}` : '—'}
          warn={!snap}
        />
      </div>

      {/* 桌面：表格 */}
      <div className="tbl-wrap holdings-table-view">
        <table className="tbl tbl-holdings">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={'sortable' + (sort.key === c.key ? ' sorted' : '')}
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
                    <div className="nm-wrap">{h.type === '现金' ? h.name : quoteLink(h.name, h.code, h.type)}</div>
                    <div className="code">
                      {h.code && h.code !== '-' ? h.code : '—'}
                      <span className={'tag tag-' + (h.type === '基金' ? 'fund' : 'stock')}>{h.type}</span>
                      <span className="expander">{open === rowKey(h) ? '▾ 收起' : '▸ 详情'}</span>
                    </div>
                  </td>
                  <td className="num">{qtyText(h)}</td>
                  <td className="num">{priceText(h)}</td>
                  <td className="num strong">{fmtMoney(h.value)}</td>
                  <td className="num">
                    <Money v={h.gain} signed /> <span className="pct-inline"><Pct v={h.gainRate} /></span>
                  </td>
                  <td className="num">{isNil(h.ratio) ? <Nil /> : Number(h.ratio).toFixed(1) + '%'}</td>
                </tr>
                {open === rowKey(h) ? (
                  <tr className="detail-tr">
                    <td colSpan={COLS.length}>
                      <Details h={h} meta={meta} />
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
                  <span className={'tag tag-' + (h.type === '基金' ? 'fund' : 'stock')}>{h.type}</span>
                </div>
              </div>
              <div className="hold-card-pnl">
                <div className={'num ' + tone(h.gain)}>{isNil(h.gain) ? '—' : fmtMoney(h.gain)}</div>
                <div className="card-hint">{fmtPct(h.gainRate)}</div>
              </div>
            </div>
            <div className="hold-card-grid">
              <div>
                <div className="hold-card-k">数量/份额</div>
                <div className="hold-card-v num">{qtyText(h)}</div>
              </div>
              <div>
                <div className="hold-card-k">现价/净值</div>
                <div className="hold-card-v num">{priceText(h)}</div>
              </div>
              <div>
                <div className="hold-card-k">市值</div>
                <div className="hold-card-v num">{fmtMoney(h.value)}</div>
              </div>
              <div>
                <div className="hold-card-k">仓位</div>
                <div className="hold-card-v num">{isNil(h.ratio) ? <Nil /> : Number(h.ratio).toFixed(1) + '%'}</div>
              </div>
            </div>
            <button className="link-btn" type="button" onClick={() => toggle(rowKey(h))}>
              {open === rowKey(h) ? '▾ 收起详情' : '▸ 成本等详情'}
            </button>
            {open === rowKey(h) ? <Details h={h} meta={meta} /> : null}
          </div>
        ))}
      </div>

      {/* 现金：单列展示，浮盈/成本口径不适用 */}
      {cash ? (
        <div className="cash-line">
          <span className="cash-tag">现金</span>
          <span className="cash-name">{cash.name}</span>
          <span className="cash-hint">单独列示，不计入持仓数量与筛选</span>
          <span className="cash-label">余额</span>
          <span className="cash-val num">{fmtMoney(cash.value)}</span>
          <span className="cash-label">占比</span>
          <span className="cash-ratio num">{isNil(cash.ratio) ? '—' : Number(cash.ratio).toFixed(1) + '%'}</span>
        </div>
      ) : null}
    </section>
  );
}
