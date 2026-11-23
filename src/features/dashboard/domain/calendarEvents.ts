export type CalendarEvent = {
  id: string
  title: string
  time: string
  duration: string
  location: string
  category: 'work' | 'personal' | 'wellness'
}
export type CalendarAgenda = { today: CalendarEvent[]; tomorrow: CalendarEvent[] }
