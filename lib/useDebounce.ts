'use client'

import { useEffect, useState } from 'react'

// Delays updating the returned value until the input has stopped changing
// for `delayMs` — prevents firing a database query on every keystroke.
// Default 2000ms per project convention (reduces load, matches patterns
// used in NationStates/P&W-style games for name search).
export function useDebounce<T>(value: T, delayMs = 1000): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}