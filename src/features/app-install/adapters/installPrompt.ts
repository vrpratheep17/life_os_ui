export interface InstallEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
let pending: InstallEvent | null = null
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  pending = event as InstallEvent
  window.dispatchEvent(new Event('lifeos-install-ready'))
})
window.addEventListener('appinstalled', () => { pending = null })
export const getInstallPrompt = () => pending
export function takeInstallPrompt() { const event = pending; pending = null; return event }

export function registerAppWorker() {
  // MSW owns the root worker in mock mode; two workers cannot share its scope.
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_MOCKS !== 'true' && 'serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(error => console.warn('App worker registration failed', error)) })
  }
}
