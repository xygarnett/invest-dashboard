import React from 'react';

/* ---------- 基础格式化 ---------- */
export const isNil = (n) => n === null || n === undefined || (typeof n === 'number' && Number.isNaN(n));

export const fmtMoney = (n, dec = 2) =>
  isNil(n) ? '—' : '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtNum = (n, dec = 2) =>
  isNil(n) ? '—' : Number(n).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtPct = (n, dec = 2) =>
  isNil(n) ? '—' : (Number(n) > 0 ? '+' : '') + Number(n).toFixed(dec) + '%';

/* ---------- 口径色：涨红 / 跌绿 / 零值与缺失灰 ---------- */
export const tone = (n) => (isNil(n) || Number(n) === 0 ? 'text-neutral' : Number(n) > 0 ? 'text-up' : 'text-down');

/* 缺失值：统一灰色破折号 */
export const Nil = () => <span className="text-neutral">—</span>;

/* 「暂无数据」统一文案（缺失即显示，不编造） */
export const NoData = ({ label = '暂无数据', note = null }) => (
  <div className="empty">
    <strong>{label}</strong>
    {note ? <div className="note-line">{note}</div> : null}
  </div>
);

/* 金额：负号置于货币符号之前（-¥83,137.19），零值与缺失为灰色 */
export const Money = ({ v, dec = 2, signed = false }) => {
  if (isNil(v)) return <Nil />;
  const n = Number(v);
  const sign = n < 0 ? '-' : signed && n > 0 ? '+' : '';
  const txt =
    sign + '¥' + Math.abs(n).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return <span className={tone(v)}>{txt}</span>;
};

export const Pct = ({ v, dec = 2, plain = false }) => (
  <span className={plain ? '' : tone(v)}>{fmtPct(v, dec)}</span>
);

/* ---------- 资产类别色：仅用于「资产配置」图例 ---------- */
export const typeColor = { 基金: '#7c9cff', 股票: '#f5a524', 现金: '#2bc48a' };

/* ---------- 行情外链 ---------- */
export const quoteUrl = (code, type) => {
  if (!code || code === '-') return null;
  if (type === '基金') return 'https://fund.eastmoney.com/' + code + '.html';
  return 'https://quote.eastmoney.com/' + (String(code).startsWith('6') ? 'sh' : 'sz') + code + '.html';
};

export const quoteLink = (name, code, type) => {
  const url = quoteUrl(code, type);
  if (!url) return <span className="nm-wrap">{name}</span>;
  return (
    <a className="nm-wrap stock-link" href={url} target="_blank" rel="noreferrer">
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

/* ---------- 排序 ---------- */
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

/* ---------- 图标（不使用 Emoji） ---------- */
export const WarnIcon = () => (
  <svg className="ic-warn" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path fill="#F5A524" d="M8 1.6 15 14H1L8 1.6Zm0 3.3-4.3 7.6h8.6L8 4.9Zm-.7 2.3h1.4v3H7.3v-3Zm0 3.7h1.4v1.4H7.3v-1.4Z" />
  </svg>
);

export const OkIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path fill="#2BC48A" d="M8 .8a7.2 7.2 0 1 0 0 14.4A7.2 7.2 0 0 0 8 .8Zm3.46 5.1-4.4 5.05a.7.7 0 0 1-1.03.02L4.1 9.02l.99-.99 1.42 1.42 3.9-4.47.99.92Z" />
  </svg>
);

export const InfoIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path fill="#93A9C6" d="M8 .8a7.2 7.2 0 1 0 0 14.4A7.2 7.2 0 0 0 8 .8Zm0 1.4a5.8 5.8 0 1 1 0 11.6A5.8 5.8 0 0 1 8 2.2Zm-.7 2.4h1.4v1.4H7.3V4.6Zm0 2.5h1.4v4.3H7.3V7.1Z" />
  </svg>
);

export const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
    <path
      fill="#4D8DFF"
      d="M10 4c-4 0-7.3 2.6-8.7 6 1.4 3.4 4.7 6 8.7 6s7.3-2.6 8.7-6c-1.4-3.4-4.7-6-8.7-6Zm0 1.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8Zm0 1.7a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4Z"
    />
    {off ? <path stroke="#4D8DFF" strokeWidth="1.6" d="M3 17 17 3" /> : null}
  </svg>
);

/* ---------- 数据日期标识（就近展示，区分口径） ---------- */
export const DateChip = ({ label, value, warn }) => (
  <span className={'date-chip' + (warn ? ' warn' : '')}>
    {label}
    <b>{value}</b>
  </span>
);

export const Kv = ({ k, children, big }) => (
  <div className="kv-row">
    <span className="k">{k}</span>
    <span className={'v' + (big ? ' big' : '')}>{children}</span>
  </div>
);
