import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import InputPanel from '../components/InputPanel'
import OutputPanel from '../components/OutputPanel'
import { DEFAULT_INPUTS } from '../data/defaults'
import { calculateCashFlow } from '../utils/calculations'

export default function SimulatorPage({ savedScenarios, onSaveScenario, onUpdateScenario, initialInputs, editingIdx }) {
  const [mobileTab, setMobileTab]   = useState('input')
  const [inputs, setInputs]         = useState(() => initialInputs ? { ...DEFAULT_INPUTS, ...initialInputs } : DEFAULT_INPUTS)
  const [scenarioName, setScenarioName] = useState(
    editingIdx != null && initialInputs
      ? (savedScenarios?.[editingIdx]?.name?.replace(/^Scenario \d+ - /, '') || '')
      : ''
  )
  const navigate = useNavigate()

  function update(patch) { setInputs(prev => ({ ...prev, ...patch })) }

  const results = useMemo(() => calculateCashFlow(inputs), [inputs])

  const isEditing = editingIdx != null

  function buildScenarioName(num) {
    const custom = scenarioName.trim()
    if (custom) return `Scenario ${num} - ${custom}`
    return `Scenario ${num} - ${inputs.projects.length}p · ${inputs.team.reduce((s,r)=>s+r.count,0)} staff`
  }

  function handleSaveScenario() {
    const num = (savedScenarios?.length || 0) + 1
    const name = buildScenarioName(num)
    onSaveScenario({ name, inputs: { ...inputs }, results: { ...results } })
    navigate('/compare')
  }

  function handleUpdateScenario() {
    const existing = savedScenarios?.[editingIdx]
    const existingNum = existing?.name?.match(/^Scenario (\d+)/)?.[1] || (editingIdx + 1)
    const name = buildScenarioName(Number(existingNum))
    onUpdateScenario(editingIdx, { name, inputs: { ...inputs }, results: { ...results } })
    navigate('/compare')
  }

  return (
    <div className="page-wrap">
      <Header scenarioName={scenarioName} onNameChange={setScenarioName} />

      {isEditing && (
        <div style={{ background: 'var(--amber-light)', borderBottom: '1px solid #fde68a', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: 'var(--amber)' }}>
          <span style={{ fontWeight: 700 }}>✏️ Editing: {savedScenarios?.[editingIdx]?.name}</span>
          <span style={{ color: 'var(--ink-4)' }}>Save will update this scenario or create new</span>
        </div>
      )}

      <div className="simulator-layout">
        <div className={`input-panel-wrap ${mobileTab === 'output' ? 'mobile-hidden' : ''}`}>
          <InputPanel
            inputs={inputs}
            update={update}
            results={results}
            onSaveScenario={isEditing ? handleUpdateScenario : handleSaveScenario}
          />
        </div>
        <div className={`output-panel-wrap ${mobileTab === 'input' ? 'mobile-hidden' : ''}`}>
          <OutputPanel
            inputs={inputs}
            results={results}
            onSaveScenario={isEditing ? handleUpdateScenario : handleSaveScenario}
          />
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <div className="mobile-tab-bar">
        <button className={`mobile-tab-btn ${mobileTab === 'input' ? 'active' : ''}`}
          onClick={() => setMobileTab('input')}>
          <span className="tab-icon">⚙️</span>
          Input
        </button>
        <button className={`mobile-tab-btn ${mobileTab === 'output' ? 'active' : ''}`}
          onClick={() => { setMobileTab('output'); window.scrollTo(0, 0) }}>
          <span className="tab-icon">📊</span>
          Output
        </button>
      </div>
    </div>
  )
}
