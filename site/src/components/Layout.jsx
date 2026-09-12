import React, { useEffect, useState } from 'react';
import { EyeIcon } from '../lib/format.jsx';

/* 六项导航（用户原需求：总览/持仓/策略观察/交易与资金/收益分析/保险保障） */
export const NAV = [
  { id: 'overview', label: '总览' },
  { id: 'holdings', label: '持仓' },
  { id: 'strategy', label: '策略观察' },
  { id: 'cashflow', label: '交易与资金' },
  { id: 'returns', label: '收益分析' },
  { id: 'insurance', label: '保险保障' },
];

/* hash 路由：仅切换视图，不新增发布入口 */
export const useRoute = () => {
  const read = () => {
    const h = String(window.location.hash || '').replace(/^#\/?/, '').trim();
    return NAV.some((n) => n.id === h) ? h : 'overview';
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    if (!window.location.hash) window.location.hash = '#/overview';
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (id) => {
    window.location.hash = '#/' + id;
    setRoute(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return [route, go];
};

export function Sidebar({ route, go }) {
  const [open, setOpen] = useState(false);
  const activeLabel = (NAV.find((n) => n.id === route) || NAV[0]).label;
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
        {NAV.map((n) => (
          <a
            key={n.id}
            href={'#/' + n.id}
            className={route === n.id ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
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

export function Header({ data, pageTitle, privacy, onTogglePrivacy }) {
  const meta = data.meta || {};
  const color = (data.extras && data.extras.marketColor) || null;
  return (
    <div className="header">
      <div>
        <h1>{pageTitle}</h1>
        <div className="greeting">
          数据更新 {meta.updated || '—'}
          <span className="dot-sep">·</span>
          {meta.market || '—'}
        </div>
      </div>
      <div className="header-right">
        {color ? (
          <span className={'market-pill ' + (String(color.color) === 'red' ? 'red' : 'green')}>
            <span className="dot" />
            市场光 {String(color.color) === 'red' ? '红' : '绿'} · {color.freeze_date || '—'}
          </span>
        ) : null}
        <button
          className={'privacy-btn' + (privacy ? ' on' : '')}
          type="button"
          onClick={onTogglePrivacy}
          title={privacy ? '退出隐藏金额' : '隐藏金额（卡片/表格/图表/详情）'}
        >
          <EyeIcon off={privacy} />
          <span>{privacy ? '已隐藏' : '隐藏金额'}</span>
        </button>
        <div className="avatar">蒂</div>
      </div>
    </div>
  );
}

export function Footer() {
  return <footer>© 投资账本台 · 蓝胖子点点 · 数据仅供个人记录，不构成投资建议</footer>;
}
