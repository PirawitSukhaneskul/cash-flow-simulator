// ASA-style Architectural Professional Fee Guideline
// Reference: https://asa.or.th/ | https://akasarchitects.com/architects-fees/
// IMPORTANT: This is a reference guideline only. Actual fees depend on scope,
// complexity, deliverables, experience, market position, and agreement between parties.

export const ASA_PROJECT_TYPES = [
  {
    id: 'residential',
    label: 'House / Residential',
    emoji: '🏠',
    description: 'Houses, villas, condominiums, apartments',
  },
  {
    id: 'office',
    label: 'Office / Hotel / School',
    emoji: '🏢',
    description: 'Offices, department stores, hotels, schools, factories',
  },
  {
    id: 'hospital',
    label: 'Hospital / Theater / University',
    emoji: '🏥',
    description: 'Hospitals, performing arts, educational institutions',
  },
  {
    id: 'interior',
    label: 'Interior / Museum',
    emoji: '🛋️',
    description: 'Interior fit-out, museum, specialty furniture projects',
  },
  {
    id: 'monument',
    label: 'Monument / Special',
    emoji: '🏛️',
    description: 'Monuments, memorials, unique special structures',
  },
  {
    id: 'warehouse',
    label: 'Warehouse / Parking',
    emoji: '🏭',
    description: 'Warehouses, parking structures, markets',
  },
]

// Construction cost brackets (THB)
export const ASA_COST_BRACKETS = [
  { label: '<฿10M',    min: 0,           max: 10_000_000  },
  { label: '฿10–30M',  min: 10_000_000,  max: 30_000_000  },
  { label: '฿30–50M',  min: 30_000_000,  max: 50_000_000  },
  { label: '฿50–100M', min: 50_000_000,  max: 100_000_000 },
  { label: '฿100–200M',min: 100_000_000, max: 200_000_000 },
  { label: '฿200–500M',min: 200_000_000, max: 500_000_001 },
]

// Fee % matrix: rows = project type, cols = cost bracket index 0–5
export const ASA_FEE_MATRIX = {
  interior:    [10.00, 7.75, 6.50, 6.00, 5.25, 4.50],
  monument:    [8.50,  6.75, 5.75, 5.50, 4.75, 4.25],
  residential: [7.50,  6.00, 5.25, 5.00, 4.50, 4.00],
  hospital:    [6.50,  5.50, 4.75, 4.50, 4.25, 3.75],
  office:      [5.50,  4.75, 4.50, 4.25, 4.00, 3.50],
  warehouse:   [4.50,  4.25, 4.00, 3.75, 3.50, 3.25],
}

export function getASACostBracketIdx(constructionCost) {
  for (let i = 0; i < ASA_COST_BRACKETS.length; i++) {
    const b = ASA_COST_BRACKETS[i]
    if (constructionCost >= b.min && constructionCost < b.max) return i
  }
  return ASA_COST_BRACKETS.length - 1
}

export function getASAGuidelineFee(projectType, constructionCost) {
  const idx    = getASACostBracketIdx(constructionCost)
  const matrix = ASA_FEE_MATRIX[projectType]
  return matrix ? matrix[idx] : 5.0
}

// Quick-start size presets
export const PROJECT_SIZE_PRESETS = [
  { id: 'small',      label: 'Small',      emoji: '🏠', subtitle: '< ฿10M',        defaultCost: 5_000_000,   defaultType: 'residential', duration: 3 },
  { id: 'medium',     label: 'Medium',     emoji: '🏢', subtitle: '฿10M – 50M',    defaultCost: 25_000_000,  defaultType: 'office',      duration: 5 },
  { id: 'large',      label: 'Large',      emoji: '🏗️', subtitle: '฿50M – 200M',   defaultCost: 100_000_000, defaultType: 'office',      duration: 8 },
  { id: 'mega',       label: 'Mega',       emoji: '🌆', subtitle: '฿200M+',        defaultCost: 300_000_000, defaultType: 'hospital',    duration: 12 },
  { id: 'renovation', label: 'Renovation', emoji: '🔨', subtitle: 'Interior / Fit', defaultCost: 3_000_000,   defaultType: 'interior',    duration: 2 },
]
