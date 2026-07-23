import type { GrabMonthSummary, GrabRecord } from '../types'
import { currentMonthKey, filterByMonth, getMonthKey } from './calculations'

export interface GrabWeekGroup {
  weekKey: string
  label: string
  startDate: string
  endDate: string
  records: GrabRecord[]
  summary: GrabMonthSummary
}

/** Monday-start week key: YYYY-Www */
export function getWeekKey(dateStr: string): string {
  const monday = startOfWeek(dateStr)
  const thursday = new Date(`${monday}T00:00:00`)
  thursday.setDate(thursday.getDate() + 3)
  const year = thursday.getFullYear()
  const yearStart = startOfWeek(`${year}-01-04`)
  const mondayDate = new Date(`${monday}T00:00:00`)
  const yearStartDate = new Date(`${yearStart}T00:00:00`)
  const week =
    Math.round(
      (mondayDate.getTime() - yearStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    ) + 1
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function startOfWeek(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return toISODate(date)
}

export function endOfWeek(dateStr: string): string {
  const start = new Date(`${startOfWeek(dateStr)}T00:00:00`)
  start.setDate(start.getDate() + 6)
  return toISODate(start)
}

export function shiftWeek(dateStr: string, weeks: number): string {
  const date = new Date(`${startOfWeek(dateStr)}T00:00:00`)
  date.setDate(date.getDate() + weeks * 7)
  return toISODate(date)
}

export function formatWeekLabel(dateStr: string): string {
  const start = new Date(`${startOfWeek(dateStr)}T00:00:00`)
  const end = new Date(`${endOfWeek(dateStr)}T00:00:00`)
  const startText = start.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
  })
  const endText = end.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${startText} – ${endText}`
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function grabNetProfit(record: Pick<
  GrabRecord,
  'grossEarnings' | 'petrolCost' | 'otherCost' | 'credit'
>): number {
  return (
    record.grossEarnings - record.petrolCost - record.otherCost - record.credit
  )
}

export function summarizeGrabRecords(records: GrabRecord[]): GrabMonthSummary {
  const grossEarnings = records.reduce((s, r) => s + r.grossEarnings, 0)
  const petrolCost = records.reduce((s, r) => s + r.petrolCost, 0)
  const otherCost = records.reduce((s, r) => s + r.otherCost, 0)
  const credit = records.reduce((s, r) => s + r.credit, 0)
  const netProfit = records.reduce((s, r) => s + grabNetProfit(r), 0)
  const drivingDays = records.length
  const drivingHours = records.reduce(
    (s, r) => s + (Number(r.drivingHours) || 0),
    0,
  )
  const averageDailyProfit = drivingDays > 0 ? netProfit / drivingDays : 0
  const profitPerHour = drivingHours > 0 ? netProfit / drivingHours : 0

  let bestDay: GrabRecord | null = null
  let bestNet = Number.NEGATIVE_INFINITY
  for (const record of records) {
    const net = grabNetProfit(record)
    if (net > bestNet) {
      bestNet = net
      bestDay = record
    }
  }

  return {
    grossEarnings,
    petrolCost,
    otherCost,
    credit,
    netProfit,
    averageDailyProfit,
    drivingDays,
    drivingHours,
    profitPerHour,
    bestDay,
  }
}

export function filterByWeek(
  records: GrabRecord[],
  weekDate: string,
): GrabRecord[] {
  const start = startOfWeek(weekDate)
  const end = endOfWeek(weekDate)
  return records.filter((r) => r.date >= start && r.date <= end)
}

export function summarizeGrabMonth(
  records: GrabRecord[],
  monthKey = currentMonthKey(),
): GrabMonthSummary {
  return summarizeGrabRecords(filterByMonth(records, monthKey))
}

export function summarizeGrabWeek(
  records: GrabRecord[],
  weekDate: string,
): GrabMonthSummary {
  return summarizeGrabRecords(filterByWeek(records, weekDate))
}

export function groupGrabByWeek(records: GrabRecord[]): GrabWeekGroup[] {
  const map = new Map<string, GrabRecord[]>()

  for (const record of records) {
    const key = getWeekKey(record.date)
    const list = map.get(key)
    if (list) list.push(record)
    else map.set(key, [record])
  }

  return [...map.entries()]
    .map(([weekKey, weekRecords]) => {
      const sorted = [...weekRecords].sort((a, b) => b.date.localeCompare(a.date))
      const startDate = startOfWeek(sorted[0].date)
      const endDate = endOfWeek(sorted[0].date)
      return {
        weekKey,
        label: formatWeekLabel(sorted[0].date),
        startDate,
        endDate,
        records: sorted,
        summary: summarizeGrabRecords(sorted),
      }
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
}

export function grabBreakdownPercents(summary: GrabMonthSummary): {
  netProfit: number
  petrol: number
  other: number
} {
  const gross = summary.grossEarnings
  if (gross <= 0) {
    return { netProfit: 0, petrol: 0, other: 0 }
  }

  return {
    netProfit: (Math.max(0, summary.netProfit) / gross) * 100,
    petrol: (summary.petrolCost / gross) * 100,
    other: (summary.otherCost / gross) * 100,
  }
}

export function totalGrabNetProfit(
  records: GrabRecord[],
  monthKey?: string,
): number {
  const list = monthKey
    ? records.filter((r) => getMonthKey(r.date) === monthKey)
    : records
  return list.reduce((sum, record) => sum + grabNetProfit(record), 0)
}

export interface GrabInsight {
  id: string
  tone: 'positive' | 'neutral' | 'watch'
  text: string
}

export function buildGrabInsights(
  records: GrabRecord[],
  monthKey = currentMonthKey(),
): GrabInsight[] {
  const current = summarizeGrabMonth(records, monthKey)
  const [y, m] = monthKey.split('-').map(Number)
  const prevDate = new Date(y, m - 2, 1)
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const previous = summarizeGrabMonth(records, prevKey)
  const percents = grabBreakdownPercents(current)
  const insights: GrabInsight[] = []

  if (previous.netProfit > 0 && current.drivingDays > 0) {
    const change =
      ((current.netProfit - previous.netProfit) / Math.abs(previous.netProfit)) *
      100
    if (change >= 5) {
      insights.push({
        id: 'profit-up',
        tone: 'positive',
        text: `Your Grab profit increased ${Math.round(change)}% compared to last month`,
      })
    } else if (change <= -5) {
      insights.push({
        id: 'profit-down',
        tone: 'watch',
        text: `Your Grab profit dropped ${Math.round(Math.abs(change))}% compared to last month`,
      })
    }
  }

  if (current.grossEarnings > 0 && percents.petrol >= 8) {
    insights.push({
      id: 'petrol-share',
      tone: percents.petrol >= 25 ? 'watch' : 'neutral',
      text: `Petrol represents ${Math.round(percents.petrol)}% of your Grab income`,
    })
  }

  if (current.bestDay) {
    const day = new Date(`${current.bestDay.date}T00:00:00`).toLocaleDateString(
      'en-MY',
      { weekday: 'long' },
    )
    insights.push({
      id: 'best-day',
      tone: 'positive',
      text: `Your best earning day was ${day}`,
    })
  }

  if (current.profitPerHour > 0) {
    insights.push({
      id: 'per-hour',
      tone: 'neutral',
      text: `You earned about RM${Math.round(current.profitPerHour)} per driving hour`,
    })
  }

  if (insights.length === 0 && current.drivingDays === 0) {
    insights.push({
      id: 'empty',
      tone: 'neutral',
      text: 'Log a driving day to see performance insights',
    })
  }

  return insights.slice(0, 4)
}
