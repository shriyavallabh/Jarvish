import { useState, useEffect, useCallback } from 'react';
import { useDebouncedApi } from './use-api';
import { ComplianceCheckResponse, ComplianceFlag } from '@/lib/types/api';
import { api } from '@/lib/api/client';

interface UseComplianceCheckOptions {
  enabled?: boolean;
  debounceMs?: number;
  minLength?: number;
}

export function useComplianceCheck(
  text: string,
  type: 'market_update' | 'educational' | 'promotional' | 'news' = 'market_update',
  language: 'en' | 'hi' | 'mr' = 'en',
  options: UseComplianceCheckOptions = {}
) {
  const {
    enabled = true,
    debounceMs = 500,
    minLength = 10,
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced text state
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, debounceMs]);

  // Perform compliance check
  useEffect(() => {
    if (!enabled || !debouncedText || debouncedText.length < minLength) {
      setResult(null);
      return;
    }

    const checkCompliance = async () => {
      setIsChecking(true);
      setError(null);

      try {
        const response = await api.post<ComplianceCheckResponse>(
          '/compliance/check',
          {
            text: debouncedText,
            type,
            language,
          }
        );

        setResult(response as any);
      } catch (err: any) {
        setError(err.message || 'Compliance check failed');
        setResult(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkCompliance();
  }, [debouncedText, type, language, enabled, minLength]);

  return {
    isChecking,
    result,
    error,
    riskScore: result?.riskScore,
    flags: result?.flags || [],
    suggestions: result?.suggestions || [],
    approved: result?.approved || false,
  };
}

// Hook for getting compliance status color
export function useComplianceColor(score: number | undefined) {
  if (score === undefined) return 'gray';
  if (score < 30) return 'green';
  if (score < 70) return 'yellow';
  return 'red';
}

// Hook for formatting compliance messages
export function useComplianceMessage(flags: ComplianceFlag[]) {
  const getHighestSeverityFlag = useCallback(() => {
    if (!flags || flags.length === 0) return null;

    const severityOrder = { high: 3, medium: 2, low: 1 };
    return flags.sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
    )[0];
  }, [flags]);

  const formatMessage = useCallback((flag: ComplianceFlag | null) => {
    if (!flag) return 'Content is compliant';

    const prefix = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    }[flag.type];

    return `${prefix} ${flag.message}`;
  }, []);

  const highestFlag = getHighestSeverityFlag();
  const message = formatMessage(highestFlag);

  return {
    message,
    highestFlag,
    hasErrors: flags.some((f) => f.type === 'error'),
    hasWarnings: flags.some((f) => f.type === 'warning'),
  };
}

// Hook for real-time compliance tracking
export function useRealtimeCompliance(contentId: string, interval: number = 5000) {
  const [status, setStatus] = useState<'checking' | 'approved' | 'rejected' | 'pending'>('pending');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    if (!contentId) return;

    const checkStatus = async () => {
      try {
        const response = await api.get(`/content/${contentId}/compliance-status`);
        const data = response as any;
        
        setStatus(data.status);
        setLastChecked(new Date());
      } catch (error) {
        console.error('Failed to check compliance status:', error);
      }
    };

    // Initial check
    checkStatus();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkStatus, interval);

    return () => clearInterval(intervalId);
  }, [contentId, interval]);

  return {
    status,
    lastChecked,
    isApproved: status === 'approved',
    isRejected: status === 'rejected',
    isPending: status === 'pending' || status === 'checking',
  };
}