import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
} from '../constants'
import { useFinance } from '../hooks/useFinance'
import { useLanguage } from '../hooks/useLanguage'
import type { TranslationKey } from '../i18n/translations'
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
  const { t } = useLanguage()
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
          <h1>{t('recur.title')}</h1>
          <p className="muted">{t('recur.sub')}</p>
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
          {open && !editingId ? t('common.close') : t('recur.add')}
        </button>
      </section>

      <section className="panel hero-balance hero-balance--compact">
        <p className="eyebrow">{t('recur.thisMonth')}</p>
        <div className="summary-rows">
          <div className="summary-row">
            <span>{t('recur.incomeRecurring')}</span>
            <strong className="text-positive">+{formatMoney(inTotal)}</strong>
          </div>
          <div className="summary-row">
            <span>{t('recur.expenseRecurring')}</span>
            <strong className="text-danger">−{formatMoney(outTotal)}</strong>
          </div>
        </div>
      </section>

      {open ? (
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>{editingId ? t('recur.edit') : t('recur.new')}</h2>
          <label>
            {t('recur.name')}
            <input
              type="text"
              placeholder="Salary, Rent, Car…"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label>
            {t('recur.type')}
            <select
              value={form.direction}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  direction: e.target.value as 'in' | 'out',
                }))
              }
            >
              <option value="in">{t('recur.incomePlus')}</option>
              <option value="out">{t('recur.expenseMinus')}</option>
            </select>
          </label>
          <label>
            {t('recur.amountMonth')}
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
            {t('recur.day')}
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
              {t('recur.incomeSource')}
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
                    {t(`src.${s.value}` as TranslationKey)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              {t('recur.expenseCat')}
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
                    {t(`cat.${c.value}` as TranslationKey)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="muted form-hint">{t('recur.hint')}</p>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? t('common.save') : t('common.add')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : null}

      <section className="panel">
        <div className="panel__head">
          <h2>{t('recur.list')}</h2>
        </div>
        {state.commitments.length === 0 ? (
          <EmptyState
            title={t('recur.empty')}
            description={t('recur.emptyDesc')}
          />
        ) : (
          <ul className="entry-list">
            {state.commitments.map((item) => (
              <li key={item.id} className="entry">
                <div>
                  <p className="entry__title">{item.name}</p>
                  <p className="entry__meta">
                    {item.direction === 'in'
                      ? t('recur.income')
                      : t('recur.expense')}{' '}
                    · {t('recur.dayLabel')} {item.dayOfMonth ?? 1} ·{' '}
                    {t('recur.auto')}
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
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommitment(item.id)}
                    >
                      {t('common.delete')}
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
