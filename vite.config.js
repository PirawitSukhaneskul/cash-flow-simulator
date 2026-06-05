import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// On GitHub Pages this is served from a project subpath
// (https://<user>.github.io/cash-flow-simulator/). Locally it stays at '/'.
const REPO_BASE = '/cash-flow-simulator/'

// Copy index.html -> 404.html after build so client-side routes
// (/admin, /compare) survive a hard refresh / deep link on GitHub Pages.
function spaFallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      try {
        const out = resolve(__dirname, 'dist')
        copyFileSync(resolve(out, 'index.html'), resolve(out, '404.html'))
      } catch (e) {
        console.warn('[spa-404-fallback] could not create 404.html:', e.message)
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), spaFallback()],
  base: command === 'build' ? REPO_BASE : '/',
  server: {
    port: parseInt(process.env.PORT || '5180'),
    strictPort: true,
  },
}))
