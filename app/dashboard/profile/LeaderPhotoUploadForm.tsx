'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateLeaderPhotoAction } from './actions'
import { FLAG_FRAMES } from '@/types/database'
import styles from './profile.module.css'

export default function LeaderPhotoUploadForm({
  userId,
  nationId,
  currentPhotoUrl,
  currentFrame,
}: {
  userId: string
  nationId: string
  currentPhotoUrl: string | null
  currentFrame: string
}) {
  const router = useRouter()
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl)
  const [frame, setFrame] = useState(currentFrame)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
      setError('Only PNG, JPEG, or WebP images are allowed.')
      return
    }
    if (selected.size > 2 * 1024 * 1024) {
      setError('File must be under 2MB.')
      return
    }
    setError('')
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  function handleSave() {
    setError('')
    setSuccess('')
    startTransition(async () => {
      try {
        const supabase = createClient()
        let newUrl = currentPhotoUrl

        if (file) {
          const ext = file.name.split('.').pop()
          const path = `${userId}/leader.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('leader-photos')
            .upload(path, file, { upsert: true, cacheControl: '3600' })

          if (uploadError) {
            setError(uploadError.message)
            return
          }

          const { data: publicUrlData } = supabase.storage.from('leader-photos').getPublicUrl(path)
          newUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`
        }

        if (!newUrl) {
          setError('Choose a photo first.')
          return
        }

        const result = await updateLeaderPhotoAction(nationId, newUrl, frame)
        if (result.error) {
          setError(result.error)
          return
        }

        setSuccess('Leader photo updated.')
        setFile(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  const frameClass = styles[`leaderFrame-${frame}`] ?? styles['leaderFrame-none']

  return (
    <div className={`${styles.panel} card`}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className={`${styles.leaderPhotoPreviewWrap} ${frameClass}`}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Leader" className={styles.leaderPhotoPreviewImg} />
          ) : null}
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div className={styles.infoRow} style={{ border: 'none', padding: '0 0 10px' }}>
            <label className="field__label" htmlFor="leader-photo-file">
              Upload Leader Photo (PNG/JPEG/WebP, max 2MB)
            </label>
          </div>
          <input id="leader-photo-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />

          <div style={{ marginTop: 16 }}>
            <label className="field__label">Frame Style</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {FLAG_FRAMES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`btn ${frame === f.id ? 'btn--primary' : 'btn--outline'}`}
                  style={{ padding: '8px 14px', fontSize: 12.5 }}
                  onClick={() => setFrame(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}
          {success ? <div className={styles.success}>{success}</div> : null}

          <button
            type="button"
            className="btn btn--primary"
            style={{ marginTop: 16 }}
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Save Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}