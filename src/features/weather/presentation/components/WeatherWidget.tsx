import { Button } from '@heroui/react'
import { useWeather } from '../hooks/useWeather'
import styles from './WeatherWidget.module.css'

export default function WeatherWidget() {
  const { weather, status, retry } = useWeather()
  return <aside className={styles.widget} aria-label="Current London weather" data-robot-obstacle>
    <div className={styles.skyScene} aria-hidden="true"><span className={styles.sun}/><div className={styles.cloudLayer}><span/><span/><span/></div><span className={styles.horizon}/></div>
    <div className={styles.reading} aria-live="polite">
      <div><span className={styles.location}>London</span><p className={styles.condition}>{status === 'loading' ? 'Loading weather…' : status === 'error' ? 'Weather unavailable' : weather?.condition}</p></div>
      <strong className={styles.temperature}>{weather ? `${Math.round(weather.temperatureC)}°C` : '—'}</strong>
    </div>
    <div className={styles.options}>
      {status === 'error' && <Button variant="ghost" className={styles.retry} onPress={retry}>Retry</Button>}
      <span className={styles.source}>Demo weather</span>
    </div>
  </aside>
}
