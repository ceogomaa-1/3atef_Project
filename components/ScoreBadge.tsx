import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  label?: string
  className?: string
}

export function ScoreBadge({ score, label, className }: ScoreBadgeProps) {
  const color =
    score >= 70
      ? 'text-green-400 bg-green-500/10 border-green-500/20'
      : score >= 40
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      : 'text-red-400 bg-red-500/10 border-red-500/20'

  return (
    <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium', color, className)}>
      {label && <span className="text-[#888]">{label}</span>}
      {score.toFixed(0)}
    </span>
  )
}
