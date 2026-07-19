import { NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/grab', label: 'Grab', icon: GrabIcon },
  { to: '/expenses', label: 'Spend', icon: SpendIcon },
  { to: '/goals', label: 'Goals', icon: GoalsIcon },
  { to: '/more', label: 'More', icon: MoreIcon },
]

export function Layout() {
  return (
    <div className="app-shell">
      <div className="app-bg" aria-hidden="true" />
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true" />
            <div>
              <p className="brand__name">Asmu&apos;i Vault</p>
              <p className="brand__tag">Your money, kept clear</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Main">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `bottom-nav__link${isActive ? ' is-active' : ''}`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GrabIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 13.5c1.2 1.4 2.5 2.1 4 2.1s2.8-.7 4-2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9.2" cy="10.2" r="1" fill="currentColor" />
      <circle cx="14.8" cy="10.2" r="1" fill="currentColor" />
    </svg>
  )
}

function SpendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20V8m0 0 4 4m-4-4-4 4M5 4h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GoalsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}
