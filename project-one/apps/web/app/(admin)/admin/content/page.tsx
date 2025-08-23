'use client'

import { useEffect, useState } from 'react'
import { ContentModeration } from '@/components/admin/content-moderation'
import { adminService, type ContentModerationItem } from '@/lib/services/admin-service'
import { toast } from 'sonner'

export default function ContentPage() {
  const [items, setItems] = useState<ContentModerationItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<any>({})
  const pageSize = 10

  const fetchContent = async () => {
    try {
      setLoading(true)
      const { items, total } = await adminService.getContentForModeration({
        ...filters,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      })
      setItems(items)
      setTotal(total)
    } catch (error) {
      console.error('Error fetching content:', error)
      toast.error('Failed to fetch content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [currentPage, filters])

  const handleModerate = async (contentId: string, decision: any) => {
    try {
      await adminService.moderateContent(contentId, decision)
      toast.success(`Content ${decision.status.toLowerCase()}`)
      fetchContent() // Refresh the list
    } catch (error) {
      console.error('Error moderating content:', error)
      toast.error('Failed to moderate content')
    }
  }

  const handleBulkModerate = async (contentIds: string[], decision: any) => {
    try {
      await adminService.bulkModerateContent(contentIds, decision)
      toast.success(`${contentIds.length} items ${decision.status.toLowerCase()}`)
      fetchContent() // Refresh the list
    } catch (error) {
      console.error('Error bulk moderating content:', error)
      toast.error('Failed to bulk moderate content')
    }
  }

  const handleFilter = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#0B1F33]">Content Moderation</h2>
        <p className="text-gray-600 mt-1">
          Review and moderate advisor-generated content for SEBI compliance
        </p>
      </div>

      <ContentModeration
        items={items}
        total={total}
        loading={loading}
        onModerate={handleModerate}
        onBulkModerate={handleBulkModerate}
        onFilter={handleFilter}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  )
}