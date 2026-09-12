/* ============================================================
   展示层派生口径（全部由 data.json 既有真实字段推导，不外推、不编造）
   若某指标所需数据不存在，一律返回 null → 界面显示「暂无数据」。
   ============================================================ */
import { isNil } from './format.jsx';

/* ---------- 总资产 / 现金 ---------- */
export const totalAsset = (data) => (isNil(data?.summary?.totalValue) ? null : Number(data.summary.totalValue));
export const cashOf = (data) => {
  const row = (data?.holdings || []).find((h) => h.type === '现金');
  return row && !isNil(row.value) ? { row, value: Number(row.value) } : null;
};

/* ---------- 今日盈亏 ----------
   口径说明：台账对基金行的 dayGain 一律记为 0（未单独核算），股票行为实际当日盈亏。
   按「基金未更新/未核算不能当作零收益」的要求，本指标只取**股票**当日盈亏并明确标注；
   基金行仅用于披露，不计入合计（其值为 0，故合计数值不受影响）。 ---------- */
export const todayPnl = (data) => {
  const rows = data?.holdings || [];
  const stockRows = rows.filter((h) => h.type === '股票' && !isNil(h.dayGain));
  const fundRows = rows.filter((h) => h.type === '基金');
  if (!stockRows.length) return { sum: null, stockCount: 0, fundCount: fundRows.length, fundRecorded: 0 };
  const fundRecorded = fundRows.filter((h) => !isNil(h.dayGain)).length;
  return {
    sum: stockRows.reduce((a, h) => a + Number(h.dayGain || 0), 0),
    stockCount: stockRows.length,
    fundCount: fundRows.length,
    fundRecorded,
  };
};

/* ---------- 累计投资收益 = 持仓盈亏 + 已实现（summary 既有口径） ---------- */
export const cumulative = (data) => (isNil(data?.summary?.totalCombined) ? null : Number(data.summary.totalCombined));

/* ---------- 股票仓位 = 股票市值 / 总资产 ---------- */
export const stockPositionPct = (data) => {
  const total = totalAsset(data);
  if (!total) return null;
  const stock = (data?.holdings || []).filter((h) => h.type === '股票').reduce((a, h) => a + Number(h.value || 0), 0);
  return (stock / total) * 100;
};

/* ---------- 最大单股占比 ---------- */
export const maxSingle = (data) => {
  const total = totalAsset(data);
  if (!total) return null;
  const rows = (data?.holdings || []).filter((h) => h.type !== '现金');
  if (!rows.length) return null;
  const top = rows.reduce((a, b) => (Number(a.value || 0) >= Number(b.value || 0) ? a : b));
  return { name: top.name, code: top.code, pct: (Number(top.value || 0) / total) * 100 };
};

/* ---------- 当前回撤：需要组合权益时间序列；本数据集不存在 → null（暂无数据） ---------- */
export const drawdown = (data) => {
  const obs = data?.extras?.v11Sleeve?.observations || [];
  // V11 sleeve 台账只有 2 个同日观测点且净值恒为基准，无法构成回撤序列
  if (obs.length < 3) return null;
  return null;
};

/* ---------- 资产配置（类别占比） ---------- */
export const allocation = (data) => {
  const rows = data?.holdings || [];
  const total = rows.reduce((a, h) => a + Number(h.value || 0), 0) || 1;
  const present = [...new Set(rows.map((h) => h.type))];
  const order = ['基金', '股票', '现金'].filter((t) => present.includes(t)).concat(present.filter((t) => !['基金', '股票', '现金'].includes(t)));
  return order.map((t) => {
    const list = rows.filter((h) => h.type === t);
    const val = list.reduce((a, h) => a + Number(h.value || 0), 0);
    return { type: t, val, pct: (val / total) * 100, n: list.length };
  });
};

/* ---------- Core / V11 归属 ----------
   依据 extras.v11Sleeve（V11 sleeve 台账）：v11_position_value=0，
   且台账 evidence 明确「5 只既有持仓均属核心趋势存量，不计入 V11」。
   故：非现金持仓标记 Core；V11 无持仓。数据缺失则返回 null（界面显示 —）。 */
export const ownerOf = (data, h) => {
  const sleeve = data?.extras?.v11Sleeve;
  if (!sleeve) return null;
  if (h.type === '现金') return null;
  const obs = sleeve.observations || [];
  const last = obs.length ? obs[obs.length - 1] : null;
  const v11Value = last ? Number(last.v11_position_value || 0) : 0;
  if (v11Value === 0) return 'Core';
  return null; // 归属信息不完整时不猜
};

/* ---------- 风险状态 ----------
   来源 extras.profitProtection（利润保护台账）。字段全为 null 表示该周期未激活。 */
export const riskOf = (data, h) => {
  const pp = data?.extras?.profitProtection;
  if (!pp || h.type === '现金') return null;
  const st = (pp.positions || {})[h.code] || (pp.archive || {})[h.code];
  if (!st) return { label: '未登记', tone: 'neutral' };
  if (st.state === 'CLOSED') return { label: '周期已终止', tone: 'neutral' };
  if (st.activation_date) return { label: '保护中', tone: 'warn' };
  const anySet = ['activation_date', 'H', 'pending_status'].some((k) => !isNil(st[k]) && st[k] !== false);
  if (!anySet) return { label: '未激活', tone: 'neutral' };
  return { label: '待确认', tone: 'warn' };
};

/* ---------- ATR 止损：本数据集无当前 ATR 监测记录 → null（暂无数据） ---------- */
export const atrOf = () => null;

/* ---------- 今日待办 ----------
   全部来自真实字段：condition_state 标志位与日期、advice.json 批次状态。
   排序规则（写明以便核对）：① 需人工裁决/未确认生效的批次优先；② 计划性复核按日期升序。 */
export const todoList = (data) => {
  const items = [];
  const cond = data?.extras?.conditions;
  const advice = [...(data?.advice || [])].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  advice.forEach((a) => {
    const st = String(a.status || '').trim() || '待复核';
    const settled = ['已确认生效', '生效'].includes(st);
    items.push({
      title: `${a.date} 操作单批次`,
      reason: a.summary || '—',
      updatedAt: a.date || '—',
      status: st,
      priority: settled ? 3 : 1,
    });
  });

  if (cond) {
    if (cond.next_cash_review_date) {
      items.push({
        title: '现金复核（计划）',
        reason: '资金余额与可卖数量复核窗口',
        updatedAt: cond.next_cash_review_date,
        status: '计划中',
        priority: 2,
      });
    }
    const fl = cond.flags || {};
    const flagLabels = {
      pending_exit: '存在待退出信号',
      valid_v10_signal: '存在 V10 信号（已退役策略，不执行）',
      rotation_day11_exit: '轮动 Day11 退出检查',
      cash_reallocation_due: '现金再配置到期',
      corporate_action_review: '公司行动复核',
      broker_order_review: '券商委托复核',
    };
    Object.keys(flagLabels).forEach((k) => {
      if (fl[k] === true) {
        items.push({ title: flagLabels[k], reason: 'condition_state 标志位为真', updatedAt: cond.updated_at || '—', status: '待处理', priority: 1 });
      }
    });
  }

  items.sort((a, b) => a.priority - b.priority || String(a.updatedAt).localeCompare(String(b.updatedAt)));
  return { items, cond };
};

/* ---------- 板块/行业观察：无真实数据文件 → null ---------- */
export const sectorObservation = () => null;
