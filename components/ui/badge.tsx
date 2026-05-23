import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        approved: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
        pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        outline: 'border border-white/20 text-[#888]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
