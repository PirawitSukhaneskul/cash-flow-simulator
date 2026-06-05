import { Link, useLocation } from 'react-router-dom'
import { Building2 } from 'lucide-react'

export default function Header({ scenarioName, onNameChange }) {
  const loc     = useLocation()
  const current = loc.pathname

  return (
    <header className="app-header">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="header-logo">
          <Building2 size={18} />
          Arch Firm <span className="logo-accent">Simulator</span>
        </div>
      </Link>

      {/* Editable scenario name (only on simulator page) */}
      {current === '/' && onNameChange && (
        <input
          style={{
            border: 'none', background: 'transparent', fontSize: '0.82rem', fontWeight: 600,
            color: 'var(--ink-3)', outline: 'none', textAlign: 'center',
            minWidth: 120, maxWidth: 220,
          }}
          placeholder="Scenario name…"
          value={scenarioName || ''}
          onChange={e => onNameChange(e.target.value)}
        />
      )}

      <nav className="header-nav">
        <Link to="/">
          <button className={`btn btn-ghost btn-sm ${current === '/' ? 'btn-ghost' : ''}`}
            style={{ borderColor: current === '/' ? 'var(--border-md)' : 'transparent', background: current === '/' ? 'var(--rice)' : 'transparent' }}>
            Simulator
          </button>
        </Link>
        <Link to="/compare">
          <button className="btn btn-ghost btn-sm"
            style={{ borderColor: current === '/compare' ? 'var(--border-md)' : 'transparent', background: current === '/compare' ? 'var(--rice)' : 'transparent' }}>
            📊 Compare
          </button>
        </Link>
        <Link to="/admin">
          <button className="btn btn-ghost btn-sm"
            style={{ borderColor: current === '/admin' ? 'var(--border-md)' : 'transparent', background: current === '/admin' ? 'var(--rice)' : 'transparent' }}>
            Admin
          </button>
        </Link>
      </nav>
    </header>
  )
}
