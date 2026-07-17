import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Bundled variable fonts (no external CDN).
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/figtree'
import '@fontsource-variable/spline-sans-mono'

import './index.css'
import App from './App'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
