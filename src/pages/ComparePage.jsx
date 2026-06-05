import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fmtFull, fmt } from '../utils/calculations'
import { Edit2, Copy, Trash2, Pencil, Check, X } from 'lucide-react'

const SCENARIO_COLORS = ['#1a56db', '#e02020', '#1a7f4b', '#c47c00']

// ── Risk Warnings ──────────────────────────────────────────
function generateWarnings(scenario) {
  const warnings = []
  const { results, inputs } = scenario
  const staffPct = Number(results.staffCostPct)

  if (staffPct > 70) warnings.push({ type: 'red', title: 'Salary very high', desc: 'ค่าพนักงานเกิน 70% ของค่าใช้จ่ายทั้งหมด — cash pressure สูงมาก โอกาส turnover มีผลกระทบรุนแรง' })
  else if (staffPct < 30) warnings.push({ type: 'amber', title: 'Salary very low', desc: 'ค่าพนักงานต่ำกว่า 30% — อาจมีปัญหา quality และ retention ระยะยาว' })

  const avgFee = inputs.projects.length > 0
    ? inputs.projects.reduce((s, p) => s + p.feePercent, 0) / inputs.projects.length : 0
  const avgGuideline = inputs.projects.length > 0
    ? inputs.projects.reduce((s, p) => s + p.guidelineFeePercent, 0) / inputs.projects.length : 0

  if (avgFee > avgGuideline + 1.5) warnings.push({ type: 'green', title: 'Design fee above guideline', desc: `Avg fee ${avgFee.toFixed(1)}% เกิน ASA guideline ${avgGuideline.toFixed(1)}% — margin ดี แต่อาจ win rate ต่ำลง` })
  if (avgFee < avgGuideline - 1) warnings.push({ type: 'red', title: 'Design fee below guideline', desc: `Avg fee ${avgFee.toFixed(1)}% ต่ำกว่า ASA guideline ${avgGuideline.toFixed(1)}% — win rate สูง แต่ margin และ delivery safety ต่ำ` })

  if (inputs.paymentDelay > 0) warnings.push({ type: 'amber', title: 'Payment delay risk', desc: `Worst Case: ลูกค้าจ่ายช้า ${inputs.paymentDelay} เดือน — กำไรรวมปีอาจดี แต่อาจขาดสภาพคล่องรายเดือน` })

  if (results.riskyCount > 3) warnings.push({ type: 'red', title: `${results.riskyCount} risky cash months`, desc: 'Cash ต่ำกว่า minimum safe balance หลายเดือน — พิจารณาเพิ่มทุนตั้งต้นหรือ credit line' })

  if (!results.breakEvenMonth) warnings.push({ type: 'red', title: 'No break-even within simulation', desc: 'Balance ไม่กลับมาเท่าทุนภายในช่วงที่จำลอง — ทบทวน revenue หรือ cost structure' })

  return warnings
}

// ── Scenario Slot Card ─────────────────────────────────────
function ScenarioSlotCard({ scenario, idx, onDelete, onEdit, onDuplicate, onRename }) {
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')
  const s = scenario

  function startRename() {
    setDraftName(s.name.replace(/^Scenario \d+ - /, ''))
    setRenaming(true)
  }

  function confirmRename() {
    if (draftName.trim()) {
      const num = s.name.match(/^Scenario (\d+)/)?.[1] || (idx + 1)
      onRename(idx, `Scenario ${num} - ${draftName.trim()}`)
    }
    setRenaming(false)
  }

  return (
    <div className="scenario-slot filled">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: SCENARIO_COLORS[idx], marginTop: 3 }} />
        <div style={{ display: 'flex', gap: 3 }}>
          <button title="Edit Scenario" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: '0.7rem', padding: '2px 4px' }}
            onClick={() => onEdit(idx)}>
            <Edit2 size={12} />
          </button>
          <button title="Duplicate Scenario" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: '0.7rem', padding: '2px 4px' }}
            onClick={() => onDuplicate(idx)}>
            <Copy size={12} />
          </button>
          <button title="Rename Scenario" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: '0.7rem', padding: '2px 4px' }}
            onClick={startRename}>
            <Pencil size={12} />
          </button>
          <button title="Delete Scenario" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.7rem', padding: '2px 4px' }}
            onClick={() => onDelete(idx)}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {renaming ? (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          <input
            className="field"
            style={{ fontSize: '0.78rem', padding: '3px 7px', flex: 1 }}
            value={draftName}
            autoFocus
            onChange={e => setDraftName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenaming(false) }}
          />
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)' }} onClick={confirmRename}><Check size={13} /></button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)' }} onClick={() => setRenaming(false)}><X size={13} /></button>
        </div>
      ) : (
        <div className="scenario-slot-name">{s.name}</div>
      )}

      <div className="scenario-slot-revenue">{fmtFull(s.results.annualRevenue)}</div>
      <div className={`scenario-slot-profit ${s.results.annualNetProfit >= 0 ? 'pos' : 'neg'}`}>
        {fmtFull(s.results.annualNetProfit)}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-4)' }}>
        {s.results.riskyCount > 0 ? `⚠️ ${s.results.riskyCount} risky months` : '✅ Cash healthy'}
      </div>
    </div>
  )
}

// ── Comparison Table ───────────────────────────────────────
function CompareTable({ scenarios }) {
  const metrics = [
    { key: 'annualRevenue',   label: 'Annual Revenue',        fmt: fmtFull, higherBetter: true  },
    { key: 'annualNetProfit', label: 'Net Profit (Year 1)',   fmt: fmtFull, higherBetter: true  },
    { key: 'annualExpenses',  label: 'Total Expenses',        fmt: fmtFull, higherBetter: false },
    { key: 'annualSalary',    label: 'Salary Cost / yr',      fmt: fmtFull, higherBetter: false },
    { key: 'annualSoftware',  label: 'Software Cost / yr',    fmt: fmtFull, higherBetter: false },
    { key: 'monthlyFixed',    label: 'Monthly Fixed Cost',    fmt: fmtFull, higherBetter: false },
    { key: 'staffCostPct',    label: 'Staff % of Expenses',   fmt: v => `${v}%`, higherBetter: false },
    { key: 'breakEvenMonth',  label: 'Break-even Month',      fmt: v => v ? `Month ${v}` : 'Never', higherBetter: false },
    { key: 'riskyCount',      label: 'Risky Cash Months',     fmt: v => `${v} mo`, higherBetter: false },
    { key: 'minSafeBalance',  label: 'Min Safe Balance',      fmt: fmtFull, higherBetter: null },
  ]

  function getBest(key, higherBetter) {
    if (higherBetter === null) return null
    const vals = scenarios.map(s => Number(s.results[key]) || 0)
    return higherBetter ? Math.max(...vals) : Math.min(...vals)
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700 }}>Metric Comparison</div>
      </div>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              {scenarios.map((s, i) => (
                <th key={i} style={{ color: SCENARIO_COLORS[i] }}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => {
              const best = getBest(m.key, m.higherBetter)
              return (
                <tr key={m.key}>
                  <td>{m.label}</td>
                  {scenarios.map((s, i) => {
                    const val   = s.results[m.key]
                    const numV  = Number(val)
                    const isBest = best !== null && numV === best
                    return (
                      <td key={i} className={isBest ? 'best-col' : ''}>
                        {m.fmt(val ?? 0)}
                        {isBest && <span style={{ color: 'var(--green)', marginLeft: 4, fontSize: '0.68rem' }}>★</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Comparison Bar Charts ──────────────────────────────────
function CompareCharts({ scenarios }) {
  const chartData = [
    { key: 'annualRevenue',   label: 'Revenue' },
    { key: 'annualNetProfit', label: 'Net Profit' },
    { key: 'annualExpenses',  label: 'Expenses' },
  ].map(({ key, label }) => {
    const entry = { name: label }
    scenarios.forEach((s, i) => { entry[`s${i}`] = s.results[key] || 0 })
    return entry
  })

  return (
    <div className="chart-card">
      <div className="chart-title">Financial Comparison</div>
      <div className="chart-subtitle">Annual figures (Year 1 est.)</div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip formatter={(v, name) => [fmtFull(v), scenarios[parseInt(name.slice(1))]?.name]} />
            <Legend formatter={(v) => scenarios[parseInt(v.slice(1))]?.name || v} />
            {scenarios.map((s, i) => (
              <Bar key={i} dataKey={`s${i}`} fill={SCENARIO_COLORS[i]} radius={[4,4,0,0]} name={`s${i}`} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Recommendation Banner ──────────────────────────────────
function BestScenario({ scenarios }) {
  if (scenarios.length < 2) return null
  const sorted = [...scenarios].sort((a, b) => (b.results.annualNetProfit || 0) - (a.results.annualNetProfit || 0))
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const diff  = (best.results.annualNetProfit || 0) - (worst.results.annualNetProfit || 0)

  return (
    <div style={{ background: 'var(--ink)', borderRadius: 'var(--r-lg)', padding: '18px 22px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', boxShadow: 'var(--sh-md)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Best Scenario</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>{best.name}</div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
          Net profit: {fmtFull(best.results.annualNetProfit)} — ดีกว่า worst case {fmt(diff)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Most Risky</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171' }}>{worst.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{worst.results.riskyCount} risky months</div>
      </div>
    </div>
  )
}

// ── Main Compare Page ──────────────────────────────────────
export default function ComparePage({ scenarios, onClearScenario, onEditScenario, onDuplicateScenario, onRenameScenario }) {
  const navigate = useNavigate()

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="compare-page">
        <Header />
        <div className="compare-body" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
          <h2 style={{ marginBottom: 8 }}>No Scenarios Saved Yet</h2>
          <p style={{ color: 'var(--ink-3)', marginBottom: 24 }}>
            Go back to the simulator, configure a scenario, then click "Save Scenario" to compare.
          </p>
          <button className="btn btn-ink btn-lg" onClick={() => navigate('/')}>← Back to Simulator</button>
        </div>
      </div>
    )
  }

  function handleEdit(idx) {
    onEditScenario(idx)
    navigate('/')
  }

  return (
    <div className="compare-page">
      <Header />
      <div className="compare-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Scenario Comparison</h1>
            <p style={{ color: 'var(--ink-3)' }}>{scenarios.length} scenario{scenarios.length > 1 ? 's' : ''} saved</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>← Simulator</button>
          </div>
        </div>

        {/* Scenario Slot Cards */}
        <div className="scenario-slots">
          {scenarios.map((s, i) => (
            <ScenarioSlotCard
              key={i}
              scenario={s}
              idx={i}
              onDelete={onClearScenario}
              onEdit={handleEdit}
              onDuplicate={onDuplicateScenario}
              onRename={onRenameScenario}
            />
          ))}
          {scenarios.length < 4 && (
            <div className="scenario-slot empty" onClick={() => navigate('/')}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>+</div>
              <div>Add Scenario</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-4)', marginTop: 2 }}>Go to Simulator</div>
            </div>
          )}
        </div>

        {/* Recommendation */}
        <BestScenario scenarios={scenarios} />

        {/* Charts */}
        <div style={{ marginTop: 16 }}>
          <CompareCharts scenarios={scenarios} />
        </div>

        {/* Comparison Table */}
        <div style={{ marginTop: 16 }}>
          <CompareTable scenarios={scenarios} />
        </div>

        {/* Risk Warnings per scenario */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Risk Analysis & Trade-offs</div>
          {scenarios.map((s, i) => {
            const warnings = generateWarnings(s)
            if (warnings.length === 0) return null
            return (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: SCENARIO_COLORS[i], marginBottom: 6 }}>
                  {s.name}
                </div>
                {warnings.map((w, j) => (
                  <div key={j} className={`risk-warning ${w.type}`}>
                    <span className="risk-warning-icon">
                      {w.type === 'red' ? '🔴' : w.type === 'amber' ? '⚠️' : '✅'}
                    </span>
                    <div className="risk-warning-text">
                      <div className="risk-warning-title">{w.title}</div>
                      <div>{w.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
