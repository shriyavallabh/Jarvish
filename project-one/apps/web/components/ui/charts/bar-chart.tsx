// Bar Chart Component
// Responsive bar chart for analytics data visualization

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartDataPoint } from '@/lib/types/analytics';

interface BarChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  dataKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
}

const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  title,
  description,
  dataKey = 'value',
  color = '#3b82f6',
  height = 300,
  showGrid = true,
  showLegend = false,
  horizontal = false,
  formatValue,
  formatLabel
}) => {
  const formatTooltipValue = (value: number) => {
    if (formatValue) return formatValue(value);
    return value.toLocaleString();
  };

  const formatAxisLabel = (label: string) => {
    if (formatLabel) return formatLabel(label);
    return label;
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{formatAxisLabel(label)}</p>
          <p className="text-sm" style={{ color: data.color }}>
            <span className="font-medium">{dataKey}: </span>
            {formatTooltipValue(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? 'horizontal' : 'vertical'}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          )}
          
          {horizontal ? (
            <>
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                tickFormatter={formatValue}
                stroke="#9ca3af"
              />
              <YAxis 
                type="category" 
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickFormatter={formatAxisLabel}
                stroke="#9ca3af"
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickFormatter={formatAxisLabel}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={formatValue}
                stroke="#9ca3af"
              />
            </>
          )}
          
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default BarChartComponent;