import React from 'react';
import {
  fmtMoney, fmtPct, Money, Nil, Pct, NoData, DateChip, isNil, WarnIcon, InfoIcon, typeColor,
} from '../../lib/format.jsx';
import {
  totalAsset, cashOf, todayPnl, cumulative, stockPositionPct, maxSingle, drawdown, allocation, todoList,
} from '../../lib/derive.js';
import { HoldingsTable } from '../HoldingsTable.jsx';
import { Trades, PriceHistory } from '../Records.jsx';

function ChartPlaceholder() {
  return (
    <div className="chart-box">
      <div className="big">暂无数据</div>
      <div>
        组合权益时间序列不存在：
        <div>· 账户层只有单点快照（无逐日权益）
          <br />· V11 sleeve 台账仅 2026-09-11 当天 2 个观测点、净值恒为基准</div>
      </div>
      <div className="note-line">按你的规则：不得编造基准曲线，故不绘制示意走势。</div>
    </div>
  );
}

export function OverviewPage({ data, go }) {
  const ta = totalAsset(data);
  const cash = cashOf(data);
  const tp = todayPnl(data);
  const cum = cumulative(data);
  const sp = stockPositionPct(data);
  const ms = maxSingle(data);
  const dd = drawdown(data);
  const alloc = allocation(data);
  const { items, cond } = todoList(data);
  const meta = data.meta || {};
  const recent = (data.trades || []).slice(0, 5);

  const daySub = tp.sum === null
    ? '暂无可用当日行情'
    : `仅含 ${tp.stockCount} 只股票的当日行情；${tp.fundCount} 只基金台账当日记为 0（未单独核算），不计入基金收益`;

  return (
    <>
      {/* 第一排：总资产 / 今日盈亏 / 累计投资收益 / 可用现金 */}
      <div className="kpi-row section-gap">
        <div className="kpi-card">
          <div className="kpi-label">总资产（含现金）</div>
          <div className="kpi-value">{isNil(ta) ? <Nil /> : fmtMoney(ta)}</div>
          <div className="kpi-sub">{(data.holdings || []).filter((h) => h.type !== '现金').length} 项持仓（不含现金）</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            今日盈亏
            {tp.fundCount ? <span className="kpi-chip">股票口径</span> : null}
          </div>
          <div className="kpi-value"><Money v={tp.sum} signed /></div>
          <div className="kpi-sub">{daySub}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">累计投资收益</div>
          <div className="kpi-value"><Money v={cum} signed /></div>
          <div className="kpi-sub">
            持仓盈亏 <Money v={(data.summary || {}).totalGain} signed /> ＋ 已实现 <Money v={(data.summary || {}).realizedGain} signed />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">可用现金</div>
          <div className="kpi-value">{cash ? fmtMoney(cash.value) : <Nil />}</div>
          <div className="kpi-sub">单独列示 · 不计入持仓</div>
        </div>
      </div>

      <div className="date-chips section-gap">
        <DateChip label="数据更新" value={meta.updated || '—'} />
        <DateChip label="行情" value={meta.market || '—'} />
        <DateChip label="持仓数量·成本·现金" value={(/券商台账\s*(\d{4}-\d{2}-\d{2})/.exec(meta.asOf || '') || [])[1] ? '券商台账 ' + (/券商台账\s*(\d{4}-\d{2}-\d{2})/.exec(meta.asOf || '') || [])[1] : '—'} warn />
      </div>

      {/* 中部：左 收益走势图 / 右 风险概览 */}
      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-head">
            <div className="card-title">收益走势</div>
            <div className="card-hint">需组合权益时间序列</div>
          </div>
          <ChartPlaceholder />
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">风险概览</div>
            <div className="card-hint">口径见下</div>
          </div>
          <div className="kv">
            <div className="kv-row">
              <span className="k">当前回撤</span>
              <span className="v"><span className="htm-nd">暂无数据</span></span>
            </div>
            <div className="kv-row">
              <span className="k">股票仓位</span>
              <span className="v">{isNil(sp) ? <Nil /> : sp.toFixed(1) + '%'}</span>
            </div>
            <div className="kv-row">
              <span className="k">最大单股占比</span>
              <span className="v">
                {ms ? <>{ms.pct.toFixed(1)}%<span className="card-hint"> {ms.name}</span></> : <Nil />}
              </span>
            </div>
          </div>
          <div className="note-line">
            当前回撤需逐日权益高水位序列，本数据集不存在（账户层单点快照 / V11 台账 2 点）。按规则不填充、不估算。
          </div>
          <div className="risk-list" style={{ marginTop: 12 }}>
            {(() => {
              const out = [];
              if (ms && ms.pct >= 20) out.push({ ic: 'warn', t: '集中度', d: `单一标的占比 ${ms.pct.toFixed(1)}%（${ms.name}）达 20% 以上。` });
              const deep = (data.holdings || []).filter((h) => h.type !== '现金' && !isNil(h.gainRate) && Number(h.gainRate) <= -20);
              if (deep.length) out.push({ ic: 'warn', t: '浮亏超 20%', d: deep.map((h) => `${h.name} ${fmtPct(h.gainRate)}`).join('、') + '（持仓成本口径）。' });
              if (cond && cond.resource && cond.resource.staleness) out.push({ ic: 'info', t: '板块上限口径已失效', d: cond.resource.staleness });
              if (!out.length) return <div className="note-line">未触发内置提示条件。</div>;
              return out.map((r, i) => (
                <div className="risk-item" key={i}>
                  <span className="risk-ic">{r.ic === 'warn' ? <WarnIcon /> : <InfoIcon />}</span>
                  <span><span className="risk-t">{r.t}：</span>{r.d}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* 下部：左 持仓表 / 右 今日待办 */}
      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-head">
            <div className="card-title">持仓</div>
            <button className="link-btn" style={{ marginTop: 0 }} type="button" onClick={() => go('holdings')}>
              查看完整持仓 →
            </button>
          </div>
          <HoldingsTable data={data} compact />
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">今日待办</div>
            <div className="card-hint">按优先级排序</div>
          </div>
          {items.length ? (
            <div className="todo-list">
              {items.map((t, i) => {
                const settled = ['已确认生效', '生效'].includes(t.status);
                const cls = settled ? 'ok' : 'warn';
                return (
                  <div className={'todo-item ' + cls} key={i}>
                    <div className="todo-head">
                      <span className="todo-title">{t.title}</span>
                      <span className="todo-status">{t.status}</span>
                    </div>
                    <div className="todo-meta">原因：{t.reason}</div>
                    <div className="todo-meta">更新时间：{t.updatedAt}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <NoData label="暂无待办" note="condition_state 标志位均为假，且无操作单批次记录。" />
          )}
          <div className="note-line">
            排序规则：① 未确认生效/需人工裁决的批次优先 ② 计划性复核按日期升序。状态取自上游，本页不判定有效期。
          </div>
          {cond ? (
            <div className="date-chips">
              <DateChip label="condition_state" value={cond.updated_at || '—'} />
              <DateChip label="下次现金复核" value={cond.next_cash_review_date || '—'} />
            </div>
          ) : null}
        </div>
      </div>

      {/* 底部：最近交易与资金进出 */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">最近交易与资金进出</div>
          <button className="link-btn" style={{ marginTop: 0 }} type="button" onClick={() => go('cashflow')}>
            完整记录 →
          </button>
        </div>
        <Trades data={{ ...data, trades: recent }} compact />
        <div className="note-line">仅显示最近 5 条；分红、手续费、银证转账在本数据集中无记录。</div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">资产配置</div>
          <div className="card-hint">类别色仅用于本图例</div>
        </div>
        {alloc.map((g) => (
          <div className="alloc-row" key={g.type}>
            <span className="alloc-dot" style={{ background: typeColor[g.type] || '#7d93b0' }} />
            <span className="alloc-name">{g.type}</span>
            <span className="alloc-bar">
              <span className="fill" style={{ width: g.pct.toFixed(1) + '%', background: typeColor[g.type] || '#7d93b0' }} />
            </span>
            <span className="alloc-pct">{g.pct.toFixed(1)}%</span>
            <span className="alloc-val">{fmtMoney(g.val)}</span>
          </div>
        ))}
      </div>

      <PriceHistory data={data} />
    </>
  );
}
