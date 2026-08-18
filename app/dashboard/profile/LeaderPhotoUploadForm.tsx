'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './profile.module.css'

export default function LeaderPhotoUploadForm({
  userId,
  nationId,
  currentPhotoUrl,
}: {
  userId: string
  nationId: string
  currentPhotoUrl: string | null
}) {
  const router = useRouter()
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl)
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
        if (!file) {
          setError('Choose a photo first.')
          return
        }

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
        const newUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`

        const { error: rpcError } = await supabase.rpc('update_leader_photo', {
          p_nation_id: nationId,
          p_photo_url: newUrl,
        })
        if (rpcError) {
          setError(rpcError.message)
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

  return (
    <div className={`${styles.panel} card`}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-surface-sunken)', flexShrink: 0 }}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Leader" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
        </div>
        <div>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
          {error ? <div className={styles.error}>{error}</div> : null}
          {success ? <div className={styles.success}>{success}</div> : null}
          <button type="button" className="btn btn--primary" style={{ marginTop: 8 }} onClick={handleSave} disabled={isPending || !file}>
            {isPending ? 'Saving…' : 'Save Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}