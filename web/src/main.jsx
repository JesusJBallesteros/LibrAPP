import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registering the service worker is what lets the browser offer to install
// LibrAPP, and what keeps it working with no network. It is deliberately not
// awaited: the app must run whether or not this succeeds, and it fails on
// plain http, which is exactly how the dev server is served.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      // Resolved against the page, not against this module: the module is a
      // hashed file under assets/, and sw.js sits beside index.html.
      .register(new URL('sw.js', document.baseURI), { scope: './' })
      .catch(() => {})
  })
}
