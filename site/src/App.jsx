import React, { useEffect, useState } from 'react';
import { Sidebar, Header, Footer } from './components/Layout.jsx';
import { AssetCards, Allocation, AccountSummary } from './components/Overview.jsx';
import { AdviceRisk } from './components/AdviceRisk.jsx';
import { Holdings } from './components/Holdings.jsx';
import { CostRef, BrokerYearly, PriceHistory, Trades } from './components/Records.jsx';
import { Insurance } from './components/Insurance.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [privacy, setPrivacy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('data.json?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(String(e && e.message ? e.message : e)));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('privacy-mode', privacy);
  }, [privacy]);

  if (err) {
    return (
      <div className="app">
        <main className="main">
          <div className="card">数据加载失败：{err}</div>
        </main>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="app">
        <main className="main">
          <div className="card">加载中…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Header data={data} privacy={privacy} onTogglePrivacy={() => setPrivacy((v) => !v)} />

        {/* 1. 资产概览 */}
        <AssetCards data={data} />

        {/* 2. 今日建议与风险 */}
        <AdviceRisk data={data} />

        {/* 3. 持仓明细 */}
        <Holdings data={data} />

        {/* 4. 资产配置与账户摘要 */}
        <section id="allocAccount">
          <div className="grid-2">
            <div className="card" id="allocation">
              <div className="card-head">
                <div className="card-title">资产配置</div>
                <div className="card-hint">按类别</div>
              </div>
              <Allocation data={data} />
            </div>
            <div className="card" id="accountSummary">
              <div className="card-head">
                <div className="card-title">账户摘要</div>
                <div className="card-hint">历史快照</div>
              </div>
              <AccountSummary data={data} />
            </div>
          </div>
        </section>

        {/* 5. 成本参考及历史记录 */}
        <section id="records">
          <CostRef data={data} />
          <div className="card">
            <div className="card-head">
              <div className="card-title">
                券商历史累计收益 <span className="card-hint">· 按自然年度</span>
              </div>
            </div>
            <BrokerYearly data={data} />
          </div>
          <PriceHistory data={data} />
          <Trades data={data} />
        </section>

        {/* 6. 保险 */}
        <Insurance data={data} />

        <Footer />
      </main>
    </div>
  );
}
