'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDebounce } from '@/lib/useDebounce'
import { formatCash, formatNumber } from '@/lib/format'
import ConfirmButton from '@/components/ConfirmButton'
import {
  setNationStatAction,
  adjustNationStatAction,
  updateNationNameAction,
  updateLeaderNameAction,
} from './actions'
import styles from './admin.module.css'

interface NationResult {
  id: string
  name: string
  leader_name: string | null
  country_number: number
  cash_balance: number
  population: number
  daily_gdp: number
  research_points: number
}

const EDITABLE_FIELDS = [
  { key: 'cash_balance', label: 'Cash Balance' },
  { key: 'population', label: 'Population' },
  { key: 'daily_gdp', label: 'Daily GDP' },
  { key: 'research_points', label: 'Research Points' },
] as const

type FieldKey = (typeof EDITABLE_FIELDS)[number]['key']

export default function NationEditorPanel() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 1000)
  const [results, setResults] = useState<NationResult[]>([])
  const [selected, setSelected] = useState<NationResult | null>(null)

  // Profile fields
  const [nationName, setNationName] = useState('')
  const [leaderName, setLeaderName] = useState('')
  const [profileStatus, setProfileStatus] = useState('')

  // Stat editor
  const [field, setField] = useState<FieldKey>('cash_balance')
  const [mode, setMode] = useState<'set' | 'adjust'>('set')
  const [setValue, setSetValue] = useState('')
  const [deltaValue, setDeltaValue] = useState('')
  const [statStatus, setStatStatus] = useState('')

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    const trimmed = debouncedQuery.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }
    async function search() {
      const supabase = createClient()
      const { data } = await supabase
        .from('nations')
        .select('id, name, leader_name, country_number, cash_balance, population, daily_gdp, research_points')
        .ilike('name', `%${trimmed}%`)
        .limit(10)
      if (!cancelled) setResults(data ?? [])
    }
    search()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  function selectNation(n: NationResult) {
    setSelected(n)
    setNationName(n.name)
    setLeaderName(n.leader_name ?? '')
    setSetValue('')
    setDeltaValue('')
    setProfileStatus('')
    setStatStatus('')
  }

  function handleSaveProfile() {
    if (!selected) return
    startTransition(async () => {
      const trimmedName = nationName.trim()
      const trimmedLeader = leaderName.trim()
      const results = await Promise.all([
        trimmedName && trimmedName !== selected.name
          ? updateNationNameAction(selected.id, trimmedName)
          : Promise.resolve({ success: true } as const),
        trimmedLeader && trimmedLeader !== (selected.leader_name ?? '')
          ? updateLeaderNameAction(selected.id, trimmedLeader)
          : Promise.resolve({ success: true } as const),
      ])
      const firstError = results.find((r) => 'error' in r && r.error)
      setProfileStatus((firstError && 'error' in firstError ? firstError.error : undefined) ?? 'Profile updated.')
      if (!firstError) {
        setSelected({ ...selected, name: trimmedName, leader_name: trimmedLeader })
      }
    })
  }

  function handleApplySet() {
    if (!selected) return
    const val = Number(setValue)
    if (!Number.isFinite(val) || val < 0) {
      setStatStatus('Enter a valid non-negative number.')
      return
    }
    startTransition(async () => {
      const result = await setNationStatAction(selected.id, field, val)
      setStatStatus(result.error ?? `Set ${field} to ${formatNumber(val)}.`)
      if (!result.error) setSelected({ ...selected, [field]: val })
    })
  }

  function handleApplyDelta(sign: 1 | -1) {
    if (!selected) return
    const val = Number(deltaValue)
    if (!Number.isFinite(val) || val <= 0) {
      setStatStatus('Enter a positive number to add or subtract.')
      return
    }
    const delta = val * sign
    startTransition(async () => {
      const result = await adjustNationStatAction(selected.id, field, delta)
      setStatStatus(result.error ?? `${sign > 0 ? 'Added' : 'Subtracted'} ${formatNumber(val)} to ${field}.`)
      if (!result.error) {
        setSelected({ ...selected, [field]: Math.max(0, selected[field] + delta) })
      }
    })
  }

  return (
    <div className={`${styles.panel} card`}>
      <input
        className="input"
        placeholder="Search nation by name…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelected(null)
        }}
        style={{ marginBottom: 10 }}
      />

      {results.length > 0 && !selected ? (
        <div style={{ marginBottom: 10 }}>
          {results.map((n) => (
            <div key={n.id} className={styles.playerRow} style={{ cursor: 'pointer' }} onClick={() => selectNation(n)}>
              <span>
                {n.name} #{n.country_number}
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>
                {formatCash(n.cash_balance)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {selected ? (
        <>
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
              Editing: {selected.name} #{selected.country_number}
            </div>

            {/* Profile */}
            <div className={styles.subheading}>Profile</div>
            <div className={styles.formInline} style={{ marginBottom: 10, flexWrap: 'wrap' }}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Nation Name</label>
                <input
                  className="input"
                  value={nationName}
                  onChange={(e) => setNationName(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Leader Name</label>
                <input
                  className="input"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
              </div>
            </div>
            <ConfirmButton
              label="Save Profile"
              confirmLabel="Confirm — Save Profile Changes"
              onConfirm={handleSaveProfile}
              className="btn btn--outline"
              disabled={isPending}
            />
            {profileStatus ? <div style={{ fontSize: 12, marginTop: 8 }}>{profileStatus}</div> : null}

            {/* Stats */}
            <div className={styles.subheading} style={{ marginTop: 20 }}>
              Stats
            </div>

            <div className={styles.formInline} style={{ marginBottom: 10, flexWrap: 'wrap' }}>
              <select className="select" value={field} onChange={(e) => setField(e.target.value as FieldKey)}>
                {EDITABLE_FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label} (current: {formatNumber(selected[f.key])})
                  </option>
                ))}
              </select>

              <div className={styles.modeSwitch}>
                <button
                  type="button"
                  className={`${styles.modeBtn}${mode === 'set' ? ` ${styles.modeBtnActive}` : ''}`}
                  onClick={() => setMode('set')}
                >
                  Set Fixed Value
                </button>
                <button
                  type="button"
                  className={`${styles.modeBtn}${mode === 'adjust' ? ` ${styles.modeBtnActive}` : ''}`}
                  onClick={() => setMode('adjust')}
                >
                  Add / Subtract
                </button>
              </div>
            </div>

            {mode === 'set' ? (
              <div className={styles.formInline} style={{ marginBottom: 10, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="New value"
                  value={setValue}
                  onChange={(e) => setSetValue(e.target.value)}
                  style={{ maxWidth: 160 }}
                />
                <ConfirmButton
                  label="Apply Change"
                  confirmLabel="Confirm — This Changes Real Game Data"
                  onConfirm={handleApplySet}
                  className="btn btn--primary"
                  disabled={isPending || !setValue}
                />
              </div>
            ) : (
              <div className={styles.formInline} style={{ marginBottom: 10, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="Amount"
                  value={deltaValue}
                  onChange={(e) => setDeltaValue(e.target.value)}
                  style={{ maxWidth: 140 }}
                />
                <ConfirmButton
                  label="+ Add"
                  confirmLabel="Confirm — Add This Amount"
                  onConfirm={() => handleApplyDelta(1)}
                  className="btn btn--primary"
                  disabled={isPending || !deltaValue}
                />
                <ConfirmButton
                  label="− Subtract"
                  confirmLabel="Confirm — Subtract This Amount"
                  onConfirm={() => handleApplyDelta(-1)}
                  className="btn btn--outline"
                  disabled={isPending || !deltaValue}
                />
              </div>
            )}

            {statStatus ? <div style={{ fontSize: 12, marginTop: 4 }}>{statStatus}</div> : null}
          </div>

          <button type="button" className="btn btn--outline" onClick={() => setSelected(null)}>
            Change Nation
          </button>
        </>
      ) : null}
    </div>
  )
}