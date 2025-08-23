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
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  FileText,
  Activity,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Target,
  Zap,
  Shield,
  Brain
} from 'lucide-react'
import { format } from 'date-fns'

interface PlatformAnalytics {
  overview: {
    total_advisors: number;
    active_advisors: number;
    new_signups: number;
    churned_advisors: number;
    total_revenue: number;
    mrr: number;
    arr: number;
    average_revenue_per_user: number;
    lifetime_value: number;
    churn_rate: number;
    growth_rate: number;
  };
  cohort_analysis: {
    cohorts: Array<{
      cohort_month: string;
      initial_size: number;
      current_size: number;
      retention_rate: number;
      average_revenue: number;
    }>;
    retention_curve: Array<{
      month: number;
      retention_percentage: number;
    }>;
  };
  revenue_attribution: {
    by_tier: Record<string, { revenue: number; percentage: number; advisors: number }>;
    by_feature: Record<string, { revenue: number; percentage: number }>;
    top_revenue_drivers: Array<{
      driver: string;
      impact: number;
      trend: string;
      recommendation: string;
    }>;
  };
  content_analytics: {
    total_content_created: number;
    ai_generated_percentage: number;
    approval_rate: number;
    popular_topics: Array<{
      topic: string;
      count: number;
      engagement_rate: number;
      trending: boolean;
    }>;
    content_velocity: number;
    quality_score: number;
  };
  compliance_analytics: {
    total_checks: number;
    pass_rate: number;
    common_violations: Array<{
      violation: string;
      count: number;
      severity: string;
    }>;
    processing_time: {
      average: number;
      p95: number;
    };
  };
  feature_adoption: {
    features: Array<{
      feature: string;
      users: number;
      usage_rate: number;
      engagement_impact: number;
      revenue_impact: number;
    }>;
  };
  system_health: {
    api_availability: number;
    ai_service_availability: number;
    whatsapp_delivery_rate: number;
    average_response_time: number;
    error_rate: number;
  };
}

interface ChurnStatistics {
  total_advisors: number;
  at_risk_count: number;
  critical_count: number;
  average_risk_score: number;
  distribution: Record<string, number>;
  top_risk_factors: string[];
}

export default function PlatformAnalyticsPage() {
  const [timeRange, setTimeRange] = useState(30)
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [churnStats, setChurnStats] = useState<ChurnStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      const [analyticsRes, churnRes] = await Promise.all([
        fetch(`/api/analytics/admin/platform?days=${timeRange}`),
        fetch('/api/analytics/admin/churn-statistics')
      ])

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data)
      }

      if (churnRes.ok) {
        const data = await churnRes.json()
        setChurnStats(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const exportAnalytics = async (format: 'json' | 'csv') => {
    const res = await fetch(`/api/analytics/admin/export?format=${format}&days=${timeRange}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `platform_analytics_${format(new Date(), 'yyyy-MM-dd')}.${format}`
      a.click()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA200] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading platform analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1F33]">Platform Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive business intelligence and performance metrics
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
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="bg-[#CEA200] hover:bg-[#B89200] text-white"
            onClick={() => exportAnalytics('csv')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <Badge className={`border-0 ${
              analytics.overview.growth_rate > 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {analytics.overview.growth_rate > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(analytics.overview.growth_rate).toFixed(1)}%
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Monthly Recurring Revenue</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {formatCurrency(analytics.overview.mrr)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ARR: {formatCurrency(analytics.overview.arr)}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-0">
              {((analytics.overview.active_advisors / analytics.overview.total_advisors) * 100).toFixed(0)}% active
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Advisors</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {analytics.overview.total_advisors}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              +{analytics.overview.new_signups} new this period
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <Badge className={`border-0 ${
              analytics.overview.churn_rate < 5 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {analytics.overview.churn_rate.toFixed(1)}%
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Churn Rate</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {analytics.overview.churned_advisors}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              advisors churned
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-0">
              LTV/CAC
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Unit Economics</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {(analytics.overview.lifetime_value / 1500).toFixed(1)}x
            </p>
            <p className="text-xs text-gray-500 mt-1">
              LTV: {formatCurrency(analytics.overview.lifetime_value)}
            </p>
          </div>
        </Card>
      </div>

      {/* Churn Risk Overview */}
      {churnStats && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#0B1F33]">Churn Risk Analysis</h3>
            <Badge variant="outline">
              {churnStats.total_advisors} advisors analyzed
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{churnStats.critical_count}</p>
              <p className="text-sm text-gray-600 mt-1">Critical Risk</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{churnStats.at_risk_count}</p>
              <p className="text-sm text-gray-600 mt-1">At Risk</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0B1F33]">
                {churnStats.average_risk_score.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Avg Risk Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {churnStats.total_advisors - churnStats.at_risk_count - churnStats.critical_count}
              </p>
              <p className="text-sm text-gray-600 mt-1">Healthy</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Top Risk Factors:</p>
            <div className="flex flex-wrap gap-2">
              {churnStats.top_risk_factors.map((factor, index) => (
                <Badge key={index} variant="secondary">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue by Tier */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
              Revenue Attribution
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">By Subscription Tier</h4>
                <PieChart
                  data={Object.entries(analytics.revenue_attribution.by_tier).map(([tier, data]) => ({
                    label: tier,
                    value: data.revenue
                  }))}
                  height={250}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">By Feature</h4>
                <BarChart
                  data={Object.entries(analytics.revenue_attribution.by_feature).map(([feature, data]) => ({
                    label: feature.split(' ').slice(0, 2).join(' '),
                    value: data.percentage
                  }))}
                  height={250}
                  color="#CEA200"
                />
              </div>
            </div>
          </Card>

          {/* Revenue Drivers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
              Top Revenue Drivers
            </h3>
            <div className="space-y-4">
              {analytics.revenue_attribution.top_revenue_drivers.map((driver, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{driver.driver}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {driver.impact}% impact
                        </Badge>
                        <Badge className={`border-0 ${
                          driver.trend === 'increasing' 
                            ? 'bg-green-100 text-green-700'
                            : driver.trend === 'decreasing'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {driver.trend}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{driver.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-6">
          {/* Retention Curve */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
              Retention Analysis
            </h3>
            <LineChart
              data={analytics.cohort_analysis.retention_curve.map(d => ({
                label: `Month ${d.month}`,
                value: d.retention_percentage
              }))}
              height={300}
              color="#0B1F33"
            />
          </Card>

          {/* Cohort Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
              Monthly Cohorts
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Cohort</th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Initial Size</th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Current Size</th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Retention</th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Avg Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.cohort_analysis.cohorts.slice(0, 6).map((cohort, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 text-sm">{cohort.cohort_month}</td>
                      <td className="py-2 px-4 text-sm text-right">{cohort.initial_size}</td>
                      <td className="py-2 px-4 text-sm text-right">{cohort.current_size}</td>
                      <td className="py-2 px-4 text-sm text-right">
                        <Badge variant={cohort.retention_rate > 80 ? 'default' : 'secondary'}>
                          {cohort.retention_rate.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-sm text-right">
                        {formatCurrency(cohort.average_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-5 h-5 text-[#CEA200]" />
                <Badge variant="outline">Total</Badge>
              </div>
              <p className="text-2xl font-bold text-[#0B1F33]">
                {analytics.content_analytics.total_content_created}
              </p>
              <p className="text-sm text-gray-600 mt-1">Content Created</p>
              <p className="text-xs text-gray-500 mt-2">
                {analytics.content_analytics.content_velocity.toFixed(1)} per day
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Brain className="w-5 h-5 text-purple-600" />
                <Badge variant="outline">AI</Badge>
              </div>
              <p className="text-2xl font-bold text-[#0B1F33]">
                {analytics.content_analytics.ai_generated_percentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">AI Generated</p>
              <p className="text-xs text-gray-500 mt-2">
                Quality: {analytics.content_analytics.quality_score.toFixed(1)}%
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <Badge variant="outline">Compliance</Badge>
              </div>
              <p className="text-2xl font-bold text-[#0B1F33]">
                {analytics.content_analytics.approval_rate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Approval Rate</p>
              <p className="text-xs text-gray-500 mt-2">
                {analytics.compliance_analytics.total_checks} checks
              </p>
            </Card>
          </div>

          {/* Popular Topics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
              Trending Topics
            </h3>
            <div className="space-y-3">
              {analytics.content_analytics.popular_topics.slice(0, 5).map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{topic.topic}</p>
                      <p className="text-sm text-gray-600">{topic.count} posts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {topic.trending && (
                      <Badge className="bg-green-100 text-green-700 border-0">
                        Trending
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {topic.engagement_rate.toFixed(1)}% engagement
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Compliance Analytics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
              Compliance Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.compliance_analytics.pass_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 mt-1">Pass Rate</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.compliance_analytics.processing_time.average.toFixed(0)}ms
                </p>
                <p className="text-xs text-gray-600 mt-1">Avg Time</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.compliance_analytics.processing_time.p95.toFixed(0)}ms
                </p>
                <p className="text-xs text-gray-600 mt-1">P95 Time</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.compliance_analytics.common_violations.length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Violation Types</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Common Violations:</p>
              <div className="space-y-2">
                {analytics.compliance_analytics.common_violations.slice(0, 3).map((violation, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{violation.violation}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{violation.count}</Badge>
                      <Badge className={`border-0 ${
                        violation.severity === 'high' 
                          ? 'bg-red-100 text-red-700'
                          : violation.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {violation.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Feature Adoption */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
              Feature Adoption & Impact
            </h3>
            <div className="space-y-4">
              {analytics.feature_adoption.features.map((feature, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{feature.feature}</h4>
                    <Badge variant="outline">
                      {feature.usage_rate}% adoption
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Users</p>
                      <p className="text-lg font-semibold">{feature.users}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Engagement Impact</p>
                      <p className="text-lg font-semibold text-green-600">
                        +{feature.engagement_impact}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue Impact</p>
                      <p className="text-lg font-semibold text-[#CEA200]">
                        +{feature.revenue_impact}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* System Health */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F33] mb-6">
              System Health Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">API Availability</p>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.system_health.api_availability}%
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">AI Service</p>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.system_health.ai_service_availability}%
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">WhatsApp Delivery</p>
                  {analytics.system_health.whatsapp_delivery_rate > 95 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.system_health.whatsapp_delivery_rate}%
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.system_health.average_response_time}ms
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Error Rate</p>
                  {analytics.system_health.error_rate < 1 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-2xl font-bold text-[#0B1F33]">
                  {analytics.system_health.error_rate}%
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}