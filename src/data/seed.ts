import type { FinanceState } from '../types'
import { uid } from '../utils/format'

function monthDay(offsetMonths: number, day: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offsetMonths)
  d.setDate(day)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function createEmptyState(): FinanceState {
  return {
    incomes: [],
    expenses: [],
    goals: [],
    commitments: [],
    grabRecords: [],
  }
}

export function createSeedState(): FinanceState {
  return {
    incomes: [
      {
        id: uid(),
        date: monthDay(0, 1),
        source: 'salary',
        amount: 4200,
        notes: 'Monthly salary',
      },
      {
        id: uid(),
        date: monthDay(-1, 1),
        source: 'salary',
        amount: 4200,
        notes: 'Monthly salary',
      },
    ],
    expenses: [
      {
        id: uid(),
        date: monthDay(0, 2),
        category: 'housing',
        amount: 510,
        paymentMethod: 'bank',
        notes: 'Rent',
      },
      {
        id: uid(),
        date: monthDay(0, 3),
        category: 'car',
        amount: 410,
        paymentMethod: 'bank',
        notes: 'Car payment',
      },
      {
        id: uid(),
        date: monthDay(0, 3),
        category: 'family',
        amount: 500,
        paymentMethod: 'bank',
        notes: 'Parents',
      },
      {
        id: uid(),
        date: monthDay(0, 5),
        category: 'food',
        amount: 185,
        paymentMethod: 'ewallet',
        notes: 'Groceries & meals',
      },
      {
        id: uid(),
        date: monthDay(0, 7),
        category: 'utilities',
        amount: 150,
        paymentMethod: 'bank',
        notes: 'Utility bill',
      },
      {
        id: uid(),
        date: monthDay(0, 8),
        category: 'entertainment',
        amount: 50,
        paymentMethod: 'card',
        notes: 'Netflix',
      },
      {
        id: uid(),
        date: monthDay(0, 9),
        category: 'others',
        amount: 50,
        paymentMethod: 'bank',
        notes: 'Phone',
      },
      {
        id: uid(),
        date: monthDay(0, 11),
        category: 'food',
        amount: 92,
        paymentMethod: 'cash',
        notes: 'Weekend groceries',
      },
      {
        id: uid(),
        date: monthDay(0, 12),
        category: 'shopping',
        amount: 120,
        paymentMethod: 'card',
        notes: '',
      },
      {
        id: uid(),
        date: monthDay(-1, 2),
        category: 'housing',
        amount: 510,
        paymentMethod: 'bank',
        notes: 'Rent',
      },
      {
        id: uid(),
        date: monthDay(-1, 3),
        category: 'car',
        amount: 410,
        paymentMethod: 'bank',
        notes: 'Car payment',
      },
      {
        id: uid(),
        date: monthDay(-1, 3),
        category: 'family',
        amount: 500,
        paymentMethod: 'bank',
        notes: 'Parents',
      },
      {
        id: uid(),
        date: monthDay(-1, 6),
        category: 'food',
        amount: 140,
        paymentMethod: 'ewallet',
        notes: 'Groceries',
      },
      {
        id: uid(),
        date: monthDay(-1, 10),
        category: 'utilities',
        amount: 145,
        paymentMethod: 'bank',
        notes: 'Utility',
      },
      {
        id: uid(),
        date: monthDay(-1, 14),
        category: 'entertainment',
        amount: 80,
        paymentMethod: 'card',
        notes: 'Movies & Netflix',
      },
    ],
    grabRecords: [
      {
        id: uid(),
        date: monthDay(0, 16),
        grossEarnings: 151.63,
        petrolCost: 30,
        otherCost: 0,
        credit: 0,
        notes: '',
      },
      {
        id: uid(),
        date: monthDay(0, 14),
        grossEarnings: 132.4,
        petrolCost: 28,
        otherCost: 5,
        credit: 0,
        notes: '',
      },
      {
        id: uid(),
        date: monthDay(0, 12),
        grossEarnings: 168.9,
        petrolCost: 35,
        otherCost: 0,
        credit: 20,
        notes: 'Advance deducted',
      },
      {
        id: uid(),
        date: monthDay(0, 9),
        grossEarnings: 118.25,
        petrolCost: 25,
        otherCost: 0,
        credit: 0,
        notes: '',
      },
      {
        id: uid(),
        date: monthDay(-1, 28),
        grossEarnings: 145.5,
        petrolCost: 32,
        otherCost: 0,
        credit: 0,
        notes: '',
      },
      {
        id: uid(),
        date: monthDay(-1, 22),
        grossEarnings: 97.8,
        petrolCost: 22,
        otherCost: 8,
        credit: 0,
        notes: '',
      },
    ],
    goals: [
      {
        id: uid(),
        name: 'Emergency Fund',
        targetAmount: 12000,
        currentAmount: 4800,
        targetDate: `${new Date().getFullYear() + 1}-06-30`,
      },
      {
        id: uid(),
        name: 'House / Future Investment',
        targetAmount: 30000,
        currentAmount: 6500,
        targetDate: `${new Date().getFullYear() + 3}-12-31`,
      },
      {
        id: uid(),
        name: 'Personal Goal',
        targetAmount: 3000,
        currentAmount: 1200,
        targetDate: `${new Date().getFullYear()}-12-31`,
      },
    ],
    commitments: [
      { id: uid(), name: 'Car payment', amount: 410 },
      { id: uid(), name: 'Parents', amount: 500 },
      { id: uid(), name: 'Rent', amount: 510 },
      { id: uid(), name: 'Netflix', amount: 50 },
      { id: uid(), name: 'Phone', amount: 50 },
      { id: uid(), name: 'Utility', amount: 150 },
      { id: uid(), name: 'Grocery', amount: 150 },
    ],
  }
}
