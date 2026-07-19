interface ProgressBarProps {
  value: number
  tone?: 'accent' | 'warm' | 'muted'
  label?: string
}

export function ProgressBar({
  value,
  tone = 'accent',
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="progress">
      {label ? (
        <div className="progress__meta">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      ) : null}
      <div className="progress__track" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`progress__fill progress__fill--${tone}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
