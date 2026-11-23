import { wellbeingMetrics } from '../domain/wellbeing'
import type { Wellbeing } from '../domain/wellbeing'

export async function fetchWellbeing(signal: AbortSignal): Promise<Wellbeing> {
  const response = await fetch('/api/dashboard/wellbeing', { signal })
  if (!response.ok) throw new Error('Wellbeing unavailable')
  const data = await response.json()
  if (!data || !wellbeingMetrics.every(({ id }) => typeof data[id] === 'number' && Number.isFinite(data[id]) && data[id] >= 0 && data[id] <= 100)) throw new Error('Invalid wellbeing response')
  return data
}
