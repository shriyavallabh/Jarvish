"use client"

import * as React from "react"
import { Filter, Download, CheckSquare, XSquare, Eye, Shield, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, ComplianceBadge, StatusBadge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Header } from "@/components/ui/header"
import { StatsCard } from "@/components/ui/stats-card"
import { AdvisorAvatar } from "@/components/ui/avatar"
import { 
  mockContentItems, 
  mockAdvisors, 
  mockDashboardStats, 
  mockSystemHealth,
  getPendingContentItems,
  getAdvisorById 
} from "@/lib/mock/data"
import { cn } from "@/lib/utils"

export default function AdminApprovalQueuePage() {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'pending' | 'elite' | 'premium' | 'standard'>('all')
  const [filterRisk, setFilterRisk] = React.useState<'all' | 'low' | 'medium' | 'high'>('all')

  const pendingContent = getPendingContentItems()
  const stats = mockDashboardStats
  const systemHealth = mockSystemHealth

  const filteredContent = pendingContent.filter(item => {
    const advisor = getAdvisorById(item.advisorId)
    if (!advisor) return false

    if (filterStatus !== 'all') {
      if (filterStatus === 'elite' && advisor.tier !== 'elite') return false
      if (filterStatus === 'premium' && advisor.tier !== 'premium') return false
      if (filterStatus === 'standard' && advisor.tier !== 'basic') return false
    }

    if (filterRisk !== 'all' && item.riskLevel !== filterRisk) return false

    return true
  })

  const handleSelectAll = () => {
    if (selectedItems.length === filteredContent.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredContent.map(item => item.id))
    }
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (minutes < 60) return `${minutes} min ago`
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }

  return (
    <div className="admin-dashboard min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header 
        variant="admin" 
        user={{
          name: "Admin User",
          tier: "elite"
        }}
      />

      <main id="main-content" className="container py-8 space-y-6">
        {/* Professional Background Pattern */}
        <div className="fixed inset-0 bg-grid-slate-100/30 [mask-image:linear-gradient(180deg,white,transparent)] -z-10" />
        {/* Enhanced Admin Header */}
        <div className="professional-card rounded-xl shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                Content Approval Center
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="elite" className="px-4 py-1.5">
                  <Shield className="h-3.5 w-3.5 mr-1" />
                  Admin Access
                </Badge>
                <Badge variant="premium">
                  Elite Review Queue
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-blue-50 rounded-lg border border-slate-200 text-sm font-medium text-slate-700">
                <Clock className="h-4 w-4" />
                <span>Window: 20:30 - 21:30 IST</span>
              </div>
              <Button variant="elite" size="lg" className="group">
                <Download className="h-4 w-4 mr-2" />
                Executive Report
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Pending Reviews"
            value={stats.content.pending}
            trend={{
              value: "↑ 15%",
              direction: "up",
              label: "from yesterday"
            }}
            variant="premium"
            icon={<Eye className="h-6 w-6" />}
          />
          <StatsCard
            title="Approval Rate"
            value={`${((stats.content.approved / (stats.content.approved + stats.content.pending)) * 100).toFixed(1)}%`}
            trend={{
              value: "↑ 3.2%",
              direction: "up",
              label: "this week"
            }}
            variant="compliance"
            icon={<CheckSquare className="h-6 w-6" />}
          />
          <StatsCard
            title="Avg Processing"
            value="16s"
            trend={{
              value: "↓ 4s",
              direction: "up",
              label: "improvement"
            }}
            icon={<Filter className="h-6 w-6" />}
          />
          <StatsCard
            title="Quality Score"
            value={`${stats.compliance.score}%`}
            trend={{
              value: "Excellent",
              direction: "up"
            }}
            variant="compliance"
            icon={<CheckSquare className="h-6 w-6" />}
          />
        </div>

        {/* Enhanced Content Queue Table */}
        <Card className="professional-card shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Elite Advisor Content Queue</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Review and approve content submissions from premium advisors
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedItems.length === filteredContent.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button variant="success" size="sm" disabled={selectedItems.length === 0} className="shadow-lg">
                <CheckSquare className="h-4 w-4 mr-2" />
                Approve ({selectedItems.length})
              </Button>
              <Button variant="destructive" size="sm" disabled={selectedItems.length === 0} className="shadow-lg">
                <XSquare className="h-4 w-4 mr-2" />
                Reject ({selectedItems.length})
              </Button>
            </div>
          </CardHeader>

          {/* Filters */}
          <div className="px-6 py-4 border-t bg-muted/20 space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <span className="text-sm font-medium">Status:</span>
                {(['all', 'elite', 'premium', 'standard'] as const).map(status => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="h-8 text-xs"
                  >
                    {status === 'all' ? `All (${pendingContent.length})` : 
                     status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-sm font-medium">Risk:</span>
                {(['all', 'low', 'medium', 'high'] as const).map(risk => (
                  <Button
                    key={risk}
                    variant={filterRisk === risk ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRisk(risk)}
                    className="h-8 text-xs"
                  >
                    {risk.charAt(0).toUpperCase() + risk.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === filteredContent.length && filteredContent.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all content items"
                    />
                  </TableHead>
                  <TableHead>Content ID</TableHead>
                  <TableHead>Elite Advisor</TableHead>
                  <TableHead>Content Type</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((item) => {
                  const advisor = getAdvisorById(item.advisorId)
                  if (!advisor) return null

                  const isSelected = selectedItems.includes(item.id)

                  return (
                    <TableRow 
                      key={item.id}
                      className={cn(
                        "hover:bg-blue-50/30 transition-all duration-150",
                        isSelected && "bg-amber-50/50 border-l-4 border-l-amber-400 shadow-sm"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectItem(item.id)}
                          aria-label={`Select content ${item.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">#{item.id.split('-')[1]}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AdvisorAvatar 
                            name={advisor.name}
                            tier={advisor.tier}
                          />
                          <div>
                            <div className="font-medium">{advisor.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {advisor.tier.toUpperCase()}/{advisor.registrationId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {item.type.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ComplianceBadge score={item.complianceScore} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          Preview →
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Enhanced System Status Footer */}
        <Card className="professional-card bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <CardContent className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  systemHealth.whatsappApi === 'operational' ? "bg-green-500" : "bg-red-500"
                )} />
                <span>WhatsApp API: {systemHealth.whatsappApi}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  systemHealth.rateLimit < 80 ? "bg-yellow-500" : "bg-green-500"
                )} />
                <span>Rate Limit: {systemHealth.rateLimit}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>AI Service: {systemHealth.responseTime}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Queue: {systemHealth.deliveryQueue} jobs</span>
              </div>
            </div>
            <div className="bg-muted px-4 py-2 rounded-md text-xs text-muted-foreground">
              ⌘A Select All • ⌘↵ Approve • ⌘R Reject • Space Preview
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}