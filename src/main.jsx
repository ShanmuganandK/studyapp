import React from 'react'
import ReactDOM from 'react-dom/client'
// Self-hosted fonts (Fontsource — bundled woff2, font-display: swap; no CDN, low-end-Android safe):
// Nunito = body/parent (friendly rounded), Baloo 2 = kid-facing display (chunky, playful numbers).
import '@fontsource-variable/nunito'
import '@fontsource-variable/baloo-2'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
