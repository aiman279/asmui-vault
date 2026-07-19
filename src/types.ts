export type IncomeSource = 'salary' | 'side' | 'other'

export type ExpenseCategory =
  | 'housing'
  | 'car'
  | 'family'
  | 'food'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'transportation'
  | 'others'

export type PaymentMethod = 'cash' | 'card' | 'ewallet' | 'bank'

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

export interface FinanceState {
  incomes: Income[]
  expenses: Expense[]
  goals: Goal[]
  commitments: Commitment[]
  grabRecords: GrabRecord[]
}

export interface MonthSummary {
  income: number
  expenses: number
  savings: number
  savingRate: number
  biggestCategory: ExpenseCategory | null
  biggestCategoryAmount: number
}
