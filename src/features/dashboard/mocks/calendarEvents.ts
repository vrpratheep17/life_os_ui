import type { CalendarAgenda } from '../domain/calendarEvents'

export const calendarAgendaFixture: CalendarAgenda = {
  today: [
    { id: 'standup', title: 'Team standup', time: '10:30', duration: '30 min', location: 'Google Meet', category: 'work' },
    { id: 'lunch', title: 'Lunch with Alex', time: '13:00', duration: '1 hour', location: 'The Corner Cafe', category: 'personal' },
    { id: 'gym', title: 'Strength & reset', time: '18:00', duration: '45 min', location: 'Gym session', category: 'wellness' },
  ],
  tomorrow: [
    { id: 'focus', title: 'Deep work', time: '09:00', duration: '90 min', location: 'Focus time', category: 'work' },
    { id: 'walk', title: 'A little fresh air', time: '12:30', duration: '20 min', location: 'Walk outside', category: 'wellness' },
    { id: 'learn', title: 'Make time to learn', time: '19:00', duration: '30 min', location: 'Personal learning', category: 'personal' },
  ],
}
