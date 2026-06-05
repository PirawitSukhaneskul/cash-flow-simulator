import { useState } from 'react'
import { Shield, Download, Users, Star, Building2, Package } from 'lucide-react'
import Header from '../components/Header'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { fmtFull } from '../utils/calculations'

const PASSCODE = '30032000'

// ── Mock Data ────────────────────────────────────────────
const MOCK_SUBMISSIONS = [
  { id: 1, ts: '2026-06-01 09:14', email: 'arch@studio.th', type: 'architecture', experience: '3–7 ปี', hasBusiness: 'planning', pack: 'Architecture Pack', projects: 8, fee: 900000, staff: 4, capital: 2000000, revenue: 7200000, expenses: 5800000, profit: 1030000, rating: 5, reason: 'ดีมาก เห็นภาพชัดเลย' },
  { id: 2, ts: '2026-06-01 14:32', email: 'bim@design.co', type: 'bim', experience: '7–15 ปี', hasBusiness: 'owner', pack: 'BIM Pack', projects: 4, fee: 2500000, staff: 9, capital: 5000000, revenue: 10000000, expenses: 8200000, profit: 1440000, rating: 4, reason: 'Useful for planning' },
  { id: 3, ts: '2026-06-02 10:05', email: 'interior@gmail.com', type: 'interior', experience: '1–3 ปี', hasBusiness: 'employee', pack: 'Interior Pack', projects: 12, fee: 300000, staff: 3, capital: 800000, revenue: 3600000, expenses: 3100000, profit: 404000, rating: 5, reason: 'เข้าใจง่าย ตัวเลขน่าเชื่อถือ' },
  { id: 4, ts: '2026-06-02 16:20', email: 'studio@design.th', type: 'architecture', experience: '7–15 ปี', hasBusiness: 'owner', pack: 'Architecture Pack', projects: 6, fee: 1200000, staff: 6, capital: 3000000, revenue: 7200000, expenses: 6400000, profit: 640000, rating: 3, reason: 'ดี แต่อยากได้ compare mode' },
  { id: 5, ts: '2026-06-03 08:44', email: 'fresh@arch.com', type: 'architecture', experience: 'ยังไม่มีประสบการณ์', hasBusiness: 'student', pack: 'Architecture Pack', projects: 4, fee: 500000, staff: 3, capital: 1000000, revenue: 2000000, expenses: 2800000, profit: -960000, rating: 5, reason: 'น่ากลัวมากเลยครับ แต่ดีที่รู้ก่อน' },
  { id: 6, ts: '2026-06-03 13:11', email: 'big.firm@arch.th', type: 'bim', experience: '15 ปีขึ้นไป', hasBusiness: 'owner', pack: 'BIM Pack', projects: 3, fee: 5000000, staff: 12, capital: 8000000, revenue: 15000000, expenses: 13500000, profit: 1215000, rating: 4, reason: 'Professional tool' },
  { id: 7, ts: '2026-06-04 09:30', email: 'planner@th.com', type: 'interior', experience: '3–7 ปี', hasBusiness: 'planning', pack: 'Interior Pack', projects: 10, fee: 200000, staff: 2, capital: 600000, revenue: 2000000, expenses: 1900000, profit: 80000, rating: 4, reason: 'เห็นว่า margin ต่ำมาก ต้องคิดใหม่' },
]

const TYPE_COLORS = { architecture: '#2563eb', interior: '#10b981', bim: '#8b5cf6' }
const TYPE_LABELS = { architecture: '🏛️ Architecture', interior: '🛋️ Interior', bim: '🔷 BIM' }
const STAR_COLORS = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981']

function StatCard({ icon: Icon, label, value, sub, color = 'var(--text-1)' }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', align: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="var(--text-2)" />
        </div>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function RatingDistribution({ data }) {
  const dist = [1, 2, 3, 4, 5].map(n => ({
    rating: `★ ${n}`,
    count: data.filter(d => d.rating === n).length,
  }))
  return (
    <div className="chart-card">
      <div className="chart-title">Rating Distribution</div>
      <div className="chart-subtitle">{data.length} total responses</div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dist} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="rating" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Responses" radius={[4, 4, 0, 0]}>
              {dist.map((_, i) => (
                <Cell key={i} fill={STAR_COLORS[i + 1]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TypeDistribution({ data }) {
  const dist = ['architecture', 'interior', 'bim'].map(t => ({
    name: TYPE_LABELS[t],
    value: data.filter(d => d.type === t).length,
    color: TYPE_COLORS[t],
  })).filter(d => d.value > 0)

  return (
    <div className="chart-card">
      <div className="chart-title">Business Type Distribution</div>
      <div className="chart-subtitle">{data.length} submissions</div>
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={dist} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
              {dist.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RevenueRanges({ data }) {
  const ranges = [
    { label: '< ฿2M', count: data.filter(d => d.revenue < 2_000_000).length },
    { label: '฿2M–5M', count: data.filter(d => d.revenue >= 2_000_000 && d.revenue < 5_000_000).length },
    { label: '฿5M–10M', count: data.filter(d => d.revenue >= 5_000_000 && d.revenue < 10_000_000).length },
    { label: '> ฿10M', count: data.filter(d => d.revenue >= 10_000_000).length },
  ]
  return (
    <div className="chart-card">
      <div className="chart-title">Projected Revenue Ranges</div>
      <div className="chart-subtitle">Annual revenue distribution</div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ranges} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Submissions" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SoftwarePackDist({ data }) {
  const packs = {}
  data.forEach(d => { packs[d.pack] = (packs[d.pack] || 0) + 1 })
  const dist = Object.entries(packs).map(([name, count]) => ({ name: name.replace(' Pack', ''), count }))

  return (
    <div className="chart-card">
      <div className="chart-title">Software Pack Popularity</div>
      <div className="chart-subtitle">Most selected packs</div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dist} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip />
            <Bar dataKey="count" name="Selections" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Admin Dashboard ─────────────────────────────────────
function AdminDashboard() {
  const data = MOCK_SUBMISSIONS
  const avgRating = (data.reduce((s, d) => s + d.rating, 0) / data.length).toFixed(1)
  const avgRevenue = data.reduce((s, d) => s + d.revenue, 0) / data.length
  const avgProfit  = data.reduce((s, d) => s + d.profit,  0) / data.length
  const topType    = Object.entries(data.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1])[0]

  function downloadCSV() {
    const headers = ['ID', 'Timestamp', 'Email', 'Type', 'Experience', 'Has Business', 'Software Pack', 'Projects/yr', 'Avg Fee', 'Staff', 'Capital', 'Revenue', 'Expenses', 'Profit', 'Rating', 'Reason']
    const rows = data.map(d => [d.id, d.ts, d.email, d.type, d.experience, d.hasBusiness, d.pack, d.projects, d.fee, d.staff, d.capital, d.revenue, d.expenses, d.profit, d.rating, `"${d.reason}"`])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'arch_simulator_submissions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <Header />
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Admin Dashboard</h1>
            <p>ข้อมูลผู้ใช้ทั้งหมด — {data.length} submissions (mock data — Stage 1)</p>
          </div>
          <button className="btn btn-secondary" onClick={downloadCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="admin-layout" style={{ marginBottom: 20 }}>
          <StatCard icon={Users} label="Total Submissions" value={data.length} sub="all time" />
          <StatCard icon={Star} label="Avg Rating" value={`★ ${avgRating}`} sub="out of 5" color="#f59e0b" />
          <StatCard icon={Building2} label="Top Business Type" value={TYPE_LABELS[topType?.[0]]} sub={`${topType?.[1]} users`} />
          <StatCard icon={Package} label="Avg Projected Revenue" value={fmtFull(avgRevenue)} sub="annual Year 1" color="var(--blue)" />
        </div>

        {/* Charts */}
        <div className="admin-chart-grid">
          <RatingDistribution data={data} />
          <TypeDistribution data={data} />
          <RevenueRanges data={data} />
          <SoftwarePackDist data={data} />
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Submissions Table</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>Sample data — Stage 2 will pull from Google Sheets</div>
            </div>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Experience</th>
                  <th>Pack</th>
                  <th>Projects</th>
                  <th>Revenue/yr</th>
                  <th>Profit/yr</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>{d.id}</td>
                    <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{d.ts}</td>
                    <td style={{ fontSize: '0.78rem' }}>{d.email}</td>
                    <td>
                      <span className={`badge ${d.type === 'architecture' ? 'badge-blue' : d.type === 'bim' ? 'badge-purple' : 'badge-green'}`}>
                        {d.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>{d.experience}</td>
                    <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{d.pack}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.projects}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--blue)' }}>{fmtFull(d.revenue)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: d.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtFull(d.profit)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {'★'.repeat(d.rating)}
                      <span style={{ color: 'var(--border-md)' }}>{'★'.repeat(5 - d.rating)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Passcode Gate ─────────────────────────────────────────
export default function AdminPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (code === PASSCODE) {
      setUnlocked(true)
    } else {
      setError('รหัสไม่ถูกต้อง — ลองอีกครั้ง')
      setCode('')
    }
  }

  if (unlocked) return <AdminDashboard />

  return (
    <div className="passcode-gate">
      <div className="passcode-card">
        <div className="passcode-icon">
          <Shield size={24} color="var(--text-2)" />
        </div>
        <h2 style={{ marginBottom: 8 }}>Admin Access</h2>
        <p style={{ fontSize: '0.875rem' }}>กรอกรหัสผ่านเพื่อเข้าสู่ admin dashboard</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className={`passcode-input ${error ? 'error' : ''}`}
            placeholder="••••••••"
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            autoFocus
            maxLength={12}
          />
          {error && <div className="passcode-error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            เข้าสู่ระบบ
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-3)' }}>
          Stage 1: passcode check is client-side only.<br />
          Stage 2 will verify via Google Apps Script.
        </p>
      </div>
    </div>
  )
}
