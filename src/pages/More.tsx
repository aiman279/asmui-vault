import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFinance } from '../hooks/useFinance'

export function MorePage() {
  const { clearAllData, exportBackup, importBackup } = useFinance()
  const [confirmClear, setConfirmClear] = useState(false)
  const [backupText, setBackupText] = useState('')
  const [backupMsg, setBackupMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleClear() {
    clearAllData()
    window.location.assign(`${window.location.origin}/?reset=${Date.now()}`)
  }

  function handleExport() {
    const json = exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aflow-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMsg('Backup downloaded')
  }

  function handleCopy() {
    void navigator.clipboard.writeText(exportBackup()).then(
      () => setBackupMsg('Backup copied — paste it on the other device/URL'),
      () => setBackupMsg('Could not copy — use Download instead'),
    )
  }

  function handleImport() {
    const result = importBackup(backupText.trim())
    if (!result.ok) {
      setBackupMsg(result.error)
      return
    }
    setBackupMsg('Data restored')
    setBackupText('')
    window.setTimeout(() => {
      window.location.assign(`${window.location.origin}/?imported=${Date.now()}`)
    }, 400)
  }

  function handleFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const result = importBackup(text)
      setBackupMsg(result.ok ? 'Data restored from file' : result.error)
      if (result.ok) {
        window.setTimeout(() => {
          window.location.assign(
            `${window.location.origin}/?imported=${Date.now()}`,
          )
        }, 400)
      }
    }
    reader.readAsText(file)
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
        <h2>Backup & restore</h2>
        <p className="muted about-copy">
          Move your data between phones or URLs without typing everything again.
        </p>
        <div className="form__actions form__actions--wrap">
          <button type="button" className="btn btn--primary" onClick={handleExport}>
            Download backup
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleCopy}>
            Copy backup
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => fileRef.current?.click()}
          >
            Import file
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json,text/plain"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <label style={{ marginTop: 14, display: 'block' }}>
          Or paste backup text
          <textarea
            rows={4}
            value={backupText}
            onChange={(e) => setBackupText(e.target.value)}
            placeholder='{"incomes":[],"expenses":[],...}'
            style={{ width: '100%', marginTop: 6 }}
          />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!backupText.trim()}
          onClick={handleImport}
          style={{ marginTop: 10 }}
        >
          Restore pasted backup
        </button>
        {backupMsg ? <p className="muted" style={{ marginTop: 10 }}>{backupMsg}</p> : null}
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
