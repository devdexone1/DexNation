'use client'

import { useEffect, useRef, useState } from 'react'

export default function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = 'Click again to confirm',
  className = 'btn btn--primary',
  disabled = false,
}: {
  onConfirm: () => void
  label: string
  confirmLabel?: string
  className?: string
  disabled?: boolean
}) {
  const [armed, setArmed] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleClick() {
    if (!armed) {
      setArmed(true)
      timeoutRef.current = setTimeout(() => setArmed(false), 3000)
      return
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setArmed(false)
    onConfirm()
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={disabled}
      style={armed ? { background: 'var(--color-negative)', borderColor: 'var(--color-negative)' } : undefined}
    >
      {armed ? confirmLabel : label}
    </button>
  )
}