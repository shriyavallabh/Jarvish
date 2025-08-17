import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
        secondary:
          "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
        destructive:
          "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        outline: "text-slate-700 border-slate-300 hover:bg-slate-50",
        // Enhanced Financial Services Variants
        compliance: "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 hover:from-green-100 hover:to-emerald-100 shadow-sm",
        "compliance-warning": "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 hover:from-amber-100 hover:to-yellow-100 shadow-sm",
        "compliance-error": "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-800 hover:from-red-100 hover:to-rose-100 shadow-sm",
        premium: "border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 text-amber-900 hover:from-amber-100 hover:via-yellow-100 hover:to-amber-100 font-bold shadow-md",
        elite: "border-amber-400 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-slate-900 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 font-bold shadow-lg",
        whatsapp: "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 hover:from-green-100 hover:to-emerald-100 shadow-sm",
        pending: "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 hover:from-blue-100 hover:to-indigo-100 shadow-sm",
        delivered: "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 hover:from-green-100 hover:to-emerald-100 shadow-sm",
        failed: "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-800 hover:from-red-100 hover:to-rose-100 shadow-sm",
        scheduled: "border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-800 hover:from-purple-100 hover:to-indigo-100 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// Enhanced Compliance Badge with Professional Styling
const ComplianceBadge = React.forwardRef<
  HTMLDivElement,
  BadgeProps & {
    score: number
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, score, size = 'md', ...props }, ref) => {
  const getVariant = (score: number) => {
    if (score >= 90) return "compliance"
    if (score >= 75) return "compliance"
    if (score >= 60) return "compliance-warning"
    return "compliance-error"
  }

  const getLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 75) return "Good"
    if (score >= 60) return "Acceptable"
    if (score >= 40) return "Concerning"
    return "Critical"
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  return (
    <div ref={ref}>
      <Badge
        variant={getVariant(score)}
        className={cn(
          "gap-1.5 font-bold",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span className="inline-flex w-2 h-2 rounded-full bg-current opacity-60" />
        {getLabel(score)} • {score}%
      </Badge>
    </div>
  )
})
ComplianceBadge.displayName = "ComplianceBadge"

// Enhanced Status Badge with Professional Design
const StatusBadge = React.forwardRef<
  HTMLDivElement,
  BadgeProps & {
    status: 'pending' | 'approved' | 'delivered' | 'failed' | 'draft' | 'scheduled' | 'ready' | 'generating' | 'rejected'
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, status, size = 'md', ...props }, ref) => {
  const statusConfig = {
    pending: { variant: 'pending' as const, label: 'Pending Review' },
    approved: { variant: 'compliance' as const, label: 'Approved' },
    delivered: { variant: 'delivered' as const, label: 'Delivered' },
    failed: { variant: 'failed' as const, label: 'Failed' },
    draft: { variant: 'secondary' as const, label: 'Draft' },
    scheduled: { variant: 'scheduled' as const, label: 'Scheduled' },
    ready: { variant: 'compliance' as const, label: 'Ready' },
    generating: { variant: 'pending' as const, label: 'Generating' },
    rejected: { variant: 'destructive' as const, label: 'Rejected' },
  }

  const config = statusConfig[status]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  return (
    <div ref={ref}>
      <Badge
        variant={config.variant}
        className={cn(
          "gap-1.5 font-semibold",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span className="inline-flex w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" />
        {config.label}
      </Badge>
    </div>
  )
})
StatusBadge.displayName = "StatusBadge"

export { Badge, badgeVariants, ComplianceBadge, StatusBadge }