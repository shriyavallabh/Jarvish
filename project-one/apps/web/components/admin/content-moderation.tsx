'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ContentModerationItem } from '@/lib/services/admin-service'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  FileText,
  Globe,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'

interface ContentModerationProps {
  items: ContentModerationItem[]
  total: number
  loading?: boolean
  onModerate: (contentId: string, decision: any) => void
  onBulkModerate: (contentIds: string[], decision: any) => void
  onFilter: (filters: any) => void
  onPageChange: (page: number) => void
  currentPage: number
  pageSize: number
}

export function ContentModeration({
  items,
  total,
  loading,
  onModerate,
  onBulkModerate,
  onFilter,
  onPageChange,
  currentPage,
  pageSize
}: ContentModerationProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [previewContent, setPreviewContent] = useState<ContentModerationItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showModerateDialog, setShowModerateDialog] = useState(false)
  const [moderationDecision, setModerationDecision] = useState({
    status: 'APPROVED' as 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION',
    feedback: '',
    sebiViolations: [] as string[]
  })

  const totalPages = Math.ceil(total / pageSize)

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const selectAllItems = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.id))
    }
  }

  const getRiskBadge = (score: number) => {
    if (score >= 7) {
      return { color: 'bg-red-100 text-red-700', label: 'High Risk' }
    } else if (score >= 4) {
      return { color: 'bg-yellow-100 text-yellow-700', label: 'Medium Risk' }
    } else {
      return { color: 'bg-green-100 text-green-700', label: 'Low Risk' }
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode }> = {
      'PENDING': { color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-3 h-3" /> },
      'APPROVED': { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
      'REJECTED': { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
      'NEEDS_REVISION': { color: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="w-3 h-3" /> }
    }
    return badges[status] || badges['PENDING']
  }

  const handlePreview = (item: ContentModerationItem) => {
    setPreviewContent(item)
    setShowPreview(true)
  }

  const handleModerate = (item: ContentModerationItem) => {
    setPreviewContent(item)
    setModerationDecision({
      status: 'APPROVED',
      feedback: '',
      sebiViolations: []
    })
    setShowModerateDialog(true)
  }

  const submitModeration = () => {
    if (previewContent) {
      onModerate(previewContent.id, moderationDecision)
      setShowModerateDialog(false)
      setPreviewContent(null)
    }
  }

  const handleBulkApprove = () => {
    if (selectedItems.length > 0) {
      onBulkModerate(selectedItems, { status: 'APPROVED' })
      setSelectedItems([])
    }
  }

  const handleBulkReject = () => {
    if (selectedItems.length > 0) {
      onBulkModerate(selectedItems, { 
        status: 'REJECTED',
        feedback: 'Bulk rejection - compliance issues detected'
      })
      setSelectedItems([])
    }
  }

  const commonViolations = [
    'Misleading return claims',
    'Missing risk disclosures',
    'Unverified testimonials',
    'Guaranteed returns promise',
    'Past performance emphasis',
    'Regulatory non-compliance'
  ]

  return (
    <>
      <Card className="p-6">
        {/* Filters and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Select onValueChange={(value) => onFilter({ status: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => onFilter({ riskLevel: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            {selectedItems.length > 0 && (
              <>
                <Badge variant="outline" className="px-3 py-1">
                  {selectedItems.length} selected
                </Badge>
                <Button
                  variant="outline"
                  onClick={handleBulkApprove}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bulk Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkReject}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Bulk Reject
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200] mx-auto"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No content to moderate
            </div>
          ) : (
            items.map((item) => {
              const riskBadge = getRiskBadge(item.riskScore)
              const statusBadge = getStatusBadge(item.complianceStatus)
              
              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[#0B1F33]">
                              {item.advisorName}
                            </h4>
                            <Badge className={`${statusBadge.color} border-0 text-xs`}>
                              <span className="mr-1">{statusBadge.icon}</span>
                              {item.complianceStatus}
                            </Badge>
                            <Badge className={`${riskBadge.color} border-0 text-xs`}>
                              {riskBadge.label} ({item.riskScore.toFixed(1)})
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {item.contentType}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {item.language.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(item)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleModerate(item)}
                            className="bg-[#0B1F33] hover:bg-[#1A365D]"
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Moderate
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {item.content}
                      </p>
                      
                      {item.sebiViolations.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">
                            {item.sebiViolations.length} SEBI violations detected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => onPageChange(page)}
                    className={currentPage === page ? 'bg-[#0B1F33]' : ''}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{previewContent.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Advisor</label>
                  <p className="mt-1">{previewContent.advisorName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Content Type</label>
                  <p className="mt-1">{previewContent.contentType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Language</label>
                  <p className="mt-1">{previewContent.language.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Risk Score</label>
                  <p className="mt-1">{previewContent.riskScore.toFixed(1)}/10</p>
                </div>
              </div>
              {previewContent.sebiViolations.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">SEBI Violations</label>
                  <ul className="mt-2 space-y-1">
                    {previewContent.sebiViolations.map((violation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mt-0.5" />
                        {violation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderation Dialog */}
      <Dialog open={showModerateDialog} onOpenChange={setShowModerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderate Content</DialogTitle>
            <DialogDescription>
              Review and make a decision on this content
            </DialogDescription>
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm">{previewContent.content}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Decision</label>
                <Select
                  value={moderationDecision.status}
                  onValueChange={(value) => setModerationDecision({
                    ...moderationDecision,
                    status: value as 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">Approve</SelectItem>
                    <SelectItem value="REJECTED">Reject</SelectItem>
                    <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(moderationDecision.status === 'REJECTED' || moderationDecision.status === 'NEEDS_REVISION') && (
                <>
                  <div>
                    <label className="text-sm font-medium">SEBI Violations</label>
                    <div className="mt-2 space-y-2">
                      {commonViolations.map((violation) => (
                        <label key={violation} className="flex items-center gap-2">
                          <Checkbox
                            checked={moderationDecision.sebiViolations.includes(violation)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setModerationDecision({
                                  ...moderationDecision,
                                  sebiViolations: [...moderationDecision.sebiViolations, violation]
                                })
                              } else {
                                setModerationDecision({
                                  ...moderationDecision,
                                  sebiViolations: moderationDecision.sebiViolations.filter(v => v !== violation)
                                })
                              }
                            }}
                          />
                          <span className="text-sm">{violation}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Feedback</label>
                    <Textarea
                      className="mt-1"
                      placeholder="Provide detailed feedback for the advisor..."
                      value={moderationDecision.feedback}
                      onChange={(e) => setModerationDecision({
                        ...moderationDecision,
                        feedback: e.target.value
                      })}
                      rows={4}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitModeration} className="bg-[#0B1F33] hover:bg-[#1A365D]">
              Submit Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}