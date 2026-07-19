import type { ExpenseCategory, IncomeSource, PaymentMethod } from './types'

export const STORAGE_KEY = 'pocket-finance-v2'

export const INCOME_SOURCES: { value: IncomeSource; label: string }[] = [
  { value: 'salary', label: 'Salary' },
  { value: 'side', label: 'Side income' },
  { value: 'other', label: 'Other income' },
]

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'housing', label: 'Housing' },
  { value: 'car', label: 'Car' },
  { value: 'family', label: 'Family support' },
  { value: 'food', label: 'Food & groceries' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'others', label: 'Others' },
]

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'ewallet', label: 'E-wallet' },
  { value: 'bank', label: 'Bank transfer' },
]

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<ExpenseCategory, string>

export const SOURCE_LABELS: Record<IncomeSource, string> = Object.fromEntries(
  INCOME_SOURCES.map((s) => [s.value, s.label]),
) as Record<IncomeSource, string>
