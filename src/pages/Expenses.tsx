import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from '../constants'
import { useFinance } from '../hooks/useFinance'
import type { Expense, ExpenseCategory, PaymentMethod } from '../types'
import {
  currentMonthKey,
  filterByMonth,
  getBiggestCategory,
  getMonthKey,
  previousMonthKey,
  sumAmounts,
} from '../utils/calculations'
import { formatDate, formatMoney, formatMonthLabel, todayISO } from '../utils/format'

const emptyForm = {
  date: todayISO(),
  category: 'food' as ExpenseCategory,
  amount: '',
  paymentMethod: 'ewallet' as PaymentMethod,
  notes: '',
}

export function ExpensesPage() {
  const { state, addExpense, updateExpense, deleteExpense } = useFinance()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const month = currentMonthKey()
  const prev = previousMonthKey(month)
  const [year, monthNum] = month.split('-').map(Number)
  const sorted = useMemo(
    () => [...state.expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [state.expenses],
  )
  const monthExpenses = useMemo(
    () => filterByMonth(state.expenses, month),
    [state.expenses, month],
  )
  const prevMonthExpenses = useMemo(
    () => filterByMonth(state.expenses, prev),
    [state.expenses, prev],
  )
  const monthTotal = sumAmounts(monthExpenses)
  const prevMonthTotal = sumAmounts(prevMonthExpenses)
  const biggest = getBiggestCategory(monthExpenses)
  const spendTrend =
    prevMonthTotal === 0
      ? null
      : ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100

  const draftAmount = Number(form.amount)
  const draftValid = Number.isFinite(draftAmount) && draftAmount > 0
  const draftInThisMonth = getMonthKey(form.date || todayISO()) === month
  const liveMonthTotal = !open
    ? monthTotal
    : editingId
      ? state.expenses.reduce((sum, item) => {
          if (item.id !== editingId) {
            return getMonthKey(item.date) === month ? sum + item.amount : sum
          }
          if (!draftValid || !draftInThisMonth) return sum
          return sum + draftAmount
        }, 0)
      : monthTotal + (draftValid && draftInThisMonth ? draftAmount : 0)

  function startEdit(item: Expense) {
    setEditingId(item.id)
    setForm({
      date: item.date,
      category: item.category,
      amount: String(item.amount),
      paymentMethod: item.paymentMethod,
      notes: item.notes,
    })
    setOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm, date: todayISO() })
    setOpen(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.date || !Number.isFinite(amount) || amount <= 0) return

    const payload = {
      date: form.date,
      category: form.category,
      amount,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim(),
    }

    if (editingId) {
      updateExpense(editingId, payload)
    } else {
      addExpense(payload)
    }
    resetForm()
  }

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="muted">Quick daily logging — under a minute.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            if (open && !editingId) {
              setOpen(false)
            } else {
              setEditingId(null)
              setForm({ ...emptyForm, date: todayISO() })
              setOpen(true)
            }
          }}
        >
          {open && !editingId ? 'Close' : 'Add expense'}
        </button>
      </section>

      <section className="panel hero-balance hero-balance--compact">
        <p className="eyebrow">{formatMonthLabel(year, monthNum - 1)}</p>
        <p className="hero-balance__label">Total spend this month</p>
        <p className="hero-balance__value hero-balance__value--sm">
          {formatMoney(liveMonthTotal)}
        </p>
        <p className="hero-balance__sub">
          {monthExpenses.length} expense
          {monthExpenses.length === 1 ? '' : 's'}
          {open ? ' · updating as you type' : ''}
        </p>
      </section>

      {monthTotal > 0 || prevMonthTotal > 0 ? (
        <section className="panel">
          <div className="summary-rows">
            <div className="summary-row">
              <span>Biggest category</span>
              <strong>
                {biggest.category
                  ? CATEGORY_LABELS[biggest.category]
                  : '—'}
              </strong>
            </div>
            {biggest.category ? (
              <div className="summary-row">
                <span>{CATEGORY_LABELS[biggest.category]} spend</span>
                <strong className="text-danger">
                  {formatMoney(biggest.amount)}
                </strong>
              </div>
            ) : null}
            <div className="summary-row">
              <span>Spending trend</span>
              <strong
                className={
                  spendTrend === null
                    ? ''
                    : spendTrend > 5
                      ? 'text-danger'
                      : spendTrend < -5
                        ? 'text-positive'
                        : ''
                }
              >
                {spendTrend === null
                  ? 'No last month yet'
                  : `${spendTrend > 0 ? '+' : ''}${Math.round(spendTrend)}% vs last month`}
              </strong>
            </div>
          </div>
        </section>
      ) : null}

      {open ? (
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit expense' : 'New expense'}</h2>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as ExpenseCategory,
                }))
              }
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount (RM)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </label>
          <label>
            Payment method
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  paymentMethod: e.target.value as PaymentMethod,
                }))
              }
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <input
              type="text"
              placeholder="Optional"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="net-preview">
            <span>Total spend this month</span>
            <strong className="text-danger">{formatMoney(liveMonthTotal)}</strong>
            <p className="muted">
              {draftInThisMonth
                ? editingId
                  ? 'Total after this edit'
                  : 'Current month total + this expense'
                : 'This date is outside the current month'}
            </p>
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? 'Save changes' : 'Save expense'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="panel">
        <div className="panel__head">
          <h2>Recent expenses</h2>
          <span className="badge">{formatMoney(monthTotal)}</span>
        </div>
        {sorted.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Log a purchase to see where your money goes."
          />
        ) : (
          <>
            <ul className="entry-list">
              {sorted.map((item) => (
                <li key={item.id} className="entry">
                  <div>
                    <p className="entry__title">
                      {CATEGORY_LABELS[item.category]}
                    </p>
                    <p className="entry__meta">
                      {formatDate(item.date)} ·{' '}
                      {
                        PAYMENT_METHODS.find(
                          (m) => m.value === item.paymentMethod,
                        )?.label
                      }
                      {item.notes ? ` · ${item.notes}` : ''}
                    </p>
                  </div>
                  <div className="entry__right">
                    <p className="entry__amount entry__amount--out">
                      −{formatMoney(item.amount)}
                    </p>
                    <div className="entry__actions">
                      <button type="button" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExpense(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="summary-row summary-row--total commitment-total">
              <span>Total spend this month</span>
              <strong className="text-danger">{formatMoney(monthTotal)}</strong>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
