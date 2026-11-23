export type DailyGoal = { id: string; title: string; description: string; achieved: boolean }
export type DailyOverview = {
  goals: DailyGoal[]
  tasks: { completed: number; total: number }
}

export function summarizeGoals(goals: DailyGoal[]): DailyOverview {
  return { goals, tasks: { completed: goals.filter((goal) => goal.achieved).length, total: goals.length } }
}
