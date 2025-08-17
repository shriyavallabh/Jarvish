"use client"

import * as React from "react"
import { Calendar, Clock, TrendingUp, MessageSquare, CheckCircle, AlertTriangle, BarChart3, Users, Star, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, ComplianceBadge, StatusBadge } from "@/components/ui/badge"
import { Header } from "@/components/ui/header"
import { StatsCard, CountdownCard, DeliveryStatsCard, ComplianceStatsCard } from "@/components/ui/stats-card"
import { AdvisorAvatar } from "@/components/ui/avatar"
import { ActivityTimeline } from "@/components/ui/activity-timeline"
import { 
  mockAdvisors, 
  mockContentItems, 
  mockActivities,
  mockDashboardStats,
  mockSystemHealth,
  getRecentContentItems,
  getAdvisorActivities 
} from "@/lib/mock/data"
import { cn } from "@/lib/utils"

export default function AdvisorOverviewPage() {
  const [currentAdvisor] = React.useState(mockAdvisors[0])
  const [timeUntilDelivery, setTimeUntilDelivery] = React.useState("07:32:15")
  
  const recentContent = getRecentContentItems()
  const activities = getAdvisorActivities(currentAdvisor.id)
  const stats = mockDashboardStats
  const systemHealth = mockSystemHealth

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(6, 0, 0, 0)
      
      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeUntilDelivery(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="advisor-dashboard min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header 
        variant="advisor" 
        user={{
          name: currentAdvisor.name,
          tier: currentAdvisor.tier,
          avatar: currentAdvisor.avatar
        }}
      />

      <main id="main-content" className="container py-8 space-y-8">
        <div className="fixed inset-0 bg-grid-slate-100/40 [mask-image:linear-gradient(180deg,white,transparent)] -z-10" />
        
        <div className="professional-card rounded-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <AdvisorAvatar 
                  name={currentAdvisor.name}
                  tier={currentAdvisor.tier}
                />
                {currentAdvisor.tier === 'elite' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Good Morning, {currentAdvisor.name.split(' ')[0]}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="compliance" className="font-semibold">
                    {currentAdvisor.registrationType} • {currentAdvisor.registrationId}
                  </Badge>
                  <Badge variant={currentAdvisor.tier === 'elite' ? 'elite' : 'premium'} className="font-bold">
                    {currentAdvisor.tier.toUpperCase()} TIER
                  </Badge>
                </div>
              </div>
            </div>
          
            <div className="flex flex-col sm:flex-row gap-4">
              <CountdownCard 
                timeUntil={timeUntilDelivery}
                label="Next Delivery"
                className="min-w-48 shadow-lg"
              />
              <Button variant="premium" size="lg" className="group">
                <MessageSquare className="h-4 w-4 mr-2" />
                Create Custom Content
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        <section 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          aria-labelledby="performance-overview"
        >
          <h2 id="performance-overview" className="sr-only">Performance Overview</h2>
          <StatsCard
            title="Content Delivered"
            value={stats.content.delivered}
            trend={{
              value: "↑ 12%",
              direction: "up",
              label: "this month"
            }}
            variant="premium"
            icon={<MessageSquare className="h-6 w-6" />}
          />
          
          <ComplianceStatsCard
            score={stats.compliance.score}
            checks={{
              passed: stats.compliance.passedChecks,
              total: stats.compliance.totalChecks
            }}
          />
          
          <DeliveryStatsCard
            delivered={232}
            total={240}
            rate={96.7}
          />
          
          <StatsCard
            title="Client Engagement"
            value={`${stats.engagement.rate}%`}
            trend={{
              value: "↑ 8.5%",
              direction: "up",
              label: "avg open rate"
            }}
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </section>

        <div className="grid gap-8 lg:grid-cols-3" role="main">
          <div className="lg:col-span-2 space-y-8">
            <Card className="professional-card hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Today's Content Ready</CardTitle>
                  <CardDescription>
                    Scheduled for 06:00 IST delivery • Auto-approved by AI
                  </CardDescription>
                </div>
                <Badge variant="compliance" className="gap-2">
                  <CheckCircle className="h-3 w-3" />
                  SEBI Verified
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentContent.slice(0, 3).map((content) => (
                  <div 
                    key={content.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-blue-50/30 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {content.type.replace('-', ' ').split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <ComplianceBadge score={content.complianceScore} size="sm" />
                          <span>•</span>
                          <span>Branded for {currentAdvisor.tier} tier</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary">
                      Preview →
                    </Button>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    View All Content (12 items ready)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Performance
                </CardTitle>
                <CardDescription>
                  Content delivery and engagement metrics for the past 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Messages Sent", value: "168", change: "+12%" },
                    { label: "Avg. Open Rate", value: "87%", change: "+5%" },
                    { label: "Client Responses", value: "23", change: "+18%" },
                    { label: "New Inquiries", value: "7", change: "+40%" }
                  ].map((metric, index) => (
                    <div key={index} className="text-center p-3 rounded-lg bg-gradient-to-br from-white to-blue-50/30 border border-slate-200">
                      <div className="metric-value">{metric.value}</div>
                      <div className="metric-label mt-1">{metric.label}</div>
                      <div className="text-xs font-semibold text-green-600 mt-2">{metric.change}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Content Calendar
                  </CardTitle>
                  <CardDescription>
                    Your next 7 days of automated content delivery
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Customize Schedule
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Tomorrow", type: "Market Update", status: "ready" },
                    { date: "Thu 17", type: "SIP Benefits", status: "ready" },
                    { date: "Fri 18", type: "Tax Saving Tips", status: "generating" },
                    { date: "Sat 19", type: "Weekend Wisdom", status: "scheduled" },
                    { date: "Mon 21", type: "Weekly Market Wrap", status: "scheduled" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-medium text-sm">{item.date}</span>
                        <span className="text-muted-foreground">{item.type}</span>
                      </div>
                      <StatusBadge 
                        status={item.status as "approved" | "pending" | "scheduled"} 
                        size="sm" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={activities} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Create Custom Message
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Manage Client Groups
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Star className="h-4 w-4" />
                  Update Branding
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>WhatsApp API</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        systemHealth.whatsappApi === 'operational' ? "bg-green-500" : "bg-red-500"
                      )} />
                      <span className="capitalize">{systemHealth.whatsappApi}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Content Generation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{systemHealth.responseTime}ms</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily Quota</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        systemHealth.rateLimit < 80 ? "bg-green-500" : "bg-yellow-500"
                      )} />
                      <span>{systemHealth.rateLimit}% used</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Queue</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{systemHealth.deliveryQueue} jobs</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">All systems operational</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Next content delivery at 06:00 IST tomorrow
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {currentAdvisor.tier.charAt(0).toUpperCase() + currentAdvisor.tier.slice(1)} Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {(currentAdvisor.tier === 'elite' ? [
                    "Custom branding on all images",
                    "Multi-language content (EN/HI/MR)",
                    "Priority WhatsApp delivery",
                    "Advanced analytics dashboard",
                    "Dedicated account manager",
                    "API access for integrations"
                  ] : currentAdvisor.tier === 'premium' ? [
                    "Branded images with your logo",
                    "2 language options",
                    "Priority content generation",
                    "Performance analytics",
                    "Email support"
                  ] : [
                    "Daily automated content",
                    "SEBI compliance checking",
                    "Standard WhatsApp delivery",
                    "Basic analytics",
                    "Community support"
                  ]).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                  {currentAdvisor.tier !== 'elite' && (
                    <div className="pt-3 border-t">
                      <Button variant="premium" size="sm" className="w-full">
                        Upgrade to {currentAdvisor.tier === 'premium' ? 'Elite' : 'Premium'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}