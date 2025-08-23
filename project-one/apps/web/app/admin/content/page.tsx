'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Edit,
  Trash2,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  FileText,
  Settings,
  Users,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface Content {
  id: string
  title: string
  content: string
  contentHindi: string
  contentMarathi: string
  category: string
  tags: string[]
  status: 'draft' | 'scheduled' | 'published'
  scheduledFor: string
  complianceScore: number
}

export default function AdminContentPage() {
  const [contents, setContents] = useState<Content[]>([
    {
      id: '1',
      title: 'Market Update Template',
      content: 'The markets showed positive momentum today...',
      contentHindi: 'आज बाजार में सकारात्मक गति देखी गई...',
      contentMarathi: 'आज बाजारात सकारात्मक गती दिसली...',
      category: 'Market Update',
      tags: ['daily', 'market'],
      status: 'scheduled',
      scheduledFor: '2024-01-20T06:00:00',
      complianceScore: 95,
    },
  ])

  const [newContent, setNewContent] = useState({
    title: '',
    content: '',
    contentHindi: '',
    contentMarathi: '',
    category: '',
    tags: '',
  })

  const [activeTab, setActiveTab] = useState('create')

  const handleCreateContent = () => {
    const content: Content = {
      id: Date.now().toString(),
      title: newContent.title,
      content: newContent.content,
      contentHindi: newContent.contentHindi,
      contentMarathi: newContent.contentMarathi,
      category: newContent.category,
      tags: newContent.tags.split(',').map(t => t.trim()),
      status: 'draft',
      scheduledFor: '',
      complianceScore: Math.floor(Math.random() * 20) + 80,
    }

    setContents([...contents, content])
    toast.success('Content created successfully!')
    
    // Reset form
    setNewContent({
      title: '',
      content: '',
      contentHindi: '',
      contentMarathi: '',
      category: '',
      tags: '',
    })
  }

  const scheduleContent = (id: string) => {
    setContents(contents.map(c => 
      c.id === id 
        ? { ...c, status: 'scheduled', scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
        : c
    ))
    toast.success('Content scheduled for tomorrow 6 AM')
  }

  const deleteContent = (id: string) => {
    setContents(contents.filter(c => c.id !== id))
    toast.success('Content deleted')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Jarvish Admin
              </h1>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Admin Panel
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Subscribers</p>
                <p className="text-2xl font-bold">527</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Content Published</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold">98%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Content</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Create New Content</h2>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newContent.title}
                      onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                      placeholder="Market Update"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newContent.category}
                      onChange={(e) => setNewContent({...newContent, category: e.target.value})}
                      placeholder="Market Analysis"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={newContent.tags}
                    onChange={(e) => setNewContent({...newContent, tags: e.target.value})}
                    placeholder="equity, nifty, banking"
                  />
                </div>

                <Tabs defaultValue="english" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="english">English</TabsTrigger>
                    <TabsTrigger value="hindi">Hindi</TabsTrigger>
                    <TabsTrigger value="marathi">Marathi</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="english">
                    <div>
                      <Label htmlFor="content">Content (English)</Label>
                      <Textarea
                        id="content"
                        value={newContent.content}
                        onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                        placeholder="Write your content here..."
                        rows={6}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="hindi">
                    <div>
                      <Label htmlFor="contentHindi">Content (Hindi)</Label>
                      <Textarea
                        id="contentHindi"
                        value={newContent.contentHindi}
                        onChange={(e) => setNewContent({...newContent, contentHindi: e.target.value})}
                        placeholder="हिंदी में सामग्री लिखें..."
                        rows={6}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="marathi">
                    <div>
                      <Label htmlFor="contentMarathi">Content (Marathi)</Label>
                      <Textarea
                        id="contentMarathi"
                        value={newContent.contentMarathi}
                        onChange={(e) => setNewContent({...newContent, contentMarathi: e.target.value})}
                        placeholder="मराठीत सामग्री लिहा..."
                        rows={6}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">
                      AI Compliance Check: Passed
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">
                      Save as Draft
                    </Button>
                    <Button onClick={handleCreateContent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Content
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            <div className="space-y-4">
              {contents.filter(c => c.status === 'scheduled').map((content) => (
                <Card key={content.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{content.title}</h3>
                        <Badge variant="outline">{content.category}</Badge>
                        <Badge className="bg-blue-100 text-blue-700">
                          Scheduled
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {content.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(content.scheduledFor).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          6:00 AM
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Compliance: {content.complianceScore}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteContent(content.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {contents.filter(c => c.status === 'draft').length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mt-8 mb-4">Drafts</h3>
                  {contents.filter(c => c.status === 'draft').map((content) => (
                    <Card key={content.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{content.title}</h3>
                            <Badge variant="outline">{content.category}</Badge>
                            <Badge variant="secondary">Draft</Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {content.content}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => scheduleContent(content.id)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Schedule
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteContent(content.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No published content yet</h3>
              <p className="text-gray-500">
                Content will appear here after being delivered to subscribers
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}