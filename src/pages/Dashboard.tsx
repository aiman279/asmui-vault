import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ComparePill } from '../components/ComparePill'
import { MiniBars } from '../components/MiniBars'
import { PieChart } from '../components/PieChart'
import { ProgressBar } from '../components/ProgressBar'
import { StatCard } from '../components/StatCard'
import { useFinance } from '../hooks/useFinance'
import { useLanguage } from '../hooks/useLanguage'
import type { TranslationKey } from '../i18n/translations'
import {
  availableBalance,
  categoryTotals,
  currentMonthKey,
  emergencyFundGoal,
  filterByMonth,
  goalProgress,
  monthIncomeBreakdown,
  previousMonthKey,
  totalCommitments,
  wealthTotals,
} from '../utils/calculations'
import { formatMoney, formatMonthLabel, formatPercent } from '../utils/format'
import { summarizeGrabMonth } from '../utils/grab'
import { buildInsights } from '../utils/insights'
import {
  allocationPercents,
  comfortableRunway,
  financialHealthScore,
  moneyAllocation,
} from '../utils/v15'

const BALANCE_HIDDEN_KEY = 'aflow-balance-hidden'

export function Dashboard() {
  const { state } = useFinance()
  const { t } = useLanguage()
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
  const income = monthIncomeBreakdown(state, month)
  const prevIncome = monthIncomeBreakdown(state, prev)
  const expenses = filterByMonth(state.expenses, month)
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const prevExpenses = filterByMonth(state.expenses, prev)
  const prevExpenseTotal = prevExpenses.reduce((s, e) => s + e.amount, 0)
  const savings = income.total - expenseTotal
  const prevSavings = prevIncome.total - prevExpenseTotal
  const savingRate = income.total > 0 ? (savings / income.total) * 100 : 0
  const prevSavingRate =
    prevIncome.total > 0 ? (prevSavings / prevIncome.total) * 100 : 0
  const balance = availableBalance(state)
  const health = financialHealthScore(state)
  const allocation = moneyAllocation(state, month)
  const allocPct = allocationPercents(allocation)
  const emergency = emergencyFundGoal(state.goals)
  const otherGoals = state.goals.filter((g) => g.id !== emergency?.id).slice(0, 2)
  const totals = categoryTotals(expenses)
  const maxCat = Math.max(...Object.values(totals), 1)
  const chartItems = Object.entries(totals)
    .map(([category, value]) => ({
      label: t(`cat.${category}` as TranslationKey),
      value: value ?? 0,
      max: maxCat,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  const insights = buildInsights(state)
  const [year, monthNum] = month.split('-').map(Number)
  const committed = totalCommitments(state.commitments)
  const grabSummary = summarizeGrabMonth(state.grabRecords ?? [], month)
  const netWorth = wealthTotals(state.wealthItems ?? []).netWorth
  const runway = comfortableRunway(state)

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
          >
            {balanceHidden ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <h1 className="hero-balance__label">{t('dash.howMuch')}</h1>
        <p className="hero-balance__value">
          {balanceHidden ? '••••••' : formatMoney(balance)}
        </p>
        <p className="hero-balance__sub">
          {t('dash.afterSpending')}
          {balanceHidden || committed === 0
            ? ''
            : ` · ${formatMoney(committed)} ${t('dash.fixedOutflows')}`}
        </p>

        <div className={`health-score health-score--${health.status}`}>
          <div className="health-score__top">
            <span className="health-score__label">{t('dash.status')}</span>
            <span className={`status-pill status-pill--${health.status}`}>
              <span className="status-pill__dot" aria-hidden="true" />
              {t(`status.${health.status}` as TranslationKey)}
            </span>
          </div>
          <p className="health-score__value">
            {health.score}
            <span> / 100</span>
          </p>
          <ProgressBar value={health.score} label={t('dash.health')} />
          <p className="muted health-score__blurb">
            {t(`health.blurb.${health.blurbKey}` as TranslationKey)}
          </p>
        </div>

        <div className="quick-actions">
          <Link to="/grab" className="btn btn--primary">
            {t('dash.logGrab')}
          </Link>
          <Link to="/expenses" className="btn btn--ghost">
            {t('dash.addExpense')}
          </Link>
        </div>
      </section>

      <section className="panel reveal delay-1">
        <div className="panel__head">
          <h2>{t('dash.monthlyOverview')}</h2>
          <Link to="/summary" className="text-link">
            {t('dash.fullReport')}
          </Link>
        </div>
        <div className="stat-grid">
          <StatCard
            label={t('dash.totalIncome')}
            value={formatMoney(income.total)}
            tone="positive"
          >
            <ComparePill current={income.total} previous={prevIncome.total} />
          </StatCard>
          <StatCard
            label={t('dash.totalExpenses')}
            value={formatMoney(expenseTotal)}
            tone="negative"
          >
            <ComparePill current={expenseTotal} previous={prevExpenseTotal} />
          </StatCard>
          <StatCard
            label={t('dash.totalSavings')}
            value={formatMoney(savings)}
            tone={savings >= 0 ? 'positive' : 'negative'}
          >
            <ComparePill current={savings} previous={prevSavings} />
          </StatCard>
          <StatCard label={t('dash.savingRate')} value={formatPercent(savingRate)}>
            <ComparePill current={savingRate} previous={prevSavingRate} />
          </StatCard>
        </div>
      </section>

      <section className="panel reveal delay-1">
        <div className="panel__head">
          <h2>{t('dash.whereIncomeGoes')}</h2>
        </div>
        <p className="allocation-income">
          {t('dash.monthlyIncome')}{' '}
          <strong>{formatMoney(allocation.income)}</strong>
        </p>
        <PieChart
          title=""
          baseTotal={Math.max(allocation.income, 1)}
          centerValue={
            allocation.income > 0 ? `${allocPct.savings}%` : '—'
          }
          centerLabel={t('dash.saved')}
          slices={[
            {
              label: t('alloc.needs'),
              amount: allocation.needs,
              color: '#0d6e5f',
            },
            {
              label: t('alloc.savings'),
              amount: allocation.savings,
              color: '#1a9a6c',
            },
            {
              label: t('alloc.lifestyle'),
              amount: allocation.lifestyle,
              color: '#e0a83a',
            },
            {
              label: t('alloc.investment'),
              amount: allocation.investment,
              color: '#5b8def',
            },
          ]}
        />
        <div className="alloc-bars">
          {(
            [
              ['needs', allocation.needs, allocPct.needs],
              ['savings', allocation.savings, allocPct.savings],
              ['lifestyle', allocation.lifestyle, allocPct.lifestyle],
              ['investment', allocation.investment, allocPct.investment],
            ] as const
          ).map(([key, amount, pct]) => (
            <div key={key} className="alloc-bars__row">
              <div className="alloc-bars__meta">
                <span>{t(`alloc.${key}` as TranslationKey)}</span>
                <span>
                  {pct}% · {formatMoney(amount)}
                </span>
              </div>
              <div className="alloc-bars__track">
                <div
                  className={`alloc-bars__fill alloc-bars__fill--${key}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel grab-performance reveal delay-2">
        <div className="panel__head">
          <h2>{t('dash.sideIncome')}</h2>
          <Link to="/grab" className="text-link">
            {t('nav.grab')}
          </Link>
        </div>
        <p className="grab-performance__profit">
          {formatMoney(grabSummary.netProfit)}
        </p>
        <p className="muted grab-performance__caption">
          {t('dash.netProfit')}
          {grabSummary.profitPerHour > 0
            ? ` · ${formatMoney(grabSummary.profitPerHour)}/hour`
            : ''}
        </p>
        <div className="grab-performance__grid">
          <div>
            <p className="grab-performance__label">{t('dash.hours')}</p>
            <p className="grab-performance__value">
              {grabSummary.drivingHours > 0
                ? `${grabSummary.drivingHours.toFixed(1)}h`
                : '—'}
            </p>
          </div>
          <div>
            <p className="grab-performance__label">{t('dash.avgDay')}</p>
            <p className="grab-performance__value">
              {formatMoney(grabSummary.averageDailyProfit)}
            </p>
          </div>
          <div>
            <p className="grab-performance__label">{t('dash.activeDays')}</p>
            <p className="grab-performance__value">{grabSummary.drivingDays}</p>
          </div>
        </div>
      </section>

      <section className="stat-grid reveal delay-2">
        <StatCard
          label={t('dash.wealthier')}
          value={balanceHidden ? '••••' : formatMoney(netWorth)}
          tone={netWorth >= 0 ? 'positive' : 'negative'}
        >
          <Link to="/wealth" className="text-link">
            {t('nav.wealth')}
          </Link>
        </StatCard>
        <StatCard
          label={t('dash.survive')}
          value={
            runway.months >= 99 ? '99+ mo' : `${runway.months.toFixed(1)} mo`
          }
        >
          <Link to="/wealth" className="text-link">
            {t('wealth.survival')}
          </Link>
        </StatCard>
      </section>

      {emergency ? (
        <section className="panel reveal delay-3">
          <div className="panel__head">
            <h2>{t('dash.progress')}</h2>
            <Link to="/goals" className="text-link">
              {t('dash.goals')}
            </Link>
          </div>
          <p className="panel__amount">
            {formatMoney(emergency.currentAmount)}
            <span> of {formatMoney(emergency.targetAmount)}</span>
          </p>
          <ProgressBar value={goalProgress(emergency)} label={t('dash.emergency')} />
        </section>
      ) : null}

      {otherGoals.length > 0 ? (
        <section className="panel reveal delay-3">
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
          <h2>{t('dash.spendingSnap')}</h2>
        </div>
        <MiniBars items={chartItems} />
      </section>

      <section className="panel reveal delay-3">
        <div className="panel__head">
          <h2>{t('dash.insights')}</h2>
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
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
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
