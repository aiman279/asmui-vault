interface MiniBarsProps {
  items: { label: string; value: number; max: number }[]
}

export function MiniBars({ items }: MiniBarsProps) {
  if (items.length === 0) {
    return <p className="muted">No spending data yet</p>
  }

  return (
    <div className="mini-bars">
      {items.map((item) => {
        const width = item.max > 0 ? (item.value / item.max) * 100 : 0
        return (
          <div key={item.label} className="mini-bars__row">
            <span className="mini-bars__label">{item.label}</span>
            <div className="mini-bars__track">
              <div className="mini-bars__fill" style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
