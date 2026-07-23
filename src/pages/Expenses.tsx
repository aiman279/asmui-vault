import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from '../constants'
import { useFinance } from '../hooks/useFinance'
import { useLanguage } from '../hooks/useLanguage'
import type { TranslationKey } from '../i18n/translations'
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
  const { t } = useLanguage()
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
          <h1>{t('spend.title')}</h1>
          <p className="muted">{t('spend.sub')}</p>
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
          {open && !editingId ? t('common.close') : t('spend.add')}
        </button>
      </section>

      <section className="panel hero-balance hero-balance--compact">
        <p className="eyebrow">{formatMonthLabel(year, monthNum - 1)}</p>
        <p className="hero-balance__label">{t('spend.totalMonth')}</p>
        <p className="hero-balance__value hero-balance__value--sm">
          {formatMoney(liveMonthTotal)}
        </p>
        <p className="hero-balance__sub">
          {monthExpenses.length}{' '}
          {monthExpenses.length === 1 ? t('spend.count') : t('spend.countPlural')}
          {open ? ` · ${t('spend.updating')}` : ''}
        </p>
      </section>

      {monthTotal > 0 || prevMonthTotal > 0 ? (
        <section className="panel">
          <div className="summary-rows">
            <div className="summary-row">
              <span>{t('spend.biggest')}</span>
              <strong>
                {biggest.category
                  ? t(`cat.${biggest.category}` as TranslationKey)
                  : '—'}
              </strong>
            </div>
            {biggest.category ? (
              <div className="summary-row">
                <span>
                  {t(`cat.${biggest.category}` as TranslationKey)}
                </span>
                <strong className="text-danger">
                  {formatMoney(biggest.amount)}
                </strong>
              </div>
            ) : null}
            <div className="summary-row">
              <span>{t('spend.trend')}</span>
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
                  ? t('spend.noLastMonth')
                  : `${spendTrend > 0 ? '+' : ''}${Math.round(spendTrend)}% ${t('spend.vsLast')}`}
              </strong>
            </div>
          </div>
        </section>
      ) : null}

      {open ? (
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>{editingId ? t('spend.edit') : t('spend.new')}</h2>
          <label>
            {t('common.date')}
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </label>
          <label>
            {t('spend.category')}
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
                  {t(`cat.${category.value}` as TranslationKey)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('common.amount')}
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
            {t('spend.payment')}
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
                  {t(`pay.${method.value}` as TranslationKey)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('common.notes')}
            <input
              type="text"
              placeholder={t('common.optional')}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="net-preview">
            <span>{t('spend.totalMonth')}</span>
            <strong className="text-danger">{formatMoney(liveMonthTotal)}</strong>
            <p className="muted">
              {draftInThisMonth
                ? editingId
                  ? t('spend.afterEdit')
                  : t('spend.plusThis')
                : t('spend.outsideMonth')}
            </p>
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? t('common.save') : t('spend.save')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : null}

      <section className="panel">
        <div className="panel__head">
          <h2>{t('spend.recent')}</h2>
          <span className="badge">{formatMoney(monthTotal)}</span>
        </div>
        {sorted.length === 0 ? (
          <EmptyState
            title={t('spend.empty')}
            description={t('spend.emptyDesc')}
          />
        ) : (
          <>
            <ul className="entry-list">
              {sorted.map((item) => (
                <li key={item.id} className="entry">
                  <div>
                    <p className="entry__title">
                      {t(`cat.${item.category}` as TranslationKey)}
                    </p>
                    <p className="entry__meta">
                      {formatDate(item.date)} ·{' '}
                      {t(`pay.${item.paymentMethod}` as TranslationKey)}
                      {item.notes ? ` · ${item.notes}` : ''}
                    </p>
                  </div>
                  <div className="entry__right">
                    <p className="entry__amount entry__amount--out">
                      −{formatMoney(item.amount)}
                    </p>
                    <div className="entry__actions">
                      <button type="button" onClick={() => startEdit(item)}>
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExpense(item.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="summary-row summary-row--total commitment-total">
              <span>{t('spend.totalMonth')}</span>
              <strong className="text-danger">{formatMoney(monthTotal)}</strong>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
