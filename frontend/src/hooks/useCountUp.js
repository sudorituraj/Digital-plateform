import { useEffect, useState } from 'react'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Animates a number from 0 to `target` (≈0.6 s). Jumps straight there when motion is reduced. */
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target == null) return
    if (reducedMotion()) {
      const id = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(id)
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - (1 - p) ** 3))) // ease-out
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}
