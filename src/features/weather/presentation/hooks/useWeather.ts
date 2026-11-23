import { useEffect, useState } from 'react'
import { fetchCurrentWeather } from '../../adapters/weatherApi'
import type { CurrentWeather } from '../../domain/weather'

export function useWeather() {
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setStatus('loading')
    const timeout = setTimeout(() => controller.abort(), 12000)
    fetchCurrentWeather(controller.signal).then((reading) => {
      if (active) { setWeather(reading); setStatus('ready') }
    }).catch(() => { if (active) { setWeather(null); setStatus('error') } }).finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [refresh])
  useEffect(() => {
    const interval = setInterval(() => setRefresh((value) => value+1), 15*60*1000)
    return () => clearInterval(interval)
  }, [])
  return { weather, status, retry: () => setRefresh((value) => value+1) }
}
