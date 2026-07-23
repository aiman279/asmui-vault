import { ASSET_CATEGORIES } from '../constants'
import type {
  AllocationResult,
  ExpenseCategory,
  FinanceState,
  Goal,
  HealthScoreResult,
  RunwayLevel,
  WealthItem,
} from '../types'
import {
  currentMonthKey,
  emergencyFundGoal,
  filterByMonth,
  goalProgress,
  monthlyBurn,
  monthIncomeBreakdown,
  previousMonthKey,
  sumAmounts,
  wealthTotals,
} from './calculations'
import { summarizeGrabMonth } from './grab'

const NEED_CATS = new Set<ExpenseCategory>([
  'housing',
  'car',
  'family',
  'food',
  'phone',
  'utilities',
])

const LIFESTYLE_CATS = new Set<ExpenseCategory>([
  'entertainment',
  'shopping',
  'others',
])

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** 0–100 health score — simple weighted parts */
export function financialHealthScore(state: FinanceState): HealthScoreResult {
  const month = currentMonthKey()
  const prev = previousMonthKey(month)
  const income = monthIncomeBreakdown(state, month)
  const expenses = sumAmounts(filterByMonth(state.expenses, month))
  const prevExpenses = sumAmounts(filterByMonth(state.expenses, prev))
  const savings = income.total - expenses
  const savingRate = income.total > 0 ? (savings / income.total) * 100 : 0

  const emergency = emergencyFundGoal(state.goals)
  const emergencyPct = emergency ? goalProgress(emergency) : 0

  const comfortable = comfortableRunway(state)
  const { assets, liabilities } = wealthTotals(state.wealthItems ?? [])

  // 1. Savings rate → /25 (20%+ = full)
  const savingsRatePts = clamp((savingRate / 20) * 25, 0, 25)

  // 2. Emergency → /25
  const emergencyPts = clamp((emergencyPct / 100) * 25, 0, 25)

  // 3. Runway → /20 (6 months = full)
  const runwayPts = clamp((comfortable.months / 6) * 20, 0, 20)

  // 4. Debt → /15 (no debt = full; debt ≥ assets = 0)
  let debtPts = 15
  if (assets <= 0 && liabilities > 0) debtPts = 0
  else if (assets > 0) {
    const ratio = liabilities / assets
    debtPts = clamp((1 - ratio) * 15, 0, 15)
  }

  // 5. Spending control → /15 (flat or down = full; +25% = 0)
  let spendingPts = 10
  if (prevExpenses > 0) {
    const change = (expenses - prevExpenses) / prevExpenses
    if (change <= 0) spendingPts = 15
    else if (change >= 0.25) spendingPts = 0
    else spendingPts = clamp((1 - change / 0.25) * 15, 0, 15)
  } else if (expenses === 0) {
    spendingPts = 12
  }

  const parts = {
    savingsRate: Math.round(savingsRatePts),
    emergency: Math.round(emergencyPts),
    runway: Math.round(runwayPts),
    debt: Math.round(debtPts),
    spending: Math.round(spendingPts),
  }

  const score = clamp(
    parts.savingsRate +
      parts.emergency +
      parts.runway +
      parts.debt +
      parts.spending,
    0,
    100,
  )

  let status: HealthScoreResult['status'] = 'warning'
  if (score >= 70) status = 'healthy'
  else if (score < 40) status = 'critical'

  let blurbKey: 'default' | 'healthy' | 'critical' | 'emergency' | 'savings' =
    'default'
  if (status === 'healthy') blurbKey = 'healthy'
  else if (status === 'critical') blurbKey = 'critical'
  else if (parts.emergency < 10) blurbKey = 'emergency'
  else if (parts.savingsRate < 10) blurbKey = 'savings'

  return { score, status, parts, blurbKey }
}

export function moneyAllocation(
  state: FinanceState,
  monthKey = currentMonthKey(),
): AllocationResult {
  const income = monthIncomeBreakdown(state, monthKey).total
  const expenses = filterByMonth(state.expenses, monthKey)

  let needs = 0
  let lifestyle = 0
  let investment = 0

  for (const e of expenses) {
    if (e.category === 'investment') investment += e.amount
    else if (NEED_CATS.has(e.category)) needs += e.amount
    else if (LIFESTYLE_CATS.has(e.category)) lifestyle += e.amount
    else lifestyle += e.amount
  }

  // Outgoing fixed commitments count as needs (if not already mirrored as expenses)
  for (const c of state.commitments ?? []) {
    if (c.direction === 'out') {
      const already = expenses.some((e) => e.recurringId === c.id)
      if (!already) needs += c.amount
    }
  }

  const spent = needs + lifestyle + investment
  const savings = Math.max(0, income - spent)

  return { income, needs, lifestyle, investment, savings }
}

export function cashOnly(items: WealthItem[]): number {
  return items
    .filter((i) => i.kind === 'asset' && i.category === 'cash')
    .reduce((s, i) => s + i.amount, 0)
}

export function liquidComfortable(items: WealthItem[]): number {
  const liquid = new Set(
    ASSET_CATEGORIES.filter((c) => c.liquid).map((c) => c.value),
  )
  return items
    .filter((i) => i.kind === 'asset' && liquid.has(i.category as never))
    .reduce((s, i) => s + i.amount, 0)
}

export function survivalRunway(state: FinanceState): {
  months: number
  cash: number
  burn: number
  level: RunwayLevel
} {
  const cash = cashOnly(state.wealthItems ?? [])
  const burn = monthlyBurn(state)
  const months = burn > 0 ? Math.max(0, cash / burn) : cash > 0 ? 99 : 0
  return { months, cash, burn, level: runwayLevel(months) }
}

export function comfortableRunway(state: FinanceState): {
  months: number
  liquid: number
  burn: number
  level: RunwayLevel
} {
  const liquid = liquidComfortable(state.wealthItems ?? [])
  const burn = monthlyBurn(state)
  const months = burn > 0 ? Math.max(0, liquid / burn) : liquid > 0 ? 99 : 0
  return { months, liquid, burn, level: runwayLevel(months) }
}

export function runwayLevel(months: number): RunwayLevel {
  if (months >= 6) return 'safe'
  if (months >= 3) return 'improve'
  return 'risk'
}

/** Next milestone toward target (25% steps, min RM500 step) */
export function goalMilestone(goal: Goal): {
  nextMilestone: number
  remainingToMilestone: number
  remainingToTarget: number
  progress: number
  estimatedMonths: number | null
} {
  const progress = goalProgress(goal)
  const remainingToTarget = Math.max(0, goal.targetAmount - goal.currentAmount)

  if (goal.currentAmount >= goal.targetAmount) {
    return {
      nextMilestone: goal.targetAmount,
      remainingToMilestone: 0,
      remainingToTarget: 0,
      progress: 100,
      estimatedMonths: 0,
    }
  }

  const step = Math.max(500, Math.round(goal.targetAmount / 4 / 100) * 100)
  let next = step
  while (next <= goal.currentAmount && next < goal.targetAmount) {
    next += step
  }
  next = Math.min(next, goal.targetAmount)

  const remainingToMilestone = Math.max(0, next - goal.currentAmount)

  // Pace: assume linear to target date, or null
  let estimatedMonths: number | null = null
  const target = new Date(`${goal.targetDate}T00:00:00`)
  const now = new Date()
  if (!Number.isNaN(target.getTime()) && target > now && remainingToTarget > 0) {
    const monthsLeft =
      (target.getFullYear() - now.getFullYear()) * 12 +
      (target.getMonth() - now.getMonth())
    if (monthsLeft > 0 && goal.currentAmount > 0) {
      const neededPerMonth = remainingToTarget / monthsLeft
      estimatedMonths =
        neededPerMonth > 0
          ? Math.ceil(remainingToTarget / neededPerMonth)
          : monthsLeft
    } else if (monthsLeft > 0) {
      estimatedMonths = monthsLeft
    }
  }

  // Fallback: if saving ~RM500/mo mental default when no date pace
  if (estimatedMonths === null && remainingToTarget > 0) {
    estimatedMonths = Math.ceil(remainingToTarget / 500)
  }

  return {
    nextMilestone: next,
    remainingToMilestone,
    remainingToTarget,
    progress,
    estimatedMonths,
  }
}

export function buildMonthlyInsightLines(state: FinanceState): string[] {
  const month = currentMonthKey()
  const prev = previousMonthKey(month)
  const income = monthIncomeBreakdown(state, month)
  const prevIncome = monthIncomeBreakdown(state, prev)
  const expenses = filterByMonth(state.expenses, month)
  const expenseTotal = sumAmounts(expenses)
  const prevExpenseTotal = sumAmounts(filterByMonth(state.expenses, prev))
  const savings = income.total - expenseTotal
  const prevSavings = prevIncome.total - prevExpenseTotal
  const lines: string[] = []

  if (prevIncome.total > 0 || prevExpenseTotal > 0) {
    if (savings > prevSavings) {
      lines.push('Your savings increased compared to last month')
    } else if (savings < prevSavings) {
      lines.push('Your savings dipped compared to last month')
    }
  }

  if (income.total > 0 && income.grab > 0) {
    lines.push(
      `Grab contributed ${Math.round((income.grab / income.total) * 100)}% of your income`,
    )
  }

  const grab = summarizeGrabMonth(state.grabRecords ?? [], month)
  const prevGrab = summarizeGrabMonth(state.grabRecords ?? [], prev)
  if (prevGrab.netProfit > 0 && grab.netProfit > 0) {
    const change =
      ((grab.netProfit - prevGrab.netProfit) / Math.abs(prevGrab.netProfit)) *
      100
    if (Math.abs(change) >= 5) {
      lines.push(
        change > 0
          ? `Your Grab profit increased ${Math.round(change)}% compared to last month`
          : `Your Grab profit dropped ${Math.round(Math.abs(change))}% compared to last month`,
      )
    }
  }

  if (expenses.length > 0) {
    const totals: Partial<Record<ExpenseCategory, number>> = {}
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] ?? 0) + e.amount
    }
    let biggest: ExpenseCategory | null = null
    let amt = 0
    for (const [k, v] of Object.entries(totals) as [ExpenseCategory, number][]) {
      if (v > amt) {
        biggest = k
        amt = v
      }
    }
    if (biggest) {
      const label =
        biggest.charAt(0).toUpperCase() + biggest.slice(1).replace(/([A-Z])/g, ' $1')
      const pretty: Record<string, string> = {
        housing: 'Housing',
        car: 'Car',
        family: 'Family support',
        food: 'Food',
        phone: 'Phone',
        utilities: 'Utilities',
        entertainment: 'Entertainment',
        shopping: 'Shopping',
        investment: 'Investment',
        others: 'Others',
      }
      lines.push(
        `Your biggest expense category was ${pretty[biggest] ?? label}`,
      )
    }
  }

  const emergency = emergencyFundGoal(state.goals)
  if (emergency) {
    const pct = Math.round(goalProgress(emergency))
    lines.push(`Your emergency fund is ${pct}% complete`)
  }

  if (lines.length === 0) {
    lines.push('Keep logging — monthly insights appear as you build history')
  }

  return lines.slice(0, 5)
}

export function allocationPercents(a: AllocationResult) {
  const base = a.income > 0 ? a.income : 1
  return {
    needs: Math.round((a.needs / base) * 100),
    savings: Math.round((a.savings / base) * 100),
    investment: Math.round((a.investment / base) * 100),
    lifestyle: Math.round((a.lifestyle / base) * 100),
  }
}
