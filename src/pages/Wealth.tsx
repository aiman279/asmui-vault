import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import {
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
} from '../constants'
import { useFinance } from '../hooks/useFinance'
import type {
  AssetCategory,
  LiabilityCategory,
  WealthItem,
} from '../types'
import {
  filterSnapshots,
  liquidMoney,
  runwayMonths,
  wealthTotals,
  type RunwayScenario,
} from '../utils/calculations'
import { formatMoney, formatPercent } from '../utils/format'

type Range = '1m' | '3m' | '1y' | 'all'

const emptyAsset = {
  category: 'cash' as AssetCategory,
  amount: '',
}

const emptyLiability = {
  category: 'carLoan' as LiabilityCategory,
  amount: '',
}

export function WealthPage() {
  const {
    state,
    upsertWealthItem,
    deleteWealthItem,
    recordWealthSnapshot,
  } = useFinance()
  const [range, setRange] = useState<Range>('3m')
  const [scenario, setScenario] = useState<RunwayScenario>('realistic')
  const [assetForm, setAssetForm] = useState(emptyAsset)
  const [liabilityForm, setLiabilityForm] = useState(emptyLiability)
  const [editing, setEditing] = useState<WealthItem | null>(null)

  const items = state.wealthItems ?? []
  const totals = wealthTotals(items)
  const liquid = liquidMoney(items)
  const runway = runwayMonths(state, scenario)
  const snapshots = useMemo(
    () => filterSnapshots(state.wealthSnapshots ?? [], range),
    [state.wealthSnapshots, range],
  )

  const change =
    snapshots.length >= 2
      ? snapshots[snapshots.length - 1].netWorth - snapshots[0].netWorth
      : null

  const assets = items.filter((i) => i.kind === 'asset')
  const liabilities = items.filter((i) => i.kind === 'liability')

  function saveAsset(e: FormEvent) {
    e.preventDefault()
    const amount = Number(assetForm.amount)
    if (!Number.isFinite(amount) || amount < 0) return
    const meta = ASSET_CATEGORIES.find((c) => c.value === assetForm.category)!
    upsertWealthItem({
      id: editing?.kind === 'asset' ? editing.id : undefined,
      kind: 'asset',
      category: assetForm.category,
      label: meta.label,
      amount,
    })
    setAssetForm(emptyAsset)
    setEditing(null)
  }

  function saveLiability(e: FormEvent) {
    e.preventDefault()
    const amount = Number(liabilityForm.amount)
    if (!Number.isFinite(amount) || amount < 0) return
    const meta = LIABILITY_CATEGORIES.find(
      (c) => c.value === liabilityForm.category,
    )!
    upsertWealthItem({
      id: editing?.kind === 'liability' ? editing.id : undefined,
      kind: 'liability',
      category: liabilityForm.category,
      label: meta.label,
      amount,
    })
    setLiabilityForm(emptyLiability)
    setEditing(null)
  }

  function startEdit(item: WealthItem) {
    setEditing(item)
    if (item.kind === 'asset') {
      setAssetForm({
        category: item.category as AssetCategory,
        amount: String(item.amount),
      })
    } else {
      setLiabilityForm({
        category: item.category as LiabilityCategory,
        amount: String(item.amount),
      })
    }
  }

  const maxSnap = Math.max(...snapshots.map((s) => Math.abs(s.netWorth)), 1)

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>Wealth</h1>
          <p className="muted">Net worth, growth, and how long your money lasts.</p>
        </div>
      </section>

      <section className="panel grab-hero">
        <p className="eyebrow">Net worth</p>
        <p className="grab-hero__label">Current net worth</p>
        <p className="grab-hero__value">{formatMoney(totals.netWorth)}</p>
        <p className="muted">
          Assets {formatMoney(totals.assets)} − Liabilities{' '}
          {formatMoney(totals.liabilities)}
        </p>
        <div className="form__actions form__actions--wrap" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => recordWealthSnapshot()}
          >
            Save snapshot
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Wealth growth</h2>
        </div>
        <div className="segmented segmented--4 range-tabs">
          {(
            [
              ['1m', '1M'],
              ['3m', '3M'],
              ['1y', '1Y'],
              ['all', 'All'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`segmented__btn${range === value ? ' is-active' : ''}`}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {snapshots.length === 0 ? (
          <EmptyState
            title="No snapshots yet"
            description="Update assets, then tap Save snapshot to track growth."
          />
        ) : (
          <>
            <p className="wealth-change">
              {change === null
                ? 'Add another snapshot to see growth'
                : change >= 0
                  ? `Your net worth increased by ${formatMoney(change)}`
                  : `Your net worth decreased by ${formatMoney(Math.abs(change))}`}
            </p>
            <div className="spark-bars">
              {snapshots.map((s) => (
                <div key={s.id} className="spark-bars__col" title={s.date}>
                  <div
                    className={`spark-bars__fill${s.netWorth < 0 ? ' is-neg' : ''}`}
                    style={{
                      height: `${Math.max(8, (Math.abs(s.netWorth) / maxSnap) * 100)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Financial runway</h2>
        </div>
        <p className="runway-value">
          {runway >= 99 ? '99+' : runway.toFixed(1)} months
        </p>
        <p className="muted">
          You can survive about{' '}
          <strong>
            {runway >= 99 ? '99+' : Math.floor(runway)} months
          </strong>{' '}
          without income (liquid {formatMoney(liquid)}).
        </p>
        <div className="segmented" style={{ marginTop: 14 }}>
          {(
            [
              ['optimistic', 'Optimistic'],
              ['realistic', 'Realistic'],
              ['conservative', 'Careful'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`segmented__btn${scenario === value ? ' is-active' : ''}`}
              onClick={() => setScenario(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: '0.82rem' }}>
          {scenario === 'optimistic' && 'Assumes lower monthly spend.'}
          {scenario === 'realistic' && 'Uses your current spending pattern.'}
          {scenario === 'conservative' && 'Assumes higher monthly spend.'}
        </p>
        <div style={{ marginTop: 12 }}>
          <ProgressBar
            value={Math.min(100, (runway / 6) * 100)}
            label="Toward 6-month buffer"
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Assets</h2>
        </div>
        <form className="form form--inline" onSubmit={saveAsset}>
          <label>
            Type
            <select
              value={assetForm.category}
              onChange={(e) =>
                setAssetForm((f) => ({
                  ...f,
                  category: e.target.value as AssetCategory,
                }))
              }
            >
              {ASSET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
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
              value={assetForm.amount}
              onChange={(e) =>
                setAssetForm((f) => ({ ...f, amount: e.target.value }))
              }
              required
            />
          </label>
          <button type="submit" className="btn btn--primary">
            {editing?.kind === 'asset' ? 'Save' : 'Add asset'}
          </button>
        </form>
        {assets.length === 0 ? (
          <EmptyState title="No assets yet" description="Add cash, ASB, or investments." />
        ) : (
          <ul className="entry-list">
            {assets.map((item) => (
              <li key={item.id} className="entry">
                <div>
                  <p className="entry__title">{item.label}</p>
                </div>
                <div className="entry__right">
                  <p className="entry__amount entry__amount--in">
                    {formatMoney(item.amount)}
                  </p>
                  <div className="entry__actions">
                    <button type="button" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteWealthItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Liabilities</h2>
        </div>
        <form className="form form--inline" onSubmit={saveLiability}>
          <label>
            Type
            <select
              value={liabilityForm.category}
              onChange={(e) =>
                setLiabilityForm((f) => ({
                  ...f,
                  category: e.target.value as LiabilityCategory,
                }))
              }
            >
              {LIABILITY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
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
              value={liabilityForm.amount}
              onChange={(e) =>
                setLiabilityForm((f) => ({ ...f, amount: e.target.value }))
              }
              required
            />
          </label>
          <button type="submit" className="btn btn--primary">
            {editing?.kind === 'liability' ? 'Save' : 'Add debt'}
          </button>
        </form>
        {liabilities.length === 0 ? (
          <EmptyState title="No debts listed" description="Add car, house, or other loans." />
        ) : (
          <ul className="entry-list">
            {liabilities.map((item) => (
              <li key={item.id} className="entry">
                <div>
                  <p className="entry__title">{item.label}</p>
                </div>
                <div className="entry__right">
                  <p className="entry__amount entry__amount--out">
                    −{formatMoney(item.amount)}
                  </p>
                  <div className="entry__actions">
                    <button type="button" onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteWealthItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {items.length > 0 ? (
          <div className="summary-row summary-row--total commitment-total">
            <span>Net worth</span>
            <strong className={totals.netWorth >= 0 ? 'text-positive' : 'text-danger'}>
              {formatMoney(totals.netWorth)}
            </strong>
            <span className="muted" style={{ width: '100%', marginTop: 4 }}>
              Liquid share of assets:{' '}
              {totals.assets > 0
                ? formatPercent((liquid / totals.assets) * 100)
                : '0%'}
            </span>
          </div>
        ) : null}
      </section>
    </div>
  )
}
