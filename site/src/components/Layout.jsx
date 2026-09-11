import React, { useState } from 'react';

export const NAV_ITEMS = [
  { id: 'overview', label: '资产概览' },
  { id: 'adviceRisk', label: '今日建议与风险' },
  { id: 'holdings', label: '持仓明细' },
  { id: 'allocAccount', label: '资产配置与账户摘要' },
  { id: 'records', label: '成本参考及历史记录' },
  { id: 'insurance', label: '保险' },
];

function go(id) {
  const el = document.getElementById(id);
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
      <path
        fill="#4F46E5"
        d="M10 4c-4 0-7.3 2.6-8.7 6 1.4 3.4 4.7 6 8.7 6s7.3-2.6 8.7-6c-1.4-3.4-4.7-6-8.7-6Zm0 1.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8Zm0 1.7a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4Z"
      />
      {off ? <path stroke="#4F46E5" strokeWidth="1.6" d="M3 17 17 3" /> : null}
    </svg>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('overview');
  const activeLabel = (NAV_ITEMS.find((n) => n.id === active) || NAV_ITEMS[0]).label;

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">IT</div>
        <div>
          <div className="logo-title">InvestTrack</div>
          <div className="logo-sub">投资账本台 · 蓝胖子点点</div>
        </div>
      </div>

      <button className="nav-toggle" type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>导航</span>
        <span className="cur">
          {activeLabel} {open ? '收起' : '展开'}
        </span>
      </button>

      <nav className={open ? 'open' : ''}>
        {NAV_ITEMS.map((n) => (
          <a
            key={n.id}
            href={'#' + n.id}
            className={active === n.id ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActive(n.id);
              setOpen(false);
              go(n.id);
            }}
          >
            {n.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export function Header({ data, privacy, onTogglePrivacy }) {
  const meta = data.meta || {};
  return (
    <div className="header">
      <div>
        <h1>投资账本台</h1>
        <div className="greeting">
          欢迎回来，蒂姆 <span className="dot-sep">·</span> 数据更新 {meta.updated || '—'}
        </div>
      </div>
      <div className="header-right">
        <span className="market-pill">
          <span className="dot" />
          {meta.market || '—'}
        </span>
        <button
          className={'privacy-btn' + (privacy ? ' on' : '')}
          type="button"
          onClick={onTogglePrivacy}
          title={privacy ? '退出隐私模式' : '隐私模式（模糊金额）'}
        >
          <EyeIcon off={privacy} />
          <span>{privacy ? '已隐藏' : '隐私'}</span>
        </button>
        <div className="avatar">蒂</div>
      </div>
    </div>
  );
}

export function Footer() {
  return <footer>© 投资账本台 · 蓝胖子点点 · 数据仅供个人记录，不构成投资建议</footer>;
}
