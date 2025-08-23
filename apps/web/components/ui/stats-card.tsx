import * as React from "react"
import { Card, CardContent } from "./card"
import { Badge } from "./badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  icon?: React.ReactNode
  variant?: 'default' | 'premium' | 'compliance'
  className?: string
}

export function StatsCard({
  title,
  value,
  trend,
  icon,
  variant = 'default',
  className,
}: StatsCardProps) {
  const cardVariants = {
    default: "border-t-4 border-t-blue-600 bg-gradient-to-br from-white to-blue-50/20",
    premium: "border-t-4 border-t-amber-400 bg-gradient-to-br from-amber-50/30 to-yellow-50/20",
    compliance: "border-t-4 border-t-green-600 bg-gradient-to-br from-green-50/30 to-emerald-50/20"
  }

  return (
    <Card 
      className={cn(
        cardVariants[variant], 
        "hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden",
        className
      )}
      role="region"
      aria-labelledby={`stats-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        {icon && React.cloneElement(icon as React.ReactElement, { className: "w-full h-full" })}
      </div>
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p 
              id={`stats-${title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground uppercase tracking-wide"
            >
              {title}
            </p>
            <p 
              className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
              aria-label={`${title}: ${value}`}
            >
              {value}
            </p>
            {trend && (
              <div className="flex items-center space-x-1">
                <span
                  className={cn(
                    "text-sm font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md",
                    trend.direction === 'up' && "text-green-700 bg-green-100/50",
                    trend.direction === 'down' && "text-red-700 bg-red-100/50",
                    trend.direction === 'neutral' && "text-slate-600 bg-slate-100/50"
                  )}
                  aria-label={`Trend: ${trend.direction === 'up' ? 'increasing' : trend.direction === 'down' ? 'decreasing' : 'stable'} by ${trend.value}`}
                >
                  {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
                  {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
                  {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
                  {trend.value}
                </span>
                {trend.label && (
                  <span className="text-sm text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              "h-14 w-14 flex items-center justify-center rounded-xl shadow-lg",
              variant === 'premium' && "bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700",
              variant === 'compliance' && "bg-gradient-to-br from-green-100 to-emerald-100 text-green-700",
              variant === 'default' && "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700"
            )}>
              {React.cloneElement(icon as React.ReactElement, { className: "h-7 w-7" })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Specialized cards for different contexts
export function DeliveryStatsCard({
  delivered,
  total,
  rate,
  className,
}: {
  delivered: number
  total: number
  rate: number
  className?: string
}) {
  return (
    <StatsCard
      title="Delivery Rate"
      value={`${rate}%`}
      trend={{
        value: `${delivered}/${total}`,
        direction: rate >= 99 ? 'up' : rate >= 95 ? 'neutral' : 'down',
        label: "messages"
      }}
      variant="premium"
      className={className}
    />
  )
}

export function ComplianceStatsCard({
  score,
  checks,
  className,
}: {
  score: number
  checks: { passed: number; total: number }
  className?: string
}) {
  return (
    <StatsCard
      title="Compliance Score"
      value={`${score}%`}
      trend={{
        value: `${checks.passed}/${checks.total}`,
        direction: score >= 95 ? 'up' : score >= 90 ? 'neutral' : 'down',
        label: "checks passed"
      }}
      variant="compliance"
      className={className}
    />
  )
}

export function CountdownCard({
  timeUntil,
  label = "Next Delivery",
  className,
}: {
  timeUntil: string
  label?: string
  className?: string
}) {
  return (
    <Card className={cn(
      "bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-400 text-slate-900 border-2 border-amber-500 shadow-xl",
      "hover:shadow-2xl transition-all duration-300",
      className
    )}>
      <CardContent className="p-4 text-center relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>
        <div className="space-y-1 relative">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight font-mono text-slate-900">
            {timeUntil}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}