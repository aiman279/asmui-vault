import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
} from '../constants'
import { useFinance } from '../hooks/useFinance'
import type {
  Commitment,
  ExpenseCategory,
  IncomeSource,
} from '../types'
import {
  totalCommitments,
  totalIncomeCommitments,
} from '../utils/calculations'
import { formatMoney } from '../utils/format'

const emptyForm = {
  name: '',
  amount: '',
  direction: 'out' as 'in' | 'out',
  dayOfMonth: '1',
  category: 'housing' as ExpenseCategory,
  source: 'salary' as IncomeSource,
}

export function CommitmentsPage() {
  const { state, addCommitment, updateCommitment, deleteCommitment } =
    useFinance()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const outTotal = totalCommitments(state.commitments)
  const inTotal = totalIncomeCommitments(state.commitments)

  function startEdit(item: Commitment) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      amount: String(item.amount),
      direction: item.direction ?? 'out',
      dayOfMonth: String(item.dayOfMonth ?? 1),
      category: item.category ?? 'others',
      source: item.source ?? 'salary',
    })
    setOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setOpen(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    const dayOfMonth = Number(form.dayOfMonth)
    if (!form.name.trim() || !Number.isFinite(amount) || amount < 0) return

    const payload: Omit<Commitment, 'id'> = {
      name: form.name.trim(),
      amount,
      direction: form.direction,
      dayOfMonth: Number.isFinite(dayOfMonth)
        ? Math.min(28, Math.max(1, dayOfMonth))
        : 1,
      category: form.direction === 'out' ? form.category : undefined,
      source: form.direction === 'in' ? form.source : undefined,
    }

    if (editingId) {
      updateCommitment(editingId, payload)
    } else {
      addCommitment(payload)
    }
    resetForm()
  }

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>Recurring</h1>
          <p className="muted">
            Auto-posts each month — salary in, bills out. Edit anytime.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            if (open && !editingId) setOpen(false)
            else {
              setEditingId(null)
              setForm(emptyForm)
              setOpen(true)
            }
          }}
        >
          {open && !editingId ? 'Close' : 'Add recurring'}
        </button>
      </section>

      <section className="panel hero-balance hero-balance--compact">
        <p className="eyebrow">This month auto</p>
        <div className="summary-rows">
          <div className="summary-row">
            <span>Income recurring</span>
            <strong className="text-positive">+{formatMoney(inTotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Expense recurring</span>
            <strong className="text-danger">−{formatMoney(outTotal)}</strong>
          </div>
        </div>
      </section>

      {open ? (
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit recurring' : 'New recurring'}</h2>
          <label>
            Name
            <input
              type="text"
              placeholder="Salary, Rent, Car…"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Type
            <select
              value={form.direction}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  direction: e.target.value as 'in' | 'out',
                }))
              }
            >
              <option value="in">Income (+)</option>
              <option value="out">Expense (−)</option>
            </select>
          </label>
          <label>
            Amount (RM / month)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </label>
          <label>
            Day of month
            <input
              type="number"
              min="1"
              max="28"
              value={form.dayOfMonth}
              onChange={(e) =>
                setForm((f) => ({ ...f, dayOfMonth: e.target.value }))
              }
            />
          </label>
          {form.direction === 'in' ? (
            <label>
              Income source
              <select
                value={form.source}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    source: e.target.value as IncomeSource,
                  }))
                }
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Expense category
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as ExpenseCategory,
                  }))
                }
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="muted form-hint">
            Saves and posts into Income or Spend for this month automatically.
          </p>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? 'Save' : 'Add'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="panel">
        <div className="panel__head">
          <h2>Your recurrings</h2>
        </div>
        {state.commitments.length === 0 ? (
          <EmptyState
            title="No recurrings yet"
            description="Add salary (+), rent (−), car (−), parents (−)."
          />
        ) : (
          <ul className="entry-list">
            {state.commitments.map((item) => (
              <li key={item.id} className="entry">
                <div>
                  <p className="entry__title">{item.name}</p>
                  <p className="entry__meta">
                    {item.direction === 'in' ? 'Income' : 'Expense'} · Day{' '}
                    {item.dayOfMonth ?? 1} · Auto each month
                  </p>
                </div>
                <div className="entry__right">
                  <p
                    className={`entry__amount ${
                      item.direction === 'in'
                        ? 'entry__amount--in'
                        : 'entry__amount--out'
                    }`}
                  >
                    {item.direction === 'in' ? '+' : '−'}
                    {formatMoney(item.amount)}
                  </p>
                  <div className="entry__actions">
                    <button type="button" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommitment(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
