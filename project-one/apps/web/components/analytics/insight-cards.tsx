import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface InsightCardsProps {
  insights: any; // WeeklyInsight type
}

export function InsightCards({ insights }: InsightCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Content Suggestions Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Content Ideas</h3>
          <Lightbulb className="w-5 h-5 text-yellow-500" />
        </div>
        <ul className="space-y-2">
          {insights.ai_recommendations.content_suggestions.slice(0, 3).map((suggestion: string, index: number) => (
            <li key={index} className="text-sm text-gray-600 flex items-start">
              <span className="text-[#CEA200] mr-2">•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </Card>

      {/* Top Performing Topics Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Top Topics</h3>
          <Target className="w-5 h-5 text-green-500" />
        </div>
        <div className="space-y-2">
          {insights.performance_analysis.best_performing_topics.slice(0, 3).map((topic: string, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{topic}</span>
              <Badge variant="secondary" className="text-xs">
                #{index + 1}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Week Comparison Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">vs Last Week</h3>
          {insights.comparative_analysis.vs_previous_week.engagement_change > 0 ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Content</span>
            <span className={`text-sm font-semibold ${
              insights.comparative_analysis.vs_previous_week.content_growth > 0 
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {insights.comparative_analysis.vs_previous_week.content_growth > 0 ? '+' : ''}
              {insights.comparative_analysis.vs_previous_week.content_growth.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Engagement</span>
            <span className={`text-sm font-semibold ${
              insights.comparative_analysis.vs_previous_week.engagement_change > 0 
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {insights.comparative_analysis.vs_previous_week.engagement_change > 0 ? '+' : ''}
              {insights.comparative_analysis.vs_previous_week.engagement_change.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Compliance</span>
            <span className={`text-sm font-semibold ${
              insights.comparative_analysis.vs_previous_week.compliance_improvement > 0 
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {insights.comparative_analysis.vs_previous_week.compliance_improvement > 0 ? '+' : ''}
              {insights.comparative_analysis.vs_previous_week.compliance_improvement.toFixed(1)}%
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}