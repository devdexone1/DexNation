import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber, formatPercent } from '@/lib/format'
import type { Nation, WorldBankLoan, CreditStatus } from '@/types/database'
import ToolInfo from '@/components/ToolInfo'
import BorrowForm from './BorrowForm'
import LoanRow from './LoanRow'
import styles from './bank.module.css'

const GRADE_ROWS = [
  { grade: 'S', range: '90.00 – 100.00', multiplier: '3.0x GDP*', rate: '1.0% / tick' },
  { grade: 'A', range: '75.00 – 89.99', multiplier: '2.0x GDP*', rate: '2.0% / tick' },
  { grade: 'B', range: '60.00 – 74.99', multiplier: '1.0x GDP*', rate: '3.5% / tick' },
  { grade: 'C', range: '45.00 – 59.99', multiplier: '0.5x GDP*', rate: '5.0% / tick' },
  { grade: 'D', range: '30.00 – 44.99', multiplier: '0.25x GDP*', rate: '8.0% / tick' },
  { grade: 'F', range: '< 30.00', multiplier: 'Blocked', rate: '12.0% / tick' },
]

export default async function BankPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let loans: WorldBankLoan[] = []
  let status: CreditStatus | null = null

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [loansRes, statusRes] = await Promise.all([
        supabase
          .from('world_bank_loans')
          .select('*')
          .eq('nation_id', nation.id)
          .order('created_at', { ascending: false }),
        supabase.rpc('compute_credit_status', { p_nation_id: nation.id }),
      ])
      loans = loansRes.data ?? []
      status = (statusRes.data as CreditStatus[] | null)?.[0] ?? null
    }
  }

  const activeLoans = loans.filter((l) => l.status !== 'CLEARED')
  const clearedLoans = loans.filter((l) => l.status === 'CLEARED')

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>World Bank</div>
        <h1 className={styles.title}>Credit &amp; Loans</h1>
        <p className={styles.subtitle}>
          Borrow against your credit grade and repay manually. Simplified for now: the
          borrowing cap and debt-ratio score use your Cash Balance instead of Daily GDP
          (Daily GDP is always $0 until the Daily Tick engine exists), and repayments are
          made manually instead of auto-deducted every tick.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Credit Status
          <ToolInfo title="Credit Score">
            Determines your borrowing cap and interest rate. Based on your payment
            history, debt-to-GDP ratio, and Approval Rating. Missing payments 3 times in
            a row triggers Default: your credit drops to Grade F and 20% of your stockpile
            is seized.
          </ToolInfo>
        </h2>
        <div className={styles.scoreGrid}>
          <div className={`${styles.scoreCard} card`}>
            <span className={styles.scoreLabel}>Credit Score</span>
            <span className={`${styles.scoreValue} mono`}>{status?.credit_score ?? '—'}</span>
          </div>
          <div className={`${styles.scoreCard} card`}>
            <span className={styles.scoreLabel}>Grade</span>
            <div className={styles.gradeBadgeRow}>
              <span className="badge badge--accent">{status?.credit_grade ?? '—'}</span>
            </div>
          </div>
          <div className={`${styles.scoreCard} card`}>
            <span className={styles.scoreLabel}>Borrowing Cap</span>
            <span className={`${styles.scoreValue} mono`}>{formatCash(status?.max_borrow_cap)}</span>
          </div>
          <div className={`${styles.scoreCard} card`}>
            <span className={styles.scoreLabel}>Active Debt</span>
            <span className={`${styles.scoreValue} mono`}>{formatCash(status?.total_active_debt)}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Apply for a Loan</h2>
        {nation && status ? (
          <BorrowForm
            nationId={nation.id}
            maxBorrowCap={status.max_borrow_cap}
            totalActiveDebt={status.total_active_debt}
            isBlocked={status.credit_grade === 'F'}
          />
        ) : null}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Loans ({activeLoans.length} active)</h2>
        <div className={`${styles.panel} card`}>
          {activeLoans.length === 0 ? (
            <div className={styles.emptyState}>No active loans.</div>
          ) : (
            activeLoans.map((loan) => (
              <LoanRow key={loan.id} loan={loan} nationId={nation!.id} />
            ))
          )}
        </div>

        {clearedLoans.length > 0 && (
          <div className={`${styles.panel} card`} style={{ marginTop: 12 }}>
            <div className={styles.scoreLabel} style={{ marginBottom: 10 }}>
              Cleared ({clearedLoans.length})
            </div>
            {clearedLoans.map((loan) => (
              <LoanRow key={loan.id} loan={loan} nationId={nation!.id} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Credit Grade Reference</h2>
        <div className={`${styles.gradeTableWrap} card`}>
          <table className={styles.gradeTable}>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Score Range</th>
                <th>Borrow Multiplier</th>
                <th>Interest Rate</th>
              </tr>
            </thead>
            <tbody>
              {GRADE_ROWS.map((row) => (
                <tr key={row.grade} className={status?.credit_grade === row.grade ? styles.gradeRowActive : ''}>
                  <td>{row.grade}</td>
                  <td>{row.range}</td>
                  <td>{row.multiplier}</td>
                  <td>{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.loanMeta} style={{ marginTop: 8 }}>
          *Multiplier applies to Cash Balance for now, not Daily GDP (see note above).
        </p>
      </div>
    </div>
  )
}