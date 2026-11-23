import { describeWeather } from '../domain/weather'
import type { CurrentWeather } from '../domain/weather'

// The development response is supplied by MSW, without external weather requests.
export async function fetchCurrentWeather(signal: AbortSignal): Promise<CurrentWeather> {
  const response = await fetch('/api/weather', { signal })
  if (!response.ok) throw new Error('Weather service unavailable')
  const { current } = await response.json()
  if (typeof current?.temperature_2m !== 'number' || typeof current?.weather_code !== 'number') throw new Error('Invalid weather response')
  return { temperatureC: current.temperature_2m, ...describeWeather(current.weather_code, current.is_day === 1) }
}
