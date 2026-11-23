import { useEffect, useState } from 'react'
import { Button } from '@heroui/react'
import { getInstallPrompt, takeInstallPrompt } from '../../adapters/installPrompt'
import styles from './InstallApp.module.css'

function standalone() {
  return window.matchMedia('(display-mode: standalone)').matches || !!(navigator as Navigator & { standalone?: boolean }).standalone
}
export default function InstallApp() {
  const [installed, setInstalled] = useState(standalone)
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(() => !!getInstallPrompt())
  const [help, setHelp] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const ready = () => setReady(true)
    const media = window.matchMedia('(display-mode: standalone)')
    const update = () => setInstalled(standalone())
    const installed = () => setInstalled(true)
    window.addEventListener('lifeos-install-ready', ready)
    window.addEventListener('appinstalled', installed)
    media.addEventListener('change', update)
    return () => { window.removeEventListener('lifeos-install-ready', ready); window.removeEventListener('appinstalled', installed); media.removeEventListener('change', update) }
  }, [])
  async function install() {
    const prompt = takeInstallPrompt()
    if (!prompt) { setHelp(value => !value); return }
    setBusy(true)
    try {
      await prompt.prompt()
      const choice = await prompt.userChoice
      if (choice.outcome === 'accepted') setDismissed(true)
    } catch { setHelp(true) }
    finally { setReady(false); setBusy(false) }
  }
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (installed || dismissed) return null
  return <aside className={styles.banner} aria-label="Install Life OS">
    <div className={styles.row}><img src="/icons/app-192.png" alt="" width="38" height="38"/><div className={styles.copy}><strong>Life OS, one tap away.</strong><span>A little space on your home screen.</span></div><Button className={styles.close} variant="ghost" isIconOnly aria-label="Dismiss install suggestion" onPress={() => setDismissed(true)}>&times;</Button></div>
    <Button className={styles.install} variant="primary" isDisabled={busy} onPress={install}>{busy ? 'Opening...' : ready ? 'Install app' : 'How to install'}</Button>
    {help && <p className={styles.help} role="status">{!window.isSecureContext ? 'Open Life OS using an HTTPS link to install on your phone or computer. Installation is also available from localhost on this computer.' : ios ? 'Open in Safari, tap Share, then Add to Home Screen and Add.' : 'In Chrome or Edge, open the browser menu and choose Install Life OS or Install this page as an app. On Safari for Mac, choose File, then Add to Dock. If the option is missing, try a supported browser or revisit after loading the app.'}</p>}
  </aside>
}
