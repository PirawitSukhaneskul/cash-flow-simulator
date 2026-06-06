import { jsPDF } from 'jspdf'
import { getSoftwareById } from '../data/softwareCatalog'

// ── Helpers ────────────────────────────────────────────────
const THB = (n) => '฿' + Math.round(Number(n) || 0).toLocaleString('en-US')
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Palette (matches the app)
const C = {
  ink: '#0f0f0f', sub: '#666666', line: '#e0dcd4',
  blue: '#1a56db', red: '#e02020', green: '#1a7f4b', pink: '#fca5a5', amber: '#c47c00',
}

// ── Cash flow chart → PNG dataURL (drawn on a canvas) ──────
function cashFlowChartDataUrl(monthlyData, minSafeBalance, months) {
  const data = (monthlyData || []).slice(0, months || (monthlyData || []).length)
  const W = 900, H = 340, scale = 1.4
  const cv = document.createElement('canvas')
  cv.width = W * scale; cv.height = H * scale
  const ctx = cv.getContext('2d')
  ctx.scale(scale, scale)
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

  const padL = 70, padR = 70, padT = 24, padB = 40
  const plotW = W - padL - padR, plotH = H - padT - padB
  const n = data.length || 1

  const maxBar = Math.max(1, ...data.map(d => Math.max(d.revenue, d.expenses)))
  const balances = data.map(d => d.balance)
  const maxBal = Math.max(minSafeBalance, ...balances, 1)
  const minBal = Math.min(0, ...balances, minSafeBalance)
  const balRange = (maxBal - minBal) || 1

  const xAt = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yBar = (v) => padT + plotH - (v / maxBar) * plotH
  const yBal = (v) => padT + plotH - ((v - minBal) / balRange) * plotH

  // grid + axes
  ctx.strokeStyle = C.line; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke()
  ctx.fillStyle = C.sub; ctx.font = '12px Arial'
  for (let g = 0; g <= 4; g++) {
    const y = padT + (g / 4) * plotH
    ctx.strokeStyle = '#f0ede6'; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke()
    const barVal = maxBar * (1 - g / 4)
    ctx.fillStyle = C.sub; ctx.textAlign = 'right'
    ctx.fillText('฿' + Math.round(barVal / 1000) + 'K', padL - 6, y + 4)
  }

  // min-safe dashed line
  const yMin = yBal(minSafeBalance)
  ctx.strokeStyle = C.red; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(padL, yMin); ctx.lineTo(padL + plotW, yMin); ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = C.red; ctx.textAlign = 'left'; ctx.font = '11px Arial'
  ctx.fillText('Min safe ' + THB(minSafeBalance), padL + 4, yMin - 5)

  // bars
  const slot = plotW / n
  const bw = Math.max(2, Math.min(14, slot * 0.32))
  data.forEach((d, i) => {
    const cx = xAt(i)
    ctx.fillStyle = C.blue
    ctx.fillRect(cx - bw - 1, yBar(d.revenue), bw, padT + plotH - yBar(d.revenue))
    ctx.fillStyle = C.pink
    ctx.fillRect(cx + 1, yBar(d.expenses), bw, padT + plotH - yBar(d.expenses))
  })

  // balance line
  ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5; ctx.beginPath()
  data.forEach((d, i) => { const x = xAt(i), y = yBal(d.balance); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
  ctx.stroke()
  data.forEach((d, i) => {
    const x = xAt(i), y = yBal(d.balance), risky = d.balance < minSafeBalance
    ctx.fillStyle = risky ? C.red : C.blue
    ctx.beginPath(); ctx.arc(x, y, risky ? 4 : 3, 0, Math.PI * 2); ctx.fill()
  })

  // x labels (every ~2 months)
  ctx.fillStyle = C.sub; ctx.font = '11px Arial'; ctx.textAlign = 'center'
  const step = n > 14 ? 3 : n > 8 ? 2 : 1
  data.forEach((d, i) => {
    if (i % step !== 0) return
    const lbl = d.monthLabel || MONTHS[i % 12]
    ctx.fillText(lbl, xAt(i), padT + plotH + 18)
  })

  return cv.toDataURL('image/jpeg', 0.82)
}

// ── Risk warnings (mirrors the compare page) ───────────────
function scenarioWarnings(s) {
  const w = []
  const { results, inputs } = s
  const staffPct = Number(results.staffCostPct)
  if (staffPct > 70) w.push('Salary very high — staff > 70% of expenses; high cash pressure.')
  else if (staffPct < 30) w.push('Salary very low — staff < 30%; quality/retention risk.')
  const projects = inputs.projects || []
  const avgFee = projects.length ? projects.reduce((a, p) => a + p.feePercent, 0) / projects.length : 0
  const avgGuide = projects.length ? projects.reduce((a, p) => a + p.guidelineFeePercent, 0) / projects.length : 0
  if (avgFee > avgGuide + 1.5) w.push(`Design fee above guideline (${avgFee.toFixed(1)}% vs ${avgGuide.toFixed(1)}%) — good margin, lower win rate.`)
  if (avgFee < avgGuide - 1) w.push(`Design fee below guideline (${avgFee.toFixed(1)}% vs ${avgGuide.toFixed(1)}%) — thin margin.`)
  if (inputs.paymentDelay > 0) w.push(`Payment delay +${inputs.paymentDelay} mo — possible monthly liquidity gaps.`)
  if (results.riskyCount > 3) w.push(`${results.riskyCount} risky cash months — consider more capital or a credit line.`)
  if (!results.breakEvenMonth) w.push('No break-even within the simulated period.')
  return w
}

// ── Main: build the PDF ────────────────────────────────────
export function generateReportPdf(scenarios, answers = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = 210, M = 16
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  // ── Cover ──
  doc.setFillColor(15, 15, 15); doc.rect(0, 0, PW, 46, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.text('Cash Flow Report', M, 22)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(180, 180, 180)
  doc.text('Arch Firm Cash Flow Simulator', M, 30)
  doc.text(`${scenarios.length} scenario${scenarios.length > 1 ? 's' : ''}  ·  ${today}`, M, 37)
  if (answers.email) doc.text(answers.email, PW - M, 37, { align: 'right' })

  let y = 58
  doc.setTextColor(15, 15, 15)

  // ── 1. Comparison ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.text('1. Scenario Comparison', M, y); y += 8

  const cols = ['Metric', ...scenarios.map((s, i) => s.name.replace(/^Scenario \d+ - /, `S${i + 1}: `))]
  const rows = [
    ['Annual Revenue', ...scenarios.map(s => THB(s.results.annualRevenue))],
    ['Net Profit (Y1)', ...scenarios.map(s => THB(s.results.annualNetProfit))],
    ['Total Expenses', ...scenarios.map(s => THB(s.results.annualExpenses))],
    ['Salary / yr', ...scenarios.map(s => THB(s.results.annualSalary))],
    ['Software / yr', ...scenarios.map(s => THB(s.results.annualSoftware))],
    ['Staff % of Exp.', ...scenarios.map(s => `${s.results.staffCostPct}%`)],
    ['Break-even', ...scenarios.map(s => s.results.breakEvenMonth ? `Mo ${s.results.breakEvenMonth}` : 'Never')],
    ['Risky months', ...scenarios.map(s => `${s.results.riskyCount}`)],
    ['Min safe cash', ...scenarios.map(s => THB(s.results.minSafeBalance))],
  ]
  const colW = (PW - 2 * M) / cols.length
  // header
  doc.setFillColor(247, 245, 240); doc.rect(M, y, PW - 2 * M, 8, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60)
  cols.forEach((c, i) => doc.text(String(c).slice(0, 22), M + i * colW + 2, y + 5.5))
  y += 8
  doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20)
  rows.forEach((r, ri) => {
    if (ri % 2 === 1) { doc.setFillColor(250, 249, 246); doc.rect(M, y, PW - 2 * M, 7, 'F') }
    r.forEach((cell, ci) => {
      doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal')
      doc.text(String(cell).slice(0, 22), M + ci * colW + 2, y + 5)
    })
    y += 7
  })
  y += 6

  // best scenario
  if (scenarios.length > 1) {
    const best = [...scenarios].sort((a, b) => (b.results.annualNetProfit || 0) - (a.results.annualNetProfit || 0))[0]
    doc.setFillColor(240, 253, 246); doc.rect(M, y, PW - 2 * M, 12, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(26, 127, 75)
    doc.text(`Best scenario: ${best.name}  (${THB(best.results.annualNetProfit)} net profit)`, M + 3, y + 7.5)
    y += 16
  }

  // ── 2. Each scenario ──
  scenarios.forEach((s, idx) => {
    doc.addPage(); y = 20
    doc.setTextColor(15, 15, 15)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
    doc.text(`2.${idx + 1}  ${s.name}`, M, y); y += 9

    // KPI line
    const isProfit = s.results.annualNetProfit >= 0
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(80, 80, 80)
    doc.text(`Revenue ${THB(s.results.annualRevenue)}   ·   Expenses ${THB(s.results.annualExpenses)}`, M, y); y += 6
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
    doc.setTextColor(isProfit ? 26 : 224, isProfit ? 127 : 32, isProfit ? 75 : 32)
    doc.text(`Net profit (Y1): ${THB(s.results.annualNetProfit)}`, M, y); y += 9

    // cash flow chart
    doc.setTextColor(15, 15, 15); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text('Cash Flow Projection', M, y); y += 3
    try {
      const img = cashFlowChartDataUrl(s.results.monthlyData, s.results.minSafeBalance, s.inputs.months)
      const imgW = PW - 2 * M, imgH = imgW * (340 / 900)
      doc.addImage(img, 'JPEG', M, y, imgW, imgH); y += imgH + 6
    } catch (e) { y += 4 }

    // inputs summary
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Inputs', M, y); y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60, 60, 60)
    const team = (s.inputs.team || []).reduce((a, r) => a + r.count, 0)
    const sw = (s.inputs.selectedSoftware || []).length
    const lines = [
      `Projects: ${(s.inputs.projects || []).length}   ·   Team: ${team}   ·   Software: ${sw} tools`,
      `Tax: ${s.inputs.taxRate}%   ·   Initial capital: ${THB(s.inputs.initialCapital)}   ·   Period: ${s.inputs.months} months`,
      `Worst case delay: ${s.inputs.paymentDelay > 0 ? '+' + s.inputs.paymentDelay + ' month(s)' : 'Normal'}   ·   Min safe cash: ${THB(s.results.minSafeBalance)}`,
    ]
    lines.forEach(l => { doc.text(l, M, y); y += 5 })
    y += 1;
    (s.inputs.projects || []).slice(0, 8).forEach(p => {
      doc.text(`•  ${p.name}: ${THB(p.constructionCost)} @ ${p.feePercent.toFixed(2)}% = ${THB(p.constructionCost * p.feePercent / 100)}`, M + 2, y); y += 4.6
    })
    y += 2

    // Team breakdown + software list (the detail collected per simulation)
    const teamStr = (s.inputs.team || []).map(t => `${t.role} x${t.count}`).join(', ') || '—'
    const swStr = (s.inputs.selectedSoftware || [])
      .map(x => { const c = getSoftwareById(x.id); return `${c?.name || x.id} x${x.users || 1}` }).join(', ') || '—'
    const wrap = (label, str) => {
      doc.setFont('helvetica', 'bold'); doc.text(label, M, y)
      doc.setFont('helvetica', 'normal')
      const t = doc.splitTextToSize(str, PW - 2 * M - 22)
      t.forEach((ln, k) => { doc.text(ln, M + 22, y + k * 4.6) })
      y += Math.max(4.6, t.length * 4.6) + 1.5
    }
    wrap('Team:', teamStr)
    wrap('Software:', swStr)
    y += 2

    // warnings
    const warns = scenarioWarnings(s)
    if (warns.length) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 15, 15)
      doc.text('Warnings', M, y); y += 5.5
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(180, 60, 0)
      warns.forEach(w => { const t = doc.splitTextToSize('!  ' + w, PW - 2 * M - 4); doc.text(t, M + 2, y); y += t.length * 4.6 })
    }
  })

  // footer on every page
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text('Estimates for planning only. Verify figures before commercial use.', M, 290)
    doc.text(`${p} / ${pages}`, PW - M, 290, { align: 'right' })
  }

  return doc
}

// Returns { dataUrl, base64, filename }
export function buildReportPdf(scenarios, answers) {
  const doc = generateReportPdf(scenarios, answers)
  const dataUrl = doc.output('datauristring')   // data:application/pdf;filename=...;base64,XXXX
  const base64 = dataUrl.substring(dataUrl.indexOf('base64,') + 7)
  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `cashflow_report_${stamp}.pdf`
  return { doc, dataUrl, base64, filename }
}
