import { useState } from 'react'
import { Mail, ArrowRight, X } from 'lucide-react'

export default function EmailGate({ onSubmit, onSkip }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email')
      return
    }
    onSubmit(email)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-icon" style={{ background: '#f0fdf4' }}>
          <Mail size={24} color="#16a34a" />
        </div>

        <h2 className="modal-title">Before you start</h2>
        <p className="modal-desc">
          Enter your email to receive the report after the simulation
          and to save your results.
        </p>

        <div className="privacy-notice">
          🔒 <strong>Privacy:</strong> By submitting, you agree that your simulation inputs and email
          may be saved for research and product improvement. We do not sell your data.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-label">
              <span className="input-label-text">Email Address</span>
            </div>
            <input
              type="email"
              className={`input-field ${error ? 'above-avg' : ''}`}
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoFocus
            />
            {error && <div className="input-hint above-avg">{error}</div>}
          </div>

          <div className="modal-footer" style={{ flexDirection: 'column', gap: 8 }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              <ArrowRight size={16} />
              Start simulation
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', color: 'var(--text-3)' }}
              onClick={onSkip}
            >
              Skip for now (no report)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
