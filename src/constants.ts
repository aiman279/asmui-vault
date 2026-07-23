import type {
  AssetCategory,
  ExpenseCategory,
  IncomeSource,
  LiabilityCategory,
  PaymentMethod,
} from './types'

export const STORAGE_KEY = 'aflow-finance-v1'
export const LEGACY_STORAGE_KEYS = ['pocket-finance-v2', 'pocket-finance-v1']

export const INCOME_SOURCES: { value: IncomeSource; label: string }[] = [
  { value: 'salary', label: 'Salary' },
  { value: 'side', label: 'Other side income' },
  { value: 'other', label: 'Other income' },
]

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'housing', label: 'Housing' },
  { value: 'car', label: 'Car' },
  { value: 'family', label: 'Family support' },
  { value: 'food', label: 'Food' },
  { value: 'phone', label: 'Phone' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'investment', label: 'Investment' },
  { value: 'others', label: 'Others' },
]

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'ewallet', label: 'E-wallet' },
  { value: 'bank', label: 'Bank transfer' },
]

export const ASSET_CATEGORIES: {
  value: AssetCategory
  label: string
  liquid?: boolean
}[] = [
  { value: 'cash', label: 'Cash', liquid: true },
  { value: 'asb', label: 'ASB', liquid: true },
  { value: 'investment', label: 'Investment' },
  { value: 'gold', label: 'Gold' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'property', label: 'Property value' },
]

export const LIABILITY_CATEGORIES: {
  value: LiabilityCategory
  label: string
}[] = [
  { value: 'carLoan', label: 'Car loan' },
  { value: 'houseLoan', label: 'House loan' },
  { value: 'otherDebt', label: 'Other debt' },
]

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<ExpenseCategory, string>

export const SOURCE_LABELS: Record<IncomeSource, string> = Object.fromEntries(
  INCOME_SOURCES.map((s) => [s.value, s.label]),
) as Record<IncomeSource, string>

export const STATUS_LABELS = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
} as const

export const RUNWAY_LABELS = {
  safe: 'Safe',
  improve: 'Need improvement',
  risk: 'Risk',
} as const

export const ALLOCATION_LABELS: Record<
  'needs' | 'savings' | 'investment' | 'lifestyle',
  string
> = {
  needs: 'Needs',
  savings: 'Savings',
  investment: 'Investment',
  lifestyle: 'Lifestyle',
}

export const APP_VERSION = '1.5'
