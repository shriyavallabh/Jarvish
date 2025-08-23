"use client"

import * as React from "react"
import { Bell, X, Check, AlertCircle, CheckCircle, Info, MessageSquare, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useNotifications, type Notification } from "@/lib/hooks/useNotifications"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead, onRemove }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'delivery':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'compliance':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getBgColor = () => {
    if (notification.read) return "bg-muted/30"
    
    switch (notification.type) {
      case 'success':
        return "bg-green-50 border-l-4 border-l-green-500"
      case 'error':
        return "bg-red-50 border-l-4 border-l-red-500"
      case 'warning':
        return "bg-yellow-50 border-l-4 border-l-yellow-500"
      case 'delivery':
        return "bg-blue-50 border-l-4 border-l-blue-500"
      case 'compliance':
        return "bg-purple-50 border-l-4 border-l-purple-500"
      default:
        return "bg-gray-50 border-l-4 border-l-gray-500"
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-IN')
  }

  return (
    <Card className={cn("mb-2 transition-all hover:shadow-md", getBgColor())}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  "text-sm font-medium truncate",
                  !notification.read && "font-semibold"
                )}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatTime(notification.timestamp)}
                </span>
                {notification.action && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={notification.action.onClick}
                    className="h-6 text-xs px-2"
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="h-6 w-6 p-0"
                title="Mark as read"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(notification.id)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              title="Remove notification"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestNotificationPermission,
    notificationPermission
  } = useNotifications()

  const [isOpen, setIsOpen] = React.useState(false)

  // Request notification permission on first interaction
  React.useEffect(() => {
    if (isOpen && notificationPermission === 'default') {
      requestNotificationPermission()
    }
  }, [isOpen, notificationPermission, requestNotificationPermission])

  const recentNotifications = notifications.slice(0, 10)
  const hasNotifications = notifications.length > 0

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("relative", className)}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 sm:w-96 max-h-[80vh]"
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {hasNotifications && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-6 text-xs px-2"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 text-xs px-2 text-muted-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {!hasNotifications ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">
              You'll see updates about content delivery, compliance checks, and system status here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onRemove={removeNotification}
                />
              ))}
              {notifications.length > 10 && (
                <div className="text-center p-4">
                  <Button variant="outline" size="sm" className="text-xs">
                    View all notifications ({notifications.length})
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {notificationPermission === 'default' && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Enable Browser Notifications</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Get notified about important updates even when the app is closed.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={requestNotificationPermission}
                className="w-full text-xs"
              >
                Enable Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Export notification toast component for inline use
interface NotificationToastProps {
  notification: Notification
  onClose: () => void
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  React.useEffect(() => {
    if (notification.autoHide && notification.duration) {
      const timer = setTimeout(onClose, notification.duration)
      return () => clearTimeout(timer)
    }
  }, [notification.autoHide, notification.duration, onClose])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'delivery':
        return <MessageSquare className="h-5 w-5 text-green-600" />
      case 'compliance':
        return <Shield className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return "bg-green-50 border-green-200"
      case 'error':
        return "bg-red-50 border-red-200"
      case 'warning':
        return "bg-yellow-50 border-yellow-200"
      case 'delivery':
        return "bg-blue-50 border-blue-200"
      case 'compliance':
        return "bg-purple-50 border-purple-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 z-50 w-80 border-l-4 shadow-lg transition-all duration-300",
      getBgColor()
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {notification.message}
              </p>
              {notification.action && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={notification.action.onClick}
                  className="mt-3 h-7 text-xs"
                >
                  {notification.action.label}
                </Button>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}