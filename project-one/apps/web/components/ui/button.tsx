import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800",
        outline:
          "border-2 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
        ghost: "hover:bg-slate-100 hover:text-slate-900 shadow-none",
        link: "text-blue-600 underline-offset-4 hover:underline shadow-none",
        // Enhanced Financial Services Variants
        primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl",
        success: "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg",
        warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg",
        premium: "relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-slate-900 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 font-bold shadow-xl hover:shadow-2xl border border-amber-300 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        elite: "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-amber-400 hover:text-amber-300 border-2 border-amber-400/50 hover:border-amber-400 shadow-xl font-bold",
        whatsapp: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg",
        compliance: "bg-gradient-to-r from-emerald-600 to-green-700 text-white hover:from-emerald-700 hover:to-green-800 border border-green-800 shadow-lg",
        trust: "bg-gradient-to-r from-blue-700 to-indigo-800 text-white hover:from-blue-800 hover:to-indigo-900 shadow-xl font-bold",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-md px-10 text-base",
        icon: "h-10 w-10",
        "touch-friendly": "min-h-[44px] px-6 py-3", // WCAG compliant touch target
        "hero": "h-14 px-10 text-lg font-bold", // For hero CTAs
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={!asChild && !props.type ? "button" : props.type}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }