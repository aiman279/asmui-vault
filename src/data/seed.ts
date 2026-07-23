import type { FinanceState } from '../types'

function defaultEmergencyTargetDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Empty starting state for first open / clear all. */
export function createEmptyState(): FinanceState {
  return {
    incomes: [],
    expenses: [],
    goals: [
      {
        id: 'goal-emergency',
        name: 'Emergency Fund',
        targetAmount: 12000,
        currentAmount: 0,
        targetDate: defaultEmergencyTargetDate(),
      },
    ],
    commitments: [],
    grabRecords: [],
    wealthItems: [],
    wealthSnapshots: [],
  }
}
