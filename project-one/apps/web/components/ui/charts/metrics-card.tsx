// Metrics Card Component
// Display key metrics with trend indicators and comparison data

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MetricsCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: 'percentage' | 'absolute';
  trend?: 'up' | 'down' | 'stable';
  description?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  previousValue,
  change,
  changeType = 'percentage',
  trend,
  description,
  icon,
  color = 'blue',
  size = 'md',
  className = ''
}) => {
  // Format the main value
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  // Calculate change if not provided
  const calculatedChange = change ?? (
    previousValue && typeof value === 'number' && typeof previousValue === 'number'
      ? ((value - previousValue) / previousValue) * 100
      : 0
  );

  // Determine trend if not provided
  const calculatedTrend = trend ?? (
    calculatedChange > 5 ? 'up' : calculatedChange < -5 ? 'down' : 'stable'
  );

  // Get trend styling
  const getTrendColor = (trendDirection: string) => {
    switch (trendDirection) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trendDirection: string) => {
    switch (trendDirection) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getTrendBadgeColor = (trendDirection: string) => {
    switch (trendDirection) {
      case 'up': return 'bg-green-100 text-green-800';
      case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Size variants
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const valueSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  // Color variants
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    gray: 'border-gray-200 bg-gray-50'
  };

  return (
    <Card className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {icon && <div className="text-gray-600">{icon}</div>}
            <h3 className={`font-medium text-gray-700 ${titleSizeClasses[size]}`}>
              {title}
            </h3>
          </div>
          
          <div className="mt-2">
            <p className={`font-bold text-gray-900 ${valueSizeClasses[size]}`}>
              {formatValue(value)}
            </p>
            
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Trend indicator */}
        {(change !== undefined || calculatedChange !== 0) && (
          <div className="flex flex-col items-end">
            <Badge className={`${getTrendBadgeColor(calculatedTrend)} text-xs font-medium`}>
              {getTrendIcon(calculatedTrend)} {Math.abs(calculatedChange).toFixed(1)}
              {changeType === 'percentage' ? '%' : ''}
            </Badge>
            
            {previousValue && (
              <p className="text-xs text-gray-500 mt-1">
                vs {formatValue(previousValue)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress bar for percentage metrics */}
      {typeof value === 'number' && value <= 100 && value >= 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                calculatedTrend === 'up' ? 'bg-green-500' :
                calculatedTrend === 'down' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default MetricsCard;