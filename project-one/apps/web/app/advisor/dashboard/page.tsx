'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Copy, 
  Download, 
  Share2, 
  Calendar,
  Clock,
  MessageSquare,
  TrendingUp,
  FileText,
  Globe,
  ChevronRight,
  Sparkles,
  Bell,
  User,
  LogOut,
  Settings,
  Loader2,
  Plus,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Send,
  Target,
  Users,
  BarChart3,
  PenTool
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
// Import content generation components
import ContentGenerator from '@/components/content/content-generator'
import ContentPreview from '@/components/content/content-preview'
import DemographicSelector from '@/components/content/demographic-selector'
// Use mock hooks for development - replace with Supabase hooks in production
import { useAdvisor, useContent, useContentDelivery, useAdvisorAnalytics } from '@/lib/mock/hooks'

interface ContentItem {
  id: string
  title: string
  content_english: string
  content_hindi?: string | null
  category: string
  topic_family: string
  compliance_score: number
  ai_score: number
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'delivered'
  scheduled_for: string | null
  created_at: string
  is_approved: boolean
}

export default function AdvisorDashboard() {
  const { signOut } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState('english')
  const [activeTab, setActiveTab] = useState('overview')
  const [showContentGenerator, setShowContentGenerator] = useState(false)
  const [showDemographics, setShowDemographics] = useState(false)
  const [selectedDemographics, setSelectedDemographics] = useState(null)
  const [dailyLimit, setDailyLimit] = useState({ used: 3, total: 10 })
  const [complianceStatus, setComplianceStatus] = useState({ score: 95, status: 'compliant' })
  
  // Supabase hooks
  const { advisor, loading: advisorLoading } = useAdvisor()
  const { content, loading: contentLoading, createContent } = useContent()
  const { deliveries, loading: deliveryLoading } = useContentDelivery()
  const { analytics, loading: analyticsLoading } = useAdvisorAnalytics()
  
  // Filter today's content
  const todaysContent = content.filter(item => {
    const itemDate = new Date(item.scheduled_for || item.created_at)
    const today = new Date()
    return itemDate.toDateString() === today.toDateString() && item.is_approved
  })
  
  const loading = advisorLoading || contentLoading

  // Redirect to onboarding if no advisor profile
  useEffect(() => {
    if (!advisorLoading && !advisor && user) {
      router.push('/onboarding')
    }
  }, [advisor, advisorLoading, user, router])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Content copied to clipboard!')
  }

  const downloadContent = (contentItem: ContentItem) => {
    const element = document.createElement('a')
    const textContent = selectedLanguage === 'hindi' && contentItem.content_hindi 
      ? contentItem.content_hindi 
      : contentItem.content_english
    const file = new Blob([textContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${contentItem.title.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Content downloaded!')
  }

  const shareViaWhatsApp = (text: string) => {
    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }

  const getContentByLanguage = (item: ContentItem) => {
    switch(selectedLanguage) {
      case 'hindi':
        return item.content_hindi || item.content_english
      default:
        return item.content_english
    }
  }
  
  // Calculate stats from real data
  const stats = {
    todaysContent: todaysContent.length,
    messagesSent: deliveries.filter(d => d.delivery_status === 'delivered').length,
    languages: content.some(item => item.content_hindi) ? 2 : 1,
    engagement: analytics?.engagement_rate || 0,
    complianceRate: 95,
    activeClients: 247,
    weeklyReach: 1235,
    contentGenerated: content.length
  }

  // Recent content history
  const recentContent = content.slice(0, 5).map(item => ({
    ...item,
    generatedAt: item.created_at,
    complianceChecked: true,
    deliveryStatus: item.status
  }))

  const handleContentGenerate = (generatedContent: any) => {
    console.log('Generated content:', generatedContent)
    // Update daily limit
    setDailyLimit(prev => ({ ...prev, used: prev.used + 1 }))
    // Refresh content list
    createContent(generatedContent)
  }

  const handleDemographicsChange = (demographics: any) => {
    setSelectedDemographics(demographics)
  }

  const handlePersonalize = () => {
    console.log('Applying personalization with:', selectedDemographics)
    toast.success('Personalization applied to content generation')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Jarvish
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex">
                Advisor Dashboard
              </Badge>
              {/* SEBI Compliance Indicator */}
              <div className="flex items-center gap-2 ml-4">
                <Shield className={`h-4 w-4 ${complianceStatus.status === 'compliant' ? 'text-green-600' : 'text-yellow-600'}`} />
                <span className="text-sm font-medium">
                  {complianceStatus.score}% Compliant
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Daily Limit Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                <Activity className="h-4 w-4 text-gray-600" />
                <span className="text-sm">
                  {dailyLimit.used}/{dailyLimit.total} Content Generated
                </span>
              </div>
              
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              
              <div className="relative group">
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">{user?.firstName}</span>
                </Button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 hidden group-hover:block">
                  <Link href="/advisor/profile">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </Link>
                  <button 
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner with Quick Actions */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {advisor?.business_name || user?.firstName}!
              </h2>
              <p className="opacity-90">
                Your daily content is ready. Share with confidence - all content is SEBI compliant.
              </p>
              {advisor && (
                <div className="flex items-center gap-4 mt-3">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {advisor.subscription_tier.toUpperCase()} Plan
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    EUIN: {advisor.euin}
                  </Badge>
                </div>
              )}
              {/* Quick Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={() => setShowContentGenerator(true)}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Content
                </Button>
                <Button 
                  onClick={() => setShowDemographics(true)}
                  variant="outline"
                  className="text-white border-white/50 hover:bg-white/10"
                  size="sm"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Set Demographics
                </Button>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                <Clock className="h-5 w-5" />
                <span className="font-medium">6:00 AM</span>
              </div>
              <p className="text-sm opacity-75 mt-1">Daily Delivery</p>
            </div>
          </div>
        </Card>

        {/* Enhanced Stats with Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Content</p>
                <p className="text-2xl font-bold">{stats.todaysContent}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold">{stats.messagesSent}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold">{stats.activeClients}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Engagement</p>
                <p className="text-2xl font-bold">{Math.round(stats.engagement)}%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold">{stats.complianceRate}%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Weekly Reach</p>
                <p className="text-2xl font-bold">{stats.weeklyReach}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-lg p-2">
                <PenTool className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Content Generated</p>
                <p className="text-2xl font-bold">{stats.contentGenerated}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 rounded-lg p-2">
                <Globe className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Languages</p>
                <p className="text-2xl font-bold">{stats.languages}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="generate">Generate Content</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">

            {/* Language Selector */}
            <div className="mb-6">
              <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="english">English</TabsTrigger>
                  <TabsTrigger value="hindi">हिंदी</TabsTrigger>
                  <TabsTrigger value="marathi">मराठी</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Daily Content */}
            <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Today's Content
            </h2>
            <Badge className="bg-green-100 text-green-700">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : todaysContent.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Content Available Today</h3>
              <p className="text-gray-600 mb-4">Your daily content will appear here at 6:00 AM</p>
              <Link href="/advisor/content/create">
                <Button>
                  Create Custom Content
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {todaysContent.map((item) => (
                <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        {item.compliance_score >= 80 && (
                          <Badge className="bg-green-100 text-green-700">SEBI Compliant</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant="secondary">{item.topic_family}</Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span>Score:</span>
                          <span className="font-medium">{item.compliance_score}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.created_at).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {getContentByLanguage(item)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getContentByLanguage(item))}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadContent(item)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      onClick={() => shareViaWhatsApp(getContentByLanguage(item))}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Share on WhatsApp
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

              {/* Archive Link */}
              <Card className="p-6 bg-gray-50 border-dashed">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Need Previous Content?</h3>
                    <p className="text-sm text-gray-600">
                      Access your complete content archive from the past 30 days
                    </p>
                  </div>
                  <Link href="/advisor/archive">
                    <Button variant="outline" className="flex items-center gap-2">
                      View Archive
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Generate Content Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {showContentGenerator ? (
                  <ContentGenerator
                    advisorProfile={{
                      name: advisor?.business_name || user?.firstName || 'Advisor',
                      euin: advisor?.euin || 'ARN-123456',
                      specialization: advisor?.specialization || 'Mutual Funds',
                      tier: (advisor?.subscription_tier as 'basic' | 'standard' | 'pro') || 'basic'
                    }}
                    onGenerate={handleContentGenerate}
                  />
                ) : (
                  <Card className="p-12 text-center">
                    <PenTool className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">AI Content Generator</h3>
                    <p className="text-gray-600 mb-6">
                      Generate SEBI-compliant content with AI assistance
                    </p>
                    <Button 
                      onClick={() => setShowContentGenerator(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Start Generating
                    </Button>
                  </Card>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Client Demographics */}
                {showDemographics ? (
                  <DemographicSelector
                    onDemographicsChange={handleDemographicsChange}
                    onPersonalize={handlePersonalize}
                    showAdvancedOptions={advisor?.subscription_tier === 'pro'}
                  />
                ) : (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Client Demographics</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Personalize content for your target audience
                    </p>
                    <Button 
                      onClick={() => setShowDemographics(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Configure Demographics
                    </Button>
                  </Card>
                )}
                
                {/* Daily Limit Card */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Daily Generation Limit</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Used Today</span>
                      <span className="font-semibold">
                        {dailyLimit.used} / {dailyLimit.total}
                      </span>
                    </div>
                    <Progress value={(dailyLimit.used / dailyLimit.total) * 100} className="h-2" />
                    <p className="text-xs text-gray-500">
                      Resets daily at 12:00 AM IST
                    </p>
                  </div>
                </Card>
                
                {/* Compliance Status Card */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Compliance Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Score</span>
                      <div className="flex items-center gap-2">
                        {complianceStatus.status === 'compliant' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className="font-semibold text-lg">
                          {complianceStatus.score}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>SEBI Rules</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>AI Validation</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Final Review</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Content Generation History</h3>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {recentContent.length > 0 ? (
                <div className="space-y-4">
                  {recentContent.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{item.title}</h4>
                            <Badge variant={item.compliance_score >= 80 ? 'default' : 'destructive'} className="text-xs">
                              {item.compliance_score >= 80 ? 'Compliant' : 'Non-Compliant'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.content_english}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Generated: {new Date(item.generatedAt).toLocaleDateString()}</span>
                            <span>Score: {item.compliance_score}%</span>
                            <span>Status: {item.deliveryStatus}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No content history available</p>
                  <p className="text-sm text-gray-500 mt-1">Your generated content will appear here</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Open Rate</span>
                    <span className="font-semibold">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Click Rate</span>
                    <span className="font-semibold">34%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Share Rate</span>
                    <span className="font-semibold">12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="font-semibold">45%</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Content Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Generated</span>
                    <span className="font-semibold">{stats.contentGenerated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="font-semibold">{Math.floor(stats.contentGenerated * 0.95)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <span className="font-semibold">{Math.floor(stats.contentGenerated * 0.05)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Score</span>
                    <span className="font-semibold">92%</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Content Categories</h3>
                <div className="space-y-2">
                  {['Educational', 'Market Updates', 'Tax Planning', 'Investment Tips', 'Seasonal'].map((category, index) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${100 - (index * 15)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{100 - (index * 15)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Client Engagement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Clients</span>
                    <span className="font-semibold">{stats.activeClients}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New This Week</span>
                    <span className="font-semibold">+23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Engagement Score</span>
                    <span className="font-semibold">{Math.round(stats.engagement)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Retention Rate</span>
                    <span className="font-semibold">94%</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">SEBI Compliance Dashboard</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-lg">{complianceStatus.score}%</p>
                  <p className="text-sm text-gray-600">Overall Compliance</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Shield className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-lg">Stage 3</p>
                  <p className="text-sm text-gray-600">Validation Level</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-lg">Active</p>
                  <p className="text-sm text-gray-600">Monitoring Status</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Recent Compliance Checks</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Content ID #{1000 + i}</p>
                            <p className="text-xs text-gray-500">Checked {i} hours ago</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">98%</p>
                          <p className="text-xs text-gray-500">Compliant</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Compliance Guidelines</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>No guaranteed returns or assured performance claims</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Mandatory risk disclaimers included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Educational framing for all content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Advisor identity (EUIN) in all communications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>5-year audit trail maintained</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}