'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Target,
  Award,
  Calendar,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  Eye,
  Share2,
  MousePointer
} from 'lucide-react';

interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  unit?: string;
}

interface ContentPerformance {
  category: string;
  sent: number;
  opened: number;
  clicked: number;
  shared: number;
  engagement: number;
}

interface PerformanceAnalyticsProps {
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
  onExport?: () => void;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  dateRange = 'week',
  onExport
}) => {
  const [selectedRange, setSelectedRange] = useState(dateRange);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Mock performance data
  const keyMetrics: PerformanceMetric[] = [
    { label: 'Total Reach', value: 1234, change: 12.5, trend: 'up', unit: 'clients' },
    { label: 'Engagement Rate', value: 78.5, change: 5.2, trend: 'up', unit: '%' },
    { label: 'Open Rate', value: 92.3, change: -2.1, trend: 'down', unit: '%' },
    { label: 'Click Rate', value: 34.7, change: 8.9, trend: 'up', unit: '%' },
    { label: 'Share Rate', value: 12.4, change: 3.2, trend: 'up', unit: '%' },
    { label: 'Response Time', value: 2.3, change: -0.5, trend: 'up', unit: 'hrs' }
  ];

  const contentPerformance: ContentPerformance[] = [
    { category: 'Educational', sent: 245, opened: 220, clicked: 89, shared: 34, engagement: 78 },
    { category: 'Market Updates', sent: 189, opened: 175, clicked: 67, shared: 23, engagement: 72 },
    { category: 'Tax Planning', sent: 156, opened: 148, clicked: 98, shared: 45, engagement: 85 },
    { category: 'Investment Tips', sent: 134, opened: 120, clicked: 56, shared: 19, engagement: 68 },
    { category: 'Seasonal', sent: 98, opened: 89, clicked: 34, shared: 12, engagement: 62 }
  ];

  const clientEngagement = {
    activeClients: 247,
    newClients: 23,
    churnedClients: 5,
    avgSessionTime: '4m 32s',
    totalInteractions: 1456,
    satisfactionScore: 4.6
  };

  const complianceMetrics = {
    overallScore: 95,
    rulesCompliance: 98,
    aiValidation: 92,
    finalApproval: 94,
    rejectionRate: 3.2,
    avgProcessingTime: 1.8
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral', positive: boolean = true) => {
    if (trend === 'up') {
      return positive ? 
        <ArrowUp className="h-4 w-4 text-green-600" /> : 
        <ArrowUp className="h-4 w-4 text-red-600" />;
    } else if (trend === 'down') {
      return positive ? 
        <ArrowDown className="h-4 w-4 text-red-600" /> : 
        <ArrowDown className="h-4 w-4 text-green-600" />;
    }
    return null;
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Performance Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                <Button
                  key={range}
                  variant={selectedRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRange(range)}
                  className="capitalize"
                >
                  {range === 'week' ? 'Last 7 Days' :
                   range === 'month' ? 'Last 30 Days' :
                   range === 'quarter' ? 'Last 3 Months' : 'Last Year'}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {keyMetrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-gray-600">{metric.label}</span>
              {getTrendIcon(metric.trend, metric.change > 0)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{metric.value}</span>
              {metric.unit && (
                <span className="text-sm text-gray-500">{metric.unit}</span>
              )}
            </div>
            <div className={`text-xs mt-1 ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metric.change > 0 ? '+' : ''}{metric.change}% from last {selectedRange}
            </div>
          </Card>
        ))}
      </div>

      {/* Content Performance Table */}
      <Card className="p-6">
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => toggleSection('content')}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Content Performance by Category
          </h3>
          {expandedSection === 'content' ? 
            <ChevronUp className="h-5 w-5" /> : 
            <ChevronDown className="h-5 w-5" />
          }
        </div>
        
        {(expandedSection === 'content' || expandedSection === null) && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-gray-700">Category</th>
                  <th className="pb-3 font-medium text-gray-700 text-center">Sent</th>
                  <th className="pb-3 font-medium text-gray-700 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-4 w-4" />
                      Opened
                    </div>
                  </th>
                  <th className="pb-3 font-medium text-gray-700 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MousePointer className="h-4 w-4" />
                      Clicked
                    </div>
                  </th>
                  <th className="pb-3 font-medium text-gray-700 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Share2 className="h-4 w-4" />
                      Shared
                    </div>
                  </th>
                  <th className="pb-3 font-medium text-gray-700 text-center">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {contentPerformance.map((item) => (
                  <tr key={item.category} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{item.category}</td>
                    <td className="py-3 text-center">{item.sent}</td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span>{item.opened}</span>
                        <span className="text-xs text-gray-500">
                          ({((item.opened / item.sent) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span>{item.clicked}</span>
                        <span className="text-xs text-gray-500">
                          ({((item.clicked / item.opened) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span>{item.shared}</span>
                        <span className="text-xs text-gray-500">
                          ({((item.shared / item.sent) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={item.engagement} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{item.engagement}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Client Engagement & Compliance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Engagement */}
        <Card className="p-6">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => toggleSection('engagement')}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Engagement
            </h3>
            {expandedSection === 'engagement' ? 
              <ChevronUp className="h-5 w-5" /> : 
              <ChevronDown className="h-5 w-5" />
            }
          </div>
          
          {(expandedSection === 'engagement' || expandedSection === null) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Active Clients</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{clientEngagement.activeClients}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">New This Week</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">+{clientEngagement.newClients}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Session Time</span>
                  <span className="font-semibold">{clientEngagement.avgSessionTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Interactions</span>
                  <span className="font-semibold">{clientEngagement.totalInteractions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Satisfaction Score</span>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{clientEngagement.satisfactionScore}/5</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Churn Rate</span>
                  <span className="font-semibold text-red-600">
                    {((clientEngagement.churnedClients / clientEngagement.activeClients) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Compliance Metrics */}
        <Card className="p-6">
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => toggleSection('compliance')}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Metrics
            </h3>
            {expandedSection === 'compliance' ? 
              <ChevronUp className="h-5 w-5" /> : 
              <ChevronDown className="h-5 w-5" />
            }
          </div>
          
          {(expandedSection === 'compliance' || expandedSection === null) && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Compliance Score</span>
                  <Badge className="bg-green-600">{complianceMetrics.overallScore}%</Badge>
                </div>
                <Progress value={complianceMetrics.overallScore} className="h-3" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stage 1: Rules Engine</span>
                  <div className="flex items-center gap-2">
                    <Progress value={complianceMetrics.rulesCompliance} className="w-20 h-2" />
                    <span className="text-sm font-medium">{complianceMetrics.rulesCompliance}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stage 2: AI Validation</span>
                  <div className="flex items-center gap-2">
                    <Progress value={complianceMetrics.aiValidation} className="w-20 h-2" />
                    <span className="text-sm font-medium">{complianceMetrics.aiValidation}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stage 3: Final Review</span>
                  <div className="flex items-center gap-2">
                    <Progress value={complianceMetrics.finalApproval} className="w-20 h-2" />
                    <span className="text-sm font-medium">{complianceMetrics.finalApproval}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejection Rate</span>
                  <span className="font-semibold text-red-600">{complianceMetrics.rejectionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Processing Time</span>
                  <span className="font-semibold">{complianceMetrics.avgProcessingTime}s</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Performance Tips */}
      <Card className="p-6 bg-blue-50">
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Performance Insights</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Your engagement rate is 15% higher than the platform average</li>
              <li>• Tax planning content shows the highest client interaction</li>
              <li>• Consider scheduling more content during 9-11 AM for better reach</li>
              <li>• Hindi content has 23% higher share rate than English</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Add missing import
import { Shield } from 'lucide-react';

export default PerformanceAnalytics;