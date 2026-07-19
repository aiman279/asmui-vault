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
  previousMonthKey,
  summarizeMonth,
} from '../utils/calculations'
import { formatMoney, formatMonthLabel, formatPercent } from '../utils/format'

export function SummaryPage() {
  const { state } = useFinance()
  const month = currentMonthKey()
  const prev = previousMonthKey(month)
  const current = summarizeMonth(state.incomes, state.expenses, month)
  const previous = summarizeMonth(state.incomes, state.expenses, prev)
  const monthExpenses = filterByMonth(state.expenses, month)
  const totals = categoryTotals(monthExpenses)
  const maxCat = Math.max(...Object.values(totals), 1)
  const chartItems = (
    Object.entries(totals) as [ExpenseCategory, number][]
  )
    .map(([category, value]) => ({
      label: CATEGORY_LABELS[category],
      value,
      max: maxCat,
    }))
    .sort((a, b) => b.value - a.value)

  const [year, monthNum] = month.split('-').map(Number)
  const [prevYear, prevMonthNum] = prev.split('-').map(Number)

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>Monthly summary</h1>
          <p className="muted">{formatMonthLabel(year, monthNum - 1)}</p>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard label="Total income" value={formatMoney(current.income)} tone="positive">
          <ComparePill current={current.income} previous={previous.income} />
        </StatCard>
        <StatCard
          label="Total expenses"
          value={formatMoney(current.expenses)}
          tone="negative"
        >
          <ComparePill current={current.expenses} previous={previous.expenses} />
        </StatCard>
        <StatCard
          label="Total savings"
          value={formatMoney(current.savings)}
          tone={current.savings >= 0 ? 'positive' : 'negative'}
        >
          <ComparePill current={current.savings} previous={previous.savings} />
        </StatCard>
        <StatCard label="Saving percentage" value={formatPercent(current.savingRate)}>
          <ComparePill
            current={current.savingRate}
            previous={previous.savingRate}
          />
        </StatCard>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Biggest spending category</h2>
        </div>
        {current.biggestCategory ? (
          <div className="highlight-stat">
            <p className="highlight-stat__label">
              {CATEGORY_LABELS[current.biggestCategory]}
            </p>
            <p className="highlight-stat__value">
              {formatMoney(current.biggestCategoryAmount)}
            </p>
            <p className="muted">
              {current.expenses > 0
                ? `${Math.round(
                    (current.biggestCategoryAmount / current.expenses) * 100,
                  )}% of this month's spending`
                : 'No expenses recorded'}
            </p>
          </div>
        ) : (
          <p className="muted">No expenses recorded this month.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Category breakdown</h2>
        </div>
        <MiniBars items={chartItems} />
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>This month vs previous</h2>
        </div>
        <div className="compare-table">
          <div className="compare-table__row compare-table__head">
            <span />
            <span>{formatMonthLabel(year, monthNum - 1).split(' ')[0]}</span>
            <span>
              {formatMonthLabel(prevYear, prevMonthNum - 1).split(' ')[0]}
            </span>
          </div>
          <div className="compare-table__row">
            <span>Income</span>
            <span>{formatMoney(current.income)}</span>
            <span>{formatMoney(previous.income)}</span>
          </div>
          <div className="compare-table__row">
            <span>Expenses</span>
            <span>{formatMoney(current.expenses)}</span>
            <span>{formatMoney(previous.expenses)}</span>
          </div>
          <div className="compare-table__row">
            <span>Savings</span>
            <span>{formatMoney(current.savings)}</span>
            <span>{formatMoney(previous.savings)}</span>
          </div>
          <div className="compare-table__row">
            <span>Saving rate</span>
            <span>{formatPercent(current.savingRate)}</span>
            <span>{formatPercent(previous.savingRate)}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
