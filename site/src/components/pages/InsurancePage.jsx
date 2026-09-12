import React from 'react';
import { fmtMoney, fmtNum, Nil, NoData, DateChip, isNil } from '../../lib/format.jsx';

const LABELS = {
  count: '保单数量',
  coverage: '保额',
  annualPremium: '年缴保费',
  company: '承保公司',
  type: '险种',
  status: '状态',
  premiumRatio: '保费占比',
  insured: '被保人',
  startDate: '起保日期',
  endDate: '到期日期',
  nextPaymentDate: '下次缴费日期',
  paymentYears: '缴费年限',
  beneficiary: '受益人',
  policyNo: '保单号',
};

const isScalar = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);

function renderVal(k, v) {
  if (isNil(v)) return <Nil />;
  if (['coverage', 'annualPremium'].includes(k)) return fmtMoney(v, 0);
  if (k === 'premiumRatio') return fmtNum(v, 2) + '%';
  if (typeof v === 'boolean') return v ? '是' : '否';
  return String(v);
}

export function InsurancePage({ data }) {
  const ins = data.insurance || {};
  const keys = Object.keys(ins);
  if (!keys.length) return <NoData label="暂无数据" note="未取得保险台账。" />;

  const scalarKeys = keys.filter((k) => isScalar(ins[k]));
  const tiles = ['count', 'coverage', 'annualPremium', 'premiumRatio'].filter((k) => k in ins);
  const rest = scalarKeys.filter((k) => !tiles.includes(k));
  const complex = keys.filter((k) => !isScalar(ins[k]));

  return (
    <>
      <div className="grid-4 section-gap">
        {tiles.map((k) => (
          <div className="ins-tile" key={k}>
            <div className="ins-tile-label">{LABELS[k] || k}</div>
            <div className="ins-tile-value">{renderVal(k, ins[k])}</div>
            <div className="ins-tile-sub">
              {k === 'coverage' && ins.type ? ins.type : null}
              {k === 'annualPremium' && ins.company ? ins.company : null}
              {k === 'premiumRatio' ? '年缴保费 ÷ 总资产（口径见数据源）' : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">保单与缴费安排</div>
            <div className="card-hint">台账字段原样展示</div>
          </div>
          {rest.length ? (
            <div className="kv">
              {rest.map((k) => (
                <div className="kv-row" key={k}>
                  <span className="k">{LABELS[k] || k}</span>
                  <span className="v">{renderVal(k, ins[k])}</span>
                </div>
              ))}
            </div>
          ) : (
            <NoData />
          )}
          <div className="date-chips">
            <DateChip label="来源" value="static_data.json · insurance" />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">其他字段</div>
            <div className="card-hint">嵌套结构原样列出</div>
          </div>
          {complex.length ? (
            complex.map((k) => (
              <div className="sub-block" key={k}>
                <div className="sub-title">{LABELS[k] || k}</div>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12, color: 'var(--muted)', background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                  {JSON.stringify(ins[k], null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <div className="note-line">无额外嵌套字段。</div>
          )}
        </div>
      </div>
    </>
  );
}
