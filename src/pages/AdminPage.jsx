import { useState, useEffect } from 'react'
import { Shield, Download, Users, Star, Building2, Package, Eye, RefreshCw } from 'lucide-react'
import Header from '../components/Header'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { fmtFull } from '../utils/calculations'
import { GAS_URL } from '../config'

const PASSCODE = '30032000'

const TYPE_COLORS = { architecture: '#2563eb', interior: '#10b981', bim: '#8b5cf6' }
const TYPE_LABELS = { architecture: '🏛️ Architecture', interior: '🛋️ Interior', bim: '🔷 BIM' }
const STAR_COLORS = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981']

// ── Map a raw Google-Sheet row to the shape the dashboard uses ──
function normalize(rows) {
  return rows.map((r, i) => ({
    id: i + 1,
    ts: r['Timestamp'] ? new Date(r['Timestamp']).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '',
    email: r['Email'] || '',
    type: String(r['Business Type'] || '').toLowerCase() || 'architecture',
    experience: r['Experience'] || '—',
    hasBusiness: r['Has Business'] || '',
    softwareList: r['Software List'] || '',
    softwareCount: Number(r['Software Count']) || 0,
    teamBreakdown: r['Team Breakdown'] || '',
    projects: Number(r['Projects Count']) || 0,
    staff: Number(r['Team Size']) || 0,
    capital: Number(r['Initial Capital']) || 0,
    revenue: Number(r['Annual Revenue']) || 0,
    expenses: Number(r['Annual Expenses']) || 0,
    profit: Number(r['Annual Net Profit']) || 0,
    rating: Number(r['Rating']) || 0,
    reason: r['Reason'] || '',
    raw: r,
  }))
}

function StatCard({ icon: Icon, label, value, sub, color = 'var(--ink)' }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--rice)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="var(--ink-3)" />
        </div>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function RatingDistribution({ data }) {
  const dist = [1, 2, 3, 4, 5].map(n => ({ rating: `★ ${n}`, count: data.filter(d => d.rating === n).length }))
  return (
    <div className="chart-card">
      <div className="chart-title">Rating Distribution</div>
      <div className="chart-subtitle">{data.length} responses</div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dist} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="rating" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Responses" radius={[4, 4, 0, 0]}>
              {dist.map((_, i) => <Cell key={i} fill={STAR_COLORS[i + 1]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ExperienceDistribution({ data }) {
  const map = {}
  data.forEach(d => { map[d.experience] = (map[d.experience] || 0) + 1 })
  const palette = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#94a3b8']
  const dist = Object.entries(map).map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }))
  return (
    <div className="chart-card">
      <div className="chart-title">Experience of Users</div>
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

// Count individual software across all submissions (parsed from "Name xN, …")
function SoftwarePopularity({ data }) {
  const counts = {}
  data.forEach(d => {
    String(d.softwareList || '').split(',').forEach(part => {
      const name = part.trim().replace(/\s*x\d+\s*$/i, '').trim()
      if (name) counts[name] = (counts[name] || 0) + 1
    })
  })
  const dist = Object.entries(counts).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, 8)
  return (
    <div className="chart-card">
      <div className="chart-title">Software Popularity</div>
      <div className="chart-subtitle">Most-used tools across all simulations</div>
      <div style={{ height: 180 }}>
        {dist.length === 0
          ? <div style={{ color: 'var(--ink-4)', fontSize: '0.8rem', textAlign: 'center', paddingTop: 60 }}>No software data yet</div>
          : <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip />
                <Bar dataKey="count" name="Used by" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>}
      </div>
    </div>
  )
}

// ── Admin Dashboard ─────────────────────────────────────
function AdminDashboard() {
  const [data, setData]       = useState([])
  const [visits, setVisits]   = useState(null)
  const [state, setState]     = useState('loading') // loading | ok | error
  const [errMsg, setErrMsg]   = useState('')

  async function load() {
    setState('loading')
    try {
      const res = await fetch(`${GAS_URL}?action=submissions&key=${PASSCODE}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Request failed')
      setData(normalize(json.rows || []))
      setVisits(typeof json.visits === 'number' ? json.visits : null)
      setState('ok')
    } catch (e) {
      setErrMsg(e.message || 'Could not load submissions')
      setState('error')
    }
  }
  useEffect(() => { load() }, [])

  const n = data.length
  const avgRating  = n ? (data.reduce((s, d) => s + d.rating, 0) / n).toFixed(1) : '—'
  const avgRevenue = n ? data.reduce((s, d) => s + d.revenue, 0) / n : 0
  const avgProjects = n ? (data.reduce((s, d) => s + d.projects, 0) / n).toFixed(1) : '—'

  function downloadCSV() {
    if (!n) return
    const headers = Object.keys(data[0].raw)
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = data.map(d => headers.map(h => esc(d.raw[h])))
    const csv = [headers.map(esc), ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url; a.download = `admin_export_${stamp}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: 'var(--rice)', minHeight: '100vh' }}>
      <Header />
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--ink-3)' }}>
              {state === 'loading' ? 'Loading live data from Google Sheets…'
                : state === 'error' ? 'Could not load live data'
                : `${n} submission${n !== 1 ? 's' : ''} — live from Google Sheets`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={load}><RefreshCw size={14} /> Refresh</button>
            <button className="btn btn-blue" onClick={downloadCSV} disabled={!n}><Download size={14} /> Export CSV</button>
          </div>
        </div>

        {state === 'error' && (
          <div className="balance-alert critical" style={{ marginBottom: 20 }}>
            <span className="balance-alert-icon">⚠️</span>
            <div>
              <div className="balance-alert-title">Couldn't load submissions</div>
              <div className="balance-alert-desc">{errMsg}. The backend may need the latest deploy, or there's no data yet.</div>
            </div>
          </div>
        )}

        {state === 'ok' && n === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, marginBottom: 20 }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
            <div style={{ fontWeight: 600 }}>No submissions yet</div>
            <div style={{ color: 'var(--ink-4)', fontSize: '0.85rem', marginTop: 4 }}>
              When someone gets a report on the Compare page, it'll show up here.
            </div>
          </div>
        )}

        {state === 'ok' && n > 0 && <>
          {/* Stats */}
          <div className="admin-layout" style={{ marginBottom: 20 }}>
            <StatCard icon={Users} label="Total Submissions" value={n} sub="all time" />
            <StatCard icon={Eye} label="Page Visits" value={visits != null ? visits.toLocaleString() : '—'} sub="all time" color="var(--blue)" />
            <StatCard icon={Star} label="Avg Rating" value={`★ ${avgRating}`} sub="out of 5" color="#f59e0b" />
            <StatCard icon={Package} label="Avg Projected Revenue" value={fmtFull(avgRevenue)} sub={`${avgProjects} projects avg`} color="var(--green)" />
          </div>

          {/* Charts */}
          <div className="admin-chart-grid">
            <RatingDistribution data={data} />
            <ExperienceDistribution data={data} />
            <RevenueRanges data={data} />
            <SoftwarePopularity data={data} />
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600 }}>Submissions Table</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-4)', marginTop: 2 }}>Live data — every simulation is collected here</div>
            </div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Email</th><th>Exp.</th>
                    <th>Projects</th><th>Team</th><th>Software</th>
                    <th>Revenue/yr</th><th>Profit/yr</th><th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.id}>
                      <td style={{ color: 'var(--ink-4)', fontFamily: 'monospace' }}>{d.id}</td>
                      <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{d.ts}</td>
                      <td style={{ fontSize: '0.78rem' }}>{d.email}</td>
                      <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{d.experience}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.projects}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.staff}</td>
                      <td style={{ fontSize: '0.72rem', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.softwareList}>{d.softwareList || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--blue)' }}>{fmtFull(d.revenue)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: d.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtFull(d.profit)}</td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {'★'.repeat(d.rating)}<span style={{ color: 'var(--border-md)' }}>{'★'.repeat(5 - d.rating)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}
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
    if (code === PASSCODE) setUnlocked(true)
    else { setError('Incorrect passcode — try again'); setCode('') }
  }

  if (unlocked) return <AdminDashboard />

  return (
    <div className="passcode-gate">
      <div className="passcode-card">
        <div className="passcode-icon"><Shield size={24} color="var(--ink-3)" /></div>
        <h2 style={{ marginBottom: 8 }}>Admin Access</h2>
        <p style={{ fontSize: '0.875rem' }}>Enter the passcode to access the admin dashboard</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className={`passcode-input ${error ? 'error' : ''}`}
            placeholder="••••••••"
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            autoFocus maxLength={12}
          />
          {error && <div className="passcode-error">{error}</div>}
          <button type="submit" className="btn btn-blue" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            Enter
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--ink-4)' }}>
          Passcode is checked client-side. For a real launch, move this to server-side auth.
        </p>
      </div>
    </div>
  )
}
