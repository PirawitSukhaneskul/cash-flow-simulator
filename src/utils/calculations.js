import { calcSelectedSoftwareCost } from '../data/softwareCatalog'
import { MONTH_NAMES, parseYM, addMonths, currentYM } from './dates'

export function calculateCashFlow(inputs) {
  const {
    projects = [],
    selectedSoftware = [],
    team = [],
    taxRate = 20,
    initialCapital = 1_500_000,
    months = 24,
    rent = 45000, utilities = 8000, marketing = 3000,
    equipment = 5000, outsourcing = 10000, accounting = 5000, other = 3000,
    paymentDelay: globalDelay = 0,
    useCustomMinBalance = false,
    minSafeBalanceCustom = null,
    simStartDate = currentYM(),
  } = inputs
  const startYM = parseYM(simStartDate)

  // ── Fixed monthly costs ───────────────────────────────────
  const softwareMonthlyCost = calcSelectedSoftwareCost(selectedSoftware)
  const monthlySalary = team.reduce((s, m) => s + m.count * m.salary, 0) * 1.12
  const monthlyFixed = monthlySalary + softwareMonthlyCost +
    rent + utilities + marketing + equipment + outsourcing + accounting + other

  // ── Min safe balance ──────────────────────────────────────
  const autoMinBalance = Math.round((monthlySalary + softwareMonthlyCost + rent) * 3)
  const minSafeBalance = (useCustomMinBalance && minSafeBalanceCustom != null)
    ? minSafeBalanceCustom : autoMinBalance

  // ── Revenue distribution per project ─────────────────────
  const monthlyRevenue = new Array(months).fill(0)

  for (const proj of projects) {
    const fee   = proj.constructionCost * (proj.feePercent / 100)
    // Worst Case (global) delay stacks on top of any per-project payment delay,
    // so toggling Worst Case mode always shifts income — even when each project
    // has an explicit paymentDelay of 0.
    const delay = (proj.paymentDelay || 0) + (globalDelay || 0)

    if (proj.milestones && proj.milestones.length > 0) {
      // Milestone-based payment schedule
      for (const ms of proj.milestones) {
        const absIdx = (proj.startMonth - 1) + (ms.month - 1) + delay
        if (absIdx >= 0 && absIdx < months) {
          monthlyRevenue[absIdx] += fee * (ms.pct / 100)
        }
      }
    } else {
      // Legacy: 30% start, 50% mid, 20% end
      const startIdx = (proj.startMonth - 1) + delay
      const midIdx   = startIdx + Math.floor((proj.duration - 1) / 2)
      const endIdx   = (proj.startMonth - 1) + proj.duration - 1 + delay
      if (startIdx < months) monthlyRevenue[startIdx] += fee * 0.30
      if (midIdx   < months) monthlyRevenue[midIdx]   += fee * 0.50
      if (endIdx   < months) monthlyRevenue[endIdx]   += fee * 0.20
    }
  }

  // ── Month-by-month projection ─────────────────────────────
  const monthlyData = []
  let balance = initialCapital

  for (let i = 0; i < months; i++) {
    const revenue  = monthlyRevenue[i]
    const expenses = monthlyFixed
    const profit   = revenue - expenses
    const tax      = profit > 0 ? profit * (taxRate / 100) : 0
    const net      = revenue - expenses - tax
    balance       += net
    const isRisky  = balance < minSafeBalance

    const cur = addMonths(startYM, i)
    // Real month label; show the year compactly at Jan and the first point
    const monthLabel = (cur.m === 0 || i === 0)
      ? `${MONTH_NAMES[cur.m]} '${String(cur.y).slice(2)}`
      : MONTH_NAMES[cur.m]

    monthlyData.push({
      month:        `M${i + 1}`,
      monthLabel,
      dateLabel:    `${MONTH_NAMES[cur.m]} ${cur.y}`,
      year:         Math.floor(i / 12) + 1,
      revenue:      Math.round(revenue),
      expenses:     Math.round(expenses + tax),
      tax:          Math.round(tax),
      net:          Math.round(net),
      balance:      Math.round(balance),
      isRisky,
      balanceSafe:  !isRisky ? Math.round(balance) : null,
      balanceRisky: isRisky  ? Math.round(balance) : null,
    })
  }

  // ── Annual KPIs ───────────────────────────────────────────
  const annualRevenue   = projects.reduce((s, p) => s + p.constructionCost * (p.feePercent / 100), 0)
  const annualExpenses  = monthlyFixed * 12
  const annualProfit    = annualRevenue - annualExpenses
  const annualTax       = annualProfit > 0 ? annualProfit * (taxRate / 100) : 0
  const annualNetProfit = annualProfit - annualTax
  const annualSalary    = monthlySalary * 12
  const annualSoftware  = softwareMonthlyCost * 12

  const breakEvenIdx   = monthlyData.findIndex(d => d.balance >= initialCapital)
  const breakEvenMonth = breakEvenIdx >= 0 ? breakEvenIdx + 1 : null

  const runwayIdx = monthlyData.findIndex(d => d.balance <= 0)
  const runway    = runwayIdx >= 0 ? runwayIdx + 1 : null

  const minBalance  = Math.min(...monthlyData.map(d => d.balance))

  const riskyMonths = monthlyData.filter(d => d.isRisky)
  const riskyCount  = riskyMonths.length
  const firstRisky  = riskyMonths[0] || null

  const annualOffice    = (rent + utilities) * 12
  const annualMarketing = marketing * 12
  const annualOther     = (equipment + outsourcing + accounting + other) * 12

  const expenseBreakdown = [
    { name: 'Salary',    value: Math.round(annualSalary),    color: '#0ea5e9' },
    { name: 'Software',  value: Math.round(annualSoftware),  color: '#8b5cf6' },
    { name: 'Office',    value: Math.round(annualOffice),    color: '#f59e0b' },
    { name: 'Marketing', value: Math.round(annualMarketing), color: '#10b981' },
    { name: 'Tax',       value: Math.round(annualTax),       color: '#f43f5e' },
    { name: 'Other',     value: Math.round(annualOther),     color: '#94a3b8' },
  ].filter(e => e.value > 0)

  const staffCostPct = annualExpenses > 0
    ? ((annualSalary / annualExpenses) * 100).toFixed(1) : '0.0'

  return {
    monthlyData,
    annualRevenue,
    annualExpenses,
    annualProfit,
    annualTax,
    annualNetProfit,
    annualSalary,
    annualSoftware,
    monthlySalary,
    monthlyFixed,
    softwareMonthlyCost,
    breakEvenMonth,
    runway,
    minBalance,
    staffCostPct,
    expenseBreakdown,
    minSafeBalance,
    autoMinBalance,
    riskyMonths,
    riskyCount,
    firstRisky,
  }
}

// ── Formatters ────────────────────────────────────────────
export function fmt(n) {
  if (n == null || isNaN(n)) return '฿—'
  const abs  = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000)     return `${sign}฿${(abs / 1_000).toFixed(0)}K`
  return `${sign}฿${abs.toLocaleString()}`
}

export function fmtFull(n) {
  if (n == null || isNaN(n)) return '฿—'
  const sign = n < 0 ? '-' : ''
  return `${sign}฿${Math.abs(Math.round(n)).toLocaleString()}`
}
