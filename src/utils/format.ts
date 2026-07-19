export function formatMoney(amount: number): string {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('en-MY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return amount < 0 ? `-RM${formatted}` : `RM${formatted}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-MY', {
    month: 'long',
    year: 'numeric',
  })
}

export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
