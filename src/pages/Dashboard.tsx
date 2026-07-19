import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ComparePill } from '../components/ComparePill'
import { MiniBars } from '../components/MiniBars'
import { ProgressBar } from '../components/ProgressBar'
import { StatCard } from '../components/StatCard'
import { CATEGORY_LABELS } from '../constants'
import { useFinance } from '../hooks/useFinance'
import {
  availableBalance,
  categoryTotals,
  currentMonthKey,
  emergencyFundGoal,
  filterByMonth,
  goalProgress,
  previousMonthKey,
  summarizeMonth,
  totalCommitments,
} from '../utils/calculations'
import { formatDate, formatMoney, formatMonthLabel, formatPercent } from '../utils/format'
import { grabNetProfit, summarizeGrabMonth } from '../utils/grab'
import { buildInsights } from '../utils/insights'

const BALANCE_HIDDEN_KEY = 'asmui-balance-hidden'

export function Dashboard() {
  const { state } = useFinance()
  const [balanceHidden, setBalanceHidden] = useState(() => {
    try {
      return localStorage.getItem(BALANCE_HIDDEN_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(BALANCE_HIDDEN_KEY, balanceHidden ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [balanceHidden])

  const month = currentMonthKey()
  const prev = previousMonthKey(month)
  const summary = summarizeMonth(state.incomes, state.expenses, month)
  const prevSummary = summarizeMonth(state.incomes, state.expenses, prev)
  const grabSummary = summarizeGrabMonth(state.grabRecords ?? [], month)
  const prevGrab = summarizeGrabMonth(state.grabRecords ?? [], prev)
  const totalIncome = summary.income + grabSummary.netProfit
  const prevTotalIncome = prevSummary.income + prevGrab.netProfit
  const totalSaved = totalIncome - summary.expenses
  const prevTotalSaved = prevTotalIncome - prevSummary.expenses
  const savingRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0
  const prevSavingRate =
    prevTotalIncome > 0 ? (prevTotalSaved / prevTotalIncome) * 100 : 0
  const balance = availableBalance(state)
  const emergency = emergencyFundGoal(state.goals)
  const otherGoals = state.goals.filter((g) => g.id !== emergency?.id).slice(0, 2)
  const monthExpenses = filterByMonth(state.expenses, month)
  const totals = categoryTotals(monthExpenses)
  const maxCat = Math.max(...Object.values(totals), 1)
  const chartItems = Object.entries(totals)
    .map(([category, value]) => ({
      label: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS],
      value: value ?? 0,
      max: maxCat,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  const insights = buildInsights(state)
  const [year, monthNum] = month.split('-').map(Number)
  const committed = totalCommitments(state.commitments)

  return (
    <div className="stack">
      <section className="hero-balance reveal">
        <div className="hero-balance__top">
          <p className="eyebrow">{formatMonthLabel(year, monthNum - 1)}</p>
          <button
            type="button"
            className="balance-toggle"
            onClick={() => setBalanceHidden((v) => !v)}
            aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
            title={balanceHidden ? 'Show balance' : 'Hide balance'}
          >
            {balanceHidden ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <h1 className="hero-balance__label">Available balance</h1>
        <p className="hero-balance__value">
          {balanceHidden ? '••••••' : formatMoney(balance)}
        </p>
        <p className="hero-balance__sub">
          After commitments
          {balanceHidden ? '' : `: ${formatMoney(committed)} reserved`}
        </p>
        <div className="quick-actions">
          <Link to="/grab" className="btn btn--primary">
            Log Grab
          </Link>
          <Link to="/expenses" className="btn btn--ghost">
            Add expense
          </Link>
        </div>
      </section>

      <section className="panel grab-performance reveal delay-1">
        <div className="panel__head">
          <h2>Grab performance</h2>
          <Link to="/grab" className="text-link">
            Open tracker
          </Link>
        </div>
        <p className="grab-performance__profit">
          {formatMoney(grabSummary.netProfit)}
        </p>
        <p className="muted grab-performance__caption">This Month Grab Profit</p>
        <div className="grab-performance__grid">
          <div>
            <p className="grab-performance__label">Best Earning Day</p>
            <p className="grab-performance__value">
              {grabSummary.bestDay
                ? formatMoney(grabNetProfit(grabSummary.bestDay))
                : '—'}
            </p>
            <p className="grab-performance__meta">
              {grabSummary.bestDay
                ? formatDate(grabSummary.bestDay.date)
                : 'No days yet'}
            </p>
          </div>
          <div>
            <p className="grab-performance__label">Average Profit / Day</p>
            <p className="grab-performance__value">
              {formatMoney(grabSummary.averageDailyProfit)}
            </p>
          </div>
          <div>
            <p className="grab-performance__label">Days Active</p>
            <p className="grab-performance__value">{grabSummary.drivingDays}</p>
          </div>
        </div>
      </section>

      <section className="stat-grid reveal delay-1">
        <StatCard label="Income" value={formatMoney(totalIncome)} tone="positive">
          <ComparePill current={totalIncome} previous={prevTotalIncome} />
        </StatCard>
        <StatCard
          label="Expenses"
          value={formatMoney(summary.expenses)}
          tone="negative"
        >
          <ComparePill current={summary.expenses} previous={prevSummary.expenses} />
        </StatCard>
        <StatCard
          label="Saved"
          value={formatMoney(totalSaved)}
          tone={totalSaved >= 0 ? 'positive' : 'negative'}
        >
          <ComparePill current={totalSaved} previous={prevTotalSaved} />
        </StatCard>
        <StatCard label="Saving rate" value={formatPercent(savingRate)}>
          <ComparePill current={savingRate} previous={prevSavingRate} />
        </StatCard>
      </section>

      {emergency ? (
        <section className="panel reveal delay-2">
          <div className="panel__head">
            <h2>Emergency fund</h2>
            <Link to="/goals" className="text-link">
              View goals
            </Link>
          </div>
          <p className="panel__amount">
            {formatMoney(emergency.currentAmount)}
            <span> of {formatMoney(emergency.targetAmount)}</span>
          </p>
          <ProgressBar value={goalProgress(emergency)} label="Progress" />
        </section>
      ) : null}

      {otherGoals.length > 0 ? (
        <section className="panel reveal delay-2">
          <div className="panel__head">
            <h2>Goal progress</h2>
          </div>
          <div className="goal-list">
            {otherGoals.map((goal) => (
              <div key={goal.id} className="goal-row">
                <div className="goal-row__top">
                  <span>{goal.name}</span>
                  <span>{formatPercent(goalProgress(goal))}</span>
                </div>
                <ProgressBar value={goalProgress(goal)} tone="warm" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel reveal delay-3">
        <div className="panel__head">
          <h2>Spending snapshot</h2>
          <Link to="/summary" className="text-link">
            Full summary
          </Link>
        </div>
        <MiniBars items={chartItems} />
      </section>

      <section className="panel reveal delay-3">
        <div className="panel__head">
          <h2>Smart insights</h2>
        </div>
        <ul className="insights">
          {insights.map((insight) => (
            <li key={insight.id} className={`insight insight--${insight.tone}`}>
              {insight.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 3l18 18M10.5 10.6a3 3 0 0 0 4 4M9.4 5.4A10.5 10.5 0 0 1 12 5c6 0 9.5 7 9.5 7a16.5 16.5 0 0 1-3.4 4.1M6.2 6.3A16.4 16.4 0 0 0 2.5 12S6 19 12 19c1.3 0 2.5-.3 3.6-.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
