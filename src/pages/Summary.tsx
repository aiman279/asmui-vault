import { ComparePill } from '../components/ComparePill'
import { MiniBars } from '../components/MiniBars'
import { StatCard } from '../components/StatCard'
import { CATEGORY_LABELS } from '../constants'
import { useFinance } from '../hooks/useFinance'
import type { ExpenseCategory } from '../types'
import {
  categoryTotals,
  currentMonthKey,
  filterByMonth,
  monthIncomeBreakdown,
  previousMonthKey,
} from '../utils/calculations'
import { formatMoney, formatMonthLabel, formatPercent } from '../utils/format'
import { buildMonthlyInsightLines } from '../utils/v15'

export function SummaryPage() {
  const { state } = useFinance()
  const month = currentMonthKey()
  const prev = previousMonthKey(month)
  const income = monthIncomeBreakdown(state, month)
  const prevIncome = monthIncomeBreakdown(state, prev)
  const monthExpenses = filterByMonth(state.expenses, month)
  const prevExpenses = filterByMonth(state.expenses, prev)
  const expenseTotal = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const prevExpenseTotal = prevExpenses.reduce((s, e) => s + e.amount, 0)
  const savings = income.total - expenseTotal
  const prevSavings = prevIncome.total - prevExpenseTotal
  const savingRate = income.total > 0 ? (savings / income.total) * 100 : 0
  const prevSavingRate =
    prevIncome.total > 0 ? (prevSavings / prevIncome.total) * 100 : 0

  const totals = categoryTotals(monthExpenses)
  const maxCat = Math.max(...Object.values(totals), 1)
  const chartItems = (Object.entries(totals) as [ExpenseCategory, number][])
    .map(([category, value]) => ({
      label: CATEGORY_LABELS[category],
      value,
      max: maxCat,
    }))
    .sort((a, b) => b.value - a.value)

  const biggest = chartItems[0]
  const grabShare =
    income.total > 0 ? (income.grab / income.total) * 100 : 0

  const snapshots = [...(state.wealthSnapshots ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  )
  const monthStart = `${month}-01`
  const snapsInMonth = snapshots.filter((s) => s.date.slice(0, 7) === month)
  const snapBefore = [...snapshots].reverse().find((s) => s.date < monthStart)
  const netWorthChange =
    snapsInMonth.length > 0 && snapBefore
      ? snapsInMonth[snapsInMonth.length - 1].netWorth - snapBefore.netWorth
      : snapsInMonth.length >= 2
        ? snapsInMonth[snapsInMonth.length - 1].netWorth -
          snapsInMonth[0].netWorth
        : null

  const insights = buildMonthlyInsightLines(state)
  const [year, monthNum] = month.split('-').map(Number)

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>Monthly report</h1>
          <p className="muted">{formatMonthLabel(year, monthNum - 1)}</p>
        </div>
      </section>

      <section className="panel report-hero">
        <div className="summary-rows">
          <div className="summary-row">
            <span>Income</span>
            <strong className="text-positive">{formatMoney(income.total)}</strong>
          </div>
          <div className="summary-row">
            <span>Expenses</span>
            <strong className="text-danger">{formatMoney(expenseTotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Savings</span>
            <strong className={savings >= 0 ? 'text-positive' : 'text-danger'}>
              {formatMoney(savings)}
            </strong>
          </div>
          <div className="summary-row summary-row--total">
            <span>Net worth change</span>
            <strong
              className={
                netWorthChange === null
                  ? ''
                  : netWorthChange >= 0
                    ? 'text-positive'
                    : 'text-danger'
              }
            >
              {netWorthChange === null
                ? '—'
                : `${netWorthChange >= 0 ? '+' : ''}${formatMoney(netWorthChange)}`}
            </strong>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard
          label="Total income"
          value={formatMoney(income.total)}
          tone="positive"
        >
          <ComparePill current={income.total} previous={prevIncome.total} />
        </StatCard>
        <StatCard
          label="Total expenses"
          value={formatMoney(expenseTotal)}
          tone="negative"
        >
          <ComparePill current={expenseTotal} previous={prevExpenseTotal} />
        </StatCard>
        <StatCard
          label="Total savings"
          value={formatMoney(savings)}
          tone={savings >= 0 ? 'positive' : 'negative'}
        >
          <ComparePill current={savings} previous={prevSavings} />
        </StatCard>
        <StatCard label="Saving rate" value={formatPercent(savingRate)}>
          <ComparePill current={savingRate} previous={prevSavingRate} />
        </StatCard>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Income mix</h2>
        </div>
        <div className="income-split">
          <div className="income-split__row">
            <span>Salary</span>
            <strong>{formatMoney(income.salary)}</strong>
          </div>
          <div className="income-split__row">
            <span>Grab</span>
            <strong>{formatMoney(income.grab)}</strong>
          </div>
          <div className="income-split__row">
            <span>Other</span>
            <strong>{formatMoney(income.other)}</strong>
          </div>
        </div>
        {income.total > 0 && income.grab > 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>
            Grab contributed {Math.round(grabShare)}% of total income
          </p>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Biggest expense</h2>
        </div>
        {biggest && biggest.value > 0 ? (
          <div className="highlight-stat">
            <p className="highlight-stat__label">{biggest.label}</p>
            <p className="highlight-stat__value">{formatMoney(biggest.value)}</p>
            <p className="muted">
              {expenseTotal > 0
                ? `${Math.round((biggest.value / expenseTotal) * 100)}% of this month's spending`
                : 'No expenses recorded'}
            </p>
          </div>
        ) : (
          <p className="muted">No expenses recorded this month.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Spending by category</h2>
        </div>
        <MiniBars items={chartItems} />
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Insights</h2>
        </div>
        <ul className="insights">
          {insights.map((text, i) => (
            <li key={`${i}-${text.slice(0, 12)}`} className="insight insight--neutral">
              {text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
