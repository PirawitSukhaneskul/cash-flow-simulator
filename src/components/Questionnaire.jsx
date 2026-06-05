import { useState } from 'react'
import { FileSpreadsheet, X, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react'

const TOTAL_STEPS = 4
const GAS_URL = import.meta.env.VITE_GAS_URL || ''

async function postToGAS(payload) {
  if (!GAS_URL) {
    // No backend configured — dev mode
    console.warn('[Arch Sim] No VITE_GAS_URL set. Simulating success.')
    await new Promise(r => setTimeout(r, 1200)) // fake delay
    return { success: true, devMode: true }
  }
  try {
    const res = await fetch(GAS_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const json = await res.json()
    return json
  } catch (err) {
    // Network error (or CORS — GAS sometimes needs mode:no-cors)
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode:   'no-cors',
        headers:{ 'Content-Type': 'application/json' },
        body:   JSON.stringify(payload),
      })
      // no-cors: can't read response, assume success
      return { success: true, noCors: true }
    } catch (err2) {
      return { success: false, error: err2.message }
    }
  }
}

export default function Questionnaire({ onSubmit, onClose, inputs, results, scenarioName }) {
  const [step,   setStep]   = useState(1)
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [errMsg, setErrMsg] = useState('')
  const [answers, setAnswers] = useState({
    email: '', experience: '', hasBusiness: '', rating: 0, reason: '',
  })
  const [emailError, setEmailError] = useState('')

  function canNext() {
    if (step === 1) return answers.email.includes('@') && answers.email.includes('.')
    if (step === 2) return answers.experience !== ''
    if (step === 3) return answers.hasBusiness !== ''
    if (step === 4) return answers.rating > 0 && answers.reason.trim().length > 0
    return false
  }

  async function handleNext() {
    if (step === 1 && (!answers.email.includes('@') || !answers.email.includes('.'))) {
      setEmailError('กรุณากรอก email ที่ถูกต้อง'); return
    }
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return }

    // Final step: submit
    setStatus('sending')

    const payload = {
      // Questionnaire answers
      email:       answers.email,
      experience:  answers.experience,
      hasBusiness: answers.hasBusiness,
      rating:      answers.rating,
      reason:      answers.reason,
      scenarioName: scenarioName || '',

      // Simulation results
      projectCount:    (inputs?.projects || []).length,
      annualRevenue:   results?.annualRevenue   || 0,
      annualExpenses:  results?.annualExpenses  || 0,
      annualNetProfit: results?.annualNetProfit || 0,
      annualTax:       results?.annualTax       || 0,
      monthlyFixed:    results?.monthlyFixed    || 0,
      initialCapital:  inputs?.initialCapital   || 0,
      taxRate:         inputs?.taxRate          || 0,
      teamSize:        (inputs?.team || []).reduce((s, r) => s + r.count, 0),
      paymentDelay:    inputs?.paymentDelay     || 0,
      riskyCount:      results?.riskyCount      || 0,
      breakEvenMonth:  results?.breakEvenMonth  || null,
      minSafeBalance:  results?.minSafeBalance  || 0,
      monthlyData:     (results?.monthlyData    || []).slice(0, 12), // Year 1
    }

    const result = await postToGAS(payload)

    if (result.success) {
      setStatus('success')
      onSubmit(answers)
    } else {
      setStatus('error')
      setErrMsg(result.error || 'ไม่สามารถส่งได้ กรุณาลองอีกครั้ง')
    }
  }

  // ── Success screen ────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h2 className="modal-title">Report ส่งแล้ว!</h2>
          <p className="modal-desc">
            รายงาน Cash Flow ส่งไปที่ <strong>{answers.email}</strong> แล้ว<br />
            ตรวจสอบ inbox (อาจอยู่ใน Spam)
          </p>
          <button className="btn btn-ink btn-full btn-lg" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    )
  }

  // ── Error screen ──────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
          <h2 className="modal-title">ส่งไม่สำเร็จ</h2>
          <p className="modal-desc">{errMsg}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStatus('idle')}>
              ลองอีกครั้ง
            </button>
            <button className="btn btn-ink" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              ปิด
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Sending screen ────────────────────────────────────────
  if (status === 'sending') {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
          <h2 className="modal-title">กำลังส่ง Report…</h2>
          <p className="modal-desc">บันทึกข้อมูลและส่ง email ไปที่ {answers.email}</p>
        </div>
      </div>
    )
  }

  // ── Question steps ────────────────────────────────────────
  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, background: 'var(--blue-light)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet size={20} color="var(--blue)" />
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 4 }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 18 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i + 1 <= step ? 'var(--ink)' : 'var(--border)', transition: 'background 0.25s' }} />
          ))}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--ink-4)', marginBottom: 4 }}>Step {step} / {TOTAL_STEPS}</div>

        {/* Step 1 — Email */}
        {step === 1 && <>
          <h2 className="modal-title">รับ Excel Report</h2>
          <p className="modal-desc">กรอก email เพื่อรับไฟล์ Cash Flow สรุปผลการจำลอง</p>
          <div className="privacy-notice">
            🔒 <strong>Privacy:</strong> By submitting, your inputs and email may be saved for research. We do not sell your data.
          </div>
          <div className="input-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: 6 }}>Email Address</label>
            <input type="email" className={`field ${emailError ? 'above-avg' : ''}`}
              placeholder="your@email.com" value={answers.email} autoFocus
              onChange={e => { setAnswers(a => ({ ...a, email: e.target.value })); setEmailError('') }} />
            {emailError && <div className="input-hint above-avg">{emailError}</div>}
          </div>
          {!GAS_URL && (
            <div style={{ background: 'var(--amber-light)', border: '1px solid #fde68a', borderRadius: 'var(--r-sm)', padding: '8px 12px', fontSize: '0.72rem', color: 'var(--amber)', marginTop: 8 }}>
              ⚠️ Dev mode: Set VITE_GAS_URL to enable real email sending.
            </div>
          )}
        </>}

        {/* Step 2 — Experience */}
        {step === 2 && <>
          <h2 className="modal-title">ประสบการณ์ในวงการ</h2>
          <p className="modal-desc">คุณทำงานในสายออกแบบ / สถาปัตย์มานานเท่าไร?</p>
          {['ยังไม่มีประสบการณ์','1–3 ปี','3–7 ปี','7–15 ปี','15 ปีขึ้นไป'].map(opt => (
            <button key={opt} className={`btn ${answers.experience === opt ? 'btn-ink' : 'btn-ghost'}`}
              style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 'var(--r-md)', marginBottom: 6 }}
              onClick={() => setAnswers(a => ({ ...a, experience: opt }))}>
              {opt}
            </button>
          ))}
        </>}

        {/* Step 3 — Business status */}
        {step === 3 && <>
          <h2 className="modal-title">สถานะธุรกิจ</h2>
          <p className="modal-desc">ตอนนี้คุณอยู่ในสถานการณ์ไหน?</p>
          {[
            { val:'owner',    label:'เป็นเจ้าของบริษัทอยู่แล้ว' },
            { val:'employee', label:'ทำงานในบริษัทสายนี้' },
            { val:'planning', label:'กำลังวางแผนจะเปิด' },
            { val:'student',  label:'นักศึกษา / เรียนอยู่' },
            { val:'other',    label:'อื่นๆ' },
          ].map(({ val, label }) => (
            <button key={val} className={`btn ${answers.hasBusiness === val ? 'btn-ink' : 'btn-ghost'}`}
              style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 'var(--r-md)', marginBottom: 6 }}
              onClick={() => setAnswers(a => ({ ...a, hasBusiness: val }))}>
              {label}
            </button>
          ))}
        </>}

        {/* Step 4 — Rating */}
        {step === 4 && <>
          <h2 className="modal-title">ให้คะแนน App นี้</h2>
          <p className="modal-desc">ช่วย feedback สั้นๆ</p>
          <div className="star-rating">
            {[1,2,3,4,5].map(n => (
              <button key={n} className={`star-btn ${n <= answers.rating ? 'active' : ''}`}
                onClick={() => setAnswers(a => ({ ...a, rating: n }))}>★</button>
            ))}
          </div>
          <div className="input-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: 6 }}>เหตุผล / ความคิดเห็น</label>
            <textarea className="field" placeholder="บอกเหตุผลสั้นๆ..." rows={3} style={{ resize: 'vertical' }}
              value={answers.reason} onChange={e => setAnswers(a => ({ ...a, reason: e.target.value }))} />
          </div>
        </>}

        {/* Footer */}
        <div className="modal-footer" style={{ marginTop: 20 }}>
          {step > 1 && <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>}
          <button className="btn btn-ink" style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleNext} disabled={!canNext()}>
            {step < TOTAL_STEPS ? 'Next →' : <><Send size={14} /> Send Report</>}
          </button>
        </div>
      </div>
    </div>
  )
}
