'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Shield,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { checkCompliance, autoFixContent } from '@/lib/api/compliance';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';

interface RealTimeComplianceCheckerProps {
  content: string;
  language?: 'en' | 'hi' | 'mr';
  contentType?: 'whatsapp' | 'status' | 'linkedin' | 'email';
  advisorId?: string;
  onComplianceUpdate?: (isCompliant: boolean, score: number) => void;
  onAutoFix?: (fixedContent: string) => void;
  autoCheck?: boolean;
  showAutoFix?: boolean;
}

export default function RealTimeComplianceChecker({
  content,
  language = 'en',
  contentType = 'whatsapp',
  advisorId,
  onComplianceUpdate,
  onAutoFix,
  autoCheck = true,
  showAutoFix = true
}: RealTimeComplianceCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);

  // Debounced compliance check
  const debouncedCheck = useMemo(
    () =>
      debounce(async (text: string) => {
        if (!text || text.length < 10) return;

        setIsChecking(true);
        const startTime = Date.now();

        try {
          const result = await checkCompliance({
            content: text,
            language,
            contentType,
            advisorId
          });

          setComplianceResult(result);
          setLastCheckTime(Date.now() - startTime);
          
          if (onComplianceUpdate) {
            onComplianceUpdate(result.isCompliant, 100 - result.riskScore);
          }
        } catch (error) {
          console.error('Compliance check failed:', error);
          toast.error('Failed to check compliance');
        } finally {
          setIsChecking(false);
        }
      }, 500),
    [language, contentType, advisorId, onComplianceUpdate]
  );

  // Auto-check on content change
  useEffect(() => {
    if (autoCheck && content) {
      debouncedCheck(content);
    }
  }, [content, autoCheck, debouncedCheck]);

  // Manual check
  const handleManualCheck = useCallback(async () => {
    if (!content) return;

    setIsChecking(true);
    const startTime = Date.now();

    try {
      const result = await checkCompliance({
        content,
        language,
        contentType,
        advisorId,
        skipCache: true
      });

      setComplianceResult(result);
      setLastCheckTime(Date.now() - startTime);
      
      if (onComplianceUpdate) {
        onComplianceUpdate(result.isCompliant, 100 - result.riskScore);
      }

      toast.success('Compliance check completed');
    } catch (error) {
      console.error('Compliance check failed:', error);
      toast.error('Failed to check compliance');
    } finally {
      setIsChecking(false);
    }
  }, [content, language, contentType, advisorId, onComplianceUpdate]);

  // Auto-fix functionality
  const handleAutoFix = useCallback(async () => {
    if (!content || !complianceResult || complianceResult.isCompliant) return;

    setIsFixing(true);
    try {
      const fixed = await autoFixContent(content, language);
      
      if (fixed.wasFixed && fixed.fixedContent) {
        if (onAutoFix) {
          onAutoFix(fixed.fixedContent);
        }
        toast.success('Content automatically fixed');
        
        // Re-check the fixed content
        const recheck = await checkCompliance({
          content: fixed.fixedContent,
          language,
          contentType,
          advisorId
        });
        setComplianceResult(recheck);
      } else {
        toast.error('Unable to auto-fix. Manual changes required.');
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
      toast.error('Failed to auto-fix content');
    } finally {
      setIsFixing(false);
    }
  }, [content, complianceResult, language, contentType, advisorId, onAutoFix]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get compliance status color
  const getComplianceColor = () => {
    if (!complianceResult) return 'gray';
    if (complianceResult.isCompliant) return 'green';
    if (complianceResult.riskScore >= 70) return 'red';
    if (complianceResult.riskScore >= 40) return 'orange';
    return 'yellow';
  };

  const color = getComplianceColor();

  if (!content) {
    return null;
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className={`h-5 w-5 ${
            color === 'green' ? 'text-green-600' :
            color === 'red' ? 'text-red-600' :
            color === 'orange' ? 'text-orange-600' :
            color === 'yellow' ? 'text-yellow-600' :
            'text-gray-600'
          }`} />
          <h3 className="font-semibold">Compliance Check</h3>
          {isChecking && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          )}
          {lastCheckTime > 0 && !isChecking && (
            <Badge variant="outline" className="text-xs">
              {lastCheckTime}ms
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!autoCheck && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualCheck}
              disabled={isChecking || !content}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Check
            </Button>
          )}
          
          {showAutoFix && complianceResult && !complianceResult.isCompliant && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoFix}
              disabled={isFixing || complianceResult.riskScore >= 70}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Auto-Fix
            </Button>
          )}
        </div>
      </div>

      {/* Compliance Status */}
      {complianceResult && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {complianceResult.isCompliant ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Compliant</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-600 font-medium">Non-Compliant</span>
                </>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-xs text-gray-500">Risk Score</p>
              <p className={`text-lg font-bold ${
                complianceResult.riskScore >= 70 ? 'text-red-600' :
                complianceResult.riskScore >= 40 ? 'text-orange-600' :
                complianceResult.riskScore >= 20 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {complianceResult.riskScore}%
              </p>
            </div>
          </div>

          {/* Risk Score Progress */}
          <div className="space-y-1">
            <Progress 
              value={100 - complianceResult.riskScore} 
              className={`h-2 ${
                complianceResult.riskScore >= 70 ? 'bg-red-100' :
                complianceResult.riskScore >= 40 ? 'bg-orange-100' :
                complianceResult.riskScore >= 20 ? 'bg-yellow-100' :
                'bg-green-100'
              }`}
            />
            <p className="text-xs text-gray-500">
              Compliance Score: {100 - complianceResult.riskScore}%
            </p>
          </div>

          {/* Validation Stages */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {complianceResult.stagesCompleted.rules ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span className={complianceResult.stagesCompleted.rules ? 'text-green-600' : 'text-gray-400'}>
                Rules Check
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {complianceResult.stagesCompleted.ai ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span className={complianceResult.stagesCompleted.ai ? 'text-green-600' : 'text-gray-400'}>
                AI Analysis
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {complianceResult.stagesCompleted.final ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span className={complianceResult.stagesCompleted.final ? 'text-green-600' : 'text-gray-400'}>
                Final Review
              </span>
            </div>
          </div>

          {/* Issues */}
          {complianceResult.issues && complianceResult.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Issues Found ({complianceResult.issues.length})
              </h4>
              
              {complianceResult.issues.map((issue: any, index: number) => (
                <Alert key={index} className={getSeverityColor(issue.severity)}>
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs mb-1"
                        >
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <p className="text-sm font-medium">{issue.description}</p>
                        {issue.suggestion && (
                          <p className="text-xs mt-1 opacity-75">
                            💡 {issue.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {complianceResult.suggestions && complianceResult.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Info className="h-4 w-4" />
                Suggestions
              </h4>
              
              <ul className="space-y-1">
                {complianceResult.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {isChecking && !complianceResult && (
        <div className="py-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Checking compliance...</p>
          <p className="text-xs text-gray-400 mt-1">Three-stage validation in progress</p>
        </div>
      )}
    </Card>
  );
}