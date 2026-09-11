import React from 'react';

/* ---------- 基础格式化 ---------- */
export const isNil = (n) => n === null || n === undefined || (typeof n === 'number' && Number.isNaN(n));

export const fmtMoney = (n, dec = 2) =>
  isNil(n) ? '—' : '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtNum = (n, dec = 2) =>
  isNil(n) ? '—' : Number(n).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtPct = (n, dec = 2) =>
  isNil(n) ? '—' : (Number(n) > 0 ? '+' : '') + Number(n).toFixed(dec) + '%';

/* ---------- 口径色：红盈 / 绿亏 / 灰=零值与缺失 ---------- */
export const tone = (n) => (isNil(n) || Number(n) === 0 ? 'text-neutral' : Number(n) > 0 ? 'text-up' : 'text-down');

/* 缺失值：统一灰色破折号 */
export const Nil = () => <span className="text-neutral">—</span>;

/* 金额：负号置于货币符号之前（-¥83,137.19），零值与缺失为灰色 */
export const Money = ({ v, dec = 2, signed = false }) => {
  if (isNil(v)) return <Nil />;
  const n = Number(v);
  const sign = n < 0 ? '-' : signed && n > 0 ? '+' : '';
  const txt =
    sign + '¥' + Math.abs(n).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return <span className={tone(v)}>{txt}</span>;
};

export const Pct = ({ v, dec = 2 }) => <span className={tone(v)}>{fmtPct(v, dec)}</span>;

/* ---------- 资产类别色：仅用于「资产配置」图例 ---------- */
export const typeColor = { 基金: '#6366F1', 股票: '#F59E0B', 现金: '#10B981' };

/* ---------- 行情外链（股票 / 基金各自站点） ---------- */
export const quoteUrl = (code, type) => {
  if (!code || code === '-') return null;
  if (type === '基金') return 'https://fund.eastmoney.com/' + code + '.html';
  return 'https://quote.eastmoney.com/' + (String(code).startsWith('6') ? 'sh' : 'sz') + code + '.html';
};

export const quoteLink = (name, code, type) => {
  const url = quoteUrl(code, type);
  if (!url) return <span className="nm">{name}</span>;
  return (
    <a className="nm stock-link" href={url} target="_blank" rel="noreferrer">
      {name}
      <span className="arrow">↗</span>
    </a>
  );
};

/* ---------- 单位价格：股票=现价，基金=净值（市值/份额推得） ---------- */
export const unitPrice = (h) => {
  const q = Number(h && h.quantity);
  const v = Number(h && h.value);
  if (!q || !Number.isFinite(q) || !Number.isFinite(v)) return null;
  return v / q;
};

export const priceDec = (type) => (type === '基金' ? 4 : 2);

/* ---------- 排序：与原看板一致（数字默认降序、字符串默认升序、缺失排最后） ---------- */
export const sortRows = (rows, key, dir, kind) => {
  const s = [...rows].sort((a, b) => {
    let va = a[key];
    let vb = b[key];
    if (kind === 'string') {
      const sa = String(va === null || va === undefined ? '' : va);
      const sb = String(vb === null || vb === undefined ? '' : vb);
      return dir === 'asc' ? sa.localeCompare(sb, 'zh-CN') : sb.localeCompare(sa, 'zh-CN');
    }
    if (isNil(va)) va = -Infinity;
    if (isNil(vb)) vb = -Infinity;
    return dir === 'asc' ? va - vb : vb - va;
  });
  return s;
};

/* ---------- 小型图标（不使用 Emoji） ---------- */
export const WarnIcon = () => (
  <svg className="ic-warn" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path fill="#EA580C" d="M8 1.6 15 14H1L8 1.6Zm0 3.3-4.3 7.6h8.6L8 4.9Zm-.7 2.3h1.4v3H7.3v-3Zm0 3.7h1.4v1.4H7.3v-1.4Z" />
  </svg>
);

/* ---------- 数据日期标识（就近展示，区分口径） ---------- */
export const DateChip = ({ label, value, warn }) => (
  <span className={'date-chip' + (warn ? ' warn' : '')}>
    {label}
    <b>{value}</b>
  </span>
);
