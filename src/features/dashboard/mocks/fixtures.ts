import type { DailyGoal } from '../domain/dailyOverview'

export const dailyStepsFixture = { count: 5500, target: 7000 }
export const wellbeingFixture = { sleep: 82, hydration: 68, upskilled: 45, energy: 76, focus: 64, recovery: 88 }

export const dailyGoalsFixture: DailyGoal[] = [
  { id: 'steps', title: 'Walk 7,000 steps', description: 'Move your body throughout the day.', achieved: true },
  { id: 'wake', title: 'Wake up at 5:00 AM', description: 'Give yourself a calm, intentional start.', achieved: true },
  { id: 'read', title: 'Read for 20 minutes', description: 'Make a little time to learn something new.', achieved: true },
  { id: 'workout', title: 'Exercise for 30 minutes', description: 'Build strength and look after your health.', achieved: false },
  { id: 'meditate', title: 'Meditate for 10 minutes', description: 'Pause, breathe, and clear your mind.', achieved: false },
  { id: 'journal', title: 'Write a gratitude journal', description: 'Reflect on three good things from today.', achieved: false },
]
