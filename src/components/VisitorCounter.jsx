import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { GAS_URL } from '../config'

// Small page-visit counter shown at the very bottom of the app.
// Increments once per browser session (via sessionStorage), reads the running
// total from the Google Apps Script backend. Fails silently if the count can't
// be read (e.g. CORS / offline) so it never breaks the page.
export default function VisitorCounter() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    let cancelled = false
    const counted = sessionStorage.getItem('arch_sim_counted') === '1'
    const action = counted ? 'count' : 'visit'

    fetch(`${GAS_URL}?action=${action}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (typeof d?.count === 'number') {
          setCount(d.count)
          if (!counted) sessionStorage.setItem('arch_sim_counted', '1')
        }
      })
      .catch(() => { /* ignore — counter is non-critical */ })

    return () => { cancelled = true }
  }, [])

  if (count == null) return null

  return (
    <div className="visitor-counter">
      <Eye size={12} />
      <span>{count.toLocaleString('en-US')} visits</span>
    </div>
  )
}
