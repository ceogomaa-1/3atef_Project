import { cn } from '@/lib/utils'

interface RiskIndicatorProps {
  score: number
  className?: string
}

export function RiskIndicator({ score, className }: RiskIndicatorProps) {
  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'

  const config = {
    high: { label: 'High Risk', bar: 'bg-red-500', text: 'text-red-400' },
    medium: { label: 'Med Risk', bar: 'bg-yellow-500', text: 'text-yellow-400' },
    low: { label: 'Low Risk', bar: 'bg-green-500', text: 'text-green-400' },
  }

  const { label, bar, text } = config[level]
  const pct = Math.min(100, score)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-xs font-medium tabular-nums', text)}>
        {label} ({score})
      </span>
    </div>
  )
}
