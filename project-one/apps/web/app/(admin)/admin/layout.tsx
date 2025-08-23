'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Shield,
  Settings,
  Bell,
  LogOut,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user } = useUser()
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [pendingCount, setPendingCount] = useState(0)

  // Check if user is admin
  useEffect(() => {
    if (user && user.publicMetadata?.role !== 'admin') {
      redirect('/advisor/dashboard')
    }
  }, [user])

  // Fetch system health status
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const response = await fetch('/api/admin/health')
        if (response.ok) {
          const data = await response.json()
          setSystemHealth(data)
        }
      } catch (error) {
        console.error('Failed to fetch system health:', error)
      }
    }

    fetchSystemHealth()
    const interval = setInterval(fetchSystemHealth, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Fetch pending content count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/admin/content/pending-count')
        if (response.ok) {
          const data = await response.json()
          setPendingCount(data.count || 0)
        }
      } catch (error) {
        console.error('Failed to fetch pending count:', error)
      }
    }

    fetchPendingCount()
    const interval = setInterval(fetchPendingCount, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const navigation: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />
    },
    {
      label: 'Content',
      href: '/admin/content',
      icon: <FileText className="w-5 h-5" />,
      badge: pendingCount > 0 ? pendingCount.toString() : undefined
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      label: 'Compliance',
      href: '/admin/compliance',
      icon: <Shield className="w-5 h-5" />
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="w-5 h-5" />
    }
  ]

  const getHealthIcon = (status: string) => {
    switch(status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'unhealthy':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="admin-dashboard min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B1F33] text-white">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#CEA200] rounded-lg flex items-center justify-center text-[#0B1F33] font-bold text-xl">
              J
            </div>
            <div>
              <div className="text-lg font-semibold">JARVISH</div>
              <div className="text-xs text-[#CEA200]">Admin Portal</div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-gray-400">Administrator</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-[#CEA200] text-[#0B1F33] font-medium' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge className="bg-red-500 text-white border-0 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* System Health */}
        {systemHealth && (
          <div className="p-4 mt-auto border-t border-white/10">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">System Health</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {getHealthIcon(systemHealth.database)}
                <span className="text-gray-300">Database</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getHealthIcon(systemHealth.whatsappApi)}
                <span className="text-gray-300">WhatsApp API</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getHealthIcon(systemHealth.aiService)}
                <span className="text-gray-300">AI Service</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getHealthIcon(systemHealth.redis)}
                <span className="text-gray-300">Redis Queue</span>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 mt-auto border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/5"
            onClick={() => window.location.href = '/sign-out'}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Top Header */}
        <header className="bg-white border-b px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-[#0B1F33]">
                {pathname === '/admin/dashboard' && 'Dashboard Overview'}
                {pathname === '/admin/users' && 'User Management'}
                {pathname === '/admin/content' && 'Content Moderation'}
                {pathname === '/admin/analytics' && 'Platform Analytics'}
                {pathname === '/admin/compliance' && 'Compliance Monitoring'}
                {pathname === '/admin/settings' && 'System Settings'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and monitor the JARVISH platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
              <Badge className="bg-[#CEA200] text-[#0B1F33] px-3 py-1">
                Admin Mode
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}