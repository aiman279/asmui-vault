import type { FinanceState } from '../types'

/** Empty starting state for first open / clear all. */
export function createEmptyState(): FinanceState {
  return {
    incomes: [],
    expenses: [],
    goals: [],
    commitments: [],
    grabRecords: [],
  }
}
