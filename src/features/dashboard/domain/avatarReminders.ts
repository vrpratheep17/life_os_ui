import type { Wellbeing } from './wellbeing'

export type AvatarReminder = { id: string; text: string; acknowledgement: string; action: string }

export function getAvatarReminders(wellbeing: Wellbeing): AvatarReminder[] {
  const reminders: AvatarReminder[] = []
  if (wellbeing.hydration < 80) reminders.push({
    id: 'water', text: `Hey, your hydration goal is at ${Math.round(wellbeing.hydration)}%. How about a glass of water?`,
    action: "I'll grab some water", acknowledgement: 'Sounds good! A little water break is a nice moment to pause.',
  })
  if (wellbeing.upskilled < 75) reminders.push({
    id: 'learn', text: 'Got ten minutes? Pick a page to read or something new to learn. Small steps count.',
    action: "I'll make time", acknowledgement: 'One small lesson at a time. You have got this!',
  })
  if (wellbeing.focus < 75) reminders.push({
    id: 'focus', text: 'Let’s make a little room for focus. Choose one task and give it your attention.',
    action: 'One task at a time', acknowledgement: 'Great choice. Start small, and take it at your own pace.',
  })
  reminders.push({
    id: 'break', text: 'How about a short stretch? Stand up, relax your shoulders, and take a moment for yourself.',
    action: "I'll take a break", acknowledgement: 'Enjoy your break. Your goals will be here when you return.',
  })
  return reminders
}
