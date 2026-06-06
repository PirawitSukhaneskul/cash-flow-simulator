// Month-level date helpers. The cash flow model is monthly, so projects pick a
// start month (YYYY-MM). startMonth in the engine is a 1-based offset from the
// simulation start date.

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function currentYM() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// "2026-06" -> { y: 2026, m: 5 }  (m is 0-based)
export function parseYM(ym) {
  const [y, m] = String(ym || currentYM()).split('-').map(Number)
  return { y: y || new Date().getFullYear(), m: (m || 1) - 1 }
}

export function fmtYM({ y, m }) {
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

export function addMonths(ym, n) {
  const { y, m } = typeof ym === 'string' ? parseYM(ym) : ym
  const t = y * 12 + m + n
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 }
}

// whole months from a -> b (both YYYY-MM)
export function monthsBetween(aYM, bYM) {
  const a = parseYM(aYM), b = parseYM(bYM)
  return (b.y * 12 + b.m) - (a.y * 12 + a.m)
}

// "Jun 2026" — accepts either "YYYY-MM" or { y, m }
export function ymLabel(ym, withYear = true) {
  const { y, m } = (typeof ym === 'string') ? parseYM(ym) : ym
  return withYear ? `${MONTH_NAMES[m]} ${y}` : MONTH_NAMES[m]
}
