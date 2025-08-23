import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"
import type { ActivityItem } from "@/lib/mock/types"

interface ActivityTimelineProps {
  activities: ActivityItem[]
  title?: string
  showAll?: boolean
  className?: string
}

export function ActivityTimeline({
  activities,
  title = "Recent Activity",
  showAll = false,
  className,
}: ActivityTimelineProps) {
  const displayedActivities = showAll ? activities : activities.slice(0, 4)

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {!showAll && activities.length > 4 && (
          <button className="text-sm text-primary hover:underline">
            View All →
          </button>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {displayedActivities.map((activity, index) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isLast={index === displayedActivities.length - 1}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TimelineItem({
  activity,
  isLast,
}: {
  activity: ActivityItem
  isLast: boolean
}) {
  const severityColors = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    }
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    }
    return date.toLocaleDateString()
  }

  return (
    <div className="relative flex items-start space-x-4 pb-6">
      {/* Timeline dot */}
      <div
        className={cn(
          "relative z-10 h-4 w-4 rounded-full border-2 border-background",
          severityColors[activity.severity]
        )}
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">
            {activity.title}
          </h4>
          <Badge
            variant={
              activity.severity === 'success' ? 'compliance' :
              activity.severity === 'warning' ? 'compliance-warning' :
              activity.severity === 'error' ? 'compliance-error' :
              'secondary'
            }
            className="text-xs"
          >
            {activity.type.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {activity.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTime(activity.timestamp)}
        </p>
      </div>
    </div>
  )
}