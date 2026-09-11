import React from 'react';
import { fmtMoney, fmtNum, Nil } from '../lib/format.jsx';

export function Insurance({ data }) {
  const ins = data.insurance || {};
  const tiles = [
    {
      label: '保单数量',
      value: ins.count === null || ins.count === undefined ? <Nil /> : ins.count,
      sub: ins.status ? `状态：${ins.status}` : '—',
    },
    {
      label: '保额',
      value: ins.coverage === null || ins.coverage === undefined ? <Nil /> : fmtMoney(ins.coverage, 0),
      sub: ins.type || '—',
    },
    {
      label: '年缴保费',
      value: ins.annualPremium === null || ins.annualPremium === undefined ? <Nil /> : fmtMoney(ins.annualPremium, 0),
      sub: ins.company || '—',
    },
    {
      label: '保费占比',
      value: ins.premiumRatio === null || ins.premiumRatio === undefined ? <Nil /> : fmtNum(ins.premiumRatio, 2) + '%',
      sub: '年缴保费 ÷ 总资产（口径见数据源）',
    },
  ];
  return (
    <section className="card" id="insurance">
      <div className="card-head">
        <div className="card-title">保险</div>
        <div className="card-hint">个人保障台账</div>
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
    </section>
  );
}
