'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { type Advisor } from '@/lib/services/admin-service'
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  UserCheck,
  UserX,
  Edit,
  Eye,
  Mail,
  Phone
} from 'lucide-react'
import { format } from 'date-fns'

interface UserTableProps {
  users: Advisor[]
  total: number
  loading?: boolean
  onSearch: (search: string) => void
  onFilter: (filters: any) => void
  onPageChange: (page: number) => void
  onUserUpdate: (userId: string, updates: any) => void
  currentPage: number
  pageSize: number
}

export function UserTable({
  users,
  total,
  loading,
  onSearch,
  onFilter,
  onPageChange,
  onUserUpdate,
  currentPage,
  pageSize
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<Advisor | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editData, setEditData] = useState<any>({})

  const totalPages = Math.ceil(total / pageSize)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
  }

  const getSubscriptionBadge = (tier: string) => {
    const colors: Record<string, string> = {
      'FREE': 'bg-gray-100 text-gray-700',
      'BASIC': 'bg-blue-100 text-blue-700',
      'STANDARD': 'bg-purple-100 text-purple-700',
      'PRO': 'bg-[#CEA200]/20 text-[#CEA200]'
    }
    return colors[tier] || 'bg-gray-100 text-gray-700'
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'TRIAL': 'bg-yellow-100 text-yellow-700',
      'ACTIVE': 'bg-green-100 text-green-700',
      'PAUSED': 'bg-orange-100 text-orange-700',
      'CANCELLED': 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const handleEdit = (user: Advisor) => {
    setSelectedUser(user)
    setEditData({
      subscription_tier: user.subscription_tier,
      subscription_status: user.subscription_status,
      is_active: user.is_active
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = () => {
    if (selectedUser) {
      onUserUpdate(selectedUser.id, editData)
      setShowEditDialog(false)
    }
  }

  const handleViewDetails = (user: Advisor) => {
    setSelectedUser(user)
    setShowDetails(true)
  }

  return (
    <>
      <Card className="p-6">
        {/* Table Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search advisors..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-[300px]"
              />
            </div>
            <Select onValueChange={(value) => onFilter({ subscriptionTier: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="BASIC">Basic</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => onFilter({ status: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            {selectedUsers.length > 0 && (
              <Badge variant="outline" className="px-3 py-1">
                {selectedUsers.length} selected
              </Badge>
            )}
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={selectAllUsers}
                  />
                </TableHead>
                <TableHead>Advisor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA200]"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No advisors found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0B1F33] text-white rounded-full flex items-center justify-center font-medium">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {user.advisor_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getSubscriptionBadge(user.subscription_tier)} border-0`}>
                        {user.subscription_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadge(user.subscription_status)} border-0`}>
                        {user.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.content_types?.length || 0} types
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {user.last_login_at 
                          ? format(new Date(user.last_login_at), 'MMM dd, HH:mm')
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} advisors
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

      {/* User Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advisor Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-[#0B1F33] text-white rounded-full flex items-center justify-center text-2xl font-medium">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedUser.full_name}</h3>
                  <p className="text-gray-600">{selectedUser.firm_name || 'No firm name'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedUser.phone}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Advisor Type</label>
                  <p className="mt-1">{selectedUser.advisor_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ARN Number</label>
                  <p className="mt-1">{selectedUser.arn_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">EUIN Number</label>
                  <p className="mt-1">{selectedUser.euin_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">SEBI Registration</label>
                  <p className="mt-1">{selectedUser.sebi_registration || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Primary Language</label>
                  <p className="mt-1">{selectedUser.primary_language.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Send Time</label>
                  <p className="mt-1">{selectedUser.send_time} IST</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={`${getSubscriptionBadge(selectedUser.subscription_tier)} border-0`}>
                    {selectedUser.subscription_tier}
                  </Badge>
                  <Badge className={`${getStatusBadge(selectedUser.subscription_status)} border-0`}>
                    {selectedUser.subscription_status}
                  </Badge>
                  {selectedUser.whatsapp_verified && (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      WhatsApp Verified
                    </Badge>
                  )}
                  {selectedUser.email_verified && (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      Email Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Advisor</DialogTitle>
            <DialogDescription>
              Update advisor subscription and status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subscription Tier</label>
              <Select
                value={editData.subscription_tier}
                onValueChange={(value) => setEditData({ ...editData, subscription_tier: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Subscription Status</label>
              <Select
                value={editData.subscription_status}
                onValueChange={(value) => setEditData({ ...editData, subscription_status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={editData.is_active}
                onCheckedChange={(checked) => setEditData({ ...editData, is_active: checked })}
              />
              <label className="text-sm font-medium">Account Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-[#0B1F33] hover:bg-[#1A365D]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}