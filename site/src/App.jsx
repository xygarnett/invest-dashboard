import React, { useEffect, useState } from 'react';
import { Sidebar, Header, Footer, NAV, useRoute } from './components/Layout.jsx';
import { OverviewPage } from './components/pages/Overview.jsx';
import { HoldingsPage } from './components/pages/HoldingsPage.jsx';
import { StrategyPage } from './components/pages/StrategyPage.jsx';
import { CashFlowPage } from './components/pages/CashFlowPage.jsx';
import { ReturnsPage } from './components/pages/ReturnsPage.jsx';
import { InsurancePage } from './components/pages/InsurancePage.jsx';

const PAGES = {
  overview: OverviewPage,
  holdings: HoldingsPage,
  strategy: StrategyPage,
  cashflow: CashFlowPage,
  returns: ReturnsPage,
  insurance: InsurancePage,
};

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [route, go] = useRoute();
  const [privacy, setPrivacy] = useState(() => {
    try {
      return window.localStorage.getItem('it_privacy') === '1';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    document.body.classList.toggle('privacy-mode', privacy);
    try {
      window.localStorage.setItem('it_privacy', privacy ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
  }, [privacy]);

  useEffect(() => {
    // 数据随构建产出；查询串仅作浏览器侧去重，不影响 CDN 键
    fetch('./data.json?t=' + Date.now())
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(String(e && e.message ? e.message : e)));
  }, []);

  const title = (NAV.find((n) => n.id === route) || NAV[0]).label;

  if (err) {
    return (
      <div className="app">
        <Sidebar route={route} go={go} />
        <div className="main">
          <div className="card">
            <div className="card-title">数据加载失败</div>
            <div className="note-line">{err}</div>
          </div>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="app">
        <Sidebar route={route} go={go} />
        <div className="main">
          <div className="empty">正在加载数据…</div>
        </div>
      </div>
    );
  }

  const Page = PAGES[route] || OverviewPage;
  return (
    <div className="app">
      <Sidebar route={route} go={go} />
      <div className="main">
        <Header data={data} pageTitle={title} privacy={privacy} onTogglePrivacy={() => setPrivacy((v) => !v)} />
        <Page data={data} go={go} />
        <Footer />
      </div>
    </div>
  );
}
