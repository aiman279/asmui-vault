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
import { currentMonthKey, wealthTotals } from '../utils/calculations'

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
  importBackup: (raw: string) => { ok: true } | { ok: false; error: string }
  exportBackup: () => string
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
    'investment',
    'others',
  ]
  return allowed.includes(category as ExpenseCategory)
    ? (category as ExpenseCategory)
    : 'others'
}

/** Clean paste from WhatsApp / Notes / prompt() */
export function sanitizeBackupRaw(raw: string): string {
  let text = raw.trim()
  text = text.replace(/^\uFEFF/, '')
  text = text.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
  text = text.replace(/[\u2018\u2019\u201A\u201B]/g, "'")
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1)
  }
  return text
}

function normalizeCommitment(raw: Record<string, unknown>): Commitment {
  return {
    id: String(raw.id ?? uid()),
    name: String(raw.name ?? 'Commitment'),
    amount: Number(raw.amount) || 0,
    direction: raw.direction === 'in' ? 'in' : 'out',
    dayOfMonth: Math.min(
      28,
      Math.max(1, Number(raw.dayOfMonth) || 1),
    ),
    category: raw.category
      ? migrateExpenseCategory(String(raw.category))
      : 'others',
    source:
      raw.source === 'salary' || raw.source === 'side' || raw.source === 'other'
        ? raw.source
        : 'salary',
  }
}

function normalizeGrab(raw: Record<string, unknown>): GrabRecord {
  return {
    id: String(raw.id ?? uid()),
    date: String(raw.date ?? todayISO()),
    grossEarnings: Number(raw.grossEarnings) || 0,
    petrolCost: Number(raw.petrolCost) || 0,
    otherCost: Number(raw.otherCost) || 0,
    credit: Number(raw.credit) || 0,
    drivingHours: Number(raw.drivingHours) || 0,
    notes: String(raw.notes ?? ''),
  }
}

function normalizeState(parsed: Partial<FinanceState>): FinanceState | null {
  if (!parsed || typeof parsed !== 'object') return null

  const incomes = Array.isArray(parsed.incomes) ? parsed.incomes : null
  const expenses = Array.isArray(parsed.expenses) ? parsed.expenses : null
  if (!incomes || !expenses) return null

  return {
    incomes: incomes.map((i) => ({
      ...i,
      recurringId: i.recurringId,
    })),
    expenses: expenses.map((e) => ({
      ...e,
      category: migrateExpenseCategory(e.category as string),
      recurringId: e.recurringId,
    })),
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    commitments: Array.isArray(parsed.commitments)
      ? parsed.commitments.map((c) =>
          normalizeCommitment(c as unknown as Record<string, unknown>),
        )
      : [],
    grabRecords: Array.isArray(parsed.grabRecords)
      ? parsed.grabRecords.map((g) =>
          normalizeGrab(g as unknown as Record<string, unknown>),
        )
      : [],
    wealthItems: Array.isArray(parsed.wealthItems) ? parsed.wealthItems : [],
    wealthSnapshots: Array.isArray(parsed.wealthSnapshots)
      ? parsed.wealthSnapshots
      : [],
  }
}

/** Post recurring salary / bills for the current month once */
export function applyRecurringForMonth(
  state: FinanceState,
  monthKey = currentMonthKey(),
): FinanceState {
  let incomes = [...state.incomes]
  let expenses = [...state.expenses]
  let changed = false

  for (const c of state.commitments ?? []) {
    const day = String(Math.min(28, Math.max(1, c.dayOfMonth || 1))).padStart(
      2,
      '0',
    )
    const date = `${monthKey}-${day}`

    if (c.direction === 'in') {
      if (
        incomes.some(
          (i) => i.recurringId === c.id && i.date.startsWith(monthKey),
        )
      ) {
        continue
      }
      incomes = [
        {
          id: uid(),
          date,
          source: c.source ?? 'salary',
          amount: c.amount,
          notes: `Auto · ${c.name}`,
          recurringId: c.id,
        },
        ...incomes,
      ]
      changed = true
    } else {
      if (
        expenses.some(
          (e) => e.recurringId === c.id && e.date.startsWith(monthKey),
        )
      ) {
        continue
      }
      expenses = [
        {
          id: uid(),
          date,
          category: c.category ?? 'others',
          amount: c.amount,
          paymentMethod: 'bank',
          notes: `Auto · ${c.name}`,
          recurringId: c.id,
        },
        ...expenses,
      ]
      changed = true
    }
  }

  if (!changed) return state
  return { ...state, incomes, expenses }
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
    const normalized = normalizeState(parsed) ?? createEmptyState()
    return applyRecurringForMonth(normalized)
  } catch {
    return createEmptyState()
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(() => loadState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Re-apply recurrings when month rolls over while app stays open
  useEffect(() => {
    setState((prev) => applyRecurringForMonth(prev))
  }, [])

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
    setState((prev) => {
      const next = {
        ...prev,
        commitments: [...prev.commitments, { ...data, id: uid() }],
      }
      return applyRecurringForMonth(next)
    })
  }, [])

  const updateCommitment = useCallback(
    (id: string, data: Omit<Commitment, 'id'>) => {
      setState((prev) => {
        const next = {
          ...prev,
          commitments: prev.commitments.map((item) =>
            item.id === id ? { ...data, id } : item,
          ),
        }
        return applyRecurringForMonth(next)
      })
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

  const exportBackup = useCallback(() => JSON.stringify(state), [state])

  const importBackup = useCallback(
    (raw: string): { ok: true } | { ok: false; error: string } => {
      try {
        const cleaned = sanitizeBackupRaw(raw)
        if (!cleaned.startsWith('{')) {
          return {
            ok: false,
            error: 'Paste the full backup text (must start with { )',
          }
        }
        const parsed = JSON.parse(cleaned) as Partial<FinanceState>
        const next = normalizeState(parsed)
        if (!next) {
          return {
            ok: false,
            error: 'Backup incomplete — need incomes & expenses lists',
          }
        }
        persistAndSet(next)
        return { ok: true }
      } catch {
        return {
          ok: false,
          error: 'Invalid backup — WhatsApp may have cut the text. Try Notes.',
        }
      }
    },
    [persistAndSet],
  )

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
      importBackup,
      exportBackup,
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
      importBackup,
      exportBackup,
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
