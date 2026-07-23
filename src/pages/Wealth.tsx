import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import {
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
} from '../constants'
import { useFinance } from '../hooks/useFinance'
import { useLanguage } from '../hooks/useLanguage'
import type { TranslationKey } from '../i18n/translations'
import type {
  AssetCategory,
  LiabilityCategory,
  WealthItem,
} from '../types'
import {
  filterSnapshots,
  wealthTotals,
} from '../utils/calculations'
import { formatMoney, formatPercent } from '../utils/format'
import { comfortableRunway, survivalRunway } from '../utils/v15'

type Range = '1m' | '3m' | '1y' | 'all'

function runwayStatus(
  level: 'safe' | 'improve' | 'risk',
): 'healthy' | 'warning' | 'critical' {
  if (level === 'safe') return 'healthy'
  if (level === 'improve') return 'warning'
  return 'critical'
}

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
  const { t } = useLanguage()
  const [range, setRange] = useState<Range>('3m')
  const [assetForm, setAssetForm] = useState(emptyAsset)
  const [liabilityForm, setLiabilityForm] = useState(emptyLiability)
  const [editing, setEditing] = useState<WealthItem | null>(null)

  const items = state.wealthItems ?? []
  const totals = wealthTotals(items)
  const survival = survivalRunway(state)
  const comfortable = comfortableRunway(state)
  const snapshots = useMemo(
    () => filterSnapshots(state.wealthSnapshots ?? [], range),
    [state.wealthSnapshots, range],
  )

  const first = snapshots[0]
  const last = snapshots[snapshots.length - 1]
  const change =
    snapshots.length >= 2 ? last.netWorth - first.netWorth : null
  const assetChange =
    snapshots.length >= 2 ? last.totalAssets - first.totalAssets : null
  const liabilityChange =
    snapshots.length >= 2
      ? last.totalLiabilities - first.totalLiabilities
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
          <h1>{t('wealth.title')}</h1>
          <p className="muted">{t('wealth.sub')}</p>
        </div>
      </section>

      <section className="panel grab-hero">
        <p className="eyebrow">{t('wealth.netWorth')}</p>
        <p className="grab-hero__label">{t('wealth.current')}</p>
        <p className="grab-hero__value">{formatMoney(totals.netWorth)}</p>
        <p className="muted">
          {t('wealth.assets')} {formatMoney(totals.assets)} − {t('wealth.liabilities')}{' '}
          {formatMoney(totals.liabilities)}
        </p>
        <div className="form__actions form__actions--wrap" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => recordWealthSnapshot()}
          >
            {t('wealth.saveSnapshot')}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>{t('wealth.growth')}</h2>
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
            title={t('wealth.noSnap')}
            description={t('wealth.noSnapDesc')}
          />
        ) : (
          <>
            <p className="wealth-change">
              {change === null
                ? t('wealth.addSnap')
                : change >= 0
                  ? `${t('wealth.increased')} ${formatMoney(change)}`
                  : `${t('wealth.decreased')} ${formatMoney(Math.abs(change))}`}
            </p>
            {snapshots.length >= 2 ? (
              <div className="summary-rows" style={{ marginBottom: 12 }}>
                <div className="summary-row">
                  <span>{t('wealth.assetGrowth')}</span>
                  <strong
                    className={
                      (assetChange ?? 0) >= 0 ? 'text-positive' : 'text-danger'
                    }
                  >
                    {(assetChange ?? 0) >= 0 ? '+' : ''}
                    {formatMoney(assetChange ?? 0)}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>{t('wealth.liabilityChange')}</span>
                  <strong
                    className={
                      (liabilityChange ?? 0) <= 0
                        ? 'text-positive'
                        : 'text-danger'
                    }
                  >
                    {(liabilityChange ?? 0) > 0 ? '+' : ''}
                    {formatMoney(liabilityChange ?? 0)}
                  </strong>
                </div>
                {first && last ? (
                  <div className="summary-row">
                    <span>
                      {first.date.slice(0, 7)} → {last.date.slice(0, 7)}
                    </span>
                    <strong>
                      {formatMoney(first.netWorth)} →{' '}
                      {formatMoney(last.netWorth)}
                    </strong>
                  </div>
                ) : null}
              </div>
            ) : null}
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
          <h2>{t('wealth.surviveQ')}</h2>
        </div>
        <div className="runway-pair">
          <div className={`runway-card runway-card--${survival.level}`}>
            <p className="eyebrow">{t('wealth.survival')}</p>
            <p className="runway-value">
              {survival.months >= 99 ? '99+' : survival.months.toFixed(1)} mo
            </p>
            <p className="muted">
              {t('wealth.cashOnly')} {formatMoney(survival.cash)} ÷{' '}
              {t('wealth.monthlySpend')}
            </p>
            <span className={`status-pill status-pill--${runwayStatus(survival.level)}`}>
              <span className="status-pill__dot" aria-hidden="true" />
              {t(`runway.${survival.level}` as TranslationKey)}
            </span>
          </div>
          <div className={`runway-card runway-card--${comfortable.level}`}>
            <p className="eyebrow">{t('wealth.comfortable')}</p>
            <p className="runway-value">
              {comfortable.months >= 99
                ? '99+'
                : comfortable.months.toFixed(1)}{' '}
              mo
            </p>
            <p className="muted">
              {t('wealth.cashAsb')} {formatMoney(comfortable.liquid)} ÷{' '}
              {t('wealth.monthlySpend')}
            </p>
            <span
              className={`status-pill status-pill--${runwayStatus(comfortable.level)}`}
            >
              <span className="status-pill__dot" aria-hidden="true" />
              {t(`runway.${comfortable.level}` as TranslationKey)}
            </span>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <ProgressBar
            value={Math.min(100, (comfortable.months / 6) * 100)}
            label={t('wealth.buffer')}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>{t('wealth.assets')}</h2>
        </div>
        <form className="form form--inline" onSubmit={saveAsset}>
          <label>
            {t('wealth.type')}
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
                  {t(`asset.${c.value}` as TranslationKey)}
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
              value={assetForm.amount}
              onChange={(e) =>
                setAssetForm((f) => ({ ...f, amount: e.target.value }))
              }
              required
            />
          </label>
          <button type="submit" className="btn btn--primary">
            {editing?.kind === 'asset' ? t('common.save') : t('wealth.addAsset')}
          </button>
        </form>
        {assets.length === 0 ? (
          <EmptyState
            title={t('wealth.noAssets')}
            description={t('wealth.noAssetsDesc')}
          />
        ) : (
          <ul className="entry-list">
            {assets.map((item) => (
              <li key={item.id} className="entry">
                <div>
                  <p className="entry__title">
                    {t(`asset.${item.category}` as TranslationKey)}
                  </p>
                </div>
                <div className="entry__right">
                  <p className="entry__amount entry__amount--in">
                    {formatMoney(item.amount)}
                  </p>
                  <div className="entry__actions">
                    <button type="button" onClick={() => startEdit(item)}>
                      {t('common.edit')}
                    </button>
                    <button type="button" onClick={() => deleteWealthItem(item.id)}>
                      {t('common.delete')}
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
          <h2>{t('wealth.liabilities')}</h2>
        </div>
        <form className="form form--inline" onSubmit={saveLiability}>
          <label>
            {t('wealth.type')}
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
                  {t(`debt.${c.value}` as TranslationKey)}
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
              value={liabilityForm.amount}
              onChange={(e) =>
                setLiabilityForm((f) => ({ ...f, amount: e.target.value }))
              }
              required
            />
          </label>
          <button type="submit" className="btn btn--primary">
            {editing?.kind === 'liability' ? t('common.save') : t('wealth.addDebt')}
          </button>
        </form>
        {liabilities.length === 0 ? (
          <EmptyState
            title={t('wealth.noDebts')}
            description={t('wealth.noDebtsDesc')}
          />
        ) : (
          <ul className="entry-list">
            {liabilities.map((item) => (
              <li key={item.id} className="entry">
                <div>
                  <p className="entry__title">
                    {t(`debt.${item.category}` as TranslationKey)}
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
                    <button type="button" onClick={() => deleteWealthItem(item.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {items.length > 0 ? (
          <div className="summary-row summary-row--total commitment-total">
            <span>{t('wealth.netWorth')}</span>
            <strong className={totals.netWorth >= 0 ? 'text-positive' : 'text-danger'}>
              {formatMoney(totals.netWorth)}
            </strong>
            <span className="muted" style={{ width: '100%', marginTop: 4 }}>
              {t('wealth.liquidShare')}{' '}
              {totals.assets > 0
                ? formatPercent((comfortable.liquid / totals.assets) * 100)
                : '0%'}
            </span>
          </div>
        ) : null}
      </section>
    </div>
  )
}
