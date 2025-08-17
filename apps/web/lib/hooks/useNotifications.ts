"use client"

import { useState, useCallback, useEffect } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'delivery' | 'compliance'
  title: string
  message: string
  timestamp: Date
  read: boolean
  autoHide?: boolean
  duration?: number // in milliseconds
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationOptions {
  autoHide?: boolean
  duration?: number
  vibrate?: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Add notification
  const addNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    options: NotificationOptions = {}
  ) => {
    const {
      autoHide = true,
      duration = 5000,
      vibrate = true
    } = options

    const notification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      autoHide,
      duration
    }

    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep max 50 notifications

    // Vibrate if supported and enabled
    if (vibrate && 'vibrate' in navigator) {
      switch (type) {
        case 'success':
          navigator.vibrate([100, 50, 100])
          break
        case 'error':
          navigator.vibrate([200, 100, 200, 100, 200])
          break
        case 'warning':
          navigator.vibrate([150, 75, 150])
          break
        case 'delivery':
          navigator.vibrate([50, 25, 50])
          break
        default:
          navigator.vibrate(100)
      }
    }

    // Auto-hide notification
    if (autoHide && duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, duration)
    }

    return notification.id
  }, [])

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Specific notification functions
  const notifySuccess = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('success', title, message, options)
  }, [addNotification])

  const notifyError = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('error', title, message, { ...options, autoHide: false })
  }, [addNotification])

  const notifyWarning = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('warning', title, message, options)
  }, [addNotification])

  const notifyInfo = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('info', title, message, options)
  }, [addNotification])

  const notifyDelivery = useCallback((title: string, message: string, options?: NotificationOptions) => {
    return addNotification('delivery', title, message, { ...options, duration: 3000 })
  }, [addNotification])

  const notifyCompliance = useCallback((title: string, message: string, passed: boolean, options?: NotificationOptions) => {
    return addNotification('compliance', title, message, {
      ...options,
      duration: passed ? 3000 : 8000
    })
  }, [addNotification])

  // Bulk notification functions for common scenarios
  const notifyContentDelivered = useCallback((advisorName: string, contentCount: number) => {
    notifyDelivery(
      'Content Delivered Successfully',
      `${contentCount} content piece${contentCount > 1 ? 's' : ''} delivered to ${advisorName}`
    )
  }, [notifyDelivery])

  const notifyComplianceCheck = useCallback((contentTitle: string, score: number, passed: boolean) => {
    notifyCompliance(
      passed ? 'Compliance Check Passed' : 'Compliance Issue Detected',
      `${contentTitle} - Score: ${score}%${passed ? ' ✅' : ' ⚠️'}`,
      passed
    )
  }, [notifyCompliance])

  const notifyWhatsAppStatus = useCallback((status: 'sent' | 'delivered' | 'read' | 'failed', count: number) => {
    const messages = {
      sent: 'WhatsApp messages queued for delivery',
      delivered: 'WhatsApp messages delivered successfully',
      read: 'WhatsApp messages read by recipients',
      failed: 'WhatsApp delivery failed'
    }

    const type = status === 'failed' ? 'error' : status === 'delivered' ? 'delivery' : 'info'
    
    addNotification(
      type,
      `WhatsApp ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `${count} message${count > 1 ? 's' : ''} ${messages[status]}`
    )
  }, [addNotification])

  // Get notification counts
  const unreadCount = notifications.filter(n => !n.read).length
  const totalCount = notifications.length

  // Browser notification permission management
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission
    }
    return 'denied'
  }, [])

  const sendBrowserNotification = useCallback((title: string, options: NotificationOptions & { icon?: string; badge?: string } = {}) => {
    if (notificationPermission === 'granted' && 'Notification' in window) {
      const notification = new Notification(title, {
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        body: options.duration ? `Auto-hide in ${options.duration / 1000}s` : undefined,
        tag: 'advisor-content-platform'
      })

      if (options.duration) {
        setTimeout(() => notification.close(), options.duration)
      }

      return notification
    }
    return null
  }, [notificationPermission])

  return {
    notifications,
    unreadCount,
    totalCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyDelivery,
    notifyCompliance,
    notifyContentDelivered,
    notifyComplianceCheck,
    notifyWhatsAppStatus,
    notificationPermission,
    requestNotificationPermission,
    sendBrowserNotification
  }
}