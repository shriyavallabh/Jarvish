'use client'

import { useEffect, useState } from 'react'
import { UserTable } from '@/components/admin/user-table'
import { adminService, type Advisor } from '@/lib/services/admin-service'
import { toast } from 'sonner'

export default function UsersPage() {
  const [users, setUsers] = useState<Advisor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<any>({})
  const pageSize = 10

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { advisors, total } = await adminService.getAdvisors({
        ...filters,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      })
      setUsers(advisors)
      setTotal(total)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, filters])

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
    setCurrentPage(1)
  }

  const handleFilter = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleUserUpdate = async (userId: string, updates: any) => {
    try {
      await adminService.updateAdvisorStatus(userId, updates)
      toast.success('User updated successfully')
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#0B1F33]">User Management</h2>
        <p className="text-gray-600 mt-1">
          Manage advisor accounts, subscriptions, and access controls
        </p>
      </div>

      <UserTable
        users={users}
        total={total}
        loading={loading}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onPageChange={handlePageChange}
        onUserUpdate={handleUserUpdate}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  )
}