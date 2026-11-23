import type { DailyOverview } from '../domain/dailyOverview'
import { summarizeGoals } from '../domain/dailyOverview'

async function readOverview(response: Response): Promise<DailyOverview> {
  if (!response.ok) throw new Error('Daily overview unavailable')
  const data = await response.json()
  if (!Array.isArray(data.goals) || !data.goals.every((goal: Record<string, unknown>) => goal && typeof goal.id === 'string' && typeof goal.title === 'string' && typeof goal.description === 'string' && typeof goal.achieved === 'boolean')) throw new Error('Invalid daily goals')
  return summarizeGoals(data.goals)
}

export async function fetchDailyOverview(signal: AbortSignal): Promise<DailyOverview> {
  const response = await fetch('/api/dashboard/daily-overview', { signal })
  return readOverview(response)
}

export async function updateDailyGoal(id: string, achieved: boolean, signal: AbortSignal): Promise<DailyOverview> {
  return readOverview(await fetch(`/api/dashboard/goals/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ achieved }), signal,
  }))
}
