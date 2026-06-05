import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SimulatorPage from './pages/SimulatorPage'
import AdminPage     from './pages/AdminPage'
import ComparePage   from './pages/ComparePage'

export default function App() {
  const [savedScenarios, setSavedScenarios] = useState([])
  const [editingInputs,  setEditingInputs]  = useState(null)
  const [editingIdx,     setEditingIdx]     = useState(null)
  const [editCounter,    setEditCounter]    = useState(0)

  function handleSaveScenario(scenario) {
    setSavedScenarios(prev => [...prev, scenario].slice(-4))
    setEditingInputs(null)
    setEditingIdx(null)
  }

  function handleUpdateScenario(idx, scenario) {
    setSavedScenarios(prev => prev.map((s, i) => i === idx ? scenario : s))
    setEditingInputs(null)
    setEditingIdx(null)
  }

  function handleClearScenario(idx) {
    setSavedScenarios(prev => prev.filter((_, i) => i !== idx))
  }

  function handleEditScenario(idx) {
    setEditingInputs({ ...savedScenarios[idx].inputs })
    setEditingIdx(idx)
    setEditCounter(c => c + 1)
  }

  function handleDuplicateScenario(idx) {
    const original = savedScenarios[idx]
    const count = savedScenarios.length + 1
    const copy = {
      ...original,
      name: `Scenario ${count} - Copy of ${original.name.replace(/^Scenario \d+ - /, '')}`,
    }
    setSavedScenarios(prev => [...prev, copy].slice(-4))
  }

  function handleRenameScenario(idx, newName) {
    setSavedScenarios(prev => prev.map((s, i) =>
      i === idx ? { ...s, name: newName } : s
    ))
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <SimulatorPage
            key={editCounter}
            savedScenarios={savedScenarios}
            onSaveScenario={handleSaveScenario}
            onUpdateScenario={handleUpdateScenario}
            initialInputs={editingInputs}
            editingIdx={editingIdx}
          />
        } />
        <Route path="/compare" element={
          <ComparePage
            scenarios={savedScenarios}
            onClearScenario={handleClearScenario}
            onEditScenario={handleEditScenario}
            onDuplicateScenario={handleDuplicateScenario}
            onRenameScenario={handleRenameScenario}
          />
        } />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}
