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
          <p className="muted">Income, goals, report, and tools.</p>
        </div>
      </section>

      <section className="panel menu-list">
        <Link to="/income" className="menu-item">
          <div>
            <p className="menu-item__title">Income</p>
            <p className="menu-item__desc">
              Salary and other non-Grab income
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/goals" className="menu-item">
          <div>
            <p className="menu-item__title">Financial goals</p>
            <p className="menu-item__desc">
              Emergency fund, house, and investment targets
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/summary" className="menu-item">
          <div>
            <p className="menu-item__title">Monthly report</p>
            <p className="menu-item__desc">
              Income, expenses, savings, and insights
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/wealth" className="menu-item">
          <div>
            <p className="menu-item__title">Wealth & runway</p>
            <p className="menu-item__desc">
              Net worth, assets, debts, and survival months
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link to="/commitments" className="menu-item">
          <div>
            <p className="menu-item__title">Recurring</p>
            <p className="menu-item__desc">
              Salary in, rent/car/family out — auto each month
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="panel">
        <h2>About A.FLOW</h2>
        <p className="muted about-copy">
          A.FLOW is your personal financial flow system — track Grab profit,
          expenses, wealth, and goals in one calm place. Track less. Understand
          more. v1.5.
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
