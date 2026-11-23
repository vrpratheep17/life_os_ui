import type { CalendarAgenda, CalendarEvent } from '../domain/calendarEvents'

function isEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Record<string, unknown>
  return ['id', 'title', 'time', 'duration', 'location'].every(key => typeof event[key] === 'string') &&
    ['work', 'personal', 'wellness'].includes(String(event.category))
}
export async function getCalendarAgenda(signal: AbortSignal): Promise<CalendarAgenda> {
  const response = await fetch('/api/dashboard/calendar-events', { signal })
  if (!response.ok) throw new Error('Could not load agenda')
  const data = await response.json()
  if (!Array.isArray(data.today) || !Array.isArray(data.tomorrow) || !data.today.every(isEvent) || !data.tomorrow.every(isEvent)) throw new Error('Invalid agenda')
  return data
}
