import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/format'
import { getServerTranslator } from '@/lib/i18n/getServerLocale'
import { RESEARCH_BRANCH_LABELS } from '@/types/database'
import type { Nation, TechNode, NationTechnology, ResearchQueueItem } from '@/types/database'
import TechNodeActions from './TechNodeActions'
import styles from './research.module.css'

export default async function ResearchPage() {
  const t = await getServerTranslator()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let techNodes: TechNode[] = []
  let nationTechs: NationTechnology[] = []
  let queue: ResearchQueueItem[] = []

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [nodesRes, techsRes, queueRes] = await Promise.all([
        supabase.from('tech_nodes').select('*').order('branch').order('tier'),
        supabase.from('nation_technologies').select('*').eq('nation_id', nation.id),
        supabase
          .from('research_queue')
          .select('*')
          .eq('nation_id', nation.id)
          .order('queue_position', { ascending: true }),
      ])
      techNodes = nodesRes.data ?? []
      nationTechs = techsRes.data ?? []
      queue = queueRes.data ?? []
    }
  }

  const statusByTechId = new Map(nationTechs.map((t) => [t.tech_id, t.status]))
  const queuedTechIds = new Set(queue.map((q) => q.tech_id))
  const techById = new Map(techNodes.map((t) => [t.id, t]))

  function getNodeState(node: TechNode): 'locked' | 'available' | 'queued' | 'completed' {
    const status = statusByTechId.get(node.id)
    if (status === 'COMPLETED') return 'completed'
    if (queuedTechIds.has(node.id)) return 'queued'
    if (node.prerequisite_tech_id) {
      const prereqStatus = statusByTechId.get(node.prerequisite_tech_id)
      if (prereqStatus !== 'COMPLETED') return 'locked'
    }
    return 'available'
  }

  const branches = ['INDUSTRIAL', 'MILITARY', 'ECONOMIC', 'ENERGY']

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>{t('research.eyebrow')}</div>
        <h1 className={styles.title}>{t('research.title')}</h1>
        <p className={styles.subtitle}>{t('research.subtitle')}</p>
        <div className={styles.rpRow}>
          <div className={styles.rpLabel}>Research Points Balance</div>
          <div className={`${styles.rpValue} mono`}>{formatNumber(nation?.research_points)}</div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Research Queue ({queue.length})</h2>
        <div className={`${styles.queuePanel} card`}>
          {queue.length === 0 ? (
            <div className={styles.queueEmpty}>
              Your queue is empty. Add technologies from the tree below.
            </div>
          ) : (
            queue.map((q) => {
              const node = techById.get(q.tech_id)
              return (
                <div className={styles.queueRow} key={q.id}>
                  <span className={styles.queuePosition}>#{q.queue_position}</span>
                  <span className={styles.queueName}>{node?.name ?? q.tech_id}</span>
                  <span className="badge badge--accent">{node?.rp_cost} RP</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tech Tree</h2>

        {branches.map((branch) => {
          const nodes = techNodes.filter((n) => n.branch === branch).sort((a, b) => a.tier - b.tier)
          if (nodes.length === 0) return null

          return (
            <div key={branch} className={styles.branchBlock}>
              <div className={styles.branchLabel}>{RESEARCH_BRANCH_LABELS[branch] ?? branch}</div>

              {nodes.map((node, idx) => {
                const state = getNodeState(node)
                return (
                  <div className={styles.nodeRow} key={node.id}>
                    <span className={styles.nodeConnector}>{idx === 0 ? '●' : '→'}</span>
                    <div className={`${styles.nodeCard} card ${state === 'locked' ? styles.nodeCardLocked : ''}`}>
                      <div className={styles.nodeInfo}>
                        <span className={styles.nodeName}>
                          {node.name} <span className="mono" style={{ fontWeight: 400, fontSize: 11 }}>({node.id})</span>
                        </span>
                        <span className={styles.nodeDesc}>{node.effect_description}</span>
                        <span className={styles.nodeCost}>{formatNumber(node.rp_cost)} RP</span>
                      </div>
                      {nation ? (
                        <TechNodeActions nationId={nation.id} techId={node.id} nodeState={state} />
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}