import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { useFinance } from '../hooks/useFinance'
import type { Goal } from '../types'
import { formatDate, formatMoney, formatPercent } from '../utils/format'
import { goalMilestone } from '../utils/v15'

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
          <p className="muted">Am I making progress toward what matters?</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            if (open && !editingId) {
              setOpen(false)
            } else {
              setEditingId(null)
              setForm(emptyForm)
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

      {state.goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set an emergency fund, house fund, or investment target."
        />
      ) : (
        state.goals.map((goal) => {
          const m = goalMilestone(goal)
          return (
            <section key={goal.id} className="panel goal-card">
              <div className="panel__head">
                <h2>{goal.name}</h2>
                <span className="badge">{formatPercent(m.progress)}</span>
              </div>
              <p className="panel__amount">
                {formatMoney(goal.currentAmount)}
                <span> of {formatMoney(goal.targetAmount)}</span>
              </p>
              <ProgressBar value={m.progress} />
              <div className="goal-milestone">
                <div className="summary-row">
                  <span>Next milestone</span>
                  <strong>{formatMoney(m.nextMilestone)}</strong>
                </div>
                <div className="summary-row">
                  <span>Remaining to milestone</span>
                  <strong>{formatMoney(m.remainingToMilestone)}</strong>
                </div>
                <div className="summary-row">
                  <span>Estimated completion</span>
                  <strong>
                    {m.estimatedMonths === null
                      ? '—'
                      : m.estimatedMonths === 0
                        ? 'Done'
                        : `~${m.estimatedMonths} month${m.estimatedMonths === 1 ? '' : 's'}`}
                  </strong>
                </div>
                <p className="muted" style={{ marginTop: 8 }}>
                  Target date {formatDate(goal.targetDate)}
                </p>
              </div>
              <div className="entry__actions" style={{ marginTop: 12 }}>
                <button type="button" onClick={() => startEdit(goal)}>
                  Edit
                </button>
                <button type="button" onClick={() => deleteGoal(goal.id)}>
                  Delete
                </button>
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
