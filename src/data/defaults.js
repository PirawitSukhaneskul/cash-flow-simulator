import { SOFTWARE_PACK_DEFAULTS, SOFTWARE_CATALOG } from './softwareCatalog'
import { currentYM } from '../utils/dates'

// ── Milestone presets ──────────────────────────────────────
export const MILESTONE_PRESETS = {
  equal4:      { label: 'Equal 4 (25/25/25/25)',       pcts: [25, 25, 25, 25] },
  standard4:   { label: 'Standard 4 (30/30/30/10)',    pcts: [30, 30, 30, 10] },
  frontLoaded: { label: 'Front-loaded (40/30/20/10)',  pcts: [40, 30, 20, 10] },
  backLoaded:  { label: 'Back-loaded (10/30/30/30)',   pcts: [10, 30, 30, 30] },
  custom:      { label: 'Custom',                       pcts: null },
}

const MILESTONE_STAGE_NAMES = [
  'Schematic Design',
  'Design Development',
  'Construction Documents',
  'Project Completion',
]

export function buildDefaultMilestones(presetKey, duration) {
  const preset = MILESTONE_PRESETS[presetKey] || MILESTONE_PRESETS.standard4
  if (!preset.pcts) {
    return [{ name: 'Milestone 1', pct: 100, month: 1 }]
  }
  const count = preset.pcts.length
  const dur   = Math.max(duration, 1)
  const spreadMonths = Array.from({ length: count }, (_, i) => {
    if (count === 1) return 1
    if (i === 0) return 1
    if (i === count - 1) return dur
    return Math.max(1, Math.round(1 + (i / (count - 1)) * (dur - 1)))
  })
  return preset.pcts.map((pct, i) => ({
    name:  MILESTONE_STAGE_NAMES[i] || `Milestone ${i + 1}`,
    pct,
    month: spreadMonths[i],
  }))
}

// ── Staff roles ────────────────────────────────────────────
export const STAFF_ROLES = [
  { role: 'Intern',                    avg: 6500,   range: '5,000–8,000' },
  { role: 'Draftsman (Junior)',        avg: 15000,  range: '13,000–18,000' },
  { role: 'Draftsman (Senior)',        avg: 21000,  range: '18,000–25,000' },
  { role: 'Junior Architect',          avg: 21000,  range: '18,000–25,000' },
  { role: 'Architect',                 avg: 30000,  range: '25,000–40,000' },
  { role: 'Senior Architect',         avg: 50000,  range: '40,000–60,000' },
  { role: 'Project Architect',        avg: 52000,  range: '40,000–65,000' },
  { role: 'BIM Modeler',              avg: 24000,  range: '18,000–30,000' },
  { role: 'BIM Coordinator',          avg: 40000,  range: '30,000–50,000' },
  { role: 'BIM Manager',              avg: 70000,  range: '50,000–90,000' },
  { role: 'Associate / Design Mgr',   avg: 75000,  range: '60,000–90,000' },
  { role: 'Principal / Partner',      avg: 110000, range: '80,000–150,000+' },
]

// ── Team presets ───────────────────────────────────────────
export const TEAM_PACKS = {
  pack3: {
    label: '3 คน',
    team: [
      { role: 'Senior Architect', count: 1, salary: 50000 },
      { role: 'Architect',        count: 1, salary: 30000 },
      { role: 'Draftsman (Junior)', count: 1, salary: 15000 },
    ],
  },
  pack6: {
    label: '6 คน',
    team: [
      { role: 'Principal / Partner',   count: 1, salary: 110000 },
      { role: 'Senior Architect',     count: 1, salary: 50000 },
      { role: 'Architect',             count: 2, salary: 30000 },
      { role: 'BIM Modeler',           count: 1, salary: 24000 },
      { role: 'Draftsman (Junior)',    count: 1, salary: 15000 },
    ],
  },
  pack9: {
    label: '9 คน',
    team: [
      { role: 'Principal / Partner',   count: 1, salary: 110000 },
      { role: 'Senior Architect',     count: 1, salary: 50000 },
      { role: 'Architect',             count: 2, salary: 30000 },
      { role: 'BIM Modeler',           count: 1, salary: 24000 },
      { role: 'Draftsman (Junior)',    count: 1, salary: 15000 },
      { role: 'Project Architect',    count: 1, salary: 52000 },
      { role: 'BIM Coordinator',      count: 1, salary: 40000 },
      { role: 'Junior Architect',     count: 1, salary: 21000 },
    ],
  },
}

// ── Office overhead defaults ───────────────────────────────
export const OFFICE_DEFAULTS = {
  rent:        { avg: 45000, label: 'ค่าเช่า Office (กทม.)' },
  utilities:   { avg: 8000,  label: 'ค่าไฟ + น้ำ + Internet' },
  marketing:   { avg: 3000,  label: 'ค่าการตลาด / เว็บ' },
  equipment:   { avg: 5000,  label: 'เครื่องมือ / อุปกรณ์' },
  outsourcing: { avg: 10000, label: 'ค่า Outsource' },
  accounting:  { avg: 5000,  label: 'บัญชี / กฎหมาย' },
  other:       { avg: 3000,  label: 'อื่นๆ' },
}

// ── Default software selection ─────────────────────────────
function buildDefaultSoftware(businessType) {
  const ids = SOFTWARE_PACK_DEFAULTS[businessType] || SOFTWARE_PACK_DEFAULTS.architecture
  return ids.map(id => {
    const sw = SOFTWARE_CATALOG.find(s => s.id === id)
    return { id, users: 1, pricePerUserMonth: sw?.pricePerUserMonth ?? 0 }
  })
}

// ── Default project list ───────────────────────────────────
const DEFAULT_PROJECTS = [
  {
    id: 'proj_1',
    name: 'Residential Villa A',
    type: 'residential',
    constructionCost: 15_000_000,
    feePercent: 6.0,
    guidelineFeePercent: 6.0,
    startMonth: 1,
    duration: 4,
    paymentDelay: 0,
    milestonePreset: 'standard4',
    milestones: [
      { name: 'Schematic Design',       pct: 30, month: 1 },
      { name: 'Design Development',      pct: 30, month: 2 },
      { name: 'Construction Documents',  pct: 30, month: 3 },
      { name: 'Project Completion',      pct: 10, month: 4 },
    ],
  },
  {
    id: 'proj_2',
    name: 'Office Fit-out B',
    type: 'office',
    constructionCost: 8_000_000,
    feePercent: 5.5,
    guidelineFeePercent: 5.5,
    startMonth: 3,
    duration: 3,
    paymentDelay: 0,
    milestonePreset: 'frontLoaded',
    milestones: [
      { name: 'Schematic Design',       pct: 40, month: 1 },
      { name: 'Design Development',      pct: 30, month: 2 },
      { name: 'Construction Documents',  pct: 20, month: 3 },
      { name: 'Project Completion',      pct: 10, month: 3 },
    ],
  },
  {
    id: 'proj_3',
    name: 'Condo C',
    type: 'hospital',
    constructionCost: 50_000_000,
    feePercent: 4.75,
    guidelineFeePercent: 4.75,
    startMonth: 5,
    duration: 6,
    paymentDelay: 0,
    milestonePreset: 'standard4',
    milestones: [
      { name: 'Schematic Design',       pct: 30, month: 1 },
      { name: 'Design Development',      pct: 30, month: 2 },
      { name: 'Construction Documents',  pct: 30, month: 4 },
      { name: 'Project Completion',      pct: 10, month: 6 },
    ],
  },
]

// ── Master default inputs ──────────────────────────────────
export const DEFAULT_INPUTS = {
  businessType: 'architecture',

  // Simulation timeline origin (YYYY-MM). Each project's startMonth is a
  // 1-based offset from this. Defaults to the current month.
  simStartDate: currentYM(),

  // Team
  teamPack: 'pack3',
  team: [...TEAM_PACKS.pack3.team.map(r => ({ ...r }))],

  // Projects (replaces projectsPerYear + avgProjectFee)
  projects: DEFAULT_PROJECTS,

  // Software
  selectedSoftware: buildDefaultSoftware('architecture'),

  // Fixed monthly overhead
  rent:        45000,
  utilities:   8000,
  marketing:   3000,
  equipment:   5000,
  outsourcing: 10000,
  accounting:  5000,
  other:       3000,

  // Finance
  taxRate:        20,
  initialCapital: 1_500_000,
  months:         24,

  // Worst Case Scenario
  paymentDelay:         0,    // global default (per-project can override)
  useCustomMinBalance:  false,
  minSafeBalanceCustom: null,
}
