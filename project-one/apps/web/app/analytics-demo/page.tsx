// Analytics Demo Page
// Comprehensive demonstration of the AI-powered analytics and business intelligence system

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  BarChart, 
  PieChart, 
  MetricsCard, 
  DashboardLayout, 
  DashboardGrid, 
  DashboardWidget 
} from '@/components/ui/charts';
import { 
  AdvisorMetrics, 
  WeeklyInsight, 
  ChurnPrediction, 
  BusinessIntelligence,
  TimeSeriesData,
  ChartDataPoint 
} from '@/lib/types/analytics';

// Mock data for demonstration
const mockAdvisorMetrics: AdvisorMetrics = {
  advisor_id: 'advisor-demo-123',
  business_name: 'Demo Advisory Services',
  subscription_tier: 'pro',
  period_start: '2024-08-13T00:00:00Z',
  period_end: '2024-08-20T00:00:00Z',
  
  content_performance: {
    total_created: 12,
    approved_content: 11,
    rejected_content: 1,
    delivered_content: 10,
    approval_rate: 0.917,
    delivery_success_rate: 0.909
  },
  
  engagement: {
    total_sent: 10,
    delivered: 9,
    read: 7,
    delivery_rate: 0.9,
    read_rate: 0.778,
    trend_direction: 'improving',
    week_over_week_change: 12.5
  },
  
  language_performance: {
    english: {
      content_count: 7,
      read_rate: 0.714,
      engagement_score: 0.82
    },
    hindi: {
      content_count: 5,
      read_rate: 0.86,
      engagement_score: 0.91
    },
    preferred_language: 'hindi'
  },
  
  topic_breakdown: {
    'SIP': {
      content_count: 4,
      read_rate: 0.85,
      compliance_score: 94,
      performance_trend: 'up'
    },
    'Tax Planning': {
      content_count: 3,
      read_rate: 0.78,
      compliance_score: 89,
      performance_trend: 'stable'
    },
    'Market Update': {
      content_count: 5,
      read_rate: 0.72,
      compliance_score: 91,
      performance_trend: 'down'
    }
  },
  
  compliance: {
    average_score: 91.3,
    violations_count: 0,
    trend_direction: 'improving',
    score_change: 7.2,
    ai_accuracy: 0.96
  },
  
  health_score: 89,
  risk_level: 'low'
};

const mockWeeklyInsight: WeeklyInsight = {
  advisor_id: 'advisor-demo-123',
  week_start: '2024-08-13T00:00:00Z',
  week_end: '2024-08-20T00:00:00Z',
  
  summary: 'Excellent week with 12.5% improvement in read rates driven by strong Hindi content performance and SIP topic focus',
  
  key_wins: [
    'Hindi content achieved 86% read rate - 20% higher than English',
    'SIP content performing exceptionally with 85% engagement',
    'Zero compliance violations with 7.2 point score improvement',
    'Tuesday and Thursday delivery showing 15% better engagement'
  ],
  
  optimization_opportunities: [
    'Market update content underperforming - consider simpler explanations',
    'English content engagement declining - review language complexity',
    'Weekend delivery showing lower engagement - focus on weekdays'
  ],
  
  metrics: mockAdvisorMetrics,
  
  content_recommendations: {
    optimal_topics: ['SIP', 'Tax Planning', 'Insurance'],
    best_posting_times: ['09:00', '18:00', '20:00'],
    language_preference: 'hindi',
    suggested_frequency: 5
  },
  
  peer_comparison: {
    performance_percentile: 82,
    above_peer_average: true,
    key_differentiators: ['Strong Hindi content strategy', 'Consistent SIP focus', 'High compliance scores']
  },
  
  generated_at: new Date().toISOString(),
  ai_confidence: 0.87
};

const mockChurnPrediction: ChurnPrediction = {
  advisor_id: 'advisor-demo-123',
  
  churn_risk_30_day: 15,
  churn_risk_60_day: 22,
  churn_risk_90_day: 28,
  
  overall_health_score: 89,
  risk_category: 'good',
  
  risk_factors: {
    declining_engagement: {
      score: 10,
      description: 'Engagement stable with slight upward trend',
      trend: 5.2
    },
    payment_issues: {
      score: 5,
      failed_payments: 0,
      overdue_days: 0
    },
    support_escalations: {
      score: 8,
      ticket_count: 1,
      negative_sentiment: 0.1
    },
    content_creation_drop: {
      score: 12,
      days_since_last_content: 2,
      trend: 8.5
    },
    feature_adoption: {
      score: 15,
      unused_features: [],
      adoption_rate: 0.92
    }
  },
  
  recommended_actions: [
    {
      priority: 'low',
      action_type: 'priority_support',
      description: 'Continue excellent performance with proactive support',
      expected_impact: 25
    }
  ],
  
  model_version: '1.0.0',
  prediction_confidence: 0.91,
  last_updated: new Date().toISOString()
};

// Mock time series data
const generateMockTimeSeriesData = (days: number, baseValue: number, trend: number): TimeSeriesData => {
  const series: ChartDataPoint[] = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const trendValue = (days - i) * trend;
    const randomVariation = (Math.random() - 0.5) * baseValue * 0.1;
    const value = Math.max(0, baseValue + trendValue + randomVariation);
    
    series.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }
  
  const trendPercentage = trend > 0 ? 8.5 : trend < 0 ? -5.2 : 1.1;
  
  return {
    series,
    trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
    trend_percentage: trendPercentage
  };
};

const mockEngagementData = generateMockTimeSeriesData(30, 75, 0.5);
const mockContentCreationData = generateMockTimeSeriesData(30, 4.2, 0.1);
const mockComplianceData = generateMockTimeSeriesData(30, 88, 0.3);

// Topic performance data
const topicPerformanceData: ChartDataPoint[] = [
  { date: 'SIP', value: 85, label: 'SIP', category: 'high' },
  { date: 'Tax Planning', value: 78, label: 'Tax Planning', category: 'medium' },
  { date: 'Insurance', value: 82, label: 'Insurance', category: 'high' },
  { date: 'Market Update', value: 72, label: 'Market Update', category: 'low' },
  { date: 'Government Schemes', value: 79, label: 'Govt Schemes', category: 'medium' }
];

// Language distribution data
const languageDistributionData: ChartDataPoint[] = [
  { date: 'Hindi', value: 58, label: 'Hindi (58%)', category: 'primary' },
  { date: 'English', value: 35, label: 'English (35%)', category: 'secondary' },
  { date: 'Mixed', value: 7, label: 'Mixed (7%)', category: 'tertiary' }
];

const AnalyticsDemoPage: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'advisor' | 'admin'>('advisor');
  const [loading, setLoading] = useState(false);
  
  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const advisorDashboardTabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <DashboardGrid columns={12} gap={6}>
          <DashboardWidget colSpan={3} loading={loading}>
            <MetricsCard
              title="Weekly Content"
              value={mockAdvisorMetrics.content_performance.total_created}
              previousValue={8}
              trend="up"
              color="blue"
              icon="📝"
              description="Pieces created this week"
            />
          </DashboardWidget>
          
          <DashboardWidget colSpan={3} loading={loading}>
            <MetricsCard
              title="Engagement Rate"
              value={`${(mockAdvisorMetrics.engagement.read_rate * 100).toFixed(1)}%`}
              change={mockAdvisorMetrics.engagement.week_over_week_change}
              trend="up"
              color="green"
              icon="👁"
              description="Content read rate"
            />
          </DashboardWidget>
          
          <DashboardWidget colSpan={3} loading={loading}>
            <MetricsCard
              title="Compliance Score"
              value={`${mockAdvisorMetrics.compliance.average_score.toFixed(1)}`}
              change={mockAdvisorMetrics.compliance.score_change}
              trend="up"
              color="yellow"
              icon="✅"
              description="SEBI compliance rating"
            />
          </DashboardWidget>
          
          <DashboardWidget colSpan={3} loading={loading}>
            <MetricsCard
              title="Health Score"
              value={mockAdvisorMetrics.health_score}
              trend="up"
              color="green"
              icon="❤️"
              description="Overall advisor health"
            />
          </DashboardWidget>
          
          <DashboardWidget colSpan={8} loading={loading}>
            <LineChart
              data={mockEngagementData}
              title="Engagement Trend (30 Days)"
              description="Daily engagement rate showing consistent improvement"
              color="#10b981"
              formatValue={(value) => `${value.toFixed(1)}%`}
            />
          </DashboardWidget>
          
          <DashboardWidget colSpan={4} loading={loading}>
            <PieChart
              data={languageDistributionData}
              title="Language Performance"
              description="Content distribution by language"
              colors={['#3b82f6', '#10b981', '#f59e0b']}
            />
          </DashboardWidget>
        </DashboardGrid>
      )
    },
    {
      id: 'insights',
      label: 'AI Insights',
      badge: 'New',
      content: (
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Weekly AI Insights</h3>
              <Badge className="bg-green-100 text-green-800">
                Confidence: {Math.round(mockWeeklyInsight.ai_confidence * 100)}%
              </Badge>
            </div>
            
            <div className="prose prose-sm text-gray-700 mb-4">
              <p className="text-base font-medium">{mockWeeklyInsight.summary}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 mb-2">🎉 Key Wins This Week</h4>
                <ul className="space-y-1">
                  {mockWeeklyInsight.key_wins.map((win, index) => (
                    <li key={index} className="text-sm text-gray-700">• {win}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-orange-800 mb-2">🎯 Optimization Opportunities</h4>
                <ul className="space-y-1">
                  {mockWeeklyInsight.optimization_opportunities.map((opp, index) => (
                    <li key={index} className="text-sm text-gray-700">• {opp}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Performance Percentile: </span>
                  <span className="font-medium text-blue-600">
                    {mockWeeklyInsight.peer_comparison.performance_percentile}th percentile
                  </span>
                </div>
                <Badge variant="secondary">
                  {mockWeeklyInsight.peer_comparison.above_peer_average ? 'Above Average' : 'Below Average'}
                </Badge>
              </div>
            </div>
          </Card>
          
          <DashboardGrid columns={2} gap={6}>
            <DashboardWidget loading={loading}>
              <BarChart
                data={topicPerformanceData}
                title="Topic Performance Analysis"
                description="Engagement rates by content topic"
                color="#3b82f6"
                formatValue={(value) => `${value}%`}
              />
            </DashboardWidget>
            
            <DashboardWidget loading={loading}>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">Optimal Topics</h4>
                    <p className="text-sm text-gray-600">
                      Focus on: {mockWeeklyInsight.content_recommendations.optimal_topics.join(', ')}
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-900">Best Timing</h4>
                    <p className="text-sm text-gray-600">
                      Post at: {mockWeeklyInsight.content_recommendations.best_posting_times.join(', ')}
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-medium text-gray-900">Language Strategy</h4>
                    <p className="text-sm text-gray-600">
                      Preferred: {mockWeeklyInsight.content_recommendations.language_preference}
                    </p>
                  </div>
                </div>
              </Card>
            </DashboardWidget>
          </DashboardGrid>
        </div>
      )
    },
    {
      id: 'churn',
      label: 'Health Analysis',
      content: (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <MetricsCard
              title="30-Day Risk"
              value={`${mockChurnPrediction.churn_risk_30_day}%`}
              color="green"
              size="sm"
              description="Very low risk"
            />
            <MetricsCard
              title="60-Day Risk"
              value={`${mockChurnPrediction.churn_risk_60_day}%`}
              color="yellow"
              size="sm"
              description="Low risk"
            />
            <MetricsCard
              title="90-Day Risk"
              value={`${mockChurnPrediction.churn_risk_90_day}%`}
              color="yellow"
              size="sm"
              description="Low risk"
            />
            <MetricsCard
              title="Health Score"
              value={mockChurnPrediction.overall_health_score}
              color="green"
              size="sm"
              description="Excellent health"
            />
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Factor Analysis</h3>
            <div className="space-y-4">
              {Object.entries(mockChurnPrediction.risk_factors).map(([factor, data]) => (
                <div key={factor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium capitalize">{factor.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600">{data.description}</p>
                  </div>
                  <Badge 
                    className={
                      data.score < 20 ? 'bg-green-100 text-green-800' :
                      data.score < 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {data.score}% Risk
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )
    }
  ];

  const adminDashboardTabs = [
    {
      id: 'platform',
      label: 'Platform Overview',
      content: (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 mb-4">
            Admin Analytics Dashboard
          </h3>
          <p className="text-gray-500 mb-6">
            This would show platform-wide KPIs, revenue analytics, user acquisition metrics,
            and business intelligence insights for administrators.
          </p>
          <Button variant="outline">
            View Full Admin Demo
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <DashboardLayout
        title="JARVISH Analytics Intelligence Demo"
        subtitle="AI-powered insights for financial advisory platform optimization"
        actions={
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={activeDemo === 'advisor' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveDemo('advisor')}
              >
                Advisor View
              </Button>
              <Button
                variant={activeDemo === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveDemo('admin')}
              >
                Admin View
              </Button>
            </div>
            <Button onClick={handleRefreshData} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        }
        tabs={activeDemo === 'advisor' ? advisorDashboardTabs : adminDashboardTabs}
        alerts={[
          {
            id: 'demo-alert',
            type: 'info',
            message: 'This is a demo of the JARVISH Analytics system with mock data. Real implementation connects to live Supabase data.',
            action: () => alert('This is a demo system!')
          }
        ]}
      />
      
      {/* System Architecture Info */}
      <Card className="mt-8 p-6 bg-white border-2 border-dashed border-gray-300">
        <h3 className="text-lg font-semibold mb-4">🏗️ System Architecture Overview</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600">Analytics Engine</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Advisor metrics calculation</li>
              <li>• Time series analysis</li>
              <li>• Performance benchmarking</li>
              <li>• Caching layer (5min TTL)</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-green-600">Churn Prediction</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• ML-based health scoring</li>
              <li>• Risk factor identification</li>
              <li>• 30/60/90-day predictions</li>
              <li>• Automated interventions</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-purple-600">Business Intelligence</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Platform-wide KPIs</li>
              <li>• Revenue analytics</li>
              <li>• User acquisition metrics</li>
              <li>• Market trend analysis</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-orange-600">AI Insights</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Weekly advisor reports</li>
              <li>• Content optimization</li>
              <li>• Personalized recommendations</li>
              <li>• Peer comparisons</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Supabase</Badge>
            <Badge variant="secondary">Recharts</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">React Query</Badge>
            <Badge variant="secondary">Real-time Updates</Badge>
            <Badge variant="secondary">Export (PDF/Excel)</Badge>
            <Badge variant="secondary">DPDP Compliant</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsDemoPage;