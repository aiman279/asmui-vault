import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
  children?: ReactNode
}

export function StatCard({
  label,
  value,
  tone = 'default',
  children,
}: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {children ? <div className="stat-card__foot">{children}</div> : null}
    </article>
  )
}
