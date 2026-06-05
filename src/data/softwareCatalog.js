// Software catalog — prices are defaults and fully editable by the user.
// Note: "Software prices are editable and may vary by region, license type, and promotion."
// Verify current pricing at each vendor's official website before commercial use.

// Resolve public assets against Vite's base URL so logos work both in local
// dev ('/') and on a GitHub Pages project site ('/cash-flow-simulator/').
const asset = (p) => `${import.meta.env.BASE_URL}${p}`

export const SOFTWARE_CATALOG = [
  // BIM & CAD
  { id: 'revit',       name: 'Revit',              category: 'BIM',         logo: asset('software/revit.png'),        pricePerUserMonth: 6683, description: 'Full BIM authoring tool' },
  { id: 'autocad',     name: 'AutoCAD',             category: 'CAD',         logo: asset('software/autocad.png'),      pricePerUserMonth: 1842, description: '2D/3D CAD drafting' },
  { id: 'navisworks',  name: 'Navisworks',          category: 'BIM',         logo: asset('software/navisworks.png'),   pricePerUserMonth: 2542, description: 'Clash detection & review' },
  // 3D Modeling
  { id: 'sketchup',    name: 'SketchUp Pro',        category: '3D',          logo: asset('software/sketchup.png'),     pricePerUserMonth: 1258, description: '3D concept modeling' },
  { id: 'rhino',       name: 'Rhinoceros 3D',       category: '3D',          logo: asset('software/rhino.png'),        pricePerUserMonth: 1458, description: 'Parametric 3D modeling' },
  // Scripting & Parametric
  { id: 'grasshopper', name: 'Grasshopper',         category: 'Parametric',  logo: asset('software/grasshopper.png'),  pricePerUserMonth: 0,    description: 'Visual scripting for Rhino (free with Rhino)' },
  { id: 'python',      name: 'Python',              category: 'Scripting',   logo: asset('software/python.png'),       pricePerUserMonth: 0,    description: 'Open-source scripting (free)' },
  // Rendering
  { id: 'd5render',    name: 'D5 Render',           category: 'Rendering',   logo: null, emoji: '🎬',            pricePerUserMonth: 1067, description: 'Real-time rendering engine' },
  { id: 'twinmotion',  name: 'Twinmotion',          category: 'Rendering',   logo: null, emoji: '🏞️',           pricePerUserMonth: 1417, description: 'Real-time arch visualization (Epic)' },
  { id: 'lumion',      name: 'Lumion Pro',          category: 'Rendering',   logo: null, emoji: '💡',            pricePerUserMonth: 3142, description: 'Architectural visualization' },
  { id: 'enscape',     name: 'Enscape',             category: 'Rendering',   logo: null, emoji: '🌿',            pricePerUserMonth: 2500, description: 'Real-time VR render plugin' },
  // Productivity & AI
  { id: 'adobe_cc',    name: 'Adobe Creative Cloud',category: 'Graphics',    logo: null, emoji: '🎨',            pricePerUserMonth: 1800, description: 'Photoshop, Illustrator, InDesign' },
  { id: 'ms365',       name: 'Microsoft 365',       category: 'Productivity',logo: null, emoji: '📊',            pricePerUserMonth: 400,  description: 'Office suite' },
  { id: 'claude',      name: 'Claude Pro',          category: 'AI',          logo: asset('software/claude.png'),       pricePerUserMonth: 590,  description: 'AI assistant for design & docs' },
  { id: 'chatgpt',     name: 'ChatGPT Plus',        category: 'AI',          logo: null, emoji: '🤖',            pricePerUserMonth: 700,  description: 'OpenAI GPT assistant (Plus plan)' },
  { id: 'gemini',      name: 'Gemini',              category: 'AI',          logo: null, emoji: '✨',            pricePerUserMonth: 700,  description: 'Google Gemini AI assistant' },
  // Collaboration
  { id: 'bim360',      name: 'BIM 360 / ACC',       category: 'BIM Cloud',   logo: null, emoji: '☁️',            pricePerUserMonth: 3000, description: 'Autodesk cloud collaboration' },
]

// Category display order for the grouped software selector (first-appearance order)
export const SOFTWARE_CATEGORY_ORDER = [...new Set(SOFTWARE_CATALOG.map(s => s.category))]

// Default pack presets (software IDs to pre-select)
export const SOFTWARE_PACK_DEFAULTS = {
  architecture: ['autocad', 'sketchup', 'adobe_cc', 'd5render', 'ms365'],
  interior:     ['sketchup', 'autocad', 'adobe_cc', 'enscape', 'ms365'],
  bim:          ['revit', 'bim360', 'navisworks', 'rhino', 'grasshopper', 'twinmotion', 'adobe_cc'],
}

export function getSoftwareById(id) {
  return SOFTWARE_CATALOG.find(s => s.id === id)
}

export function calcSelectedSoftwareCost(selectedSoftware) {
  return selectedSoftware.reduce((sum, sel) => {
    const catalog = getSoftwareById(sel.id)
    const price = sel.pricePerUserMonth ?? catalog?.pricePerUserMonth ?? 0
    return sum + price * (sel.users || 1)
  }, 0)
}
