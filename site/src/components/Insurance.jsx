import React from 'react';
import { fmtMoney, fmtNum } from '../lib/format.jsx';

export function Insurance({ data }) {
  const ins = data.insurance || {};
  const tiles = [
    { label: '保单数量', value: ins.count ?? '—', sub: ins.status ? `状态：${ins.status}` : '—' },
    { label: '保额', value: ins.coverage != null ? fmtMoney(ins.coverage, 0) : '—', sub: ins.type || '—' },
    { label: '年缴保费', value: ins.annualPremium != null ? fmtMoney(ins.annualPremium, 0) : '—', sub: ins.company || '—' },
    { label: '保费占比', value: ins.premiumRatio != null ? fmtNum(ins.premiumRatio, 2) + '%' : '—', sub: '年缴保费 / 总资产（口径见数据源）' },
  ];
  return (
    <div className="card" id="insurance">
      <div className="card-head">
        <div className="card-title">
          保险 <span className="card-hint">· 个人保障台账</span>
        </div>
        <div className="card-hint">{ins.company || ''} {ins.type || ''}</div>
      </div>
      <div className="grid-4">
        {tiles.map((t) => (
          <div className="ins-tile" key={t.label}>
            <div className="ins-tile-label">{t.label}</div>
            <div className="ins-tile-value">{t.value}</div>
            <div className="ins-tile-sub">{t.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
