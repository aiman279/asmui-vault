import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { useFinance } from '../hooks/useFinance'
import type { Commitment } from '../types'
import { totalCommitments } from '../utils/calculations'
import { formatMoney } from '../utils/format'

const emptyForm = {
  name: '',
  amount: '',
}

export function CommitmentsPage() {
  const {
    state,
    addCommitment,
    updateCommitment,
    deleteCommitment,
  } = useFinance()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const total = totalCommitments(state.commitments)
  const draftAmount = Number(form.amount)
  const draftValid = Number.isFinite(draftAmount) && draftAmount >= 0
  const liveTotal = !open
    ? total
    : editingId
      ? state.commitments.reduce(
          (sum, item) =>
            sum + (item.id === editingId && draftValid ? draftAmount : item.amount),
          0,
        )
      : total + (draftValid ? draftAmount : 0)

  function startEdit(item: Commitment) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      amount: String(item.amount),
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
    if (!form.name.trim() || !Number.isFinite(amount) || amount < 0) return

    const payload = {
      name: form.name.trim(),
      amount,
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
          <h1>Fixed commitments</h1>
          <p className="muted">Recurring monthly amounts you can edit anytime.</p>
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
          {open && !editingId ? 'Close' : 'Add'}
        </button>
      </section>

      <section className="panel hero-balance hero-balance--compact">
        <p className="hero-balance__label">Total commitments</p>
        <p className="hero-balance__value hero-balance__value--sm">
          {formatMoney(liveTotal)}
        </p>
        <p className="hero-balance__sub">
          {state.commitments.length} item
          {state.commitments.length === 1 ? '' : 's'}
          {open ? ' · updating as you type' : ' · every month'}
        </p>
      </section>

      {open ? (
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit commitment' : 'New commitment'}</h2>
          <label>
            Name
            <input
              type="text"
              placeholder="e.g. Rent"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Amount (RM)
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
          <div className="net-preview">
            <span>Total commitments</span>
            <strong className="text-positive">{formatMoney(liveTotal)}</strong>
            <p className="muted">
              {editingId
                ? 'Total after this edit'
                : 'Current total + this new amount'}
            </p>
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? 'Save changes' : 'Save'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="panel">
        <div className="panel__head">
          <h2>Monthly list</h2>
          <span className="badge">{formatMoney(total)}</span>
        </div>
        {state.commitments.length === 0 ? (
          <EmptyState
            title="No commitments"
            description="Add rent, car, family support, and other fixed costs."
          />
        ) : (
          <>
            <ul className="entry-list">
              {state.commitments.map((item) => (
                <li key={item.id} className="entry">
                  <div>
                    <p className="entry__title">{item.name}</p>
                    <p className="entry__meta">Every month</p>
                  </div>
                  <div className="entry__right">
                    <p className="entry__amount">{formatMoney(item.amount)}</p>
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
            <div className="summary-row summary-row--total commitment-total">
              <span>Total commitments</span>
              <strong className="text-positive">{formatMoney(total)}</strong>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
