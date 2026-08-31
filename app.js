// 投资账本台 dashboard —— 读取 data.json 渲染（页面/样式/逻辑固定，只换 data.json）
(function () {
  'use strict';

  const fmt = n => '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPct = n => (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  const typeColor = { '基金': '#6366f1', '股票': '#f59e0b', '现金': '#10b981', '理财': '#ec4899' };
  const typeTag = { '基金': 'tag-jijin', '股票': 'tag-gupiao', '现金': 'tag-xianjin', '理财': 'tag-licai' };

  function quoteLink(code, type) {
    if (!code || code === '-') return null;
    if (type === '股票') {
      const prefix = /^(6|9)/.test(code) ? 'sh' : 'sz';
      return `https://quote.eastmoney.com/${prefix}${code}.html`;
    }
    if (type === '基金') return `https://fund.eastmoney.com/${code}.html`;
    return null;
  }
  function nameCell(name, code, type) {
    const url = quoteLink(code, type);
    if (!url) return `<div class="nm">${name}</div>`;
    return `<div class="nm"><a class="stock-link" href="${url}" target="_blank" rel="noopener">${name}<span class="arrow">↗</span></a></div>`;
  }
  const cls = v => v === 0 || v === null ? 'text-neutral' : (v >= 0 ? 'text-up' : 'text-down');

  function renderKPI(d) {
    const s = d.summary;
    document.getElementById('kpiRow').innerHTML = `
      <div class="kpi-card"><div class="kpi-label">总市值</div><div class="kpi-value">${fmt(s.totalValue)}</div><div class="kpi-sub">${s.holdingsCount} 项持仓</div></div>
      <div class="kpi-card"><div class="kpi-label">浮动盈亏</div><div class="kpi-value ${s.totalGain >= 0 ? 'up' : 'down'}">${fmt(s.totalGain)}</div><div class="kpi-sub">${fmtPct(s.totalRate)}</div></div>
      <div class="kpi-card"><div class="kpi-label">已实现收益</div><div class="kpi-value up">${fmt(s.realizedGain)}</div><div class="kpi-sub">累计已实现</div></div>
      <div class="kpi-card"><div class="kpi-label">综合总收益</div><div class="kpi-value ${s.totalCombined >= 0 ? 'up' : 'down'}">${fmt(s.totalCombined)}</div><div class="kpi-sub">${fmtPct(s.combinedRate)} · 浮动+已实现</div></div>`;
  }

  function renderAccount(d) {
    const a = d.account;
    document.getElementById('accountBody').innerHTML = `
      <div class="acct-card">
        <div class="acct-icon">券</div>
        <div class="acct-info"><div class="acct-name">${a.name}</div><div class="acct-meta">${a.openDate} 开户</div></div>
        <span class="tag tag-xianjin">活跃</span>
      </div>
      <table class="tbl">
        <tr><td style="color:#64748b;">期末资产</td><td style="font-weight:600;">${fmt(a.endAsset)}</td></tr>
        <tr><td style="color:#64748b;">银证净流入</td><td>${fmt(a.netInflow)}</td></tr>
        <tr><td style="color:#64748b;">至今账户盈亏</td><td class="text-up" style="font-weight:700;">+${fmt(a.accountGain)}</td></tr>
      </table>`;
  }

  function renderAlloc(d) {
    const types = ['基金', '股票', '现金'];
    const items = types.map(t => {
      const hs = d.holdings.filter(h => h.type === t);
      return { type: t, value: hs.reduce((s, h) => s + h.value, 0) };
    });
    document.getElementById('allocBody').innerHTML = items.map(a => {
      const pct = d.summary.totalValue ? (a.value / d.summary.totalValue * 100) : 0;
      return `<div class="alloc-row">
        <div class="alloc-dot" style="background:${typeColor[a.type]};"></div>
        <div class="alloc-name">${a.type}</div>
        <div class="alloc-bar"><div class="fill" style="width:${pct.toFixed(1)}%;background:${typeColor[a.type]};"></div></div>
        <div class="alloc-pct">${pct.toFixed(1)}%</div>
        <div class="alloc-val">${fmt(a.value)}</div>
      </div>`;
    }).join('');
  }

  // 持仓明细（可排序）
  let sortState = { col: -1, dir: 'desc' };
  const colKeys = ['name', 'type', 'quantity', 'cost', 'value', 'gain', 'gainRate', 'dayGain', 'cumGain', 'm1', 'm6', 'ratio'];
  const colTypes = ['string', 'string', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'];
  const colHeaders = ['标的', '类别', '数量', '成本', '现值', '浮盈亏', '盈亏率', '单日涨跌', '累计盈亏', '近1月', '近6月', '占比'];

  function renderHoldings(rows) {
    document.getElementById('holdingsHead').innerHTML = colHeaders.map((h, i) =>
      `<th class="sortable" data-col="${i}">${h}</th>`).join('');
    document.getElementById('holdingsBody').innerHTML = rows.map(h => {
      const qty = h.quantity !== null ? h.quantity.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : '-';
      const cell = (v, pct) => v === 0 ? '<span class="text-neutral">' + (pct ? '0.00%' : '¥0.00') + '</span>'
        : `<span class="${cls(v)}">${pct ? fmtPct(v) : (v >= 0 ? '+' : '') + fmt(v)}</span>`;
      const nullCell = (v) => v === null ? '<span class="text-neutral">-</span>' : `<span class="${cls(v)}">${fmtPct(v)}</span>`;
      return `<tr>
        <td>${nameCell(h.name, h.code, h.type)}<div class="code">${h.code}</div></td>
        <td><span class="tag ${typeTag[h.type]}">${h.type}</span></td>
        <td>${qty}</td>
        <td>${fmt(h.cost)}</td>
        <td style="font-weight:600;">${fmt(h.value)}</td>
        <td>${cell(h.gain, false)}</td>
        <td>${cell(h.gainRate, true)}</td>
        <td>${cell(h.dayGain, false)}</td>
        <td>${cell(h.cumGain, false)}</td>
        <td>${nullCell(h.m1)}</td>
        <td>${nullCell(h.m6)}</td>
        <td>${h.ratio.toFixed(1)}%</td>
      </tr>`;
    }).join('');
    document.querySelectorAll('#holdingsHead th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const i = parseInt(th.dataset.col);
        if (sortState.col === i) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        else { sortState.col = i; sortState.dir = colTypes[i] === 'string' ? 'asc' : 'desc'; }
        const key = colKeys[i];
        const sorted = [...rows].sort((a, b) => {
          let va = a[key], vb = b[key];
          if (colTypes[i] === 'string') return sortState.dir === 'asc' ? String(va || '').localeCompare(String(vb || ''), 'zh-CN') : String(vb || '').localeCompare(String(va || ''), 'zh-CN');
          if (va === null) va = -Infinity;
          if (vb === null) vb = -Infinity;
          return sortState.dir === 'asc' ? va - vb : vb - va;
        });
        renderHoldings(sorted);
      });
    });
  }

  function renderBrokerYearly(d) {
    document.getElementById('brokerPeriod').textContent = '· ' + (d.account.period || '');
    document.getElementById('brokerTotal').textContent = '+¥' + Number(d.account.accountGain).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const y = d.brokerYearly, keys = Object.keys(y);
    const yMax = Math.max(...keys.map(k => Math.abs(y[k])), 1);
    document.getElementById('brokerYearlyBody').innerHTML = keys.map(k => {
      const v = y[k], pct = Math.max(Math.abs(v) / yMax * 100, 4);
      const color = v >= 0 ? '#10b981' : '#f87171';
      return `<div class="year-row"><div class="year-lbl">${k}年</div>
        <div class="year-bar"><div class="fill" style="width:${pct.toFixed(1)}%;background:${color};"></div></div>
        <div class="year-amt" style="color:${color};">${v >= 0 ? '+' : ''}¥${v.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</div></div>`;
    }).join('');
  }

  function renderStockCost(d) {
    document.getElementById('stockCostBody').innerHTML = d.stockCostRef.map(s => {
      const holdGain = (s.last - s.costPrice) / s.costPrice * 100;
      const c = holdGain >= 0 ? '#dc2626' : '#059669';
      const be = s.breakeven !== null ? `¥${s.breakeven.toFixed(2)}<div class="code" style="color:#9ca3af;">${s.breakevenNote || ''}</div>` : `<span style="color:#9ca3af;">${s.breakevenNote || '缺失'}</span>`;
      const gain = s.breakeven !== null ? ((s.last - s.breakeven) * s.qty) : null;
      const gc = gain === null ? '' : (gain >= 0 ? '#dc2626' : '#059669');
      const gainCell = gain === null ? '<span style="color:#9ca3af;">—</span>' : `<span style="color:${gc};font-weight:600;">${gain >= 0 ? '+' : ''}¥${gain.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</span>`;
      return `<tr>
        <td>${nameCell(s.name, s.code, '股票')}<div class="code">${s.code}</div></td>
        <td>${s.qty.toLocaleString()}</td>
        <td style="font-weight:600;">¥${s.last.toFixed(2)}</td>
        <td>¥${s.costPrice.toFixed(3)}</td>
        <td>${be}</td>
        <td style="color:${c};font-weight:600;">${fmtPct(holdGain)}</td>
        <td>${gainCell}</td>
      </tr>`;
    }).join('');
  }

  function renderPriceHistory(d) {
    const ph = d.priceHistory || [];
    const names = d.stockNames || {}, codes = d.stockCodes || [];
    document.getElementById('phHead').innerHTML = '<th>标的</th>' + ph.map(p => `<th>${p.date.slice(5)}</th>`).join('');
    document.getElementById('phBody').innerHTML = codes.map(code => {
      const cells = ph.map((p, i) => {
        const r = p.rows[code];
        if (!r) return '<td>-</td>';
        const prev = i > 0 ? ph[i - 1].rows[code] : null;
        const chg = prev ? (r.close - prev.close) / prev.close * 100 : null;
        const cc = chg === null ? '' : (chg >= 0 ? '#dc2626' : '#059669');
        const chgStr = chg === null ? '' : `<span style="font-size:11px;color:${cc};">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>`;
        return `<td><div style="font-weight:700;color:#0f172a;">${r.close.toFixed(2)} ${chgStr}</div><div style="font-size:10px;color:#94a3b8;">开${r.open.toFixed(2)} 高${r.high.toFixed(2)} 低${r.low.toFixed(2)}</div></td>`;
      }).join('');
      return `<tr><td>${nameCell(names[code] || code, code, '股票')}<div class="code">${code}</div></td>${cells}</tr>`;
    }).join('');
  }

  function renderFundNav(d) {
    const fn = d.fundNav || {};
    const codes = Object.keys(fn);
    if (!codes.length) { document.getElementById('phFundBody').innerHTML = '<tr><td>无数据</td></tr>'; return; }
    const allDates = [...new Set(codes.flatMap(c => fn[c].history.map(h => h.date)))].sort();
    document.getElementById('phFundHead').innerHTML = '<th>基金</th>' + allDates.map(x => `<th>${x.slice(5)}</th>`).join('');
    document.getElementById('phFundBody').innerHTML = codes.map(c => {
      const byDate = Object.fromEntries(fn[c].history.map(h => [h.date, h.nav]));
      const cells = allDates.map((dd, i) => {
        const nav = byDate[dd];
        if (nav === undefined) return '<td>-</td>';
        const prevDate = allDates.slice(0, i).reverse().find(pd => byDate[pd] !== undefined);
        const prev = prevDate ? byDate[prevDate] : null;
        const chg = prev ? (nav - prev) / prev * 100 : null;
        const cc = chg === null ? '' : (chg >= 0 ? '#dc2626' : '#059669');
        const chgStr = chg === null ? '' : `<span style="font-size:11px;color:${cc};">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>`;
        return `<td><div style="font-weight:700;color:#0f172a;">${nav.toFixed(4)} ${chgStr}</div></td>`;
      }).join('');
      return `<tr><td>${fn[c].name}<div class="code">${c}</div></td>${cells}</tr>`;
    }).join('');
  }

  function renderTrades(d) {
    const trades = d.trades || [];
    if (d.meta && d.meta.tradesUpdated) document.getElementById('tradeUpdated').textContent = '更新于 ' + d.meta.tradesUpdated;
    const actionColor = { '买入': '#dc2626', '定投买入': '#dc2626', '卖出': '#059669', '提现': '#64748b' };
    document.getElementById('tradeBody').innerHTML = trades.map(t => {
      const amt = t.amount !== null && t.amount !== undefined ? fmt(t.amount) : '-';
      const px = t.price !== null && t.price !== undefined ? '¥' + t.price : '-';
      const qty = t.quantity !== null && t.quantity !== undefined ? t.quantity.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : '-';
      const rg = t.realizedGain !== null && t.realizedGain !== undefined ? `<span class="${cls(t.realizedGain)}">${t.realizedGain >= 0 ? '+' : ''}¥${t.realizedGain.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</span>` : '-';
      return `<tr>
        <td>${t.date}</td>
        <td style="color:${actionColor[t.action] || '#334155'};font-weight:600;">${t.action}</td>
        <td>${t.name}</td>
        <td>${px}</td><td>${qty}</td><td>${amt}</td><td>${rg}</td>
        <td style="font-size:11px;color:#64748b;max-width:280px;">${t.note || ''}</td>
      </tr>`;
    }).join('');
  }

  function renderAdvice(d) {
    const list = document.getElementById('adviceList');
    const advice = (d.advice || []).filter(a => a.status === '已确认生效').slice(0, 1);
    if (!advice.length) { list.innerHTML = '<div style="color:#94a3b8;font-size:12.5px;">暂无已确认生效的操作单</div>'; return; }
    const badgeColor = { '已确认生效': '#059669' };
    const badgeBg = { '已确认生效': '#ecfdf5' };
    list.innerHTML = advice.map(a => {
      const c = badgeColor[a.status] || '#64748b', bg = badgeBg[a.status] || '#f1f5f9';
      return `<div class="advice-item" style="border-left-color:${c};">
        <div class="advice-head">
          <span class="advice-date">${a.date}</span>
          ${a.version ? `<span class="advice-version">${a.version}</span>` : ''}
          <span class="advice-status" style="color:${c};background:${bg};">${a.status}</span>
        </div>
        <div class="advice-summary">${a.summary || ''}</div>
        ${a.plan ? `<div class="advice-plan">📌 ${a.plan}</div>` : ''}
      </div>`;
    }).join('');
  }

  function renderInsurance(d) {
    const i = d.insurance || {};
    document.getElementById('insuranceBody').innerHTML = `
      <div class="ins-tile"><div class="ins-tile-label">有效保单</div><div class="ins-tile-value">${i.count || 0} 份</div><div class="ins-tile-sub">${i.type || ''} · ${i.company || ''}</div></div>
      <div class="ins-tile"><div class="ins-tile-label">总保额</div><div class="ins-tile-value">¥${Number(i.coverage || 0).toLocaleString()}</div></div>
      <div class="ins-tile"><div class="ins-tile-label">年缴保费</div><div class="ins-tile-value">¥${Number(i.annualPremium || 0).toLocaleString()}</div><div class="ins-tile-sub">3年交已交满</div></div>
      <div class="ins-tile"><div class="ins-tile-label">保费占比</div><div class="ins-tile-value">${i.premiumRatio || 0}%</div><div class="ins-tile-sub">保费/保额</div></div>`;
  }

  // 主流程
  fetch('data.json?t=' + Date.now(), { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => {
      if (d.meta) {
        document.getElementById('greeting').textContent = '欢迎回来，蒂姆 · 最后更新 ' + (d.meta.updated || '');
        document.getElementById('marketText').textContent = d.meta.market || 'A股';
      }
      renderKPI(d);
      renderAccount(d);
      renderAlloc(d);
      renderHoldings(d.holdings || []);
      renderBrokerYearly(d);
      renderStockCost(d);
      renderPriceHistory(d);
      renderFundNav(d);
      renderTrades(d);
      renderAdvice(d);
      renderInsurance(d);
    })
    .catch(err => {
      document.getElementById('greeting').textContent = '数据加载失败：' + err.message;
      document.getElementById('kpiRow').innerHTML = '<div class="kpi-card"><div class="kpi-value">⚠️</div><div class="kpi-sub">data.json 加载失败</div></div>';
    });

  // tab 切换
  const tabs = document.querySelectorAll('#phTabs button');
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('phStockWrap').style.display = btn.dataset.tab === 'fund' ? 'none' : '';
    document.getElementById('phFundWrap').style.display = btn.dataset.tab === 'stock' ? 'none' : '';
  }));

  // 导航平滑滚动
  document.querySelectorAll('.sidebar nav a').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const t = document.querySelector(href);
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('.sidebar nav a').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
      }
    });
  });

  // 隐私模式
  const pBtn = document.getElementById('privacyBtn');
  let pOn = false;
  try { pOn = localStorage.getItem('wb_privacy') === '1'; } catch (e) {}
  function applyPrivacy() {
    document.body.classList.toggle('privacy-mode', pOn);
    pBtn.textContent = pOn ? '🔓' : '👁️';
    pBtn.title = pOn ? '显示全部数据' : '一键隐藏全部数据';
    pBtn.style.background = pOn ? '#fef2f2' : '#fff';
    pBtn.style.borderColor = pOn ? '#fecaca' : '#e2e8f0';
  }
  pBtn.addEventListener('click', () => {
    pOn = !pOn;
    try { localStorage.setItem('wb_privacy', pOn ? '1' : '0'); } catch (e) {}
    applyPrivacy();
  });
  applyPrivacy();
})();
