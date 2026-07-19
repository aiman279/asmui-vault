import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { useFinance } from '../hooks/useFinance'
import type { Goal } from '../types'
import { goalProgress } from '../utils/calculations'
import { formatDate, formatMoney, formatPercent } from '../utils/format'

const emptyForm = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: '',
}

export function GoalsPage() {
  const { state, addGoal, updateGoal, deleteGoal } = useFinance()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function startEdit(goal: Goal) {
    setEditingId(goal.id)
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate,
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
    const targetAmount = Number(form.targetAmount)
    const currentAmount = Number(form.currentAmount)
    if (
      !form.name.trim() ||
      !form.targetDate ||
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0 ||
      !Number.isFinite(currentAmount) ||
      currentAmount < 0
    ) {
      return
    }

    const payload = {
      name: form.name.trim(),
      targetAmount,
      currentAmount,
      targetDate: form.targetDate,
    }

    if (editingId) {
      updateGoal(editingId, payload)
    } else {
      addGoal(payload)
    }
    resetForm()
  }

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>Goals</h1>
          <p className="muted">Emergency fund, house, and personal targets.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            if (open && !editingId) {
              setOpen(false)
            } else {
              setEditingId(null)
              setForm({
                ...emptyForm,
                targetDate: `${new Date().getFullYear() + 1}-12-31`,
              })
              setOpen(true)
            }
          }}
        >
          {open && !editingId ? 'Close' : 'Add goal'}
        </button>
      </section>

      {open ? (
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit goal' : 'New goal'}</h2>
          <label>
            Goal name
            <input
              type="text"
              placeholder="e.g. Emergency Fund"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Target amount (RM)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.targetAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetAmount: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Current amount (RM)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.currentAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentAmount: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Target date
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetDate: e.target.value }))
              }
              required
            />
          </label>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? 'Save changes' : 'Save goal'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="stack stack--tight">
        {state.goals.length === 0 ? (
          <div className="panel">
            <EmptyState
              title="No goals yet"
              description="Set a simple target to build saving momentum."
            />
          </div>
        ) : (
          state.goals.map((goal) => {
            const progress = goalProgress(goal)
            return (
              <article key={goal.id} className="panel goal-card">
                <div className="panel__head">
                  <h2>{goal.name}</h2>
                  <span className="badge">{formatPercent(progress)}</span>
                </div>
                <p className="panel__amount">
                  {formatMoney(goal.currentAmount)}
                  <span> of {formatMoney(goal.targetAmount)}</span>
                </p>
                <ProgressBar value={progress} />
                <p className="muted goal-card__date">
                  Target: {formatDate(goal.targetDate)}
                </p>
                <div className="entry__actions">
                  <button type="button" onClick={() => startEdit(goal)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteGoal(goal.id)}>
                    Delete
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
