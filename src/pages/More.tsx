import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFinance } from '../hooks/useFinance'

export function MorePage() {
  const { clearAllData } = useFinance()
  const [confirmClear, setConfirmClear] = useState(false)

  function handleClear() {
    clearAllData()
    window.location.assign(`${window.location.origin}/?reset=${Date.now()}`)
  }

  return (
    <div className="stack">
      <section className="page-header">
        <div>
          <h1>More</h1>
          <p className="muted">Summary, commitments, and simple tools.</p>
        </div>
      </section>

      <section className="panel menu-list">
        <Link to="/grab" className="menu-item">
          <div>
            <p className="menu-item__title">Grab tracker</p>
            <p className="menu-item__desc">
              Daily earn, petrol, net profit, and driving performance
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/income" className="menu-item">
          <div>
            <p className="menu-item__title">Income (salary & other)</p>
            <p className="menu-item__desc">
              Log salary and non-Grab side income here
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/summary" className="menu-item">
          <div>
            <p className="menu-item__title">Monthly money summary</p>
            <p className="menu-item__desc">
              Income, expenses, savings, and month-to-month compare
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/commitments" className="menu-item">
          <div>
            <p className="menu-item__title">Fixed monthly commitments</p>
            <p className="menu-item__desc">
              Rent, car, family support, subscriptions
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="panel">
        <h2>About Asmu&apos;i Vault</h2>
        <p className="muted about-copy">
          A minimal money tracker for daily use — log income and expenses fast,
          see where money goes, and stay on track with savings goals. No complex
          accounting.
        </p>

        {!confirmClear ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setConfirmClear(true)}
          >
            Clear all data
          </button>
        ) : (
          <div className="reset-confirm">
            <p className="reset-confirm__text">
              Clear all data on this device? This cannot be undone.
            </p>
            <div className="form__actions form__actions--wrap">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleClear}
              >
                Yes, clear
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
