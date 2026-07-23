import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from '../constants'
import { createEmptyState } from '../data/seed'
import type {
  Commitment,
  Expense,
  ExpenseCategory,
  FinanceState,
  Goal,
  GrabRecord,
  Income,
  WealthItem,
  WealthSnapshot,
} from '../types'
import { todayISO, uid } from '../utils/format'
import { wealthTotals } from '../utils/calculations'

interface FinanceContextValue {
  state: FinanceState
  addIncome: (data: Omit<Income, 'id'>) => void
  updateIncome: (id: string, data: Omit<Income, 'id'>) => void
  deleteIncome: (id: string) => void
  addExpense: (data: Omit<Expense, 'id'>) => void
  updateExpense: (id: string, data: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void
  addGoal: (data: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, data: Omit<Goal, 'id'>) => void
  deleteGoal: (id: string) => void
  addCommitment: (data: Omit<Commitment, 'id'>) => void
  updateCommitment: (id: string, data: Omit<Commitment, 'id'>) => void
  deleteCommitment: (id: string) => void
  addGrabRecord: (data: Omit<GrabRecord, 'id'>) => void
  updateGrabRecord: (id: string, data: Omit<GrabRecord, 'id'>) => void
  deleteGrabRecord: (id: string) => void
  upsertWealthItem: (data: Omit<WealthItem, 'id'> & { id?: string }) => void
  deleteWealthItem: (id: string) => void
  recordWealthSnapshot: () => void
  clearAllData: () => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

function migrateExpenseCategory(category: string): ExpenseCategory {
  if (category === 'transportation') return 'others'
  const allowed: ExpenseCategory[] = [
    'housing',
    'car',
    'family',
    'food',
    'phone',
    'utilities',
    'entertainment',
    'shopping',
    'others',
  ]
  return allowed.includes(category as ExpenseCategory)
    ? (category as ExpenseCategory)
    : 'others'
}

function normalizeState(parsed: Partial<FinanceState>): FinanceState | null {
  if (
    !parsed ||
    !Array.isArray(parsed.incomes) ||
    !Array.isArray(parsed.expenses) ||
    !Array.isArray(parsed.goals) ||
    !Array.isArray(parsed.commitments)
  ) {
    return null
  }

  return {
    incomes: parsed.incomes,
    expenses: parsed.expenses.map((e) => ({
      ...e,
      category: migrateExpenseCategory(e.category as string),
    })),
    goals: parsed.goals,
    commitments: parsed.commitments,
    grabRecords: Array.isArray(parsed.grabRecords) ? parsed.grabRecords : [],
    wealthItems: Array.isArray(parsed.wealthItems) ? parsed.wealthItems : [],
    wealthSnapshots: Array.isArray(parsed.wealthSnapshots)
      ? parsed.wealthSnapshots
      : [],
  }
}

function loadState(): FinanceState {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      for (const key of LEGACY_STORAGE_KEYS) {
        const legacy = localStorage.getItem(key)
        if (legacy) {
          raw = legacy
          break
        }
      }
    }
    if (!raw) return createEmptyState()
    const parsed = JSON.parse(raw) as Partial<FinanceState>
    return normalizeState(parsed) ?? createEmptyState()
  } catch {
    return createEmptyState()
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(() => loadState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addIncome = useCallback((data: Omit<Income, 'id'>) => {
    setState((prev) => ({
      ...prev,
      incomes: [{ ...data, id: uid() }, ...prev.incomes],
    }))
  }, [])

  const updateIncome = useCallback((id: string, data: Omit<Income, 'id'>) => {
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.map((item) =>
        item.id === id ? { ...data, id } : item,
      ),
    }))
  }, [])

  const deleteIncome = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((item) => item.id !== id),
    }))
  }, [])

  const addExpense = useCallback((data: Omit<Expense, 'id'>) => {
    setState((prev) => ({
      ...prev,
      expenses: [{ ...data, id: uid() }, ...prev.expenses],
    }))
  }, [])

  const updateExpense = useCallback((id: string, data: Omit<Expense, 'id'>) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((item) =>
        item.id === id ? { ...data, id } : item,
      ),
    }))
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((item) => item.id !== id),
    }))
  }, [])

  const addGoal = useCallback((data: Omit<Goal, 'id'>) => {
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, { ...data, id: uid() }],
    }))
  }, [])

  const updateGoal = useCallback((id: string, data: Omit<Goal, 'id'>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((item) =>
        item.id === id ? { ...data, id } : item,
      ),
    }))
  }, [])

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((item) => item.id !== id),
    }))
  }, [])

  const addCommitment = useCallback((data: Omit<Commitment, 'id'>) => {
    setState((prev) => ({
      ...prev,
      commitments: [...prev.commitments, { ...data, id: uid() }],
    }))
  }, [])

  const updateCommitment = useCallback(
    (id: string, data: Omit<Commitment, 'id'>) => {
      setState((prev) => ({
        ...prev,
        commitments: prev.commitments.map((item) =>
          item.id === id ? { ...data, id } : item,
        ),
      }))
    },
    [],
  )

  const deleteCommitment = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      commitments: prev.commitments.filter((item) => item.id !== id),
    }))
  }, [])

  const addGrabRecord = useCallback((data: Omit<GrabRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      grabRecords: [{ ...data, id: uid() }, ...(prev.grabRecords ?? [])],
    }))
  }, [])

  const updateGrabRecord = useCallback(
    (id: string, data: Omit<GrabRecord, 'id'>) => {
      setState((prev) => ({
        ...prev,
        grabRecords: (prev.grabRecords ?? []).map((item) =>
          item.id === id ? { ...data, id } : item,
        ),
      }))
    },
    [],
  )

  const deleteGrabRecord = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      grabRecords: (prev.grabRecords ?? []).filter((item) => item.id !== id),
    }))
  }, [])

  const upsertWealthItem = useCallback(
    (data: Omit<WealthItem, 'id'> & { id?: string }) => {
      setState((prev) => {
        const items = prev.wealthItems ?? []
        if (data.id) {
          return {
            ...prev,
            wealthItems: items.map((item) =>
              item.id === data.id
                ? {
                    id: data.id,
                    kind: data.kind,
                    category: data.category,
                    label: data.label,
                    amount: data.amount,
                  }
                : item,
            ),
          }
        }
        return {
          ...prev,
          wealthItems: [
            ...items,
            {
              id: uid(),
              kind: data.kind,
              category: data.category,
              label: data.label,
              amount: data.amount,
            },
          ],
        }
      })
    },
    [],
  )

  const deleteWealthItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      wealthItems: (prev.wealthItems ?? []).filter((item) => item.id !== id),
    }))
  }, [])

  const recordWealthSnapshot = useCallback(() => {
    setState((prev) => {
      const totals = wealthTotals(prev.wealthItems ?? [])
      const snapshot: WealthSnapshot = {
        id: uid(),
        date: todayISO(),
        totalAssets: totals.assets,
        totalLiabilities: totals.liabilities,
        netWorth: totals.netWorth,
      }
      const withoutToday = (prev.wealthSnapshots ?? []).filter(
        (s) => s.date !== snapshot.date,
      )
      return {
        ...prev,
        wealthSnapshots: [...withoutToday, snapshot],
      }
    })
  }, [])

  const persistAndSet = useCallback((next: FinanceState) => {
    try {
      for (const key of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(key)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    setState(next)
  }, [])

  const clearAllData = useCallback(() => {
    persistAndSet(createEmptyState())
  }, [persistAndSet])

  const value = useMemo(
    () => ({
      state,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      addGoal,
      updateGoal,
      deleteGoal,
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addGrabRecord,
      updateGrabRecord,
      deleteGrabRecord,
      upsertWealthItem,
      deleteWealthItem,
      recordWealthSnapshot,
      clearAllData,
    }),
    [
      state,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      addGoal,
      updateGoal,
      deleteGoal,
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addGrabRecord,
      updateGrabRecord,
      deleteGrabRecord,
      upsertWealthItem,
      deleteWealthItem,
      recordWealthSnapshot,
      clearAllData,
    ],
  )

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  )
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext)
  if (!ctx) {
    throw new Error('useFinance must be used within FinanceProvider')
  }
  return ctx
}
