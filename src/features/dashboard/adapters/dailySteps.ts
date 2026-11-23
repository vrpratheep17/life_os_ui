export type DailySteps = { count: number; target: number }

export async function fetchDailySteps(signal: AbortSignal): Promise<DailySteps> {
  const response = await fetch('/api/dashboard/daily-steps', { signal })
  if (!response.ok) throw new Error('Steps unavailable')
  const data = await response.json()
  if (!Number.isInteger(data.count) || data.count < 0 || !Number.isInteger(data.target) || data.target <= 0) throw new Error('Invalid step count')
  return data
}
