export const wellbeingMetrics = [
  { id: 'sleep', label: 'Sleep quality', color: '#91baff', side: 'left' },
  { id: 'hydration', label: 'Hydrated', color: '#68ddff', side: 'left' },
  { id: 'upskilled', label: 'Upskilled', color: '#baacff', side: 'left' },
  { id: 'energy', label: 'Energy level', color: '#f0cc83', side: 'right' },
  { id: 'focus', label: 'Focus', color: '#79c7ff', side: 'right' },
  { id: 'recovery', label: 'Recovery', color: '#89dfc4', side: 'right' },
] as const

export type WellbeingMetricId = typeof wellbeingMetrics[number]['id']
export type Wellbeing = Record<WellbeingMetricId, number>
