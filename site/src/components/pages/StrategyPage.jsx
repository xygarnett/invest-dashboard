import React from 'react';
import { fmtMoney, fmtNum, Money, Nil, NoData, DateChip, isNil, WarnIcon, InfoIcon } from '../../lib/format.jsx';

function SleeveCard({ sleeve, marketColor }) {
  if (!sleeve) return <NoData label="暂无数据" note="未取得 V11 sleeve 台账。" />;
  const obs = sleeve.observations || [];
  const last = obs.length ? obs[obs.length - 1] : null;
  const limit = (sleeve.capital_semantics || {}).ALLOCATION_LIMIT || {};
  const flow = (sleeve.capital_semantics || {}).ACTUAL_EXTERNAL_FLOW || {};
  const ge = sleeve.gate_evidence || {};
  return (
    <>
      <div className="kv">
        <div className="kv-row"><span className="k">sleeve 资金上限</span><span className="v">{isNil(limit.value_cny) ? <Nil /> : fmtMoney(limit.value_cny, 0)}</span></div>
        <div className="kv-row"><span className="k">真实外部净流入</span><span className="v">{isNil(flow.total_cny) ? <Nil /> : fmtMoney(flow.total_cny, 0)}</span></div>
        <div className="kv-row"><span className="k">sleeve 权益</span><span className="v">{last && !isNil(last.equity_cny) ? fmtMoney(last.equity_cny, 0) : <Nil />}</span></div>
        <div className="kv-row"><span className="k">V11 持仓市值</span><span className="v">{last && !isNil(last.v11_position_value) ? fmtMoney(last.v11_position_value, 0) : <Nil />}</span></div>
      </div>
      <div className="date-chips">
        <DateChip label="epoch" value={sleeve.epoch_id || '—'} />
        <DateChip label="观测点" value={`${obs.length} 个`} />
      </div>
      <div className="sub-block">
        <div className="sub-title">闸门状态</div>
        <div className="date-chips">
          {Object.keys(ge).map((k) => (
            <DateChip key={k} label={k} value={ge[k] ? '通过' : '未通过'} warn={!ge[k]} />
          ))}
        </div>
      </div>
      <div className="note-line">
        {limit.meaning || ''}
        {flow.meaning ? ` / ${flow.meaning}` : ''}
        {sleeve.capital_semantics && sleeve.capital_semantics.distinction_note ? ` ${sleeve.capital_semantics.distinction_note}` : ''}
      </div>
      <div className="note-line">
        台账 evidence 明确：现有 5 只持仓均属核心趋势存量，V11 持仓登记为空（v11_position_value = 0）。
      </div>
      {marketColor ? (
        <div className="note-line">
          市场光 {String(marketColor.color) === 'red' ? '红' : '绿'}（{marketColor.freeze_date}，基准 {marketColor.benchmark}）
          {marketColor.source ? ` · 依据：${String(marketColor.source).slice(0, 120)}…` : ''}
        </div>
      ) : null}
    </>
  );
}

function Candidates({ data }) {
  const r = data.extras && data.extras.researchCandidates;
  if (!r) return <NoData label="暂无数据" note="未取得 V11 前置筛选结果文件。" />;
  const st = r.stats || {};
  const rowsS = r.s_potential || [];
  const rowsA = r.a_potential || [];
  const trunc = r.truncated || {};
  const cell = (x) => (
    <tr key={x.code + (x.sector || '')}>
      <td className="cell-left"><div className="nm-wrap">{x.name}</div><div className="code">{x.code}</div></td>
      <td className="num">{fmtNum(x.positive, 0)}</td>
      <td className="num">{fmtNum(x.upper_bound, 0)}</td>
      <td className="num">{fmtNum(x.market, 0)}</td>
      <td className="num">{fmtNum(x.stock, 0)}</td>
      <td className="num">{fmtNum(x.volume, 0)}</td>
      <td className="num">{fmtNum(x.leader, 0)}</td>
      <td className="num">{x.data_status || '—'}</td>
    </tr>
  );
  return (
    <>
      <div className="date-chips">
        <DateChip label="筛选交易日" value={r.trade_date || '—'} />
        <DateChip label="全市场" value={`${fmtNum(st.total, 0)} 只`} />
        <DateChip label="硬筛剔除" value={`${fmtNum(st.hard_filtered, 0)} 只`} />
        <DateChip label="数据不足" value={`${fmtNum(st.data_insufficient, 0)} 只`} />
        <DateChip label="S 潜力" value={`${fmtNum(st.s_potential, 0)} 只`} />
        <DateChip label="A 潜力" value={`${fmtNum(st.a_potential, 0)} 只`} />
      </div>
      <div className="sub-block">
        <div className="sub-title">S 潜力（{rowsS.length}）</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th className="cell-left">标的</th><th>综合分</th><th>上限</th><th>市场</th><th>个股</th><th>量能</th><th>龙头</th><th>数据</th>
            </tr></thead>
            <tbody>{rowsS.map(cell)}</tbody>
          </table>
        </div>
      </div>
      <div className="sub-block">
        <div className="sub-title">A 潜力（显示 {rowsA.length}{trunc.a_potential ? ` / 共 ${rowsA.length + trunc.a_potential}` : ''}）</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th className="cell-left">标的</th><th>综合分</th><th>上限</th><th>市场</th><th>个股</th><th>量能</th><th>龙头</th><th>数据</th>
            </tr></thead>
            <tbody>{rowsA.map(cell)}</tbody>
          </table>
        </div>
        {trunc.a_potential ? <div className="note-line">另有 {trunc.a_potential} 只未在页面展示（仅展示前 {rowsA.length} 只）。</div> : null}
      </div>
      <div className="note-line">
        来源文件：{data.extras.researchCandidatesSource || '—'}（只读透传，未做任何重算）。研究候选不等于交易授权，须人工复核。
      </div>
    </>
  );
}

export function StrategyPage({ data }) {
  const cond = data.extras && data.extras.conditions;
  const sleeve = data.extras && data.extras.v11Sleeve;
  const marketColor = data.extras && data.extras.marketColor;

  return (
    <>
      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Core / V11</div>
            <div className="card-hint">仅保留 Core 与 V11</div>
          </div>
          <SleeveCard sleeve={sleeve} marketColor={marketColor} />
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">条件与闸门</div>
            <div className="card-hint">condition_state 只读透传</div>
          </div>
          {cond ? (
            <>
              <div className="date-chips">
                {Object.keys(cond.flags || {}).map((k) => (
                  <DateChip key={k} label={k} value={cond.flags[k] ? '是' : '否'} warn={!!cond.flags[k]} />
                ))}
              </div>
              <div className="date-chips">
                <DateChip label="上次现金复核" value={cond.last_cash_review_date || '—'} />
                <DateChip label="下次现金复核" value={cond.next_cash_review_date || '—'} />
                <DateChip label="数据截至" value={cond.data_asof || '—'} />
              </div>
              {cond.resource ? (
                <div className="sub-block">
                  <div className="sub-title">板块上限口径</div>
                  <div className="kv">
                    <div className="kv-row"><span className="k">计算上限</span><span className="v">{isNil(cond.resource.calculated_cap) ? <Nil /> : cond.resource.calculated_cap + '%'}</span></div>
                    <div className="kv-row"><span className="k">生效交易上限</span><span className="v">{isNil(cond.resource.effective_trade_cap) ? <Nil /> : cond.resource.effective_trade_cap + '%'}</span></div>
                    <div className="kv-row"><span className="k">状态</span><span className="v">{cond.resource.effective_trade_cap_status || '—'}</span></div>
                  </div>
                  {cond.resource.staleness ? (
                    <div className="risk-list" style={{ marginTop: 10 }}>
                      <div className="risk-item">
                        <span className="risk-ic"><WarnIcon /></span>
                        <span><span className="risk-t">口径已失效：</span>{cond.resource.staleness}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <NoData label="暂无数据" note="未取得 condition_state。" />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">研究候选</div>
          <div className="card-hint">V11 前置筛选结果 · 研究观察，不构成交易信号</div>
        </div>
        <Candidates data={data} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">行业观察</div>
            <div className="card-hint">研究观察</div>
          </div>
          <NoData
            label="暂无数据"
            note="本数据集中不存在行业观察结果文件（未检索到任何行业观察数据源）。按规则不生成示意结论。"
          />
        </div>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Sector Cycle</div>
            <div className="card-hint">研究观察 · 有真实结果才显示</div>
          </div>
          <NoData
            label="暂无数据"
            note="本数据集中不存在 Sector Cycle 结果文件。该模块仅作研究展示，不生成交易信号，故不填充。"
          />
          <div className="risk-list" style={{ marginTop: 12 }}>
            <div className="risk-item">
              <span className="risk-ic"><InfoIcon /></span>
              <span><span className="risk-t">研究观察：</span>本页所有研究类内容仅供观察，不构成交易授权；不恢复 V10-D，不修改策略规则或风控参数，不提供自动下单。</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
