'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'
import { PlatformMetrics } from '@/lib/services/admin-service'

interface DashboardStatsProps {
  metrics: PlatformMetrics | null
  loading?: boolean
}

export function DashboardStats({ metrics, loading }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const stats = [
    {
      label: 'Total Advisors',
      value: metrics?.totalAdvisors || 0,
      change: '+12%',
      changeType: 'positive',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
      format: formatNumber
    },
    {
      label: 'Monthly Revenue',
      value: metrics?.monthlyRecurringRevenue || 0,
      change: '+23%',
      changeType: 'positive',
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'bg-green-500',
      format: formatCurrency
    },
    {
      label: 'Active Users',
      value: metrics?.activeAdvisors || 0,
      change: '+8%',
      changeType: 'positive',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-purple-500',
      format: formatNumber
    },
    {
      label: 'Churn Rate',
      value: metrics?.churnRate || 0,
      change: '-2%',
      changeType: 'negative',
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'bg-red-500',
      format: (val: number) => `${val}%`
    },
    {
      label: 'ARPU',
      value: metrics?.avgRevenuePerUser || 0,
      change: '+5%',
      changeType: 'positive',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-indigo-500',
      format: formatCurrency
    },
    {
      label: 'Content Created',
      value: metrics?.totalContentCreated || 0,
      change: '+45%',
      changeType: 'positive',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-orange-500',
      format: formatNumber
    },
    {
      label: 'Compliance Rate',
      value: metrics?.complianceRate || 0,
      change: '+3%',
      changeType: 'positive',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-teal-500',
      format: (val: number) => `${val}%`
    },
    {
      label: 'Avg Processing',
      value: metrics?.avgProcessingTime || 0,
      change: '-15%',
      changeType: 'positive',
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-pink-500',
      format: (val: number) => `${val}ms`
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
              <div className={`${stat.color} text-white p-1 rounded`}>
                {stat.icon}
              </div>
            </div>
            <Badge 
              variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {stat.change}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-[#0B1F33]">
              {stat.format(stat.value)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}