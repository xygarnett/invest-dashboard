import React from 'react';
import { BrokerYearly } from '../Records.jsx';
import { fmtMoney, Money, Nil, NoData, DateChip, isNil, Pct } from '../../lib/format.jsx';
import { cumulative, totalAsset } from '../../lib/derive.js';

export function ReturnsPage({ data }) {
  const s = data.summary || {};
  const a = data.account || {};
  const cum = cumulative(data);
  const ta = totalAsset(data);

  return (
    <>
      <div className="kpi-row section-gap">
        <div className="kpi-card">
          <div className="kpi-label">持仓盈亏</div>
          <div className="kpi-value"><Money v={s.totalGain} signed /></div>
          <div className="kpi-sub">成本 <Money v={s.totalCost} /> · 收益率 <Pct v={s.totalRate} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">已实现收益</div>
          <div className="kpi-value"><Money v={s.realizedGain} signed /></div>
          <div className="kpi-sub">券商台账口径</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">累计投资收益</div>
          <div className="kpi-value"><Money v={cum} signed /></div>
          <div className="kpi-sub">持仓 + 已实现 · 收益率 <Pct v={s.combinedRate} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">总资产（含现金）</div>
          <div className="kpi-value">{isNil(ta) ? <Nil /> : fmtMoney(ta)}</div>
          <div className="kpi-sub">金额收益与收益率分列，不混用</div>
        </div>
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-head">
            <div className="card-title">历史收益（年度）</div>
            <div className="card-hint">券商年度汇总</div>
          </div>
          <BrokerYearly data={data} />
          <div className="date-chips">
            <DateChip label="账户历史快照" value={a.period || '—'} />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">账户历史汇总</div>
            <div className="card-hint">期末资产 / 银证净流入 / 至今盈亏</div>
          </div>
          <div className="kv">
            <div className="kv-row"><span className="k">期末资产</span><span className="v">{isNil(a.endAsset) ? <Nil /> : fmtMoney(a.endAsset)}</span></div>
            <div className="kv-row"><span className="k">银证净流入</span><span className="v">{isNil(a.netInflow) ? <Nil /> : fmtMoney(a.netInflow)}</span></div>
            <div className="kv-row"><span className="k">至今账户盈亏</span><span className="v"><Money v={a.accountGain} signed /></span></div>
            <div className="kv-row"><span className="k">数据区间</span><span className="v">{a.period || '—'}</span></div>
          </div>
          <div className="note-line">银证转入不计入投资收益；上项「至今账户盈亏」为账户口径，与持仓口径分列。</div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-head"><div className="card-title">阶段收益</div><div className="card-hint">需权益序列</div></div>
          <NoData label="暂无数据" note="本数据集无逐日权益时间序列（账户层仅单点快照、V11 台账 2 个观测点），无法计算阶段收益。" />
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">回撤</div><div className="card-hint">需高水位序列</div></div>
          <NoData label="暂无数据" note="回撤需逐日权益与高水位序列，本数据集不存在。按规则不填充、不估算阈值。" />
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">策略贡献</div><div className="card-hint">需 strategy_owner 归属</div></div>
          <NoData label="暂无数据" note="台账记载 strategy_owner=v11 记录数为 0，现有持仓均属核心存量，无归属分账依据 → 无法计算策略贡献。" />
        </div>
      </div>
    </>
  );
}
