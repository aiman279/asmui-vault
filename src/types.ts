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
  | 'investment'
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

export type RunwayLevel = 'safe' | 'improve' | 'risk'

export type AllocationBucket = 'needs' | 'savings' | 'investment' | 'lifestyle'

export interface Income {
  id: string
  date: string
  source: IncomeSource
  amount: number
  notes: string
  /** Links auto-generated rows to a recurring commitment */
  recurringId?: string
}

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  amount: number
  paymentMethod: PaymentMethod
  notes: string
  recurringId?: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
}

/** Recurring monthly in (+) or out (−). Auto-posts each month. */
export interface Commitment {
  id: string
  name: string
  amount: number
  /** in = salary-style income, out = rent/car/etc */
  direction: 'in' | 'out'
  dayOfMonth: number
  category?: ExpenseCategory
  source?: IncomeSource
}

export interface GrabRecord {
  id: string
  date: string
  grossEarnings: number
  petrolCost: number
  otherCost: number
  credit: number
  drivingHours: number
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
  drivingHours: number
  profitPerHour: number
  bestDay: GrabRecord | null
}

export interface HealthScoreResult {
  score: number
  status: FinancialStatus
  parts: {
    savingsRate: number
    emergency: number
    runway: number
    debt: number
    spending: number
  }
  blurb: string
}

export interface AllocationResult {
  income: number
  needs: number
  lifestyle: number
  investment: number
  savings: number
}
