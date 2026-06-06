import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, Wallet, Users, Monitor, Receipt, BookMarked, Save,
} from 'lucide-react'
import { fmt, fmtFull } from '../utils/calculations'
import VisitorCounter from './VisitorCounter'

// ── Formatters ─────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Tooltip ────────────────────────────────────────────────
function CashTooltip({ active, payload, minSafeBalance }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, padding:'12px 16px', boxShadow:'var(--sh-md)', fontSize:'0.78rem', minWidth:210 }}>
      <div style={{ fontWeight:700, marginBottom:8, color:'var(--ink-3)' }}>
        {d.dateLabel || d.monthLabel}
        {d.isRisky && <span style={{ color:'var(--red)', marginLeft:6, fontSize:'0.7rem' }}>⚠️ Risky</span>}
      </div>
      {[
        { k:'Revenue',  v:d.revenue,  c:'#2563eb' },
        { k:'Expenses', v:d.expenses, c:'#f87171' },
        { k:'Net',      v:d.net,      c:d.net>=0?'var(--green)':'var(--red)' },
        { k:'Balance',  v:d.balance,  c:d.isRisky?'var(--red)':'var(--ink)' },
      ].map(r => (
        <div key={r.k} style={{ display:'flex', justifyContent:'space-between', gap:16, marginBottom:3 }}>
          <span style={{ color:'var(--ink-3)', display:'flex', gap:5, alignItems:'center' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:r.c, display:'inline-block' }} />{r.k}
          </span>
          <span style={{ fontWeight:700, color:r.c }}>{fmtFull(r.v)}</span>
        </div>
      ))}
      <div style={{ borderTop:'1px solid var(--border)', marginTop:6, paddingTop:6, display:'flex', justifyContent:'space-between', fontSize:'0.7rem' }}>
        <span style={{ color:'var(--ink-4)' }}>Min Safe</span>
        <span style={{ color:'var(--red)', fontWeight:600 }}>{fmtFull(minSafeBalance)}</span>
      </div>
    </div>
  )
}

function PieTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px', boxShadow:'var(--sh-sm)', fontSize:'0.78rem' }}>
      <div style={{ fontWeight:600 }}>{d.name}</div>
      <div style={{ color:'var(--ink-3)' }}>{fmtFull(d.value)}</div>
    </div>
  )
}

// ── Balance Alert ──────────────────────────────────────────
function BalanceAlert({ riskyCount, firstRisky }) {
  if (riskyCount === 0) return (
    <div className="balance-alert safe" style={{ marginBottom:12 }}>
      <span className="balance-alert-icon">✅</span>
      <div><div className="balance-alert-title">Cash balance is healthy</div>
        <div className="balance-alert-desc">Balance stays above minimum safe level throughout</div></div>
    </div>
  )
  if (riskyCount <= 2) return (
    <div className="balance-alert warning" style={{ marginBottom:12 }}>
      <span className="balance-alert-icon">⚠️</span>
      <div><div className="balance-alert-title">
        Risky in {firstRisky?.dateLabel || firstRisky?.monthLabel}
      </div>
        <div className="balance-alert-desc">{riskyCount} month(s) below min safe — consider credit line</div></div>
    </div>
  )
  return (
    <div className="balance-alert critical" style={{ marginBottom:12 }}>
      <span className="balance-alert-icon">🔴</span>
      <div><div className="balance-alert-title">Cash below minimum for {riskyCount} months</div>
        <div className="balance-alert-desc">Increase capital, accelerate receivables, or cut fixed costs</div></div>
    </div>
  )
}

// ── KPI Row — 5 compact cards ──────────────────────────────
function NetProfitHero({ results, inputs }) {
  const { annualRevenue, annualNetProfit } = results
  const isProfit = annualNetProfit >= 0
  const margin   = annualRevenue > 0 ? ((annualNetProfit / annualRevenue) * 100).toFixed(1) : null

  return (
    <div className="kpi-hero" style={{ marginBottom:12 }}>
      <div>
        <div className="kpi-hero-tag">Annual Net Profit (Year 1 est.)</div>
        <div className={`kpi-hero-value ${isProfit ? 'profit' : 'loss'}`}>{fmtFull(annualNetProfit)}</div>
        <div className="kpi-hero-sub">{isProfit ? '▲ กำไร' : '▼ ขาดทุน'} · after {inputs.taxRate}% tax</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div className="kpi-hero-margin-label">Net Margin</div>
        <div className={`kpi-hero-margin ${isProfit ? 'profit' : 'loss'}`}>{margin != null ? `${margin}%` : '—'}</div>
      </div>
    </div>
  )
}

function RevExpRow({ results }) {
  const { annualRevenue, annualExpenses } = results
  return (
    <div className="kpi-pair-row">
      {[
        { icon: TrendingUp, label:'Annual Revenue',  value: fmtFull(annualRevenue),  color:'var(--blue)', accent:'accent-blue' },
        { icon: Receipt,    label:'Annual Expenses', value: fmtFull(annualExpenses), color:'var(--red)',  accent:'accent-red'  },
      ].map(({ icon: Icon, label, value, color, accent }) => (
        <div key={label} className={`kpi-compact-card ${accent}`}>
          <div className="kpi-compact-icon">
            <Icon size={16} color={color} />
          </div>
          <div className="kpi-tag">{label}</div>
          <div className="kpi-value" style={{ color, fontSize:'1.15rem' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Reality Check — 4 compact scan boxes ───────────────────
function RealityCheck({ results, inputs }) {
  const { riskyCount, runway, staffCostPct } = results
  const projects = inputs.projects || []
  const avgFee   = projects.length ? projects.reduce((s, p) => s + p.feePercent, 0) / projects.length : 0
  const avgGuide = projects.length ? projects.reduce((s, p) => s + p.guidelineFeePercent, 0) / projects.length : 0
  const staffPct = Number(staffCostPct)
  const delay    = inputs.paymentDelay || 0

  const cashSafety = runway
    ? { value: 'At risk',          desc: `Cash ติดลบ Month ${runway}`,   type: 'danger' }
    : riskyCount === 0
    ? { value: 'Safe',             desc: 'สูงกว่า min safe ตลอดช่วง',     type: 'safe' }
    : riskyCount <= 2
    ? { value: `${riskyCount} mo low`, desc: 'ต่ำกว่า min safe บางเดือน', type: 'warning' }
    : { value: `${riskyCount} mo low`, desc: 'ต่ำกว่า min safe หลายเดือน', type: 'danger' }

  const feeLevel = avgFee > avgGuide + 0.25
    ? { value: 'Above guideline', desc: `${avgFee.toFixed(1)}% vs ASA ${avgGuide.toFixed(1)}%`, type: 'safe' }
    : avgFee < avgGuide - 0.25
    ? { value: 'Below guideline', desc: `${avgFee.toFixed(1)}% vs ASA ${avgGuide.toFixed(1)}%`, type: 'danger' }
    : { value: 'On guideline',    desc: `${avgFee.toFixed(1)}% ≈ ASA ${avgGuide.toFixed(1)}%`, type: 'safe' }

  const salaryLevel = staffPct > 60
    ? { value: `${staffPct}% high`, desc: 'ค่าพนักงานสูงเกินเกณฑ์', type: 'danger' }
    : staffPct < 30
    ? { value: `${staffPct}% low`,  desc: 'ค่าพนักงานต่ำผิดปกติ',   type: 'warning' }
    : { value: `${staffPct}% ok`,   desc: 'อยู่ในเกณฑ์ที่ดี',       type: 'safe' }

  const delayRisk = delay === 0
    ? { value: 'None',       desc: 'ลูกค้าจ่ายตรงเวลา',  type: 'safe' }
    : { value: `+${delay} mo`, desc: 'Worst case จ่ายช้า', type: delay >= 2 ? 'danger' : 'warning' }

  const boxes = [
    { icon: '💧', label: 'Cash Safety',         ...cashSafety },
    { icon: '📐', label: 'Fee Level',           ...feeLevel },
    { icon: '👥', label: 'Salary Level',        ...salaryLevel },
    { icon: '⏳', label: 'Payment Delay Risk',  ...delayRisk },
  ]

  return (
    <div className="card">
      <div className="card-title">Reality Check</div>
      <div className="reality-grid">
        {boxes.map(c => (
          <div key={c.label} className={`reality-card ${c.type}`}>
            <div className="reality-icon">{c.icon}</div>
            <div className="reality-label">{c.label}</div>
            <div className="reality-value">{c.value}</div>
            <div className="reality-desc">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Custom dot renderer for balance line ───────────────────
function BalanceDot(props) {
  const { cx, cy, payload, minSafeBalance, showLabel } = props
  if (!payload || cx == null || cy == null) return null
  const risky = payload.balance < minSafeBalance
  const color = risky ? '#e02020' : '#1a56db'
  const r     = risky ? 4.5 : 3
  return (
    <g key={`dot_${payload.month}`}>
      <circle cx={cx} cy={cy} r={r} fill={color} stroke="white" strokeWidth={1.5} />
      {showLabel && (
        <text x={cx} y={cy - 9} textAnchor="middle" fontSize={8} fill={color} fontWeight={700} dominantBaseline="auto">
          {fmt(payload.balance)}
        </text>
      )}
    </g>
  )
}

// ── Combo Cash Flow Chart ──────────────────────────────────
function ComboCashChart({ data, months, minSafeBalance, initialCapital, paymentDelay }) {
  const count   = Math.min(months, 24)
  const display = data.slice(0, count).map((d, i) => ({
    ...d,
    label: d.monthLabel,
    expensesDown: -Math.abs(d.expenses),   // expenses drawn below zero (outflow)
  }))

  // Cleaner chart: keep a visible vertex on every month, but show the value
  // numbers only on hover (via the tooltip) instead of labeling every point.
  const showVertexLabels = false
  const barSize          = count > 18 ? 7 : count > 12 ? 10 : 16

  // Use the unique month key (M1..Mn) for the axis; map to a display label.
  // (Month names repeat across years, so they can't be the category key.)
  const labelByMonth = Object.fromEntries(display.map(d => [d.month, d.monthLabel]))

  // Quarter boundary lines (start of Q2, Q3, Q4, Q5…)
  const qBoundaryXs = display.filter((_, i) => i > 0 && i % 3 === 0).map(d => d.month)

  // Quarter labels: Q1 at index 0, Q2 at index 3, etc.
  const qLabels = display.filter((_, i) => i % 3 === 0).map((d, qi) => ({
    x: d.month, q: `Q${qi + 1}`,
  }))

  const interval = count > 18 ? 2 : count > 12 ? 1 : 0

  const riskyCount = display.filter(d => d.balance < minSafeBalance).length
  const firstRisky = display.find(d => d.balance < minSafeBalance) || null

  return (
    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
      <div className="chart-title">Cash Flow Projection</div>
      <div className="chart-subtitle">
        Income ▲ · Outcome ▼ · ● Net profit / month · — Cash balance
        {paymentDelay > 0 && <span style={{ color:'var(--amber)', fontWeight:600 }}> · ⚡ +{paymentDelay}mo payment delay</span>}
      </div>

      <BalanceAlert riskyCount={riskyCount} firstRisky={firstRisky} />

      <div style={{ height: 290 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={display} margin={{ top: 24, right: 60, bottom: 0, left: 10 }} barGap={2}>

            {/* Grid — light verticals every month, stronger at quarters */}
            <CartesianGrid strokeDasharray="0" vertical={true} stroke="var(--border)" strokeOpacity={0.6} horizontal={true} />

            <XAxis dataKey="month" tickFormatter={m => labelByMonth[m] || m} tick={{ fontSize:10, fill:'var(--ink-4)' }} axisLine={false} tickLine={false} interval={interval} />

            {/* Left Y: bars */}
            <YAxis yAxisId="bars" tickFormatter={v => fmt(v)} tick={{ fontSize:10, fill:'var(--ink-4)' }} axisLine={false} tickLine={false} width={50} />
            {/* Right Y: balance */}
            <YAxis yAxisId="line" orientation="right" tickFormatter={v => fmt(v)} tick={{ fontSize:10, fill:'var(--ink-4)' }} axisLine={false} tickLine={false} width={54} />

            <Tooltip content={<CashTooltip minSafeBalance={minSafeBalance} />} />

            {/* Quarter boundary stronger lines */}
            {qBoundaryXs.map(x => (
              <ReferenceLine key={`qb_${x}`} yAxisId="line" x={x} stroke="var(--border-md)" strokeWidth={1.5} />
            ))}

            {/* Quarter labels at top */}
            {qLabels.map(({ x, q }) => (
              <ReferenceLine key={`ql_${q}`} yAxisId="line" x={x} stroke="none"
                label={{ value: q, position: 'top', fill:'#94a3b8', fontSize:9, fontWeight:700 }} />
            ))}

            {/* Danger zone shading below min safe balance */}
            <ReferenceArea yAxisId="line" y1={0} y2={minSafeBalance} fill="#fef2f2" fillOpacity={0.45} stroke="none" />

            {/* Dashed red min safe line */}
            <ReferenceLine yAxisId="line" y={minSafeBalance}
              stroke="#e02020" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value:`Min ฿${(minSafeBalance/1000).toFixed(0)}K`, position:'insideTopRight', fontSize:9, fill:'#e02020', fontWeight:600 }} />

            {/* Zero baseline for the diverging bars */}
            <ReferenceLine yAxisId="bars" y={0} stroke="var(--border-md)" strokeWidth={1} />

            {/* Income bars — up (green) */}
            <Bar yAxisId="bars" dataKey="revenue"      name="Income"  fill="#1a7f4b" radius={[3,3,0,0]} barSize={barSize} />
            {/* Outcome bars — down (red) */}
            <Bar yAxisId="bars" dataKey="expensesDown" name="Outcome" fill="#e57373" radius={[0,0,3,3]} barSize={barSize} />

            {/* Net profit / month — points on the bars axis */}
            <Line
              yAxisId="bars"
              dataKey="net"
              name="Net profit"
              stroke="#888888"
              strokeWidth={1.5}
              dot={(props) => { const { key, cx, cy, payload } = props; if (cx == null || cy == null) return null; return <circle key={key} cx={cx} cy={cy} r={3} fill={payload.net >= 0 ? '#1a7f4b' : '#e02020'} stroke="white" strokeWidth={1.2} /> }}
              activeDot={{ r:5, fill:'#555', stroke:'white', strokeWidth:2 }}
              connectNulls
            />

            {/* Cash balance line — running position, right axis */}
            <Line
              yAxisId="line"
              dataKey="balance"
              name="Balance"
              stroke="#1a56db"
              strokeWidth={2.5}
              dot={(props) => { const { key, ...rest } = props; return <BalanceDot key={key} {...rest} minSafeBalance={minSafeBalance} showLabel={showVertexLabels} /> }}
              activeDot={{ r:5, fill:'#1a56db', stroke:'white', strokeWidth:2 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend" style={{ marginTop:10 }}>
        <div className="legend-item"><div className="legend-dot" style={{ background:'#1a7f4b' }}/><span>Income ▲</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background:'#e57373' }}/><span>Outcome ▼</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background:'#888888' }}/><span>Net profit / month</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background:'#1a56db' }}/><span>Cash balance</span></div>
        <div className="legend-item"><div className="legend-dash" /><span>Min safe ({fmtFull(minSafeBalance)})</span></div>
      </div>
    </div>
  )
}

// ── Expense Donut ──────────────────────────────────────────
function ExpenseDonut({ data, annualExpenses }) {
  const withPct = data.map(d => ({ ...d, percent: annualExpenses > 0 ? ((d.value / annualExpenses)*100).toFixed(1) : '0' }))
  return (
    <div className="chart-card">
      <div className="chart-title">Expense Breakdown</div>
      <div className="chart-subtitle">Annual: {fmtFull(annualExpenses)}</div>
      <div style={{ height:180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={withPct} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
              {withPct.map((e,i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip content={<PieTip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend" style={{ justifyContent:'center', flexWrap:'wrap' }}>
        {withPct.map(d => (
          <div key={d.name} className="legend-item">
            <div className="legend-dot" style={{ background:d.color }} />
            <span>{d.name}</span>
            <span style={{ color:'var(--ink-4)' }}>{d.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Scenario Summary ───────────────────────────────────────
function ScenarioSummary({ inputs, results }) {
  return (
    <div className="chart-card">
      <div className="chart-title">Scenario Summary</div>
      <div className="chart-subtitle">Key assumptions</div>
      {[
        { label:'Projects',      value:`${inputs.projects.length} projects` },
        { label:'Revenue est.',  value:fmtFull(results.annualRevenue) },
        { label:'Team Size',     value:`${inputs.team.reduce((s,r)=>s+r.count,0)} คน` },
        { label:'Monthly Fixed', value:fmtFull(results.monthlyFixed) },
        { label:'Initial Capital',value:fmtFull(inputs.initialCapital) },
        { label:'Min Safe Bal.', value:fmtFull(results.minSafeBalance) },
      ].map(({ label, value }) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7, fontSize:'0.82rem' }}>
          <span style={{ color:'var(--ink-3)' }}>{label}</span>
          <span style={{ fontWeight:600 }}>{value}</span>
        </div>
      ))}
      {inputs.paymentDelay > 0 && (
        <div style={{ marginTop:8, padding:'6px 10px', background:'var(--amber-light)', borderRadius:8, fontSize:'0.75rem', color:'var(--amber)', fontWeight:600 }}>
          ⚡ Worst Case: +{inputs.paymentDelay}mo payment delay active
        </div>
      )}
    </div>
  )
}

// ── Statement of Cash Flows (annual) ───────────────────────
function StatementOfCashFlows({ inputs, results }) {
  const begin   = inputs.initialCapital || 0
  const receipts = results.annualRevenue || 0
  const pays = results.expenseBreakdown || []        // Salary, Software, Office, Marketing, Tax, Other
  const totalPay = pays.reduce((s, p) => s + p.value, 0)
  const net = receipts - totalPay
  const ending = begin + net

  const Row = ({ label, value, indent, strong, color, top }) => (
    <div className={`socf-row${strong ? ' strong' : ''}`} style={top ? { borderTop: '1.5px solid var(--border-md)' } : undefined}>
      <span className="socf-label" style={{ paddingLeft: indent ? 18 : 0 }}>{label}</span>
      <span className="socf-val" style={color ? { color } : undefined}>{value == null ? '' : fmtFull(value)}</span>
    </div>
  )

  return (
    <div className="card socf-card">
      <div className="socf-head">Statement of Cash Flows</div>
      <div className="socf-sub">Year 1 estimate · {inputs.months || 12} month projection</div>

      <Row label="Beginning cash on hand" value={begin} strong />

      <div className="socf-section">Add: Cash receipts</div>
      <Row label="Design fee revenue" value={receipts} indent />
      <Row label="Total cash receipts" value={receipts} strong top />

      <div className="socf-section">Less: Cash payments</div>
      {pays.map(p => <Row key={p.name} label={p.name} value={p.value} indent />)}
      <Row label="Total cash payments" value={totalPay} strong top />

      <Row label="Net cash flow (year)" value={net} strong top color={net >= 0 ? 'var(--green)' : 'var(--red)'} />
      <Row label="Ending cash on hand" value={ending} strong color={ending >= 0 ? 'var(--ink)' : 'var(--red)'} />
    </div>
  )
}

// ── Monthly Table ──────────────────────────────────────────
function MonthlyTable({ data, months }) {
  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom:14 }}>Monthly Cash Flow Table</div>
      <div className="monthly-table-wrap">
        <table className="monthly-table">
          <thead>
            <tr>
              <th>Month</th><th>Revenue</th><th>Expenses</th><th>Net</th><th>Balance</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, months).map(row => (
              <tr key={row.month} className={row.isRisky ? 'risky-row' : ''}>
                <td>{row.dateLabel || row.monthLabel}</td>
                <td className={row.revenue > 0 ? 'cell-positive' : ''}>{fmtFull(row.revenue)}</td>
                <td style={{ color:'var(--red)' }}>{fmtFull(row.expenses)}</td>
                <td className={row.net >= 0 ? 'cell-positive' : 'cell-negative'}>{fmtFull(row.net)}</td>
                <td className={row.balance >= 0 ? (row.isRisky ? 'cell-negative' : 'cell-positive') : 'cell-negative'}>{fmtFull(row.balance)}</td>
                <td style={{ fontSize:'0.7rem' }}>{row.isRisky ? <span style={{ color:'var(--red)', fontWeight:600 }}>⚠️ Risky</span> : <span style={{ color:'var(--green)' }}>✓</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main OutputPanel ───────────────────────────────────────
export default function OutputPanel({ inputs, results, onSaveScenario }) {
  return (
    <div className="output-panel">
      {/* 1. Annual Net Profit hero on top */}
      <NetProfitHero results={results} inputs={inputs} />
      {/* 2. Cash Flow Projection graph */}
      <ComboCashChart
        data={results.monthlyData}
        months={inputs.months}
        minSafeBalance={results.minSafeBalance}
        initialCapital={inputs.initialCapital}
        paymentDelay={inputs.paymentDelay}
      />
      {/* 3. Annual Revenue + Annual Expenses */}
      <RevExpRow results={results} />
      {/* 4. Reality Check — 4 compact boxes */}
      <RealityCheck results={results} inputs={inputs} />
      <div className="charts-grid">
        <ExpenseDonut data={results.expenseBreakdown} annualExpenses={results.annualExpenses} />
        <ScenarioSummary inputs={inputs} results={results} />
      </div>
      <StatementOfCashFlows inputs={inputs} results={results} />
      <MonthlyTable data={results.monthlyData} months={inputs.months} />

      {/* Desktop save banner */}
      <div className="download-banner desktop-only">
        <div>
          <h3>บันทึก Scenario นี้</h3>
          <p>Save to compare scenarios &amp; download the PDF report on the Compare page</p>
        </div>
        <button className="btn btn-blue btn-lg" onClick={onSaveScenario}>
          💾 Save Scenario
        </button>
      </div>

      {/* Mobile sticky action bar */}
      <div className="mobile-action-bar mobile-only">
        <button className="btn btn-blue btn-lg" style={{ flex:1, justifyContent:'center' }} onClick={onSaveScenario}>
          💾 Save Scenario
        </button>
      </div>

      {/* Page visit counter — bottom of the dashboard */}
      <VisitorCounter />
    </div>
  )
}
