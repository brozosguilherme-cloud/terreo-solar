import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terreo-800 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-terreo-800 text-white hover:bg-terreo-900 active:bg-terreo-950',
        outline:
          'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-400',
        secondary:
          'bg-stone-100 text-stone-800 hover:bg-stone-200',
        ghost:
          'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
        brand:
          'border border-terreo-800 text-terreo-800 bg-transparent hover:bg-terreo-800 hover:text-white',
        'brand-muted':
          'bg-terreo-50 text-terreo-800 hover:bg-terreo-100',
        link:
          'text-terreo-700 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-12 px-6 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
