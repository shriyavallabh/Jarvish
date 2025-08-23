'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  PenTool,
  BarChart3,
  Shield,
  Settings,
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/advisor/dashboard', icon: LayoutDashboard },
  { name: 'Generate Content', href: '/advisor/dashboard?tab=generate', icon: PenTool },
  { name: 'Content History', href: '/advisor/dashboard?tab=history', icon: FileText },
  { name: 'Analytics', href: '/advisor/dashboard?tab=analytics', icon: BarChart3 },
  { name: 'Compliance', href: '/advisor/dashboard?tab=compliance', icon: Shield },
  { name: 'Clients', href: '/advisor/clients', icon: Users },
  { name: 'Schedule', href: '/advisor/schedule', icon: Calendar },
  { name: 'Insights', href: '/advisor/insights', icon: Sparkles },
  { name: 'Settings', href: '/advisor/settings', icon: Settings }
];

const mobileNavigation = [
  { name: 'Dashboard', href: '/advisor/dashboard', icon: LayoutDashboard },
  { name: 'Generate', href: '/advisor/dashboard?tab=generate', icon: PenTool },
  { name: 'History', href: '/advisor/dashboard?tab=history', icon: FileText },
  { name: 'Analytics', href: '/advisor/dashboard?tab=analytics', icon: BarChart3 },
  { name: 'More', href: '#', icon: Menu }
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 transition-all duration-300",
        sidebarOpen ? "lg:w-64" : "lg:w-16"
      )}>
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-between px-4 mb-6">
              {sidebarOpen ? (
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Jarvish Advisor
                </h1>
              ) : (
                <span className="text-xl font-bold">J</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex"
              >
                <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
              </Button>
            </div>
            
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href.includes('?tab=') && pathname.includes(item.href.split('?')[0]));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "flex-shrink-0 h-5 w-5",
                        sidebarOpen ? "mr-3" : "mx-auto",
                        isActive ? "text-blue-600" : "text-gray-400"
                      )}
                    />
                    {sidebarOpen && item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Sidebar Footer */}
          <div className="flex-shrink-0 flex border-t p-4">
            <div className={cn(
              "flex items-center",
              sidebarOpen ? "w-full" : "justify-center"
            )}>
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300" />
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">Advisor</p>
                  <p className="text-xs text-gray-500">Pro Plan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-5 py-2">
          {mobileNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href.includes('?tab=') && pathname.includes(item.href.split('?')[0]));
            
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (item.name === 'More') {
                    setMobileMenuOpen(true);
                  } else {
                    window.location.href = item.href;
                  }
                }}
                className={cn(
                  "flex flex-col items-center py-2 text-xs",
                  isActive ? "text-blue-600" : "text-gray-600"
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-64 bg-white shadow-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.slice(4).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden",
        sidebarOpen ? "lg:ml-64" : "lg:ml-16"
      )}>
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;