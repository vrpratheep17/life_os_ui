import { useEffect, useState } from 'react'
import { fetchWellbeing } from '../../adapters/wellbeing'
import type { Wellbeing } from '../../domain/wellbeing'

export function useWellbeing() {
  const [wellbeing, setWellbeing] = useState<Wellbeing | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 10000)
    fetchWellbeing(controller.signal).then((data) => { if (active) setWellbeing(data) }).catch(() => { if (active) setError(true) }).finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [])
  return { wellbeing, error }
}
