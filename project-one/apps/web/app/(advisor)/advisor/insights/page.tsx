'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InsightCards } from '@/components/analytics/insight-cards'
import { ChurnRiskIndicator } from '@/components/analytics/churn-risk-indicator'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Brain,
  Clock,
  Globe
} from 'lucide-react'
import { format } from 'date-fns'

interface WeeklyInsight {
  period: {
    start: string;
    end: string;
    week_number: number;
  };
  summary: string;
  key_metrics: {
    content_created: number;
    messages_sent: number;
    delivery_rate: number;
    engagement_rate: number;
    compliance_score: number;
  };
  performance_analysis: {
    best_performing_topics: string[];
    optimal_timing: {
      best_days: string[];
      best_hours: number[];
    };
    language_preference: {
      primary: string;
      recommendation: string;
    };
  };
  ai_recommendations: {
    content_suggestions: string[];
    optimization_opportunities: string[];
    risk_areas: string[];
    action_items: Array<{
      priority: string;
      category: string;
      action: string;
      expected_impact: string;
    }>;
  };
  comparative_analysis: {
    vs_previous_week: {
      content_growth: number;
      engagement_change: number;
      compliance_improvement: number;
    };
    vs_peer_advisors: {
      percentile_rank: number;
      above_average_areas: string[];
    };
  };
  health_score: number;
  trend_direction: 'improving' | 'stable' | 'declining';
}

interface ContentOptimization {
  optimal_posting_times: {
    best_days: Array<{ day: string; engagement_rate: number }>;
    best_hours: Array<{ hour: number; engagement_rate: number }>;
  };
  topic_recommendations: Array<{
    topic: string;
    predicted_engagement: number;
    trending: boolean;
    sample_headlines: string[];
  }>;
  content_suggestions: Array<{
    title: string;
    content: string;
    predicted_engagement: number;
    optimal_send_time: string;
  }>;
}

export default function AdvisorInsightsPage() {
  const { user } = useUser()
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null)
  const [contentOptimization, setContentOptimization] = useState<ContentOptimization | null>(null)
  const [churnRisk, setChurnRisk] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      
      // Fetch all insights in parallel
      const [insightRes, optimizationRes, churnRes] = await Promise.all([
        fetch('/api/analytics/advisor/weekly-insights'),
        fetch('/api/analytics/advisor/content-optimization'),
        fetch('/api/analytics/advisor/churn-risk')
      ])

      if (insightRes.ok) {
        const data = await insightRes.json()
        setWeeklyInsight(data)
      }

      if (optimizationRes.ok) {
        const data = await optimizationRes.json()
        setContentOptimization(data)
      }

      if (churnRes.ok) {
        const data = await churnRes.json()
        setChurnRisk(data)
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchInsights()
    setRefreshing(false)
  }

  const exportInsights = () => {
    // Export insights as PDF or JSON
    const dataStr = JSON.stringify({
      weeklyInsight,
      contentOptimization,
      generatedAt: new Date().toISOString()
    }, null, 2)
    
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `insights_${format(new Date(), 'yyyy-MM-dd')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA200] mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1F33]">Your Performance Insights</h1>
          <p className="text-gray-600 mt-2">
            AI-powered analytics and recommendations for {user?.firstName || 'your'} advisory practice
          </p>
        </div>
        <div className="flex gap-3">
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
            onClick={exportInsights}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Health Score and Trend */}
      {weeklyInsight && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Health Score</h3>
              <Badge className={`
                ${weeklyInsight.health_score >= 80 ? 'bg-green-100 text-green-700' : 
                  weeklyInsight.health_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'} border-0
              `}>
                {weeklyInsight.health_score >= 80 ? 'Excellent' : 
                 weeklyInsight.health_score >= 60 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
            <div className="text-4xl font-bold text-[#0B1F33] mb-2">
              {weeklyInsight.health_score}
              <span className="text-lg text-gray-500">/100</span>
            </div>
            <div className="flex items-center text-sm">
              {weeklyInsight.trend_direction === 'improving' ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">Improving trend</span>
                </>
              ) : weeklyInsight.trend_direction === 'declining' ? (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  <span className="text-red-600">Declining trend</span>
                </>
              ) : (
                <>
                  <span className="text-gray-600">Stable performance</span>
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Peer Ranking</h3>
              <Target className="w-5 h-5 text-[#CEA200]" />
            </div>
            <div className="text-4xl font-bold text-[#0B1F33] mb-2">
              Top {100 - weeklyInsight.comparative_analysis.vs_peer_advisors.percentile_rank}%
            </div>
            <p className="text-sm text-gray-600">
              Among advisors in your tier
            </p>
            <div className="mt-3">
              {weeklyInsight.comparative_analysis.vs_peer_advisors.above_average_areas.slice(0, 2).map((area, i) => (
                <Badge key={i} variant="secondary" className="mr-2 mb-1 text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </Card>

          {churnRisk && <ChurnRiskIndicator risk={churnRisk} />}
        </div>
      )}

      {/* Weekly Summary */}
      {weeklyInsight && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#0B1F33]">Weekly Summary</h3>
              <p className="text-sm text-gray-600 mt-1">
                {format(new Date(weeklyInsight.period.start), 'MMM d')} - {format(new Date(weeklyInsight.period.end), 'MMM d, yyyy')}
              </p>
            </div>
            <Badge variant="outline">
              Week {weeklyInsight.period.week_number}
            </Badge>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            {weeklyInsight.summary}
          </p>
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-[#0B1F33]">
                {weeklyInsight.key_metrics.content_created}
              </p>
              <p className="text-xs text-gray-600 mt-1">Content Created</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-[#0B1F33]">
                {weeklyInsight.key_metrics.messages_sent}
              </p>
              <p className="text-xs text-gray-600 mt-1">Messages Sent</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-[#0B1F33]">
                {weeklyInsight.key_metrics.delivery_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Delivery Rate</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-[#0B1F33]">
                {weeklyInsight.key_metrics.engagement_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Engagement</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-[#0B1F33]">
                {weeklyInsight.key_metrics.compliance_score.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Compliance</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="optimization">Content Optimization</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          {weeklyInsight && (
            <>
              {/* Action Items */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-[#0B1F33] mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-[#CEA200]" />
                  Priority Action Items
                </h3>
                <div className="space-y-3">
                  {weeklyInsight.ai_recommendations.action_items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        item.priority === 'high' ? 'bg-red-500' :
                        item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.action}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.expected_impact}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Opportunities and Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-[#0B1F33] mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Optimization Opportunities
                  </h3>
                  <ul className="space-y-2">
                    {weeklyInsight.ai_recommendations.optimization_opportunities.map((opp, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{opp}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-[#0B1F33] mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                    Risk Areas to Monitor
                  </h3>
                  <ul className="space-y-2">
                    {weeklyInsight.ai_recommendations.risk_areas.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {contentOptimization && (
            <>
              {/* Optimal Posting Times */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-[#0B1F33] mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-[#CEA200]" />
                  Optimal Posting Times
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Best Days</h4>
                    <div className="space-y-2">
                      {contentOptimization.optimal_posting_times.best_days.slice(0, 3).map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium">{day.day}</span>
                          <span className="text-sm text-gray-600">
                            {day.engagement_rate.toFixed(1)}% engagement
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Best Hours</h4>
                    <div className="space-y-2">
                      {contentOptimization.optimal_posting_times.best_hours.slice(0, 3).map((hour, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium">
                            {hour.hour > 12 ? `${hour.hour - 12} PM` : `${hour.hour} AM`}
                          </span>
                          <span className="text-sm text-gray-600">
                            {hour.engagement_rate.toFixed(1)}% engagement
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Topic Recommendations */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-[#0B1F33] mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-[#CEA200]" />
                  Recommended Topics
                </h3>
                <div className="space-y-4">
                  {contentOptimization.topic_recommendations.map((topic, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{topic.topic}</h4>
                        <div className="flex items-center gap-2">
                          {topic.trending && (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              Trending
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {topic.predicted_engagement}% predicted
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Sample Headlines:</p>
                        <ul className="space-y-1">
                          {topic.sample_headlines.map((headline, i) => (
                            <li key={i} className="text-sm text-gray-600 pl-4">
                              • {headline}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Content Suggestions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
                  Ready-to-Use Content
                </h3>
                <div className="space-y-4">
                  {contentOptimization.content_suggestions.slice(0, 2).map((suggestion, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                        <Badge variant="outline">
                          {suggestion.predicted_engagement}% predicted
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                        {suggestion.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Best time: {format(new Date(suggestion.optimal_send_time), 'MMM d, h:mm a')}
                        </span>
                        <Button size="sm" className="bg-[#CEA200] hover:bg-[#B89200] text-white">
                          Use This Content
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {weeklyInsight && (
            <>
              {/* Performance Trends */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
                  Week-over-Week Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Content Growth</p>
                    <p className={`text-2xl font-bold ${
                      weeklyInsight.comparative_analysis.vs_previous_week.content_growth > 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {weeklyInsight.comparative_analysis.vs_previous_week.content_growth > 0 ? '+' : ''}
                      {weeklyInsight.comparative_analysis.vs_previous_week.content_growth.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Engagement Change</p>
                    <p className={`text-2xl font-bold ${
                      weeklyInsight.comparative_analysis.vs_previous_week.engagement_change > 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {weeklyInsight.comparative_analysis.vs_previous_week.engagement_change > 0 ? '+' : ''}
                      {weeklyInsight.comparative_analysis.vs_previous_week.engagement_change.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Compliance Improvement</p>
                    <p className={`text-2xl font-bold ${
                      weeklyInsight.comparative_analysis.vs_previous_week.compliance_improvement > 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {weeklyInsight.comparative_analysis.vs_previous_week.compliance_improvement > 0 ? '+' : ''}
                      {weeklyInsight.comparative_analysis.vs_previous_week.compliance_improvement.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>

              {/* Top Performing Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">
                    Best Performing Topics
                  </h3>
                  <div className="space-y-2">
                    {weeklyInsight.performance_analysis.best_performing_topics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{topic}</span>
                        <Badge variant="secondary">Top Performer</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-[#0B1F33] mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-[#CEA200]" />
                    Language Insights
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Primary Language</p>
                      <p className="font-semibold text-lg">
                        {weeklyInsight.performance_analysis.language_preference.primary === 'en' ? 'English' :
                         weeklyInsight.performance_analysis.language_preference.primary === 'hi' ? 'Hindi' : 'Marathi'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">
                      {weeklyInsight.performance_analysis.language_preference.recommendation}
                    </p>
                  </div>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Insight Cards Component */}
      {weeklyInsight && (
        <InsightCards insights={weeklyInsight} />
      )}
    </div>
  )
}