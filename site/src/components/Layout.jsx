import React, { useState } from 'react';

export const NAV_ITEMS = [
  { id: 'overview', icon: '📊', label: '资产概览' },
  { id: 'adviceRisk', icon: '💡', label: '今日建议与风险' },
  { id: 'holdings', icon: '📋', label: '持仓明细' },
  { id: 'allocAccount', icon: '💼', label: '资产配置与账户摘要' },
  { id: 'records', icon: '📜', label: '成本参考及历史记录' },
  { id: 'insurance', icon: '🛡️', label: '保险' },
];

function go(id) {
  const el = document.getElementById(id);
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('overview');
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">IT</div>
        <div>
          <div className="logo-title">InvestTrack</div>
          <div className="logo-sub">投资账本台</div>
        </div>
      </div>
      <button className="nav-toggle" type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>☰ 导航</span>
        <span className="cur">{NAV_ITEMS.find((n) => n.id === active)?.label} {open ? '▴' : '▾'}</span>
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
            <span className="icon">{n.icon}</span>
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
        <h1>Portfolio Dashboard</h1>
        <div className="greeting">欢迎回来，蒂姆 · 最后更新 {meta.updated || '—'}</div>
      </div>
      <div className="header-right">
        <span className="market-pill">
          <span className="dot" />
          {meta.market || '—'}
        </span>
        <button className="privacy-btn" type="button" onClick={onTogglePrivacy} title="隐私模式（模糊金额）">
          {privacy ? '🙈' : '👁'}
        </button>
        <div className="avatar">蒂</div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer>
      © 投资账本台 · 蓝胖子点点 · 数据仅供个人记录，不构成投资建议
    </footer>
  );
}
