import { useEffect, useRef, useState } from 'react'
import { fetchDailyOverview, updateDailyGoal } from '../../adapters/dailyOverview'
import type { DailyOverview } from '../../domain/dailyOverview'
import { summarizeGoals } from '../../domain/dailyOverview'

export function useDailyOverview() {
  const [overview, setOverview] = useState<DailyOverview | null>(null)
  const [error, setError] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const saveController = useRef<AbortController | null>(null)
  useEffect(() => () => saveController.current?.abort(), [])
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 10000)
    fetchDailyOverview(controller.signal).then((value) => {
      if (active) setOverview(value)
    }).catch(() => { if (active) setError(true) }).finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [])
  async function onToggle(id: string, achieved: boolean) {
    if (!overview || saveController.current) return
    const previous = overview
    const controller = new AbortController()
    saveController.current = controller
    setPendingId(id)
    setSaveError(false)
    setAnnouncement('')
    setOverview(summarizeGoals(overview.goals.map((goal) => goal.id === id ? { ...goal, achieved } : goal)))
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const updated = await updateDailyGoal(id, achieved, controller.signal)
      if (!controller.signal.aborted) {
        setOverview(updated)
        const title = updated.goals.find((goal) => goal.id === id)?.title ?? 'Goal'
        setAnnouncement(achieved ? `${title} completed. Nice progress!` : `${title} marked as not done.`)
      }
    } catch {
      setOverview(previous)
      setSaveError(true)
    } finally {
      clearTimeout(timeout)
      saveController.current = null
      setPendingId(null)
    }
  }
  return { overview, error, pendingId, saveError, announcement, onToggle }
}
