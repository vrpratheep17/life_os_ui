import { delay, http, HttpResponse } from 'msw'
import { dailyGoalsFixture, dailyStepsFixture, wellbeingFixture } from './fixtures'
import { summarizeGoals } from '../domain/dailyOverview'
import { calendarAgendaFixture } from './calendarEvents'

let goals = structuredClone(dailyGoalsFixture)

export const dashboardHandlers = [
  http.get('/api/dashboard/calendar-events', async () => {
    await delay(250)
    return HttpResponse.json(calendarAgendaFixture)
  }),
  http.get('/api/dashboard/wellbeing', async () => {
    await delay(250)
    return HttpResponse.json(wellbeingFixture)
  }),
  http.get('/api/dashboard/daily-steps', async () => {
    await delay(250)
    return HttpResponse.json(dailyStepsFixture)
  }),
  http.get('/api/dashboard/daily-score', async () => {
    await delay(250)
    return HttpResponse.json({ score: goals.length ? Math.round(goals.filter((goal) => goal.achieved).length/goals.length*100) : 0 })
  }),
  http.get('/api/dashboard/daily-overview', async () => {
    await delay(250)
    return HttpResponse.json(summarizeGoals(goals))
  }),
  http.patch('/api/dashboard/goals/:id', async ({ params, request }) => {
    const body = await request.json() as { achieved?: unknown }
    if (typeof body?.achieved !== 'boolean') return HttpResponse.json({ error: 'A boolean achieved value is required' }, { status: 400 })
    if (!goals.some((goal) => goal.id === params.id)) return HttpResponse.json({ error: 'Goal not found' }, { status: 404 })
    await delay(200)
    goals = goals.map((goal) => goal.id === params.id ? { ...goal, achieved: body.achieved as boolean } : goal)
    return HttpResponse.json(summarizeGoals(goals))
  }),
]
