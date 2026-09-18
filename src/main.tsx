import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { captureInstallPrompt } from './lib/install'
import { EasterProvider } from './store/easter.tsx'
import { PlantsProvider } from './store/plants.tsx'
import { ThemeProvider } from './store/theme.tsx'
import './index.css'

captureInstallPrompt()

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <EasterProvider>
          <PlantsProvider>
            <App />
          </PlantsProvider>
        </EasterProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}
