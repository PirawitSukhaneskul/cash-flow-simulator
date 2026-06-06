import { useState } from 'react'
import { Plus, Minus, Trash2, PlusCircle, Check, X, Save, Pencil } from 'lucide-react'
import { STAFF_ROLES, TEAM_PACKS, OFFICE_DEFAULTS, MILESTONE_PRESETS, buildDefaultMilestones } from '../data/defaults'
import { SOFTWARE_CATALOG, SOFTWARE_CATEGORY_ORDER, SOFTWARE_PACK_DEFAULTS, calcSelectedSoftwareCost } from '../data/softwareCatalog'
import { ASA_PROJECT_TYPES, PROJECT_SIZE_PRESETS, getASAGuidelineFee } from '../data/asa'
import { fmtFull, fmt } from '../utils/calculations'

// ── Helpers ────────────────────────────────────────────────
// Comma-grouped currency input. Native <input type="number"> can't render
// thousands separators, so we use a text input that displays "25,000,000"
// and parses back to a plain integer on change.
function MoneyInput({ value, onChange, className = 'field', style, placeholder, ...rest }) {
  const display = (value === '' || value == null || isNaN(value))
    ? ''
    : Number(value).toLocaleString('en-US')
  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      style={style}
      placeholder={placeholder}
      value={display}
      onChange={e => {
        const digits = e.target.value.replace(/[^\d]/g, '')
        onChange(digits === '' ? 0 : Number(digits))
      }}
      {...rest}
    />
  )
}

function Stepper({ value, onChange, min = 0, max = 99 }) {
  return (
    <div className="stepper-row">
      <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - 1))}><Minus size={12} /></button>
      <span className="stepper-count">{value}</span>
      <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + 1))}><Plus size={12} /></button>
    </div>
  )
}

function AvgField({ label, avg, value, onChange, suffix = '/mo' }) {
  const num   = Number(value)
  const diff  = num - avg
  const pct   = avg > 0 ? Math.abs(((diff / avg) * 100)).toFixed(0) : 0
  const cls   = diff > 0 ? 'above-avg' : diff < 0 ? 'below-avg' : ''
  const hint  = diff > 0 ? `⬆ +${pct}% vs AVG` : diff < 0 ? `⬇ −${pct}% vs AVG` : ''
  return (
    <div className="input-group">
      <div className="input-row">
        <span className="input-label-text">{label}</span>
        <span className="input-avg-label">AVG ฿{avg.toLocaleString()}{suffix}</span>
      </div>
      <MoneyInput className={`field ${cls}`} value={value} onChange={onChange} />
      {hint && <div className={`input-hint ${cls}`}>{hint}</div>}
    </div>
  )
}

// ── Milestone Editor ───────────────────────────────────────
function MilestoneEditor({ milestones, preset, duration, onChangePreset, onChangeMilestones }) {
  const total = milestones.reduce((s, m) => s + m.pct, 0)
  const valid = total === 100

  function applyPreset(key) {
    if (key === 'custom') {
      onChangePreset('custom')
      return
    }
    const ms = buildDefaultMilestones(key, duration)
    onChangePreset(key)
    onChangeMilestones(ms)
  }

  function updateMs(idx, field, val) {
    const next = milestones.map((m, i) => i === idx ? { ...m, [field]: val } : m)
    onChangeMilestones(next)
    onChangePreset('custom')
  }

  function removeMs(idx) {
    onChangeMilestones(milestones.filter((_, i) => i !== idx))
    onChangePreset('custom')
  }

  function addMs() {
    onChangeMilestones([...milestones, { name: `Milestone ${milestones.length + 1}`, pct: 0, month: duration }])
    onChangePreset('custom')
  }

  return (
    <div>
      <div className="section-title" style={{ marginBottom: 6 }}>Payment Milestones</div>
      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {Object.entries(MILESTONE_PRESETS).map(([k, p]) => (
          <button key={k} className={`pill ${preset === k ? 'selected' : ''}`}
            style={{ fontSize: '0.68rem' }} onClick={() => applyPreset(k)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Milestone rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>
        {milestones.map((ms, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 48px 60px 22px', gap: 4, alignItems: 'center' }}>
            <input className="field" style={{ fontSize: '0.72rem', padding: '4px 7px' }}
              value={ms.name}
              onChange={e => updateMs(idx, 'name', e.target.value)}
              placeholder="Stage name" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input type="number" className="field" style={{ fontSize: '0.72rem', padding: '4px 5px', textAlign: 'right' }}
                value={ms.pct} min={0} max={100}
                onChange={e => updateMs(idx, 'pct', Number(e.target.value))} />
              <span style={{ fontSize: '0.65rem', color: 'var(--ink-4)' }}>%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>Mo</span>
              <input type="number" className="field" style={{ fontSize: '0.72rem', padding: '4px 5px', textAlign: 'right' }}
                value={ms.month} min={1} max={Math.max(duration, 1)}
                onChange={e => updateMs(idx, 'month', Number(e.target.value))} />
            </div>
            <button className="btn-icon btn-sm" onClick={() => removeMs(idx)}><X size={10} /></button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem' }} onClick={addMs}>
          <Plus size={11} /> Add Stage
        </button>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: valid ? 'var(--green)' : 'var(--red)' }}>
          Total: {total}% {valid ? '✓' : '✗ must be 100%'}
        </span>
      </div>
    </div>
  )
}

// ── Add Project Modal ──────────────────────────────────────
function AddProjectModal({ onAdd, onUpdate, onClose, editProject }) {
  const isEdit = !!editProject
  const [size,            setSize]            = useState('medium')
  const [type,            setType]            = useState(editProject?.type ?? 'residential')
  const [cost,            setCost]            = useState(editProject?.constructionCost ?? 25_000_000)
  const [fee,             setFee]             = useState(editProject?.feePercent ?? getASAGuidelineFee('residential', 25_000_000))
  const [name,            setName]            = useState(editProject?.name ?? '')
  const [start,           setStart]           = useState(editProject?.startMonth ?? 1)
  const [dur,             setDur]             = useState(editProject?.duration ?? 5)
  const [delay,           setDelay]           = useState(editProject?.paymentDelay ?? 0)
  const [milestonePreset, setMilestonePreset] = useState(editProject?.milestonePreset ?? 'standard4')
  const [milestones,      setMilestones]      = useState(() => editProject?.milestones ?? buildDefaultMilestones('standard4', 5))

  const guideline = getASAGuidelineFee(type, cost)
  const feeClass  = fee > guideline ? 'above' : fee < guideline ? 'below' : ''
  const revenue   = cost * (fee / 100)
  const msTotal   = milestones.reduce((s, m) => s + m.pct, 0)
  const msValid   = msTotal === 100

  function pickSize(preset) {
    setSize(preset.id)
    setCost(preset.defaultCost)
    setType(preset.defaultType)
    setDur(preset.duration)
    const g = getASAGuidelineFee(preset.defaultType, preset.defaultCost)
    setFee(g)
    const ms = buildDefaultMilestones(milestonePreset, preset.duration)
    setMilestones(ms)
  }

  function pickType(tid) {
    setType(tid)
    const g = getASAGuidelineFee(tid, cost)
    setFee(g)
  }

  function changeCost(c) {
    setCost(c)
    const g = getASAGuidelineFee(type, c)
    setFee(g)
  }

  function changeDur(d) {
    setDur(d)
    if (milestonePreset !== 'custom') {
      setMilestones(buildDefaultMilestones(milestonePreset, d))
    }
  }

  function handleAdd() {
    if (!msValid) return
    const proj = {
      id: editProject?.id || `proj_${Date.now()}`,
      name: name || `${ASA_PROJECT_TYPES.find(t => t.id === type)?.label || 'Project'} — ฿${(cost/1_000_000).toFixed(0)}M`,
      type, constructionCost: cost, feePercent: fee,
      guidelineFeePercent: guideline, startMonth: start, duration: dur,
      paymentDelay: delay, milestonePreset, milestones,
    }
    if (isEdit) onUpdate(proj)
    else onAdd(proj)
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-sheet" style={{ maxWidth: 540 }}>
        <div className="sheet-header">
          <span className="sheet-title">{isEdit ? '✏️ Edit Project' : '+ Add Project'}</span>
          <button className="btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Project name */}
        <div className="input-group">
          <div className="input-row"><span className="input-label-text">Project Name (optional)</span></div>
          <input className="field" placeholder="e.g. Villa Project A" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Size presets */}
        <div className="section-title" style={{ marginBottom: 8 }}>Project Size</div>
        <div className="size-preset-grid" style={{ marginBottom: 14 }}>
          {PROJECT_SIZE_PRESETS.map(p => (
            <button key={p.id} className={`size-preset-btn ${size === p.id ? 'selected' : ''}`} onClick={() => pickSize(p)}>
              <span className="sz-icon">{p.emoji}</span>
              <span>{p.label}</span>
              <span className="sz-sub">{p.subtitle}</span>
            </button>
          ))}
        </div>

        {/* Project type */}
        <div className="section-title" style={{ marginBottom: 8 }}>Building Type (ASA Category)</div>
        <div className="type-grid" style={{ marginBottom: 14 }}>
          {ASA_PROJECT_TYPES.map(t => (
            <button key={t.id} className={`type-card ${type === t.id ? 'selected' : ''}`} onClick={() => pickType(t.id)}>
              <span className="tc-icon">{t.emoji}</span>
              <span>{t.label}</span>
              <span className="tc-sub">{t.labelTH}</span>
            </button>
          ))}
        </div>

        {/* Construction cost */}
        <div className="input-group">
          <div className="input-row">
            <span className="input-label-text">Construction Cost (THB)</span>
            <span className="input-avg-label">{fmt(cost)}</span>
          </div>
          <MoneyInput className="field" value={cost} onChange={changeCost} />
          <input type="range" min={1_000_000} max={500_000_000} step={1_000_000} value={cost}
            onChange={e => changeCost(Number(e.target.value))} style={{ marginTop: 8 }} />
          <div className="slider-labels">
            <span>฿1M</span>
            <span className="slider-value">{fmt(cost)}</span>
            <span>฿500M</span>
          </div>
        </div>

        {/* Design fee % */}
        <div className="input-group">
          <div className="fee-bar">
            <div>
              <span className="input-label-text">Design Fee %  </span>
              <span className={`fee-value ${feeClass}`}>{fee.toFixed(2)}%</span>
            </div>
            <div className="fee-guideline">ASA guideline: <strong>{guideline.toFixed(2)}%</strong></div>
          </div>
          <input type="range" min={1} max={15} step={0.25} value={fee}
            onChange={e => setFee(Number(e.target.value))} />
          <div className="slider-labels">
            <span>1%</span>
            <span className="slider-value">{fee.toFixed(2)}%</span>
            <span>15%</span>
          </div>
          {feeClass === 'above' && <div className="input-hint below-avg">✅ เกิน ASA guideline — margin ดีกว่าค่าอ้างอิง</div>}
          {feeClass === 'below' && <div className="input-hint above-avg">⚠️ ต่ำกว่า ASA guideline — ตรวจสอบ scope ก่อน</div>}
          <div className="asa-note">
            Fee % based on ASA-style guideline. Verify before commercial use.{' '}
            <a href="https://asa.or.th/" target="_blank" rel="noopener noreferrer">asa.or.th</a> ·{' '}
            <a href="https://akasarchitects.com/architects-fees/" target="_blank" rel="noopener noreferrer">akasarchitects.com</a>
          </div>
        </div>

        {/* Revenue preview */}
        <div style={{ background: 'var(--rice)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--ink-3)' }}>Design Fee Revenue</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--green)' }}>{fmtFull(revenue)}</span>
        </div>

        {/* Start month + duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div className="input-row"><span className="input-label-text">Start Month</span></div>
            <input type="number" className="field" value={start} min={1} max={60}
              onChange={e => setStart(Number(e.target.value))} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div className="input-row"><span className="input-label-text">Duration (mo)</span></div>
            <input type="number" className="field" value={dur} min={1} max={24}
              onChange={e => changeDur(Number(e.target.value))} />
          </div>
        </div>

        {/* Per-project payment delay */}
        <div className="input-group" style={{ marginBottom: 14 }}>
          <div className="input-row"><span className="input-label-text">Client Payment Delay</span></div>
          <div className="delay-row">
            {[{v:0,l:'On time'},{v:1,l:'+1 mo'},{v:2,l:'+2 mo'},{v:3,l:'+3 mo'}].map(o => (
              <button key={o.v} className={`delay-btn ${delay === o.v ? 'selected' : ''}`}
                onClick={() => setDelay(o.v)} style={{ borderRadius: 'var(--r-pill)' }}>
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Milestone editor */}
        <div style={{ background: 'var(--rice)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 18 }}>
          <MilestoneEditor
            milestones={milestones}
            preset={milestonePreset}
            duration={dur}
            onChangePreset={setMilestonePreset}
            onChangeMilestones={setMilestones}
          />
        </div>

        <div className="modal-footer" style={{ gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-ink" style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleAdd} disabled={!msValid}
            title={!msValid ? `Total must be 100% (currently ${msTotal}%)` : undefined}>
            {isEdit ? <><Check size={15} /> Save Changes</> : <><Plus size={15} /> Add Project</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Team ──────────────────────────────────────────────
function TeamTab({ inputs, update }) {
  const [showAdd, setShowAdd] = useState(false)

  function setPack(key) { update({ teamPack: key, team: TEAM_PACKS[key].team.map(r => ({ ...r })) }) }

  function updateCount(idx, count) {
    const team = inputs.team.map((r, i) => i === idx ? { ...r, count } : r)
    update({ team, teamPack: 'custom' })
  }

  function updateSalary(idx, salary) {
    const team = inputs.team.map((r, i) => i === idx ? { ...r, salary } : r)
    update({ team, teamPack: 'custom' })
  }

  function removeRole(idx) { update({ team: inputs.team.filter((_, i) => i !== idx), teamPack: 'custom' }) }

  function addRole(role) {
    update({ team: [...inputs.team, { role: role.role, count: 1, salary: role.avg }], teamPack: 'custom' })
    setShowAdd(false)
  }

  const totalRaw = inputs.team.reduce((s, r) => s + r.count * r.salary, 0)

  return (
    <div>
      {/* Pack presets */}
      <div className="section-title">Preset Pack</div>
      <div className="pill-row">
        {Object.entries(TEAM_PACKS).map(([k, p]) => (
          <button key={k} className={`pill ${inputs.teamPack === k ? 'selected' : ''}`} onClick={() => setPack(k)}>{p.label}</button>
        ))}
        <button className={`pill ${inputs.teamPack === 'custom' ? 'selected' : ''}`} onClick={() => update({ teamPack: 'custom' })}>Custom</button>
      </div>

      {/* Roster */}
      <div className="section-title">Team Roster</div>
      {inputs.team.map((m, idx) => {
        const role = STAFF_ROLES.find(r => r.role === m.role)
        const avg  = role?.avg ?? m.salary
        const cls  = m.salary > avg ? 'above-avg' : m.salary < avg ? 'below-avg' : ''
        return (
          <div key={idx} className="team-row">
            <div className="team-row-info">
              <div className="team-row-name">{m.role}</div>
              <div className="team-salary-row">
                <MoneyInput className={`team-salary-field ${cls}`} value={m.salary}
                  onChange={v => updateSalary(idx, v)} />
                <span className="team-salary-avg">AVG ฿{avg.toLocaleString()}</span>
              </div>
            </div>
            <div className="team-row-controls">
              <Stepper value={m.count} onChange={n => updateCount(idx, n)} />
              <button className="btn-icon btn-sm" onClick={() => removeRole(idx)}><Trash2 size={12} /></button>
            </div>
          </div>
        )
      })}

      {showAdd ? (
        <div style={{ border: '1.5px dashed var(--border)', borderRadius: 'var(--r-md)', padding: 10, marginTop: 6 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>เพิ่ม Role</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {STAFF_ROLES.filter(r => !inputs.team.find(t => t.role === r.role)).map(r => (
              <button key={r.role} className="pill" style={{ fontSize: '0.72rem' }} onClick={() => addRole(r)}>{r.role}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setShowAdd(false)}>ยกเลิก</button>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 8, justifyContent: 'center' }} onClick={() => setShowAdd(true)}>
          <PlusCircle size={14} /> Add Role
        </button>
      )}

      <div style={{ background: 'var(--rice)', borderRadius: 'var(--r-md)', padding: '10px 12px', marginTop: 12, fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ color: 'var(--ink-3)' }}>Raw salary / mo</span>
          <span style={{ fontWeight: 700 }}>{fmtFull(totalRaw)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--ink-3)' }}>Staff cost (×1.12 SSO)</span>
          <span style={{ fontWeight: 700 }}>{fmtFull(totalRaw * 1.12)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Projects ──────────────────────────────────────────
function ProjectsTab({ inputs, update }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editProject, setEditProject] = useState(null)

  function removeProject(id) { update({ projects: inputs.projects.filter(p => p.id !== id) }) }
  function updateProject(proj) { update({ projects: inputs.projects.map(p => p.id === proj.id ? proj : p) }) }

  const totalRevenue = inputs.projects.reduce((s, p) => s + p.constructionCost * (p.feePercent / 100), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          {inputs.projects.length} Project{inputs.projects.length !== 1 ? 's' : ''}
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--green)' }}>{fmtFull(totalRevenue)}/yr</div>
      </div>

      <div className="project-list">
        {inputs.projects.map(proj => {
          const type  = ASA_PROJECT_TYPES.find(t => t.id === proj.type)
          const rev   = proj.constructionCost * (proj.feePercent / 100)
          const feeOk = proj.feePercent >= proj.guidelineFeePercent
          const msTotal = proj.milestones?.reduce((s, m) => s + m.pct, 0) ?? null
          return (
            <div key={proj.id} className="project-item">
              <div className="project-item-icon">{type?.emoji || '📐'}</div>
              <div className="project-item-info">
                <div className="project-item-name">{proj.name}</div>
                <div className="project-item-meta">
                  {type?.label} · {fmt(proj.constructionCost)} · M{proj.startMonth} · {proj.duration}mo
                  {proj.paymentDelay > 0 && ` · +${proj.paymentDelay}mo delay`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: '0.7rem', color: feeOk ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {proj.feePercent.toFixed(2)}% {feeOk ? '✓' : '⚠️'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--ink-4)' }}>
                    guideline {proj.guidelineFeePercent.toFixed(2)}%
                  </span>
                  {msTotal !== null && (
                    <span style={{ fontSize: '0.65rem', color: msTotal === 100 ? 'var(--ink-4)' : 'var(--red)' }}>
                      · {proj.milestones?.length}ms
                    </span>
                  )}
                </div>
              </div>
              <div className="project-item-controls">
                <span className="project-item-fee">{fmt(rev)}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-icon btn-sm" title="Edit project" onClick={() => setEditProject(proj)}>
                    <Pencil size={12} />
                  </button>
                  <button className="btn-icon btn-sm" title="Delete project" onClick={() => removeProject(proj.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'center' }}
        onClick={() => setShowAdd(true)}>
        <Plus size={14} /> Add Project
      </button>

      <div className="asa-note" style={{ marginTop: 8 }}>
        Fee % from ASA guideline — reference only. <a href="https://asa.or.th/" target="_blank" rel="noopener noreferrer">asa.or.th</a>
      </div>

      {/* Simulation period */}
      <div style={{ marginTop: 14 }}>
        <div className="input-group">
          <div className="input-row"><span className="input-label-text">Simulation Period</span></div>
          <div className="pill-row">
            {[12, 24, 36, 60].map(m => (
              <button key={m} className={`pill ${inputs.months === m ? 'selected' : ''}`}
                onClick={() => update({ months: m })}>{m} mo</button>
            ))}
          </div>
        </div>

        <AvgField label="Initial Capital / เงินกู้เริ่มต้น" avg={1_500_000} value={inputs.initialCapital}
          onChange={v => update({ initialCapital: v })} suffix="" />
        <input type="range" min={500_000} max={10_000_000} step={100_000} value={inputs.initialCapital}
          onChange={e => update({ initialCapital: Number(e.target.value) })} />
        <div className="slider-labels">
          <span>฿500K</span>
          <span className="slider-value">{fmt(inputs.initialCapital)}</span>
          <span>฿10M</span>
        </div>
      </div>

      {showAdd && <AddProjectModal onAdd={proj => update({ projects: [...inputs.projects, proj] })} onClose={() => setShowAdd(false)} />}
      {editProject && <AddProjectModal editProject={editProject} onUpdate={updateProject} onClose={() => setEditProject(null)} />}
    </div>
  )
}

// ── Tab: Software ──────────────────────────────────────────
function SoftwareTab({ inputs, update }) {
  const [newSw, setNewSw] = useState({ name: '', pricePerUserMonth: '' })

  const selected = inputs.selectedSoftware || []

  function isSelected(id) { return !!selected.find(s => s.id === id) }

  function toggleSoftware(id) {
    if (isSelected(id)) {
      update({ selectedSoftware: selected.filter(s => s.id !== id) })
    } else {
      const cat = SOFTWARE_CATALOG.find(s => s.id === id)
      update({ selectedSoftware: [...selected, { id, users: 1, pricePerUserMonth: cat?.pricePerUserMonth ?? 0 }] })
    }
  }

  function updateUsers(id, users) {
    update({ selectedSoftware: selected.map(s => s.id === id ? { ...s, users } : s) })
  }

  function updatePrice(id, price) {
    update({ selectedSoftware: selected.map(s => s.id === id ? { ...s, pricePerUserMonth: price } : s) })
  }

  function addCustom() {
    if (!newSw.name) return
    const id = `custom_${Date.now()}`
    update({ selectedSoftware: [...selected, { id, name: newSw.name, pricePerUserMonth: Number(newSw.pricePerUserMonth) || 0, users: 1, isCustom: true }] })
    setNewSw({ name: '', pricePerUserMonth: '' })
  }

  function applyPack(businessType) {
    const ids = SOFTWARE_PACK_DEFAULTS[businessType] || []
    const newSel = ids.map(id => {
      const existing = selected.find(s => s.id === id)
      if (existing) return existing
      const cat = SOFTWARE_CATALOG.find(s => s.id === id)
      return { id, users: 1, pricePerUserMonth: cat?.pricePerUserMonth ?? 0 }
    })
    update({ selectedSoftware: newSel })
  }

  const totalMonthly = calcSelectedSoftwareCost(selected)

  return (
    <div>
      <div className="section-title">Preset Packs</div>
      <div className="pill-row" style={{ marginBottom: 14 }}>
        {[{k:'architecture',l:'Architecture'},{k:'interior',l:'Interior'},{k:'bim',l:'BIM'}].map(({k,l}) => (
          <button key={k} className="pill" onClick={() => applyPack(k)}>{l} Pack</button>
        ))}
      </div>

      <div className="section-title">Software Library</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-4)', marginBottom: 8 }}>
        Prices are editable defaults. Verify at vendor websites.
      </div>

      {SOFTWARE_CATEGORY_ORDER.map(cat => {
        const items = SOFTWARE_CATALOG.filter(sw => sw.category === cat)
        if (items.length === 0) return null
        return (
          <div key={cat} className="software-cat-group">
            <div className="software-cat-header">{cat}</div>
            <div className="software-grid">
              {items.map(sw => {
                const sel   = selected.find(s => s.id === sw.id)
                const isSel = !!sel
                const price = sel?.pricePerUserMonth ?? sw.pricePerUserMonth
                const users = sel?.users ?? 1
                const annual = price * users * 12

                return (
                  <div key={sw.id} className={`software-card ${isSel ? 'selected' : ''}`} onClick={() => toggleSoftware(sw.id)}>
                    <div className="software-card-header">
                      {sw.logo
                        ? <img src={sw.logo} alt={sw.name} className="software-logo" />
                        : <div className="software-emoji-logo">{sw.emoji}</div>
                      }
                      <div className="software-info">
                        <div className="software-name">{sw.name}</div>
                        <div className="software-cat">{sw.category}</div>
                      </div>
                    </div>

                    {isSel && (
                      <div onClick={e => e.stopPropagation()} style={{ marginTop: 4 }}>
                        <div className="software-price-row">
                          <div className="software-users">
                            <button className="stepper-btn" style={{ width: 22, height: 22 }}
                              onClick={e => { e.stopPropagation(); updateUsers(sw.id, Math.max(1, users - 1)) }}>
                              <Minus size={10} />
                            </button>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{users}</span>
                            <button className="stepper-btn" style={{ width: 22, height: 22 }}
                              onClick={e => { e.stopPropagation(); updateUsers(sw.id, users + 1) }}>
                              <Plus size={10} />
                            </button>
                          </div>
                          {price === 0
                            ? <span className="software-free">FREE</span>
                            : <MoneyInput className="software-price-edit" value={price}
                                onClick={e => e.stopPropagation()}
                                onChange={v => updatePrice(sw.id, v)}
                                placeholder="฿/mo" />
                          }
                        </div>
                        {price > 0 && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--ink-4)', textAlign: 'right', marginTop: 3 }}>
                            ฿{annual.toLocaleString()}/yr
                          </div>
                        )}
                      </div>
                    )}

                    {!isSel && sw.pricePerUserMonth === 0 && (
                      <div className="software-free" style={{ fontSize: '0.68rem' }}>FREE</div>
                    )}
                    {!isSel && sw.pricePerUserMonth > 0 && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-4)' }}>
                        ฿{sw.pricePerUserMonth.toLocaleString()}/user/mo
                      </div>
                    )}

                    <div className="software-check"><Check size={10} /></div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Custom software */}
      <div className="section-title" style={{ marginTop: 12 }}>Custom Software</div>
      {selected.filter(s => s.isCustom).map(s => (
        <div key={s.id} className="custom-sw-row">
          <input value={s.name || s.id} readOnly style={{ flex: 2 }} />
          <MoneyInput value={s.pricePerUserMonth} style={{ flex: 1 }}
            onChange={v => updatePrice(s.id, v)} placeholder="฿/mo" />
          <button className="btn-icon btn-sm" onClick={() => update({ selectedSoftware: selected.filter(x => x.id !== s.id) })}>
            <X size={12} />
          </button>
        </div>
      ))}
      <div className="custom-sw-row" style={{ marginTop: 4 }}>
        <input placeholder="Software name" value={newSw.name}
          onChange={e => setNewSw(n => ({ ...n, name: e.target.value }))} style={{ flex: 2 }} />
        <MoneyInput placeholder="฿/mo" value={newSw.pricePerUserMonth === '' ? '' : newSw.pricePerUserMonth}
          onChange={v => setNewSw(n => ({ ...n, pricePerUserMonth: v }))} style={{ flex: 1 }} />
        <button className="stepper-btn" onClick={addCustom}><Plus size={14} /></button>
      </div>

      <div style={{ background: 'var(--rice)', borderRadius: 'var(--r-md)', padding: '10px 12px', marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--ink-3)' }}>Total Software / mo</span>
          <span style={{ fontWeight: 700 }}>{fmtFull(totalMonthly)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: 3 }}>
          <span style={{ color: 'var(--ink-4)' }}>Annual</span>
          <span style={{ fontWeight: 600, color: 'var(--ink-3)' }}>{fmtFull(totalMonthly * 12)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Costs ─────────────────────────────────────────────
function CostsTab({ inputs, update }) {
  return (
    <div>
      <div className="section-title">Office & Overhead (Monthly)</div>
      {Object.entries(OFFICE_DEFAULTS).map(([key, info]) => (
        <AvgField key={key} label={info.label} avg={info.avg} value={inputs[key]}
          onChange={v => update({ [key]: v })} />
      ))}

      <div className="section-title" style={{ marginTop: 4 }}>Tax</div>
      <div className="input-group">
        <div className="input-row">
          <span className="input-label-text">Corporate Income Tax</span>
          <span className="input-avg-label">SME: 15–20%</span>
        </div>
        <div className="pill-row">
          <button className={`pill ${inputs.taxRate === 15 ? 'selected' : ''}`} onClick={() => update({ taxRate: 15 })}>15% (≤฿3M profit)</button>
          <button className={`pill ${inputs.taxRate === 20 ? 'selected' : ''}`} onClick={() => update({ taxRate: 20 })}>20% ({'>'} ฿3M)</button>
        </div>
        <input type="range" min={0} max={30} value={inputs.taxRate}
          onChange={e => update({ taxRate: Number(e.target.value) })} />
        <div className="slider-labels">
          <span>0%</span><span className="slider-value">{inputs.taxRate}%</span><span>30%</span>
        </div>
      </div>
    </div>
  )
}

// ── Worst Case Section ─────────────────────────────────────
function WorstCaseSection({ inputs, update, results }) {
  const [open, setOpen] = useState(false)
  const delay = inputs.paymentDelay || 0

  return (
    <div style={{ padding: '6px 16px', borderTop: '1px solid var(--border)' }}>
      <div className={`worst-case-section ${delay > 0 ? 'wc-active' : ''}`} style={{ padding: open ? 12 : '8px 12px' }}>

        <div className="wc-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div className="wc-info">
            <div className="wc-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              ⚡ Worst Case Mode
              <span style={{ fontSize: '0.6rem', color: 'var(--ink-4)', transform: open ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
            </div>
            <div className="wc-sub" style={{ fontSize: '0.67rem' }}>
              {delay > 0 ? `⚠️ +${delay}mo delay active · min ฿${(results.minSafeBalance/1000).toFixed(0)}K` : 'Normal mode — tap to configure delay'}
            </div>
          </div>
        </div>

        {open && (
          <>
            <div className="wc-body" style={{ marginTop: 10 }}>
              <div className="section-title" style={{ marginBottom: 6 }}>Payment Delay (shifts income, not expenses)</div>
              <div className="delay-row">
                {[{v:0,l:'Normal'},{v:1,l:'+1 mo'},{v:2,l:'+2 mo'},{v:3,l:'+3 mo'}].map(o => (
                  <button key={o.v} className={`delay-btn ${delay === o.v ? 'selected' : ''}`}
                    onClick={() => update({ paymentDelay: o.v })}>{o.l}</button>
                ))}
              </div>
            </div>

            <div className="divider" style={{ margin: '10px 0' }} />
            <div className="min-bal-row">
              <div>
                <div className="min-bal-label">Min Safe Balance</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ink-4)' }}>
                  {inputs.useCustomMinBalance ? 'Custom value' : `Auto: ${fmtFull(results.autoMinBalance)} (3mo core costs)`}
                </div>
              </div>
              <div className="min-bal-right">
                <button className={`pill ${!inputs.useCustomMinBalance ? 'selected' : ''}`}
                  style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                  onClick={() => update({ useCustomMinBalance: false })}>Auto</button>
                <button className={`pill ${inputs.useCustomMinBalance ? 'selected' : ''}`}
                  style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                  onClick={() => update({ useCustomMinBalance: true })}>Custom</button>
              </div>
            </div>
            {inputs.useCustomMinBalance && (
              <MoneyInput className="field" style={{ marginTop: 8 }}
                value={inputs.minSafeBalanceCustom ?? results.autoMinBalance}
                onChange={v => update({ minSafeBalanceCustom: v })}
                placeholder={`e.g. ${results.autoMinBalance.toLocaleString()}`} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main InputPanel ────────────────────────────────────────
export default function InputPanel({ inputs, update, results, onGetReport, onSaveScenario }) {
  const [tab, setTab] = useState('team')

  const TABS = [
    { key: 'team',     label: '👥 Team' },
    { key: 'projects', label: '📁 Projects' },
    { key: 'software', label: '💻 Software' },
    { key: 'costs',    label: '🏢 Costs' },
  ]

  return (
    <div className="input-panel">
      {/* Tabs */}
      <div className="input-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`input-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-scroll">
        {tab === 'team'     && <TeamTab     inputs={inputs} update={update} />}
        {tab === 'projects' && <ProjectsTab inputs={inputs} update={update} />}
        {tab === 'software' && <SoftwareTab inputs={inputs} update={update} />}
        {tab === 'costs'    && <CostsTab    inputs={inputs} update={update} />}
      </div>

      {/* Worst Case toggle */}
      <WorstCaseSection inputs={inputs} update={update} results={results} />

      {/* Footer */}
      <div className="input-footer">
        <div className="footer-cost-row">
          <div>
            <div className="footer-cost-label">Monthly Fixed Cost</div>
            <div className="footer-cost-sub">Salary + Software + Overhead</div>
          </div>
          <div className="footer-cost-value">{fmtFull(results.monthlyFixed)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onSaveScenario && (
            <button className="btn btn-ghost btn-lg" style={{ flex: 1, justifyContent: 'center', borderRadius: 'var(--r-md)' }}
              onClick={onSaveScenario}>
              <Save size={15} /> Save
            </button>
          )}
          <button className="btn btn-blue btn-lg" style={{ flex: 2, justifyContent: 'center' }} onClick={onGetReport}>
            📥 Get Excel Report
          </button>
        </div>
      </div>
    </div>
  )
}
