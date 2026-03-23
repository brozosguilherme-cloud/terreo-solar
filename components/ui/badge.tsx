import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-terreo-50 text-terreo-800 ring-1 ring-terreo-200',
        secondary:   'bg-stone-100 text-stone-700',
        destructive: 'bg-red-50 text-red-700 ring-1 ring-red-200',
        outline:     'border border-stone-300 text-stone-700',
        warning:     'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
        success:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
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
