'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCash, formatNumber } from '@/lib/format'
import styles from './AllianceProfileModal.module.css'

interface AllianceDetail {
  id: string
  name: string
  tag: string
  treasury_cash: number
  max_members: number
  created_at: string
  leader_nation_id: string
  leaderName: string
  members: { nation_id: string; name: string; role: string }[]
  treaties: { id: string; partnerName: string }[]
  totalCash: number
  totalPopulation: number
  totalMilitary: number
}

export default function AllianceProfileModal({
  allianceId,
  viewerNationId,
  viewerAllianceId,
  onClose,
}: {
  allianceId: string
  viewerNationId: string | null
  viewerAllianceId: string | null
  onClose: () => void
}) {
  const router = useRouter()
  const [data, setData] = useState<AllianceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      const supabase = createClient()

      const { data: alliance, error: allianceError } = await supabase
        .from('alliances')
        .select('*')
        .eq('id', allianceId)
        .maybeSingle()

      if (allianceError || !alliance) {
        if (!cancelled) {
          setError('Alliance not found.')
          setLoading(false)
        }
        return
      }

      const [leaderRes, membersRes, treatiesRes] = await Promise.all([
        supabase.from('nations').select('name').eq('id', alliance.leader_nation_id).maybeSingle(),
        supabase.from('alliance_members').select('nation_id, role').eq('alliance_id', allianceId),
        supabase
          .from('alliance_treaties')
          .select('*')
          .or(`alliance_a_id.eq.${allianceId},alliance_b_id.eq.${allianceId}`)
          .eq('status', 'ACTIVE'),
      ])

      const memberRows = membersRes.data ?? []
      const memberIds = memberRows.map((m) => m.nation_id)

      let members: AllianceDetail['members'] = []
      let totalCash = 0
      let totalPopulation = 0
      let totalMilitary = 0

      if (memberIds.length > 0) {
        const { data: memberNations } = await supabase
          .from('nations')
          .select('id, name, cash_balance, population')
          .in('id', memberIds)

        const nameById = new Map((memberNations ?? []).map((n) => [n.id, n.name]))
        totalCash = (memberNations ?? []).reduce((sum, n) => sum + n.cash_balance, 0)
        totalPopulation = (memberNations ?? []).reduce((sum, n) => sum + n.population, 0)

        members = memberRows.map((m) => ({
          nation_id: m.nation_id,
          name: nameById.get(m.nation_id) ?? 'Unknown',
          role: m.role,
        }))

        const { data: militaryRows } = await supabase
          .from('nation_military')
          .select('amount')
          .in('nation_id', memberIds)
        totalMilitary = (militaryRows ?? []).reduce((sum, u) => sum + u.amount, 0)
      }

      const treatyRows = treatiesRes.data ?? []
      let treaties: AllianceDetail['treaties'] = []
      if (treatyRows.length > 0) {
        const partnerIds = treatyRows.map((t) => (t.alliance_a_id === allianceId ? t.alliance_b_id : t.alliance_a_id))
        const { data: partnerAlliances } = await supabase.from('alliances').select('id, name, tag').in('id', partnerIds)
        const partnerById = new Map((partnerAlliances ?? []).map((a) => [a.id, `${a.name} [${a.tag}]`]))
        treaties = treatyRows.map((t) => ({
          id: t.id,
          partnerName: partnerById.get(t.alliance_a_id === allianceId ? t.alliance_b_id : t.alliance_a_id) ?? 'Unknown',
        }))
      }

      if (!cancelled) {
        setData({
          id: alliance.id,
          name: alliance.name,
          tag: alliance.tag,
          treasury_cash: alliance.treasury_cash,
          max_members: alliance.max_members,
          created_at: alliance.created_at,
          leader_nation_id: alliance.leader_nation_id,
          leaderName: leaderRes.data?.name ?? 'Unknown',
          members,
          treaties,
          totalCash,
          totalPopulation,
          totalMilitary,
        })
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [allianceId])

  function handleJoin() {
    if (!viewerNationId) return
    setActionError('')
    startTransition(async () => {
      const { joinAllianceAction } = await import('@/app/dashboard/politics/actions')
      const result = await joinAllianceAction(viewerNationId, allianceId)
      if (result.error) {
        setActionError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  function handleLeave() {
    if (!viewerNationId) return
    setActionError('')
    startTransition(async () => {
      const { leaveAllianceAction } = await import('@/app/dashboard/politics/actions')
      const result = await leaveAllianceAction(viewerNationId)
      if (result.error) {
        setActionError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  const isOwnAlliance = viewerAllianceId === allianceId
  const canJoin = viewerNationId && !viewerAllianceId

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Alliance profile"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {loading ? (
          <div className={styles.loading}>Loading alliance…</div>
        ) : error || !data ? (
          <div className={styles.loading}>{error || 'Something went wrong.'}</div>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.name}>
                {data.name}
                <span className={styles.tag}>[{data.tag}]</span>
              </div>
              <div className={styles.leaderLine}>
                Led by <strong>{data.leaderName}</strong> · Founded {new Date(data.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Treasury</div>
                <div className={`${styles.statValue} mono`}>{formatCash(data.treasury_cash)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Members</div>
                <div className={`${styles.statValue} mono`}>{data.members.length}/{data.max_members}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Combined Cash</div>
                <div className={`${styles.statValue} mono`}>{formatCash(data.totalCash)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Combined Population</div>
                <div className={`${styles.statValue} mono`}>{formatNumber(data.totalPopulation)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Combined Military</div>
                <div className={`${styles.statValue} mono`}>{formatNumber(data.totalMilitary)}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Active Treaties</div>
                <div className={`${styles.statValue} mono`}>{data.treaties.length}</div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Members</div>
              {data.members.length === 0 ? (
                <div className={styles.emptyState}>No members.</div>
              ) : (
                data.members.map((m) => (
                  <div className={styles.memberRow} key={m.nation_id}>
                    <Link href={`/dashboard/nations/${m.nation_id}`} className={styles.memberLink} onClick={onClose}>
                      {m.name}
                    </Link>
                    <span className={`badge ${m.role === 'LEADER' ? 'badge--positive' : 'badge--neutral'}`}>
                      {m.role}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>FTA Treaties</div>
              {data.treaties.length === 0 ? (
                <div className={styles.emptyState}>No active treaties.</div>
              ) : (
                data.treaties.map((t) => (
                  <div className={styles.memberRow} key={t.id}>
                    <span>{t.partnerName}</span>
                    <span className="badge badge--accent">Active</span>
                  </div>
                ))
              )}
            </div>

            {viewerNationId ? (
              <div className={styles.actionRow}>
                {actionError ? <div className={styles.error}>{actionError}</div> : null}
                {isOwnAlliance ? (
                  <button type="button" className="btn btn--outline" onClick={handleLeave} disabled={isPending}>
                    {isPending ? 'Leaving…' : 'Leave Alliance'}
                  </button>
                ) : canJoin ? (
                  <button type="button" className="btn btn--primary" onClick={handleJoin} disabled={isPending}>
                    {isPending ? 'Joining…' : 'Join Alliance'}
                  </button>
                ) : (
                  <div className={styles.emptyState}>
                    You&apos;re already in a different alliance — leave it first to join this one.
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}