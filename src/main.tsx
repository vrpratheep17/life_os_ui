import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { enableMocking } from './app/mocks/enableMocking'
import './app/styles/globals.css'
import { registerAppWorker } from './features/app-install'

registerAppWorker()

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode><App /></StrictMode>,
  )
}).catch((error) => {
  console.error('Application startup failed:', error)
  document.getElementById('root')!.textContent = 'We could not start the app. Please refresh.'
})
