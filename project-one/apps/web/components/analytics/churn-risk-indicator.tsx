import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ChurnRiskIndicatorProps {
  risk: {
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    probability_30_day: number;
    risk_factors: string[];
  };
}

export function ChurnRiskIndicator({ risk }: ChurnRiskIndicatorProps) {
  const getRiskColor = () => {
    switch (risk.risk_level) {
      case 'critical':
        return 'text-red-600 bg-red-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskIcon = () => {
    switch (risk.risk_level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5" />
      case 'medium':
        return <AlertCircle className="w-5 h-5" />
      case 'low':
        return <Shield className="w-5 h-5" />
      default:
        return <CheckCircle className="w-5 h-5" />
    }
  }

  const getRiskLabel = () => {
    switch (risk.risk_level) {
      case 'critical':
        return 'Critical Risk'
      case 'high':
        return 'High Risk'
      case 'medium':
        return 'Medium Risk'
      case 'low':
        return 'Low Risk'
      default:
        return 'Unknown'
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Churn Risk</h3>
        <div className={`p-2 rounded-lg ${getRiskColor()}`}>
          {getRiskIcon()}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Risk Score</span>
            <span className="text-2xl font-bold text-[#0B1F33]">
              {risk.risk_score}
              <span className="text-sm text-gray-500">/100</span>
            </span>
          </div>
          <Progress 
            value={risk.risk_score} 
            className="h-2"
            indicatorClassName={
              risk.risk_level === 'critical' ? 'bg-red-600' :
              risk.risk_level === 'high' ? 'bg-orange-600' :
              risk.risk_level === 'medium' ? 'bg-yellow-600' :
              'bg-green-600'
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <Badge className={`${getRiskColor()} border-0`}>
            {getRiskLabel()}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">30-Day Probability</span>
          <span className="text-sm font-semibold">
            {(risk.probability_30_day * 100).toFixed(1)}%
          </span>
        </div>

        {risk.risk_factors.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 mb-1">Top Risk Factor:</p>
            <p className="text-xs text-gray-900">{risk.risk_factors[0]}</p>
          </div>
        )}
      </div>
    </Card>
  )
}