import React from 'react';
import { HoldingsTable } from '../HoldingsTable.jsx';
import { CostRef, PriceHistory } from '../Records.jsx';
import { DateChip } from '../../lib/format.jsx';

export function HoldingsPage({ data }) {
  const meta = data.meta || {};
  const snap = /券商台账\s*(\d{4}-\d{2}-\d{2})/.exec(meta.asOf || '');
  return (
    <>
      <div className="date-chips section-gap">
        <DateChip label="股票行情" value={`${meta.updated || '—'} ${meta.market || ''}`.trim()} />
        <DateChip label="持仓数量·成本" value={snap ? `券商台账 ${snap[1]}` : '—'} warn={!snap} />
        <DateChip label="Core/V11 归属" value="源自 V11 sleeve 台账（现有持仓均为 Core）" />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">持仓明细</div>
          <div className="card-hint">点击列头排序 · 点击行展开 数量/成本/ATR 等详情</div>
        </div>
        <HoldingsTable data={data} />
      </div>

      <CostRef data={data} />
      <PriceHistory data={data} />
    </>
  );
}
