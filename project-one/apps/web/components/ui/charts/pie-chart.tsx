// Pie Chart Component
// Responsive pie chart for analytics data visualization

'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartDataPoint } from '@/lib/types/analytics';

interface PieChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  colors?: string[];
  formatValue?: (value: number) => string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  title,
  description,
  height = 300,
  showLegend = true,
  showLabels = true,
  colors = COLORS,
  formatValue
}) => {
  const formatTooltipValue = (value: number) => {
    if (formatValue) return formatValue(value);
    return value.toLocaleString();
  };

  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom label renderer
  const renderLabel = (entry: any) => {
    if (!showLabels) return '';
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            <span className="font-medium">Value: </span>
            {formatTooltipValue(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Percentage: </span>
            {percent}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend content
  const CustomLegend = ({ payload }: any) => {
    if (!showLegend || !payload) return null;
    
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const percent = ((entry.payload.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">
                {entry.value} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    );
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="label"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PieChartComponent;