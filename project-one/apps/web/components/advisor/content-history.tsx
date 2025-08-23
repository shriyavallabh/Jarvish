'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  FileText,
  Download,
  Copy,
  Filter,
  Search,
  Calendar,
  Clock,
  Share2,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  contentType: string;
  language: string;
  category: string;
  complianceScore: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'delivered';
  createdAt: Date;
  deliveredAt?: Date;
  clientCount?: number;
  engagementRate?: number;
}

interface ContentHistoryProps {
  items?: ContentItem[];
  onRefresh?: () => void;
  loading?: boolean;
}

export const ContentHistory: React.FC<ContentHistoryProps> = ({
  items = [],
  onRefresh,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Generate mock data if no items provided
  const mockItems: ContentItem[] = items.length > 0 ? items : [
    {
      id: '1',
      title: 'Tax Saving through ELSS Funds',
      content: 'Learn how ELSS mutual funds can help you save taxes under Section 80C...',
      contentType: 'educational',
      language: 'English',
      category: 'Tax Planning',
      complianceScore: 95,
      status: 'delivered',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      clientCount: 245,
      engagementRate: 78
    },
    {
      id: '2',
      title: 'Market Update: Q4 Results Impact',
      content: 'Quarterly results season begins with IT sector showing strong growth...',
      contentType: 'market_update',
      language: 'English',
      category: 'Market Updates',
      complianceScore: 92,
      status: 'approved',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      clientCount: 189,
      engagementRate: 65
    },
    {
      id: '3',
      title: 'SIP Benefits for Young Investors',
      content: 'Systematic Investment Plans offer disciplined investing approach...',
      contentType: 'educational',
      language: 'Hindi',
      category: 'Investment Education',
      complianceScore: 88,
      status: 'pending',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    },
    {
      id: '4',
      title: 'Diwali Special: Financial Planning',
      content: 'This Diwali, give your finances a festive makeover...',
      contentType: 'seasonal',
      language: 'Mixed',
      category: 'Seasonal',
      complianceScore: 75,
      status: 'rejected',
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
    },
    {
      id: '5',
      title: 'Understanding Risk in Mutual Funds',
      content: 'Risk and return go hand in hand in mutual fund investments...',
      contentType: 'educational',
      language: 'English',
      category: 'Risk Management',
      complianceScore: 98,
      status: 'delivered',
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 95 * 60 * 60 * 1000),
      clientCount: 312,
      engagementRate: 82
    }
  ];

  const contentItems = items.length > 0 ? items : mockItems;

  // Filter items
  const filteredItems = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  const handleDownload = (item: ContentItem) => {
    const blob = new Blob([item.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Content downloaded');
  };

  const handleShare = (item: ContentItem) => {
    const text = encodeURIComponent(item.content);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items first');
      return;
    }
    
    switch (action) {
      case 'download':
        toast.success(`Downloading ${selectedItems.length} items`);
        break;
      case 'delete':
        toast.success(`Deleted ${selectedItems.length} items`);
        setSelectedItems([]);
        break;
      case 'approve':
        toast.success(`Approved ${selectedItems.length} items`);
        setSelectedItems([]);
        break;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      delivered: 'default',
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      draft: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="delivered">Delivered</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="Tax Planning">Tax Planning</option>
              <option value="Market Updates">Market Updates</option>
              <option value="Investment Education">Investment Education</option>
              <option value="Risk Management">Risk Management</option>
              <option value="Seasonal">Seasonal</option>
            </select>
            
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium">{selectedItems.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('download')}>
              Download All
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('approve')}>
              Approve All
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
              Delete All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedItems([])}>
              Clear Selection
            </Button>
          </div>
        )}
      </Card>

      {/* Content List */}
      <div className="space-y-3">
        {paginatedItems.length > 0 ? (
          paginatedItems.map((item) => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, item.id]);
                      } else {
                        setSelectedItems(selectedItems.filter(id => id !== item.id));
                      }
                    }}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(item.status)}
                          {getStatusBadge(item.status)}
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="outline">{item.language}</Badge>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            <span className="text-xs font-medium">{item.complianceScore}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created {formatRelativeTime(item.createdAt)}</span>
                        </div>
                        {item.deliveredAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Delivered {formatRelativeTime(item.deliveredAt)}</span>
                          </div>
                        )}
                        {item.clientCount && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{item.clientCount} clients</span>
                          </div>
                        )}
                        {item.engagementRate && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{item.engagementRate}% engagement</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(item.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShare(item)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length} items
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Add missing import
import { Shield, Users } from 'lucide-react';

export default ContentHistory;