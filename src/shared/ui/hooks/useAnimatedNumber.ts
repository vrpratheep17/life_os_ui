import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(value: number | null, duration = 850) {
  const [display, setDisplay] = useState(0)
  const current = useRef(0)
  useEffect(() => {
    let frame = 0
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const target = value ?? 0
    const settle = () => { cancelAnimationFrame(frame); current.current = target; setDisplay(Math.round(target)) }
    if (preference.matches || value === null) { settle(); return }
    const from = current.current
    const started = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now-started)/duration)
      current.current = from+(target-from)*(1-Math.pow(1-progress,3))
      setDisplay(Math.round(current.current))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    const onPreferenceChange = () => { if (preference.matches) settle() }
    preference.addEventListener('change', onPreferenceChange)
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); preference.removeEventListener('change', onPreferenceChange) }
  }, [value, duration])
  return display
}
