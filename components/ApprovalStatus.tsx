import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventStatus } from '@/lib/types'

interface ApprovalStatusProps {
  status: EventStatus
  size?: 'sm' | 'md'
  className?: string
}

const CONFIG = {
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    classes: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    classes: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    classes: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  },
}

export function ApprovalStatus({ status, size = 'sm', className }: ApprovalStatusProps) {
  const { icon: Icon, label, classes } = CONFIG[status]
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-medium',
        textSize,
        classes,
        className
      )}
    >
      <Icon className={iconSize} />
      {label}
    </span>
  )
}
