'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplianceCheck {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  score: number;
  details?: string[];
  timestamp?: string;
}

interface ComplianceIndicatorProps {
  content?: string;
  score?: number;
  status?: 'compliant' | 'warning' | 'non-compliant';
  checks?: ComplianceCheck[];
  onRecheck?: () => void;
  showDetails?: boolean;
  realTime?: boolean;
}

export const ComplianceIndicator: React.FC<ComplianceIndicatorProps> = ({
  content,
  score = 0,
  status = 'compliant',
  checks = [],
  onRecheck,
  showDetails = false,
  realTime = false
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isChecking, setIsChecking] = useState(false);
  const [liveScore, setLiveScore] = useState(score);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Three-stage compliance checks
  const defaultChecks: ComplianceCheck[] = checks.length > 0 ? checks : [
    {
      name: 'Stage 1: SEBI Rules Engine',
      status: liveScore >= 70 ? 'passed' : liveScore >= 50 ? 'warning' : 'failed',
      score: Math.min(100, liveScore + 10),
      details: [
        'No guaranteed returns mentioned',
        'Risk disclaimers present',
        'Educational content verified',
        'EUIN properly displayed'
      ]
    },
    {
      name: 'Stage 2: AI Validation',
      status: liveScore >= 80 ? 'passed' : liveScore >= 60 ? 'warning' : 'failed',
      score: liveScore,
      details: [
        'Tone and language appropriate',
        'No misleading information',
        'Factual accuracy verified',
        'Context alignment checked'
      ]
    },
    {
      name: 'Stage 3: Final Verification',
      status: liveScore >= 90 ? 'passed' : liveScore >= 70 ? 'warning' : 'failed',
      score: Math.max(0, liveScore - 5),
      details: [
        'Manual review completed',
        'Compliance team approved',
        'Ready for distribution'
      ]
    }
  ];

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(liveScore);
    }, 100);
    return () => clearTimeout(timer);
  }, [liveScore]);

  // Real-time compliance checking simulation
  useEffect(() => {
    if (realTime && content) {
      const checkInterval = setInterval(() => {
        // Simulate real-time score updates based on content
        const randomVariation = Math.random() * 10 - 5;
        const newScore = Math.max(0, Math.min(100, score + randomVariation));
        setLiveScore(Math.round(newScore));
      }, 3000);

      return () => clearInterval(checkInterval);
    }
  }, [realTime, content, score]);

  const handleRecheck = async () => {
    setIsChecking(true);
    // Simulate recheck delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (onRecheck) {
      onRecheck();
    } else {
      // Simulate score improvement
      const improvement = Math.random() * 10 + 5;
      setLiveScore(Math.min(100, liveScore + improvement));
    }
    
    setIsChecking(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'compliant':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'failed':
      case 'non-compliant':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'compliant':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'failed':
      case 'non-compliant':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getOverallStatus = () => {
    if (animatedScore >= 90) return 'compliant';
    if (animatedScore >= 70) return 'warning';
    return 'non-compliant';
  };

  const getComplianceMessage = () => {
    if (animatedScore >= 90) return 'Content is fully SEBI compliant';
    if (animatedScore >= 70) return 'Minor compliance issues detected';
    return 'Significant compliance issues - revision required';
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            animatedScore >= 90 ? "bg-green-100" : 
            animatedScore >= 70 ? "bg-yellow-100" : "bg-red-100"
          )}>
            <Shield className={cn(
              "h-6 w-6",
              getStatusColor(getOverallStatus())
            )} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Compliance Status</h3>
            <p className="text-sm text-gray-600">{getComplianceMessage()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {realTime && (
            <Badge variant="outline" className="animate-pulse">
              <Clock className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecheck}
            disabled={isChecking}
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recheck
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Score Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Compliance Score</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{animatedScore}%</span>
            {liveScore > score && (
              <TrendingUp className="h-4 w-4 text-green-600" />
            )}
            {liveScore < score && (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>
        <Progress 
          value={animatedScore} 
          className="h-3"
          style={{
            background: animatedScore >= 90 ? undefined : 
                       animatedScore >= 70 ? undefined : undefined
          }}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Non-Compliant (0-69)</span>
          <span>Warning (70-89)</span>
          <span>Compliant (90-100)</span>
        </div>
      </div>

      {/* Three-Stage Validation */}
      <div className="space-y-3 mb-4">
        {defaultChecks.map((check, index) => (
          <div key={check.name} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={getStatusColor(check.status)}>
                  {getStatusIcon(check.status)}
                </div>
                <span className="font-medium text-sm">{check.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{check.score}%</span>
                <Badge 
                  variant={check.status === 'passed' ? 'default' : 
                          check.status === 'warning' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {check.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            {isExpanded && check.details && (
              <div className="mt-2 pl-7">
                <ul className="space-y-1">
                  {check.details.map((detail, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Expand/Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Show Details
          </>
        )}
      </Button>

      {/* Compliance Tips */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Compliance Tips
          </h4>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• Always include risk disclaimers for investment products</li>
            <li>• Avoid promising guaranteed returns or specific outcomes</li>
            <li>• Ensure educational tone in all communications</li>
            <li>• Include your EUIN in every message</li>
            <li>• Keep content factual and verifiable</li>
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      {animatedScore < 90 && (
        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            View Suggestions
          </Button>
          <Button 
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Auto-Fix Issues
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ComplianceIndicator;