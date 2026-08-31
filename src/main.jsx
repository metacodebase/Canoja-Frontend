import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { reloadWhenDeploymentChanges } from './utils/appVersion.js'

reloadWhenDeploymentChanges()
window.addEventListener('pageshow', (event) => {
  if (event.persisted) reloadWhenDeploymentChanges()
})
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reloadWhenDeploymentChanges()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
