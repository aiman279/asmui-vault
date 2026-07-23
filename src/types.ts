export type IncomeSource = 'salary' | 'side' | 'other'

export type ExpenseCategory =
  | 'housing'
  | 'car'
  | 'family'
  | 'food'
  | 'phone'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'others'

export type PaymentMethod = 'cash' | 'card' | 'ewallet' | 'bank'

export type AssetCategory =
  | 'cash'
  | 'asb'
  | 'investment'
  | 'gold'
  | 'stocks'
  | 'crypto'
  | 'property'

export type LiabilityCategory = 'carLoan' | 'houseLoan' | 'otherDebt'

export type FinancialStatus = 'healthy' | 'warning' | 'critical'

export interface Income {
  id: string
  date: string
  source: IncomeSource
  amount: number
  notes: string
}

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  amount: number
  paymentMethod: PaymentMethod
  notes: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
}

export interface Commitment {
  id: string
  name: string
  amount: number
}

export interface GrabRecord {
  id: string
  date: string
  grossEarnings: number
  petrolCost: number
  otherCost: number
  credit: number
  notes: string
}

export interface WealthItem {
  id: string
  kind: 'asset' | 'liability'
  category: AssetCategory | LiabilityCategory
  label: string
  amount: number
}

export interface WealthSnapshot {
  id: string
  date: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}

export interface FinanceState {
  incomes: Income[]
  expenses: Expense[]
  goals: Goal[]
  commitments: Commitment[]
  grabRecords: GrabRecord[]
  wealthItems: WealthItem[]
  wealthSnapshots: WealthSnapshot[]
}

export interface MonthSummary {
  income: number
  expenses: number
  savings: number
  savingRate: number
  biggestCategory: ExpenseCategory | null
  biggestCategoryAmount: number
}

export interface GrabMonthSummary {
  grossEarnings: number
  petrolCost: number
  otherCost: number
  credit: number
  netProfit: number
  averageDailyProfit: number
  drivingDays: number
  bestDay: GrabRecord | null
}
