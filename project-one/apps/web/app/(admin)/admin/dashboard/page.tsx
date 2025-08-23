'use client'

import { useEffect, useState } from 'react'
import { DashboardStats } from '@/components/admin/dashboard-stats'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  adminService, 
  type PlatformMetrics, 
  type ActivityFeedItem 
} from '@/lib/services/admin-service'
import {
  Activity,
  RefreshCw,
  Download,
  Calendar,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      const [metricsData, feedData] = await Promise.all([
        adminService.getPlatformMetrics(),
        adminService.getActivityFeed(10)
      ])
      setMetrics(metricsData)
      setActivityFeed(feedData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch(type) {
      case 'user_signup':
        return <Users className="w-4 h-4 text-blue-500" />
      case 'content_created':
        return <FileText className="w-4 h-4 text-green-500" />
      case 'compliance_flagged':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'subscription_changed':
        return <Activity className="w-4 h-4 text-purple-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getActivityBadge = (type: ActivityFeedItem['type']) => {
    switch(type) {
      case 'user_signup':
        return <Badge className="bg-blue-100 text-blue-700 border-0">New User</Badge>
      case 'content_created':
        return <Badge className="bg-green-100 text-green-700 border-0">Content</Badge>
      case 'compliance_flagged':
        return <Badge className="bg-red-100 text-red-700 border-0">Compliance</Badge>
      case 'subscription_changed':
        return <Badge className="bg-purple-100 text-purple-700 border-0">Subscription</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#0B1F33]">Platform Overview</h2>
          <p className="text-gray-600 mt-1">
            Real-time metrics and activity monitoring
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-[#CEA200] hover:bg-[#B89200] text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats metrics={metrics} loading={loading} />

      {/* Activity Feed and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#0B1F33]">
                Real-time Activity Feed
              </h3>
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {activityFeed.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              ) : (
                activityFeed.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="mt-1">{getActivityIcon(item.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-900">{item.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(item.timestamp), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        {getActivityBadge(item.type)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* System Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">WhatsApp API</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Service</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">89ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Redis Queue</span>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">8 jobs</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start bg-[#0B1F33] hover:bg-[#1A365D] text-white"
                onClick={() => window.location.href = '/admin/content'}
              >
                <FileText className="w-4 h-4 mr-2" />
                Review Pending Content
                {metrics && metrics.totalContentCreated > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white">
                    {metrics.totalContentCreated}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin/analytics'}
              >
                <Activity className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
              Upcoming Tasks
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Content Review</p>
                  <p className="text-xs text-gray-500">20:30 IST - Daily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">System Backup</p>
                  <p className="text-xs text-gray-500">02:00 IST - Daily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Weekly Report</p>
                  <p className="text-xs text-gray-500">Monday 09:00 IST</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}