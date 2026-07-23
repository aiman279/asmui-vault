import { ASSET_CATEGORIES } from '../constants'
import type {
  Commitment,
  Expense,
  ExpenseCategory,
  FinanceState,
  FinancialStatus,
  Goal,
  GrabRecord,
  Income,
  MonthSummary,
  WealthItem,
  WealthSnapshot,
} from '../types'

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function previousMonthKey(monthKey = currentMonthKey()): string {
  return shiftMonthKey(monthKey, -1)
}

export function shiftMonthKey(monthKey: string, months: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  const date = new Date(y, m - 1 + months, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function filterByMonth<T extends { date: string }>(
  items: T[],
  monthKey: string,
): T[] {
  return items.filter((item) => getMonthKey(item.date) === monthKey)
}

export function sumAmounts(items: { amount: number }[]): number {
  return items.reduce((total, item) => total + item.amount, 0)
}

export function categoryTotals(
  expenses: Expense[],
): Partial<Record<ExpenseCategory, number>> {
  return expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, e) => {
    const key =
      (e.category as string) === 'transportation'
        ? ('others' as ExpenseCategory)
        : e.category
    acc[key] = (acc[key] ?? 0) + e.amount
    return acc
  }, {})
}

export function getBiggestCategory(expenses: Expense[]): {
  category: ExpenseCategory | null
  amount: number
} {
  const totals = categoryTotals(expenses)
  let category: ExpenseCategory | null = null
  let amount = 0

  for (const [key, value] of Object.entries(totals) as [ExpenseCategory, number][]) {
    if (value > amount) {
      category = key
      amount = value
    }
  }

  return { category, amount }
}

export function summarizeMonth(
  incomes: Income[],
  expenses: Expense[],
  monthKey: string,
): MonthSummary {
  const monthIncomes = filterByMonth(incomes, monthKey)
  const monthExpenses = filterByMonth(expenses, monthKey)
  const income = sumAmounts(monthIncomes)
  const expenseTotal = sumAmounts(monthExpenses)
  const savings = income - expenseTotal
  const savingRate = income > 0 ? (savings / income) * 100 : 0
  const biggest = getBiggestCategory(monthExpenses)

  return {
    income,
    expenses: expenseTotal,
    savings,
    savingRate,
    biggestCategory: biggest.category,
    biggestCategoryAmount: biggest.amount,
  }
}

export function grabRecordsNet(records: GrabRecord[]): number {
  return records.reduce(
    (sum, r) =>
      sum + r.grossEarnings - r.petrolCost - r.otherCost - r.credit,
    0,
  )
}

/** Salary / side / other + Grab net for the month */
export function monthIncomeBreakdown(
  state: FinanceState,
  monthKey = currentMonthKey(),
) {
  const monthIncomes = filterByMonth(state.incomes, monthKey)
  const salary = sumAmounts(monthIncomes.filter((i) => i.source === 'salary'))
  const side = sumAmounts(monthIncomes.filter((i) => i.source === 'side'))
  const other = sumAmounts(monthIncomes.filter((i) => i.source === 'other'))
  const grab = grabRecordsNet(filterByMonth(state.grabRecords ?? [], monthKey))
  return {
    salary,
    grab,
    other: side + other,
    total: salary + side + other + grab,
  }
}

export function totalCommitments(commitments: Commitment[]): number {
  return commitments
    .filter((c) => (c.direction ?? 'out') === 'out')
    .reduce((s, c) => s + c.amount, 0)
}

export function totalIncomeCommitments(commitments: Commitment[]): number {
  return commitments
    .filter((c) => c.direction === 'in')
    .reduce((s, c) => s + c.amount, 0)
}

export function goalProgress(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
}

export function emergencyFundGoal(goals: Goal[]): Goal | undefined {
  return goals.find((g) => /emergency/i.test(g.name))
}

export function availableBalance(state: FinanceState): number {
  const grabNet = grabRecordsNet(state.grabRecords ?? [])
  // Recurring outflows are posted as expenses; only reserve unposted legacy outs
  const postedIds = new Set(
    (state.expenses ?? [])
      .map((e) => e.recurringId)
      .filter(Boolean) as string[],
  )
  const unpostedOut = (state.commitments ?? [])
    .filter((c) => (c.direction ?? 'out') === 'out' && !postedIds.has(c.id))
    .reduce((s, c) => s + c.amount, 0)

  return (
    sumAmounts(state.incomes) -
    sumAmounts(state.expenses) +
    grabNet -
    unpostedOut
  )
}

export function changePercent(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0
    return null
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

export function wealthTotals(items: WealthItem[]) {
  const assets = items
    .filter((i) => i.kind === 'asset')
    .reduce((s, i) => s + i.amount, 0)
  const liabilities = items
    .filter((i) => i.kind === 'liability')
    .reduce((s, i) => s + i.amount, 0)
  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
  }
}

export function liquidMoney(items: WealthItem[]): number {
  const liquidCats = new Set(
    ASSET_CATEGORIES.filter((c) => c.liquid).map((c) => c.value),
  )
  return items
    .filter((i) => i.kind === 'asset' && liquidCats.has(i.category as never))
    .reduce((s, i) => s + i.amount, 0)
}

export type RunwayScenario = 'optimistic' | 'realistic' | 'conservative'

export function monthlyBurn(state: FinanceState, monthKey = currentMonthKey()) {
  const expenses = sumAmounts(filterByMonth(state.expenses, monthKey))
  const committed = totalCommitments(state.commitments ?? [])
  // Use the higher of logged expenses vs commitments as burn baseline
  return Math.max(expenses, committed, 1)
}

export function runwayMonths(
  state: FinanceState,
  scenario: RunwayScenario = 'realistic',
): number {
  const liquid = liquidMoney(state.wealthItems ?? [])
  let burn = monthlyBurn(state)

  if (scenario === 'optimistic') burn = burn * 0.85
  if (scenario === 'conservative') burn = burn * 1.2

  if (burn <= 0) return liquid > 0 ? 99 : 0
  return Math.max(0, liquid / burn)
}

export function financialStatus(state: FinanceState): {
  status: FinancialStatus
  reasons: string[]
} {
  const month = currentMonthKey()
  const income = monthIncomeBreakdown(state, month)
  const expenses = sumAmounts(filterByMonth(state.expenses, month))
  const savings = income.total - expenses
  const savingRate = income.total > 0 ? (savings / income.total) * 100 : 0
  const emergency = emergencyFundGoal(state.goals)
  const emergencyPct = emergency ? goalProgress(emergency) : 0
  const runway = runwayMonths(state, 'realistic')
  const reasons: string[] = []

  let score = 0
  if (savingRate >= 20) score += 2
  else if (savingRate >= 10) score += 1
  else reasons.push('Saving rate is low')

  if (emergencyPct >= 50) score += 2
  else if (emergencyPct >= 25) score += 1
  else if (emergency) reasons.push('Emergency fund needs attention')

  if (runway >= 3) score += 2
  else if (runway >= 1) score += 1
  else if ((state.wealthItems ?? []).length > 0) {
    reasons.push('Runway is short')
  }

  if (expenses > income.total && income.total > 0) {
    score = Math.max(0, score - 2)
    reasons.push('Spending exceeds income')
  }

  let status: FinancialStatus = 'warning'
  if (score >= 5) status = 'healthy'
  else if (score <= 2) status = 'critical'

  if (reasons.length === 0) {
    if (status === 'healthy') reasons.push('Savings, buffer, and spending look steady')
    else reasons.push('Keep logging to improve your status')
  }

  return { status, reasons: reasons.slice(0, 3) }
}

export function filterSnapshots(
  snapshots: WealthSnapshot[],
  range: '1m' | '3m' | '1y' | 'all',
): WealthSnapshot[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  if (range === 'all' || sorted.length === 0) return sorted

  const now = new Date()
  const start = new Date(now)
  if (range === '1m') start.setMonth(start.getMonth() - 1)
  if (range === '3m') start.setMonth(start.getMonth() - 3)
  if (range === '1y') start.setFullYear(start.getFullYear() - 1)

  const startISO = start.toISOString().slice(0, 10)
  const filtered = sorted.filter((s) => s.date >= startISO)
  return filtered.length > 0 ? filtered : sorted.slice(-1)
}
