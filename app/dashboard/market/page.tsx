import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber } from '@/lib/format'
import type { Nation, NationStock, P2PMarketOrder, P2PTradeHistoryItem } from '@/types/database'
import SellOrderForm from './SellOrderForm'
import OrderRow from './OrderRow'
import RealtimeRefresher from '@/components/RealtimeRefresher'
import styles from './market.module.css'
import React from 'react'

interface TransitRow {
  id: string
  resource_type: string
  amount: number
  route_type: string
  arrival_tick: number
  status: string
}

export default async function MarketPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let stocks: NationStock[] = []
  let myOrders: P2PMarketOrder[] = []
  let otherOrders: (P2PMarketOrder & { sellerName?: string })[] = []
  let history: P2PTradeHistoryItem[] = []
  let incomingShipments: TransitRow[] = []

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [stocksRes, myOrdersRes, otherOrdersRes, historyRes, transitRes] = await Promise.all([
        supabase.from('nation_stocks').select('*').eq('nation_id', nation.id),
        supabase
          .from('p2p_market_orders')
          .select('*')
          .eq('seller_nation_id', nation.id)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false }),
        supabase
          .from('p2p_market_orders')
          .select('*')
          .neq('seller_nation_id', nation.id)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('p2p_trade_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('logistics_transit')
          .select('id, resource_type, amount, route_type, arrival_tick, status')
          .eq('destination_nation_id', nation.id)
          .eq('status', 'IN_TRANSIT')
          .order('arrival_tick', { ascending: true }),
      ])

      stocks = stocksRes.data ?? []
      myOrders = myOrdersRes.data ?? []
      otherOrders = otherOrdersRes.data ?? []
      history = historyRes.data ?? []
      incomingShipments = transitRes.data ?? []

      if (otherOrders.length > 0) {
        const sellerIds = Array.from(new Set(otherOrders.map((o) => o.seller_nation_id)))
        const { data: sellers } = await supabase.from('nations').select('id, name').in('id', sellerIds)
        const nameById = new Map((sellers ?? []).map((s) => [s.id, s.name]))
        otherOrders = otherOrders.map((o) => ({ ...o, sellerName: nameById.get(o.seller_nation_id) }))
      }
    }
  }

  const stockByType: Record<string, number> = Object.fromEntries(
    stocks.map((s) => [s.resource_type, s.amount])
  )

  return (
    <div>
      <RealtimeRefresher
        channelName="market-realtime"
        watches={[{ table: 'p2p_market_orders' }, { table: 'p2p_trade_history' }]}
      />
      <div className={styles.header}>
        <div className={styles.eyebrow}>Market</div>
        <h1 className={styles.title}>P2P Trading</h1>
        <p className={styles.subtitle}>
          List resources for sale or buy from other nations. Sellers set their own price
          freely. Trades between nations in the same alliance — or allied by an active FTA
          treaty — get a reduced 5% customs duty split between both alliance treasuries;
          everyone else pays the standard 15% to the World Bank.
        </p>
        <div className={styles.walletRow}>
          <span className={styles.walletLabel}>Cash</span>
          <div className={`${styles.walletValue} mono`}>{formatCash(nation?.cash_balance)}</div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div>
          <h2 className={styles.sectionTitle}>List a Resource for Sale</h2>
          {nation ? <SellOrderForm nationId={nation.id} stockByType={stockByType} /> : null}
        </div>

        <div>
          <h2 className={styles.sectionTitle}>My Active Listings ({myOrders.length})</h2>
          <div className={`${styles.panel} card`}>
            {myOrders.length === 0 ? (
              <div className={styles.emptyState}>You have no active listings.</div>
            ) : (
              myOrders.map((o) => (
                <OrderRow key={o.id} order={o} nationId={nation!.id} mode="own" />
              ))
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Browse Market ({otherOrders.length})</h2>
        <div className={`${styles.panel} card`}>
          {otherOrders.length === 0 ? (
            <div className={styles.emptyState}>No active listings from other nations yet.</div>
          ) : (
            otherOrders.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                nationId={nation!.id}
                mode="buy"
                sellerName={o.sellerName}
              />
            ))
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Incoming Shipments ({incomingShipments.length})</h2>
        <div className={`${styles.panel} card`}>
          {incomingShipments.length === 0 ? (
            <div className={styles.emptyState}>Nothing in transit right now.</div>
          ) : (
            incomingShipments.map((t) => (
              <div className={styles.transitRow} key={t.id}>
                <span>
                  {formatNumber(t.amount)} {t.resource_type}
                </span>
                <span className={styles.transitMeta}>
                  {t.route_type} · arrives tick #{t.arrival_tick}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}