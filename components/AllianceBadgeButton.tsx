'use client'

import { useState } from 'react'
import AllianceProfileModal from './AllianceProfileModal'

export default function AllianceBadgeButton({
  allianceId,
  label,
  viewerNationId,
  viewerAllianceId,
  badgeClassName = 'badge badge--positive',
}: {
  allianceId: string
  label: string
  viewerNationId: string | null
  viewerAllianceId: string | null
  badgeClassName?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={badgeClassName}
        style={{ border: 'none', cursor: 'pointer' }}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open ? (
        <AllianceProfileModal
          allianceId={allianceId}
          viewerNationId={viewerNationId}
          viewerAllianceId={viewerAllianceId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}