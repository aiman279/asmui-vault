import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFinance } from '../hooks/useFinance'
import { useLanguage } from '../hooks/useLanguage'

export function MorePage() {
  const { clearAllData } = useFinance()
  const { t } = useLanguage()
  const [confirmClear, setConfirmClear] = useState(false)

  function handleClear() {
    clearAllData()
    window.location.assign(`${window.location.origin}/?reset=${Date.now()}`)
  }

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>{t('more.title')}</h1>
          <p className="muted">{t('more.sub')}</p>
        </div>
      </section>

      <section className="panel menu-list">
        <Link to="/income" className="menu-item">
          <div>
            <p className="menu-item__title">{t('more.income')}</p>
            <p className="menu-item__desc">{t('more.incomeDesc')}</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/goals" className="menu-item">
          <div>
            <p className="menu-item__title">{t('more.goals')}</p>
            <p className="menu-item__desc">{t('more.goalsDesc')}</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/summary" className="menu-item">
          <div>
            <p className="menu-item__title">{t('more.report')}</p>
            <p className="menu-item__desc">{t('more.reportDesc')}</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/wealth" className="menu-item">
          <div>
            <p className="menu-item__title">{t('more.wealth')}</p>
            <p className="menu-item__desc">{t('more.wealthDesc')}</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/commitments" className="menu-item">
          <div>
            <p className="menu-item__title">{t('more.recur')}</p>
            <p className="menu-item__desc">{t('more.recurDesc')}</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="panel">
        <h2>{t('more.about')}</h2>
        <p className="muted about-copy">{t('more.aboutCopy')}</p>

        {!confirmClear ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setConfirmClear(true)}
          >
            {t('more.clear')}
          </button>
        ) : (
          <div className="reset-confirm">
            <p className="reset-confirm__text">{t('more.clearConfirm')}</p>
            <div className="form__actions form__actions--wrap">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleClear}
              >
                {t('more.clearYes')}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmClear(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
