'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Eye,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Phone
} from 'lucide-react'

interface DeliveryStats {
  total: number
  pending: number
  sent: number
  delivered: number
  failed: number
  read: number
  successRate: number
}

interface Delivery {
  id: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
  advisorName: string
  phoneNumber: string
  contentTitle: string
  scheduledTime: string
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  failureReason?: string
}

export function DeliveryMonitor() {
  const [stats, setStats] = useState<DeliveryStats | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch delivery statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/whatsapp/send-content')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  // Fetch recent deliveries
  const fetchDeliveries = async () => {
    try {
      // This would fetch from your actual API
      // For now, using mock data
      const mockDeliveries: Delivery[] = [
        {
          id: '1',
          status: 'delivered',
          advisorName: 'Rajesh Kumar',
          phoneNumber: '+919876543210',
          contentTitle: 'Market Update - Sensex Gains',
          scheduledTime: '2025-01-19T00:30:00Z',
          sentAt: '2025-01-19T00:30:05Z',
          deliveredAt: '2025-01-19T00:30:12Z'
        },
        {
          id: '2',
          status: 'read',
          advisorName: 'Priya Sharma',
          phoneNumber: '+919876543211',
          contentTitle: 'Investment Tips for 2025',
          scheduledTime: '2025-01-19T00:30:00Z',
          sentAt: '2025-01-19T00:30:08Z',
          deliveredAt: '2025-01-19T00:30:15Z',
          readAt: '2025-01-19T00:45:30Z'
        },
        {
          id: '3',
          status: 'failed',
          advisorName: 'Amit Patel',
          phoneNumber: '+919876543212',
          contentTitle: 'Mutual Fund Analysis',
          scheduledTime: '2025-01-19T00:30:00Z',
          failureReason: 'Invalid phone number format'
        },
        {
          id: '4',
          status: 'pending',
          advisorName: 'Neha Gupta',
          phoneNumber: '+919876543213',
          contentTitle: 'Tax Saving Strategies',
          scheduledTime: '2025-01-19T00:30:00Z'
        }
      ]
      setDeliveries(mockDeliveries)
    } catch (error) {
      console.error('Failed to fetch deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    fetchStats()
    fetchDeliveries()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStats()
        fetchDeliveries()
      }, 10000) // Refresh every 10 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(d => 
    filter === 'all' || d.status === filter
  )

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'read':
        return <Eye className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'sent':
        return 'default'
      case 'delivered':
        return 'success'
      case 'read':
        return 'success'
      case 'failed':
        return 'destructive'
      default:
        return 'default'
    }
  }

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WhatsApp Delivery Monitor</h2>
          <p className="text-muted-foreground">
            Real-time tracking of content delivery to advisors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats()
              fetchDeliveries()
            }}
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Messages
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Delivered
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.delivered + stats.read}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
              <div className="w-16">
                <Progress value={stats.successRate} className="h-2" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SLA Status */}
      {stats && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">6 AM Delivery SLA</h3>
            <Badge variant={stats.successRate >= 99 ? 'success' : 'destructive'}>
              {stats.successRate >= 99 ? 'PASS' : 'FAIL'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Target: 99% delivery within 5 minutes</span>
              <span className="font-medium">{stats.successRate}%</span>
            </div>
            <Progress value={stats.successRate} className="h-3" />
            {stats.successRate < 99 && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>SLA breach detected. Review failed deliveries.</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'pending', 'sent', 'delivered', 'read', 'failed'].map(status => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-2 text-xs">
                ({deliveries.filter(d => d.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Deliveries Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Deliveries</h3>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading deliveries...
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deliveries found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Advisor</th>
                    <th className="text-left py-3 px-4">Phone</th>
                    <th className="text-left py-3 px-4">Content</th>
                    <th className="text-left py-3 px-4">Scheduled</th>
                    <th className="text-left py-3 px-4">Delivered</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map(delivery => (
                    <tr key={delivery.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(delivery.status)}
                          <Badge variant={getStatusBadgeVariant(delivery.status) as any}>
                            {delivery.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">{delivery.advisorName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="text-sm">{delivery.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{delivery.contentTitle}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatTime(delivery.scheduledTime)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {delivery.deliveredAt ? (
                          formatTime(delivery.deliveredAt)
                        ) : delivery.failureReason ? (
                          <span className="text-red-600">{delivery.failureReason}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {delivery.status === 'failed' && (
                          <Button size="sm" variant="outline">
                            Retry
                          </Button>
                        )}
                        {delivery.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            Send Now
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}