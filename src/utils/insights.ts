import { CATEGORY_LABELS } from '../constants'
import type { Expense, FinanceState, Goal } from '../types'
import {
  categoryTotals,
  currentMonthKey,
  filterByMonth,
  goalProgress,
  monthIncomeBreakdown,
  previousMonthKey,
  summarizeMonth,
} from './calculations'

export interface Insight {
  id: string
  tone: 'positive' | 'neutral' | 'watch'
  text: string
}

function foodSpend(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.category === 'food')
    .reduce((sum, e) => sum + e.amount, 0)
}

export function buildInsights(state: FinanceState): Insight[] {
  const month = currentMonthKey()
  const prev = previousMonthKey(month)
  const income = monthIncomeBreakdown(state, month)
  const current = summarizeMonth(state.incomes, state.expenses, month)
  const previous = summarizeMonth(state.incomes, state.expenses, prev)
  const thisExpenses = filterByMonth(state.expenses, month)
  const prevExpenses = filterByMonth(state.expenses, prev)
  const insights: Insight[] = []

  const totalIncome = income.total
  const totalSaved = totalIncome - current.expenses
  const prevIncome = monthIncomeBreakdown(state, prev)
  const prevSaved = prevIncome.total - previous.expenses

  if (prevIncome.total > 0 || previous.expenses > 0) {
    if (totalSaved > prevSaved) {
      insights.push({
        id: 'savings-up',
        tone: 'positive',
        text: 'Your savings increased compared to last month',
      })
    }
  }

  if (totalIncome > 0 && income.grab > 0) {
    const share = Math.round((income.grab / totalIncome) * 100)
    if (share >= 15) {
      insights.push({
        id: 'grab-share',
        tone: 'neutral',
        text: `Your Grab income contributed ${share}% of total income`,
      })
    }
  }

  const foodNow = foodSpend(thisExpenses)
  const foodPrev = foodSpend(prevExpenses)
  if (foodPrev > 0 && foodNow > foodPrev * 1.1) {
    insights.push({
      id: 'food-up',
      tone: 'watch',
      text: 'You spent more on food this month',
    })
  } else if (foodPrev > 0 && foodNow < foodPrev * 0.9) {
    insights.push({
      id: 'food-down',
      tone: 'positive',
      text: 'You spent less on food this month',
    })
  }

  if (previous.income > 0 || previous.expenses > 0 || prevIncome.total > 0) {
    const currentSavingRate =
      totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0
    const prevSavingRate =
      prevIncome.total > 0 ? (prevSaved / prevIncome.total) * 100 : 0
    if (currentSavingRate > prevSavingRate + 2) {
      insights.push({
        id: 'saving-up',
        tone: 'positive',
        text: 'Your saving rate increased',
      })
    } else if (currentSavingRate < prevSavingRate - 2) {
      insights.push({
        id: 'saving-down',
        tone: 'watch',
        text: 'Your saving rate dipped this month',
      })
    }
  }

  const onTrackGoal = state.goals.find((goal) => isOnTrack(goal))
  if (onTrackGoal) {
    insights.push({
      id: `goal-${onTrackGoal.id}`,
      tone: 'positive',
      text: `You are on track to reach your ${onTrackGoal.name} goal`,
    })
  }

  if (current.biggestCategory && current.expenses > 0) {
    const share = (current.biggestCategoryAmount / current.expenses) * 100
    if (share >= 30) {
      insights.push({
        id: 'biggest-cat',
        tone: 'neutral',
        text: `${CATEGORY_LABELS[current.biggestCategory]} is your biggest spend this month`,
      })
    }
  }

  const totals = categoryTotals(thisExpenses)
  const prevTotals = categoryTotals(prevExpenses)
  for (const [category, amount] of Object.entries(totals) as [
    keyof typeof totals,
    number,
  ][]) {
    if (!category || category === 'food') continue
    const prevAmount = prevTotals[category] ?? 0
    if (prevAmount > 0 && amount > prevAmount * 1.25) {
      insights.push({
        id: `cat-up-${category}`,
        tone: 'watch',
        text: `Spending on ${CATEGORY_LABELS[category]} rose this month`,
      })
      break
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: 'steady',
      tone: 'neutral',
      text: 'Keep logging daily — clarity builds with every entry',
    })
  }

  return insights.slice(0, 4)
}

function isOnTrack(goal: Goal): boolean {
  const progress = goalProgress(goal)
  if (progress >= 100) return true

  const now = new Date()
  const target = new Date(`${goal.targetDate}T00:00:00`)
  if (Number.isNaN(target.getTime()) || target <= now) return progress >= 90

  const createdEstimate = new Date(target)
  createdEstimate.setMonth(createdEstimate.getMonth() - 12)
  const totalMs = target.getTime() - createdEstimate.getTime()
  const elapsedMs = now.getTime() - createdEstimate.getTime()
  const timeProgress = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100))

  return progress >= timeProgress - 8
}
