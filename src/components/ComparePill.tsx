interface ComparePillProps {
  current: number
  previous: number
  label?: string
}

export function ComparePill({ current, previous, label = 'vs last month' }: ComparePillProps) {
  if (previous === 0 && current === 0) {
    return <span className="compare compare--flat">{label}</span>
  }

  if (previous === 0) {
    return <span className="compare compare--up">New · {label}</span>
  }

  const diff = ((current - previous) / Math.abs(previous)) * 100
  const rounded = Math.round(Math.abs(diff))
  const direction = diff > 1 ? 'up' : diff < -1 ? 'down' : 'flat'
  const sign = diff > 1 ? '+' : diff < -1 ? '−' : ''

  return (
    <span className={`compare compare--${direction}`}>
      {sign}
      {rounded}% {label}
    </span>
  )
}
