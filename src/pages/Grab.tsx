import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PieChart } from '../components/PieChart'
import { StatCard } from '../components/StatCard'
import { useFinance } from '../hooks/useFinance'
import type { GrabRecord } from '../types'
import {
  currentMonthKey,
  filterByMonth,
  shiftMonthKey,
} from '../utils/calculations'
import {
  formatDate,
  formatMoney,
  formatMonthLabel,
  todayISO,
} from '../utils/format'
import {
  buildGrabInsights,
  filterByWeek,
  formatWeekLabel,
  grabBreakdownPercents,
  grabNetProfit,
  groupGrabByWeek,
  shiftWeek,
  summarizeGrabMonth,
  summarizeGrabWeek,
} from '../utils/grab'

const emptyForm = {
  date: todayISO(),
  grossEarnings: '',
  petrolCost: '',
  otherCost: '',
  credit: '',
  notes: '',
}

function parseAmount(value: string): number {
  if (value.trim() === '') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

type Tab = 'day' | 'week' | 'month'

export function GrabPage() {
  const { state, addGrabRecord, updateGrabRecord, deleteGrabRecord } =
    useFinance()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('day')
  const [weekAnchor, setWeekAnchor] = useState(todayISO())
  const [monthKey, setMonthKey] = useState(currentMonthKey())

  const [year, monthNum] = monthKey.split('-').map(Number)

  const weekSummary = useMemo(
    () => summarizeGrabWeek(state.grabRecords, weekAnchor),
    [state.grabRecords, weekAnchor],
  )
  const monthSummary = useMemo(
    () => summarizeGrabMonth(state.grabRecords, monthKey),
    [state.grabRecords, monthKey],
  )

  const recentDays = useMemo(
    () =>
      [...state.grabRecords].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14),
    [state.grabRecords],
  )

  const weekRecords = useMemo(
    () =>
      [...filterByWeek(state.grabRecords, weekAnchor)].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [state.grabRecords, weekAnchor],
  )

  const monthRecords = useMemo(
    () =>
      [...filterByMonth(state.grabRecords, monthKey)].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [state.grabRecords, monthKey],
  )

  const weekGroups = useMemo(
    () => groupGrabByWeek(monthRecords),
    [monthRecords],
  )

  const liveNet = grabNetProfit({
    grossEarnings: parseAmount(form.grossEarnings),
    petrolCost: parseAmount(form.petrolCost),
    otherCost: parseAmount(form.otherCost),
    credit: parseAmount(form.credit),
  })

  function openNewForm() {
    setEditingId(null)
    setForm({ ...emptyForm, date: todayISO() })
    setFormOpen(true)
    setTab('day')
  }

  function startEdit(item: GrabRecord) {
    setEditingId(item.id)
    setForm({
      date: item.date,
      grossEarnings: String(item.grossEarnings),
      petrolCost: String(item.petrolCost),
      otherCost: String(item.otherCost),
      credit: String(item.credit),
      notes: item.notes,
    })
    setFormOpen(true)
    setTab('day')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm, date: todayISO() })
    setFormOpen(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const grossEarnings = parseAmount(form.grossEarnings)
    if (!form.date || grossEarnings <= 0) return

    const payload = {
      date: form.date,
      grossEarnings,
      petrolCost: Math.max(0, parseAmount(form.petrolCost)),
      otherCost: Math.max(0, parseAmount(form.otherCost)),
      credit: Math.max(0, parseAmount(form.credit)),
      notes: form.notes.trim(),
    }

    if (editingId) {
      updateGrabRecord(editingId, payload)
    } else {
      addGrabRecord(payload)
    }
    resetForm()
  }

  function renderDay(item: GrabRecord) {
    const net = grabNetProfit(item)
    return (
      <li key={item.id} className="entry">
        <div>
          <p className="entry__title">{formatDate(item.date)}</p>
          <p className="entry__meta">
            Earn {formatMoney(item.grossEarnings)}
            {item.petrolCost > 0 ? ` · Gas ${formatMoney(item.petrolCost)}` : ''}
            {item.otherCost > 0 ? ` · Other ${formatMoney(item.otherCost)}` : ''}
            {item.credit > 0 ? ` · Credit ${formatMoney(item.credit)}` : ''}
            {item.notes ? ` · ${item.notes}` : ''}
          </p>
        </div>
        <div className="entry__right">
          <p
            className={`entry__amount ${
              net >= 0 ? 'entry__amount--in' : 'entry__amount--out'
            }`}
          >
            {formatMoney(net)}
          </p>
          <div className="entry__actions">
            <button type="button" onClick={() => startEdit(item)}>
              Edit
            </button>
            <button type="button" onClick={() => deleteGrabRecord(item.id)}>
              Delete
            </button>
          </div>
        </div>
      </li>
    )
  }

  function renderTrackView(
    summary: typeof weekSummary,
    label: string,
    profitTitle: string,
    records: GrabRecord[],
    mode: 'week' | 'month',
  ) {
    const percents = grabBreakdownPercents(summary)

    return (
      <>
        <section className="grab-hero panel">
          <p className="eyebrow">{label}</p>
          <p className="grab-hero__label">{profitTitle}</p>
          <p className="grab-hero__value">{formatMoney(summary.netProfit)}</p>
          <p className="muted">
            From daily logs — after petrol, other cost, and credit.
          </p>
        </section>

        <section className="stat-grid numbers-grid">
          <StatCard
            label="Best Earning Day"
            value={
              summary.bestDay
                ? formatMoney(grabNetProfit(summary.bestDay))
                : '—'
            }
            tone="positive"
          >
            {summary.bestDay ? (
              <span className="stat-card__note">
                {formatDate(summary.bestDay.date)}
              </span>
            ) : (
              <span className="stat-card__note">No days yet</span>
            )}
          </StatCard>
          <StatCard
            label="Average Profit Per Day"
            value={formatMoney(summary.averageDailyProfit)}
          />
          <StatCard label="Days Active" value={String(summary.drivingDays)} />
          <StatCard
            label="Total Gross"
            value={formatMoney(summary.grossEarnings)}
            tone="positive"
          />
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Costs</h2>
          </div>
          <div className="summary-rows">
            <div className="summary-row">
              <span>Total Petrol Cost</span>
              <strong className="text-danger">
                {formatMoney(summary.petrolCost)}
              </strong>
            </div>
            <div className="summary-row">
              <span>Total Other Cost</span>
              <strong className="text-danger">
                {formatMoney(summary.otherCost)}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <PieChart
            title="Grab Income Breakdown"
            baseTotal={summary.grossEarnings}
            centerValue={
              summary.grossEarnings > 0
                ? `${Math.round(percents.netProfit)}%`
                : '—'
            }
            centerLabel="Net profit"
            slices={[
              {
                label: 'Net Profit',
                amount: Math.max(0, summary.netProfit),
                color: '#1a9a6c',
              },
              {
                label: 'Petrol Cost',
                amount: summary.petrolCost,
                color: '#d4543c',
              },
              {
                label: 'Other Cost',
                amount: summary.otherCost,
                color: '#e0a83a',
              },
            ]}
          />
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Performance insights</h2>
          </div>
          <ul className="insights">
            {buildGrabInsights(
              state.grabRecords,
              mode === 'month' ? monthKey : currentMonthKey(),
            ).map((insight) => (
              <li
                key={insight.id}
                className={`insight insight--${insight.tone}`}
              >
                {insight.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>{mode === 'month' ? 'Week logs' : 'Daily logs'}</h2>
          </div>
          {records.length === 0 ? (
            <EmptyState
              title="No days in this period"
              description="Key in a day first, then check back here."
            />
          ) : mode === 'month' ? (
            <ul className="entry-list">
              {weekGroups.map((group) => (
                <li key={group.weekKey} className="entry">
                  <div>
                    <p className="entry__title">{group.label}</p>
                    <p className="entry__meta">
                      {group.summary.drivingDays} day
                      {group.summary.drivingDays === 1 ? '' : 's'}
                      {' · '}
                      Petrol {formatMoney(group.summary.petrolCost)}
                      {' · '}
                      Other {formatMoney(group.summary.otherCost)}
                    </p>
                  </div>
                  <div className="entry__right">
                    <p className="entry__amount entry__amount--in">
                      {formatMoney(group.summary.netProfit)}
                    </p>
                    <div className="entry__actions">
                      <button
                        type="button"
                        onClick={() => {
                          setWeekAnchor(group.startDate)
                          setTab('week')
                        }}
                      >
                        View week
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="entry-list">{records.map(renderDay)}</ul>
          )}
        </section>
      </>
    )
  }

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>Grab</h1>
          <p className="muted">Key in by day. Track by week or month.</p>
        </div>
      </section>

      <div className="segmented segmented--3" role="tablist" aria-label="Grab view">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'day'}
          className={`segmented__btn${tab === 'day' ? ' is-active' : ''}`}
          onClick={() => setTab('day')}
        >
          Day
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'week'}
          className={`segmented__btn${tab === 'week' ? ' is-active' : ''}`}
          onClick={() => setTab('week')}
        >
          Week
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'month'}
          className={`segmented__btn${tab === 'month' ? ' is-active' : ''}`}
          onClick={() => setTab('month')}
        >
          Month
        </button>
      </div>

      {tab === 'day' ? (
        <>
          <section className="page-header page-header--compact">
            <div>
              <h2>Daily logs</h2>
              <p className="muted">Tap Key in when you finish a drive.</p>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                if (formOpen && !editingId) {
                  resetForm()
                } else {
                  openNewForm()
                }
              }}
            >
              {formOpen && !editingId ? 'Close' : 'Key in'}
            </button>
          </section>

          {formOpen ? (
            <form className="panel form" onSubmit={handleSubmit}>
              <h2>{editingId ? 'Edit day' : 'Key in day'}</h2>
              <p className="muted form-hint">
                Log one driving day. Week & Month will update automatically.
              </p>
              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Gross Earnings (Earn)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="151.63"
                  value={form.grossEarnings}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, grossEarnings: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Petrol / Gas Cost
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="30"
                  value={form.petrolCost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, petrolCost: e.target.value }))
                  }
                />
              </label>
              <label>
                Other Cost
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.otherCost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, otherCost: e.target.value }))
                  }
                />
              </label>
              <label>
                Credit / Advance
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.credit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, credit: e.target.value }))
                  }
                />
              </label>
              <label>
                Notes
                <input
                  type="text"
                  placeholder="Optional"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </label>

              <div className="net-preview">
                <span>Net Profit</span>
                <strong
                  className={liveNet >= 0 ? 'text-positive' : 'text-danger'}
                >
                  {formatMoney(liveNet)}
                </strong>
                <p className="muted">Earn − Petrol − Other − Credit</p>
              </div>

              <div className="form__actions">
                <button type="submit" className="btn btn--primary">
                  {editingId ? 'Save changes' : 'Save day'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <section className="panel">
            <div className="panel__head">
              <h2>Recent days</h2>
            </div>
            {recentDays.length === 0 ? (
              <EmptyState
                title="No days yet"
                description="Tap Key in to log your first Grab day."
              />
            ) : (
              <ul className="entry-list">{recentDays.map(renderDay)}</ul>
            )}
          </section>
        </>
      ) : null}

      {tab === 'week' ? (
        <>
          <div className="week-nav">
            <button
              type="button"
              className="btn btn--ghost week-nav__btn"
              onClick={() => setWeekAnchor((d) => shiftWeek(d, -1))}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="btn btn--ghost week-nav__btn"
              onClick={() => setWeekAnchor(todayISO())}
            >
              This week
            </button>
            <button
              type="button"
              className="btn btn--ghost week-nav__btn"
              onClick={() => setWeekAnchor((d) => shiftWeek(d, 1))}
            >
              Next →
            </button>
          </div>
          {renderTrackView(
            weekSummary,
            formatWeekLabel(weekAnchor),
            'Week Grab Profit',
            weekRecords,
            'week',
          )}
        </>
      ) : null}

      {tab === 'month' ? (
        <>
          <div className="week-nav">
            <button
              type="button"
              className="btn btn--ghost week-nav__btn"
              onClick={() => setMonthKey((m) => shiftMonthKey(m, -1))}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="btn btn--ghost week-nav__btn"
              onClick={() => setMonthKey(currentMonthKey())}
            >
              This month
            </button>
            <button
              type="button"
              className="btn btn--ghost week-nav__btn"
              onClick={() => setMonthKey((m) => shiftMonthKey(m, 1))}
            >
              Next →
            </button>
          </div>
          {renderTrackView(
            monthSummary,
            formatMonthLabel(year, monthNum - 1),
            'Month Grab Profit',
            monthRecords,
            'month',
          )}
        </>
      ) : null}
    </div>
  )
}
