import React from 'react';
import { Trades } from '../Records.jsx';
import { NoData, DateChip, isNil, Money, Nil, fmtPct, Money as M } from '../../lib/format.jsx';

/* 交易与资金：交易记录 / 分红 / 手续费 / 银证转账
   本数据集中后三者无任何记录 → 一律「暂无数据」（不编造、不以 0 冒充事实） */
export function CashFlowPage({ data }) {
  const all = data.trades || [];
  const actions = [...new Set(all.map((t) => t.action))];
  const byAction = actions.map((a) => ({
    a,
    n: all.filter((t) => t.action === a).length,
    amt: all.filter((t) => t.action === a).reduce((s, t) => s + Number(t.amount || 0), 0),
  }));

  const hasDividend = all.some((t) => String(t.action).includes('分红'));
  const hasFee = all.some((t) => String(t.action).includes('费'));
  const hasTransfer = all.some((t) => /银证|转[入出账]/.test(String(t.action)));
  const realized = all.reduce((s, t) => s + Number(t.realizedGain || 0), 0);

  return (
    <>
      <div className="date-chips section-gap">
        <DateChip label="成交记录条数" value={`${all.length} 条`} />
        <DateChip label="记录最新" value={all.length ? all[0].date : '—'} />
        <DateChip label="操作类型" value={actions.join(' / ') || '—'} />
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-head">
            <div className="card-title">交易记录</div>
            <div className="card-hint">默认最近 5 条，可查看全部</div>
          </div>
          <Trades data={data} />
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">按操作类型汇总</div>
            <div className="card-hint">由交易记录聚合</div>
          </div>
          {byAction.length ? (
            <div className="kv">
              {byAction.map((b) => (
                <div className="kv-row" key={b.a}>
                  <span className="k">{b.a}（{b.n} 笔）</span>
                  <span className="v">{b.amt < 0 ? '-' : ''}¥{Math.abs(b.amt).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="kv-row">
                <span className="k">记录内已实现合计</span>
                <span className="v"><Money v={realized} signed /></span>
              </div>
            </div>
          ) : (
            <NoData />
          )}
          <div className="note-line">
            说明：账户层「已实现盈亏」的正式口径来自券商台账 ../holdings.json（{isNil((data.summary || {}).realizedGain) ? '—' : ''}
            <Money v={(data.summary || {}).realizedGain} signed />），此处仅为交易记录内字段合计，可能不含全部历史。
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-head"><div className="card-title">分红</div><div className="card-hint">资金进出</div></div>
          {hasDividend ? <Trades data={{ ...data, trades: all.filter((t) => String(t.action).includes('分红')) }} compact /> : (
            <NoData label="暂无数据" note="交易记录中没有 action 含「分红」的条目。" />
          )}
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">手续费</div><div className="card-hint">资金进出</div></div>
          {hasFee ? <Trades data={{ ...data, trades: all.filter((t) => String(t.action).includes('费')) }} compact /> : (
            <NoData label="暂无数据" note="交易记录中没有独立的费用条目（费用按估算口径并入成交，未单列）。" />
          )}
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">银证转账</div><div className="card-hint">资金进出</div></div>
          {hasTransfer ? <Trades data={{ ...data, trades: all.filter((t) => /银证|转[入出账]/.test(String(t.action))) }} compact /> : (
            <NoData label="暂无数据" note="交易记录中没有银证转账条目。" />
          )}
          <div className="note-line">
            口径提示：银证转入不计入投资收益；金额收益与收益率分开说明。
          </div>
        </div>
      </div>
    </>
  );
}
