import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { INCOME_SOURCES, SOURCE_LABELS } from '../constants'
import { useFinance } from '../hooks/useFinance'
import type { Income, IncomeSource } from '../types'
import { formatDate, formatMoney, todayISO } from '../utils/format'

const emptyForm = {
  date: todayISO(),
  source: 'salary' as IncomeSource,
  amount: '',
  notes: '',
}

export function IncomePage() {
  const { state, addIncome, updateIncome, deleteIncome } = useFinance()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const sorted = [...state.incomes].sort((a, b) => b.date.localeCompare(a.date))

  function startEdit(item: Income) {
    setEditingId(item.id)
    setForm({
      date: item.date,
      source: item.source,
      amount: String(item.amount),
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
      source: form.source,
      amount,
      notes: form.notes.trim(),
    }

    if (editingId) {
      updateIncome(editingId, payload)
    } else {
      addIncome(payload)
    }
    resetForm()
  }

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>Income</h1>
          <p className="muted">
            Log salary and other money in. Use Grab tracker for driving days.
          </p>
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
          {open && !editingId ? 'Close' : 'Add income'}
        </button>
      </section>

      {open ? (
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit income' : 'New income'}</h2>
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
              {INCOME_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
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
            Notes
            <input
              type="text"
              placeholder="Optional"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? 'Save changes' : 'Save income'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="panel">
        <div className="panel__head">
          <h2>Recent income</h2>
        </div>
        {sorted.length === 0 ? (
          <EmptyState
            title="No income yet"
            description="Add your salary or side income to start tracking."
          />
        ) : (
          <ul className="entry-list">
            {sorted.map((item) => (
              <li key={item.id} className="entry">
                <div>
                  <p className="entry__title">{SOURCE_LABELS[item.source]}</p>
                  <p className="entry__meta">
                    {formatDate(item.date)}
                    {item.notes ? ` · ${item.notes}` : ''}
                  </p>
                </div>
                <div className="entry__right">
                  <p className="entry__amount entry__amount--in">
                    +{formatMoney(item.amount)}
                  </p>
                  <div className="entry__actions">
                    <button type="button" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteIncome(item.id)}>
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
