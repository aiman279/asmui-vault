import type {
  Commitment,
  Expense,
  ExpenseCategory,
  FinanceState,
  Goal,
  Income,
  MonthSummary,
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
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
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

export function totalCommitments(commitments: Commitment[]): number {
  return sumAmounts(commitments)
}

export function goalProgress(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
}

export function emergencyFundGoal(goals: Goal[]): Goal | undefined {
  return goals.find((g) => /emergency/i.test(g.name)) ?? goals[0]
}

export function availableBalance(state: FinanceState): number {
  const grabNet = (state.grabRecords ?? []).reduce((sum, record) => {
    return (
      sum +
      record.grossEarnings -
      record.petrolCost -
      record.otherCost -
      record.credit
    )
  }, 0)
  const committed = totalCommitments(state.commitments ?? [])
  return (
    sumAmounts(state.incomes) -
    sumAmounts(state.expenses) +
    grabNet -
    committed
  )
}

export function changePercent(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0
    return null
  }
  return ((current - previous) / Math.abs(previous)) * 100
}
