'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LineChart } from '@/components/ui/charts/line-chart'
import { BarChart } from '@/components/ui/charts/bar-chart'
import { PieChart } from '@/components/ui/charts/pie-chart'
import { 
  adminService, 
  type UserGrowthData, 
  type RevenueData 
} from '@/lib/services/admin-service'
import {
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  FileText,
  Activity,
  Download,
  Calendar,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState(30)
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [contentStats, setContentStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const [growth, revenue, content] = await Promise.all([
        adminService.getUserGrowthData(timeRange),
        adminService.getRevenueData(timeRange),
        adminService.getContentPerformanceStats()
      ])
      setUserGrowthData(growth)
      setRevenueData(revenue)
      setContentStats(content)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  // Calculate summary metrics
  const calculateMetrics = () => {
    const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)
    const avgRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0
    const totalNewUsers = userGrowthData.reduce((sum, d) => sum + d.newUsers, 0)
    const totalChurned = userGrowthData.reduce((sum, d) => sum + d.churnedUsers, 0)
    
    // Calculate growth rate
    const lastWeek = revenueData.slice(-7)
    const previousWeek = revenueData.slice(-14, -7)
    const lastWeekRevenue = lastWeek.reduce((sum, d) => sum + d.revenue, 0)
    const previousWeekRevenue = previousWeek.reduce((sum, d) => sum + d.revenue, 0)
    const growthRate = previousWeekRevenue > 0 
      ? ((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 
      : 0

    return {
      totalRevenue,
      avgRevenue,
      totalNewUsers,
      totalChurned,
      growthRate
    }
  }

  const metrics = calculateMetrics()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#0B1F33]">Platform Analytics</h2>
          <p className="text-gray-600 mt-1">
            Revenue metrics, user growth, and content performance insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#CEA200] hover:bg-[#B89200] text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Analytics
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              {metrics.growthRate.toFixed(1)}%
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {formatCurrency(metrics.totalRevenue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Last {timeRange} days
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-0">
              +{metrics.totalNewUsers}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">New Users</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {metrics.totalNewUsers}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.totalChurned} churned
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-0">
              Daily Avg
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Daily Revenue</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {formatCurrency(metrics.avgRevenue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Per day average
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-0">
              Total
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Content Created</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {contentStats?.totalUsage || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total usage count
            </p>
          </div>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
              Revenue Trends
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
              </div>
            ) : (
              <LineChart
                data={revenueData.map(d => ({
                  label: format(new Date(d.date), 'MMM dd'),
                  value: d.revenue
                }))}
                height={300}
                color="#CEA200"
              />
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
                Revenue by Subscription Tier
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
                </div>
              ) : (
                <PieChart
                  data={[
                    { label: 'Pro', value: revenueData.reduce((sum, d) => sum + d.subscriptions.pro * 2499, 0) },
                    { label: 'Standard', value: revenueData.reduce((sum, d) => sum + d.subscriptions.standard * 999, 0) },
                    { label: 'Basic', value: revenueData.reduce((sum, d) => sum + d.subscriptions.basic * 499, 0) },
                    { label: 'Free', value: 0 }
                  ]}
                  height={250}
                />
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
                Subscription Distribution
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
                </div>
              ) : (
                <BarChart
                  data={[
                    { label: 'Free', value: revenueData[revenueData.length - 1]?.subscriptions.free || 0 },
                    { label: 'Basic', value: revenueData[revenueData.length - 1]?.subscriptions.basic || 0 },
                    { label: 'Standard', value: revenueData[revenueData.length - 1]?.subscriptions.standard || 0 },
                    { label: 'Pro', value: revenueData[revenueData.length - 1]?.subscriptions.pro || 0 }
                  ]}
                  height={250}
                  color="#0B1F33"
                />
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
              User Growth
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
              </div>
            ) : (
              <LineChart
                data={userGrowthData.map(d => ({
                  label: format(new Date(d.date), 'MMM dd'),
                  value: d.newUsers
                }))}
                height={300}
                color="#0B1F33"
              />
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
                Active vs Churned Users
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
                </div>
              ) : (
                <BarChart
                  data={[
                    { label: 'Active', value: userGrowthData.reduce((sum, d) => sum + d.activeUsers, 0) },
                    { label: 'New', value: userGrowthData.reduce((sum, d) => sum + d.newUsers, 0) },
                    { label: 'Churned', value: userGrowthData.reduce((sum, d) => sum + d.churnedUsers, 0) }
                  ]}
                  height={250}
                  color="#10B981"
                />
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
                User Acquisition Trend
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
                </div>
              ) : (
                <LineChart
                  data={userGrowthData.map(d => ({
                    label: format(new Date(d.date), 'MMM dd'),
                    value: d.activeUsers
                  }))}
                  height={250}
                  color="#6366F1"
                />
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
                Content by Type
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
                </div>
              ) : (
                <PieChart
                  data={Object.entries(contentStats?.byType || {}).map(([label, value]) => ({
                    label,
                    value: value as number
                  }))}
                  height={250}
                />
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
                Content by Language
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
                </div>
              ) : (
                <BarChart
                  data={Object.entries(contentStats?.byLanguage || {}).map(([label, value]) => ({
                    label: label.toUpperCase(),
                    value: value as number
                  }))}
                  height={250}
                  color="#F59E0B"
                />
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
                Compliance Status Distribution
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
                </div>
              ) : (
                <PieChart
                  data={Object.entries(contentStats?.byCompliance || {}).map(([label, value]) => ({
                    label,
                    value: value as number
                  }))}
                  height={250}
                />
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
                Content Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-sm text-gray-600">Total Content Created</span>
                  <span className="text-lg font-semibold">
                    {Object.values(contentStats?.byType || {}).reduce((sum: number, val: any) => sum + val, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-sm text-gray-600">Total Usage Count</span>
                  <span className="text-lg font-semibold">{contentStats?.totalUsage || 0}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-sm text-gray-600">Approved Content</span>
                  <span className="text-lg font-semibold text-green-600">
                    {contentStats?.byCompliance?.APPROVED || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">Pending Review</span>
                  <span className="text-lg font-semibold text-yellow-600">
                    {contentStats?.byCompliance?.PENDING || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}