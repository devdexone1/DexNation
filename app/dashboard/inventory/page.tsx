import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber } from '@/lib/format'

export default async function InventoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let inventory: { quantity: number; items: { name: string; description: string | null } | null }[] = []

  if (user) {
    const { data: nation } = await supabase.from('nations').select('id').eq('user_id', user.id).maybeSingle()
    if (nation) {
      const { data } = await supabase
        .from('nation_inventory')
        .select('quantity, items(name, description)')
        .eq('nation_id', nation.id)
      inventory = (data as any) ?? []
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--color-ink-faint)' }}>
          Inventory
        </div>
        <h1 style={{ fontSize: 24, marginTop: 4 }}>Special Items</h1>
        <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 6 }}>
          A dedicated shop for special items is coming soon — this page will let you buy,
          hold, and use unique items with real gameplay effects.
        </p>
      </div>

      <div className="card" style={{ padding: 20 }}>
        {inventory.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>
            You don&apos;t own any items yet.
          </div>
        ) : (
          inventory.map((i, idx) => (
            <div key={idx} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
              {i.items?.name} × {formatNumber(i.quantity)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}