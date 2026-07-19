interface PieSlice {
  label: string
  /** Absolute amount used for the slice size */
  amount: number
  color: string
}

interface PieChartProps {
  title: string
  slices: PieSlice[]
  /** Denominator for legend percentages (usually gross earnings) */
  baseTotal: number
  centerLabel?: string
  centerValue?: string
}

export function PieChart({
  title,
  slices,
  baseTotal,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const positiveSlices = slices.map((slice) => ({
    ...slice,
    amount: Math.max(0, slice.amount),
  }))
  const drawTotal = positiveSlices.reduce((sum, slice) => sum + slice.amount, 0)
  const gradient = buildConicGradient(positiveSlices, drawTotal)

  return (
    <div className="pie-chart">
      <h2 className="pie-chart__title">{title}</h2>
      <div className="pie-chart__body">
        <div
          className="pie-chart__ring"
          style={{ background: gradient }}
          role="img"
          aria-label={positiveSlices
            .map((s) => {
              const pct = baseTotal > 0 ? Math.round((s.amount / baseTotal) * 100) : 0
              return `${s.label} ${pct}%`
            })
            .join(', ')}
        >
          <div className="pie-chart__hole">
            {centerValue ? (
              <>
                <span className="pie-chart__center-value">{centerValue}</span>
                {centerLabel ? (
                  <span className="pie-chart__center-label">{centerLabel}</span>
                ) : null}
              </>
            ) : (
              <span className="pie-chart__center-label">Breakdown</span>
            )}
          </div>
        </div>
        <ul className="pie-chart__legend">
          {slices.map((slice) => {
            const pct =
              baseTotal > 0
                ? Math.round((Math.max(0, slice.amount) / baseTotal) * 100)
                : 0
            return (
              <li key={slice.label}>
                <span
                  className="pie-chart__swatch"
                  style={{ background: slice.color }}
                  aria-hidden="true"
                />
                <span className="pie-chart__legend-label">{slice.label}</span>
                <span className="pie-chart__legend-value">
                  {baseTotal > 0 ? `${pct}%` : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function buildConicGradient(
  slices: { amount: number; color: string }[],
  total: number,
): string {
  if (total <= 0) {
    return 'conic-gradient(var(--track) 0% 100%)'
  }

  let cursor = 0
  const stops: string[] = []

  for (const slice of slices) {
    if (slice.amount <= 0) continue
    const share = (slice.amount / total) * 100
    const start = cursor
    const end = cursor + share
    stops.push(`${slice.color} ${start}% ${end}%`)
    cursor = end
  }

  if (stops.length === 0) {
    return 'conic-gradient(var(--track) 0% 100%)'
  }

  return `conic-gradient(${stops.join(', ')})`
}
