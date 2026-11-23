import { useEffect, useState } from 'react'
import { fetchDailySteps } from '../../adapters/dailySteps'
import type { DailySteps } from '../../adapters/dailySteps'

export function useDailySteps() {
  const [steps, setSteps] = useState<DailySteps | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 10000)
    fetchDailySteps(controller.signal).then((data) => { if (active) setSteps(data) }).catch(() => { if (active) setError(true) }).finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [])
  return { steps, error }
}
