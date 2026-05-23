import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(dateStr)
  )
}

export function formatDiff(diff?: number | null): string {
  if (diff === undefined || diff === null) return '—'
  const sign = diff > 0 ? '+' : ''
  return `${sign}$${diff.toFixed(2)}`
}
