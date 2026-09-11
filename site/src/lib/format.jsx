import React from 'react';

export const isNil = (n) => n === null || n === undefined || (typeof n === 'number' && Number.isNaN(n));

export const fmtMoney = (n, dec = 2) =>
  isNil(n) ? '—' : '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtNum = (n, dec = 2) =>
  isNil(n) ? '—' : Number(n).toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const fmtPct = (n, dec = 2) =>
  isNil(n) ? '—' : (Number(n) > 0 ? '+' : '') + Number(n).toFixed(dec) + '%';

// A股口径：红=盈/涨，绿=亏/跌
export const tone = (n) => (isNil(n) || Number(n) === 0 ? 'text-neutral' : Number(n) > 0 ? 'text-up' : 'text-down');

export const Txt = ({ v, children, className }) => (
  <span className={className}>{children}</span>
);

export const Money = ({ v, dec = 2, signed = false }) => {
  if (isNil(v)) return <span className="text-neutral">—</span>;
  const txt = (signed && Number(v) > 0 ? '+' : '') + fmtMoney(v, dec);
  return <span className={tone(v)}>{txt}</span>;
};

export const Pct = ({ v, dec = 2 }) => <span className={tone(v)}>{fmtPct(v, dec)}</span>;

export const typeTag = { 基金: 'tag-jijin', 股票: 'tag-gupiao', 现金: 'tag-xianjin', 理财: 'tag-licai' };
export const typeColor = { 基金: '#6366f1', 股票: '#f59e0b', 现金: '#10b981', 理财: '#ec4899' };

export const quoteLink = (name, code) =>
  code && code !== '-' ? (
    <a className="stock-link" href={'https://quote.eastmoney.com/' + (code.startsWith('6') ? 'sh' : 'sz') + code + '.html'}
       target="_blank" rel="noreferrer">
      {name}<span className="arrow">↗</span>
    </a>
  ) : (
    <span>{name}</span>
  );

export const daysBetween = (from, to) => {
  const a = new Date(String(from) + 'T00:00:00');
  const b = new Date(String(to) + 'T00:00:00');
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
};

// 单位价格：股票=现价，基金=净值（均由 市值/数量 推得，缺失返回 null）
export const unitPrice = (h) => {
  const q = Number(h && h.quantity);
  const v = Number(h && h.value);
  if (!q || !Number.isFinite(q) || !Number.isFinite(v)) return null;
  return v / q;
};

export const priceDec = (type) => (type === '基金' ? 4 : 2);

export const DateChip = ({ label, value, warn }) => (
  <span className={'date-chip' + (warn ? ' warn' : '')}>
    {label}：<b>{value}</b>
  </span>
);
