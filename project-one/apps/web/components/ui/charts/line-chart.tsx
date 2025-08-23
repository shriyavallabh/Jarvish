// Line Chart Component
// Responsive line chart for analytics data visualization

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartDataPoint, TimeSeriesData } from '@/lib/types/analytics';

interface LineChartProps {
  data: TimeSeriesData;
  title: string;
  description?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
}

const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  title,
  description,
  color = '#8884d8',
  height = 300,
  showGrid = true,
  showLegend = false,
  formatValue,
  formatLabel
}) => {
  const formatTooltipValue = (value: number) => {
    if (formatValue) return formatValue(value);
    return value.toLocaleString();
  };

  const formatXAxisLabel = (label: string) => {
    if (formatLabel) return formatLabel(label);
    // Format date labels
    const date = new Date(label);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10b981'; // Green
      case 'down': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center space-x-2">
            <span 
              className="text-sm font-medium"
              style={{ color: getTrendColor(data.trend) }}
            >
              {getTrendIcon(data.trend)} {Math.abs(data.trend_percentage).toFixed(1)}%
            </span>
          </div>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data.series}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          )}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={formatXAxisLabel}
            stroke="#9ca3af"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={formatValue}
            stroke="#9ca3af"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number) => [formatTooltipValue(value), 'Value']}
            labelFormatter={(label) => formatXAxisLabel(label)}
          />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default LineChartComponent;