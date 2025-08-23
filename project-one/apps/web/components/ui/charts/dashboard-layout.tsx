// Dashboard Layout Component
// Responsive grid layout for analytics dashboards

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    badge?: string | number;
  }>;
  alerts?: Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    action?: () => void;
  }>;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  children,
  actions,
  tabs,
  alerts,
  className = ''
}) => {
  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            {actions}
          </div>
        )}
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`p-4 ${getAlertStyles(alert.type)}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={alert.action}
                    className="ml-3"
                  >
                    Action
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs or Direct Content */}
      {tabs ? (
        <Tabs defaultValue={tabs[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <span>{tab.label}</span>
                {tab.badge && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
};

// Grid Layout Component for organizing dashboard widgets
interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 4 | 6 | 8;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  columns = 12,
  gap = 6,
  className = ''
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gapClasses = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  };

  return (
    <div className={`grid ${gridClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Widget wrapper component
interface DashboardWidgetProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 6 | 12;
  loading?: boolean;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  children,
  className = '',
  colSpan = 1,
  loading = false
}) => {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 lg:col-span-2',
    3: 'col-span-1 lg:col-span-3',
    4: 'col-span-1 lg:col-span-4',
    6: 'col-span-1 lg:col-span-6',
    12: 'col-span-1 lg:col-span-12'
  };

  if (loading) {
    return (
      <div className={`${colSpanClasses[colSpan]} ${className}`}>
        <Card className="p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${colSpanClasses[colSpan]} ${className}`}>
      {children}
    </div>
  );
};

export default DashboardLayout;