'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminDashboard() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filterType, setFilterType] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')

  const contentQueue = [
    {
      id: 'PRM-2024-0907',
      advisor: { name: 'Arjun Khanna', id: 'ELITE/2019/0012', initials: 'AK' },
      contentType: 'Wealth Strategy',
      riskScore: 2.1,
      riskLevel: 'low',
      compliance: 'Clear',
      timestamp: '1 min ago',
      selected: true
    },
    {
      id: 'PRM-2024-0908',
      advisor: { name: 'Sanjay Malhotra', id: 'ELITE/2020/0034', initials: 'SM' },
      contentType: 'Portfolio Update',
      riskScore: 5.3,
      riskLevel: 'medium',
      compliance: 'Review needed',
      timestamp: '2 min ago',
      selected: false
    },
    {
      id: 'PRM-2024-0909',
      advisor: { name: 'Priya Gupta', id: 'PREMIUM/2021/0089', initials: 'PG' },
      contentType: 'Tax Planning',
      riskScore: 1.8,
      riskLevel: 'low',
      compliance: 'Clear',
      timestamp: '3 min ago',
      selected: true
    },
    {
      id: 'PRM-2024-0910',
      advisor: { name: 'Rohit Verma', id: 'ELITE/2018/0005', initials: 'RV' },
      contentType: 'Fund Launch',
      riskScore: 7.4,
      riskLevel: 'high',
      compliance: 'Claims flagged',
      timestamp: '5 min ago',
      selected: false
    },
    {
      id: 'PRM-2024-0911',
      advisor: { name: 'Neeta Shah', id: 'PREMIUM/2022/0156', initials: 'NS' },
      contentType: 'Market Analysis',
      riskScore: 3.2,
      riskLevel: 'low',
      compliance: 'Clear',
      timestamp: '6 min ago',
      selected: true
    }
  ]

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedItems.length === contentQueue.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(contentQueue.map(item => item.id))
    }
  }

  return (
    <div className="admin-dashboard min-h-screen flex">
      {/* Premium Sidebar */}
      <aside className="w-[280px] bg-admin-primary text-white">
        <div className="p-8 border-b border-admin-accent/30 bg-gradient-to-br from-admin-primary to-admin-secondary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-admin-accent rounded-md flex items-center justify-center text-admin-primary text-2xl font-bold">
              J
            </div>
            <div>
              <div className="text-xl font-light tracking-wide">Elite Admin</div>
              <div className="text-[11px] text-admin-accent uppercase tracking-[2px] mt-1">Premium Suite</div>
            </div>
          </div>
        </div>

        <nav className="py-6">
          <div className="mb-8">
            <div className="px-6 mb-3 text-[10px] uppercase tracking-[1.5px] text-admin-accent/60 font-semibold">
              Operations
            </div>
            <div className="relative">
              <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors bg-admin-accent/10">
                <span className="text-admin-accent text-lg">✓</span>
                <span className="text-sm font-normal tracking-[0.5px]">Approval Center</span>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-admin-accent"></div>
              </a>
              <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors">
                <span className="text-admin-accent text-lg">📊</span>
                <span className="text-sm font-normal tracking-[0.5px]">Analytics</span>
              </a>
              <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors">
                <span className="text-admin-accent text-lg">📈</span>
                <span className="text-sm font-normal tracking-[0.5px]">Performance</span>
              </a>
            </div>
          </div>

          <div className="mb-8">
            <div className="px-6 mb-3 text-[10px] uppercase tracking-[1.5px] text-admin-accent/60 font-semibold">
              Management
            </div>
            <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors">
              <span className="text-admin-accent text-lg">👔</span>
              <span className="text-sm font-normal tracking-[0.5px]">Elite Advisors</span>
            </a>
            <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors">
              <span className="text-admin-accent text-lg">📋</span>
              <span className="text-sm font-normal tracking-[0.5px]">Templates</span>
            </a>
            <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors">
              <span className="text-admin-accent text-lg">⚖️</span>
              <span className="text-sm font-normal tracking-[0.5px]">Compliance</span>
            </a>
          </div>

          <div>
            <div className="px-6 mb-3 text-[10px] uppercase tracking-[1.5px] text-admin-accent/60 font-semibold">
              Premium
            </div>
            <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors">
              <span className="text-admin-accent text-lg">💎</span>
              <span className="text-sm font-normal tracking-[0.5px]">VIP Services</span>
            </a>
            <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors">
              <span className="text-admin-accent text-lg">🏆</span>
              <span className="text-sm font-normal tracking-[0.5px]">Achievements</span>
            </a>
            <a href="#" className="flex items-center gap-4 px-6 py-3.5 hover:bg-admin-accent/5 transition-colors">
              <span className="text-admin-accent text-lg">🔐</span>
              <span className="text-sm font-normal tracking-[0.5px]">Security</span>
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        {/* Premium Header */}
        <header className="bg-white px-8 py-6 border-b border-admin-border">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light tracking-[0.5px] text-admin-primary mb-1">
                Content Approval Center
              </h1>
              <div className="flex items-center gap-2 text-[13px] text-admin-secondary">
                <span>Nightly Review Session</span>
                <Badge className="bg-gradient-to-r from-admin-accent to-[#b8941f] text-white border-0 text-[10px] font-semibold uppercase tracking-[1px] px-2 py-0.5">
                  Premium
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-admin-primary text-white px-5 py-2.5 rounded-md flex items-center gap-2 text-[13px] font-medium">
                <span>⏰</span>
                <span>Window: <span className="text-admin-accent">20:30 - 21:30 IST</span></span>
              </div>
              <Button className="bg-gradient-to-r from-admin-accent to-[#b8941f] text-white hover:from-[#b8941f] hover:to-admin-accent border-0 font-medium tracking-[0.5px]">
                <span className="mr-2">📊</span>
                Executive Report
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {/* Premium Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card className="p-6 border-admin-border relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-admin-accent before:to-[#b8941f]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-admin-accent-light rounded-md flex items-center justify-center text-admin-accent text-xl">
                  📋
                </div>
                <Badge className="bg-green-50 text-green-600 border-0 text-[11px] font-semibold">
                  ↑ 15%
                </Badge>
              </div>
              <div className="text-4xl font-light tracking-[-1px] mb-2">127</div>
              <div className="text-xs uppercase tracking-[1px] text-admin-secondary">Pending Reviews</div>
            </Card>

            <Card className="p-6 border-admin-border relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-admin-accent before:to-[#b8941f]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-admin-accent-light rounded-md flex items-center justify-center text-admin-accent text-xl">
                  ✅
                </div>
                <Badge className="bg-green-50 text-green-600 border-0 text-[11px] font-semibold">
                  ↑ 3.2%
                </Badge>
              </div>
              <div className="text-4xl font-light tracking-[-1px] mb-2">96.8%</div>
              <div className="text-xs uppercase tracking-[1px] text-admin-secondary">Approval Rate</div>
            </Card>

            <Card className="p-6 border-admin-border relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-admin-accent before:to-[#b8941f]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-admin-accent-light rounded-md flex items-center justify-center text-admin-accent text-xl">
                  ⚡
                </div>
                <Badge className="bg-green-50 text-green-600 border-0 text-[11px] font-semibold">
                  ↓ 4s
                </Badge>
              </div>
              <div className="text-4xl font-light tracking-[-1px] mb-2">16s</div>
              <div className="text-xs uppercase tracking-[1px] text-admin-secondary">Avg Processing</div>
            </Card>

            <Card className="p-6 border-admin-border relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-admin-accent before:to-[#b8941f]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-admin-accent-light rounded-md flex items-center justify-center text-admin-accent text-xl">
                  💎
                </div>
                <Badge className="bg-green-50 text-green-600 border-0 text-[11px] font-semibold">
                  Excellent
                </Badge>
              </div>
              <div className="text-4xl font-light tracking-[-1px] mb-2">99.5%</div>
              <div className="text-xs uppercase tracking-[1px] text-admin-secondary">Quality Score</div>
            </Card>
          </div>

          {/* Premium Table */}
          <Card className="border-admin-border overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-admin-surface to-white border-b border-admin-border flex justify-between items-center">
              <h2 className="text-lg font-normal tracking-[0.5px]">Elite Advisor Content Queue</h2>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="border-admin-border text-admin-primary hover:bg-admin-surface"
                  onClick={selectAll}
                >
                  Select All
                </Button>
                <Button className="bg-gradient-to-r from-admin-accent to-[#b8941f] text-white hover:from-[#b8941f] hover:to-admin-accent border-0 font-medium">
                  <span className="mr-2">✓</span>
                  Approve Premium
                </Button>
                <Button className="bg-admin-primary text-white hover:bg-admin-secondary font-medium">
                  <span className="mr-2">⚡</span>
                  Quick Review
                </Button>
              </div>
            </div>

            <div className="px-8 py-4 bg-admin-surface border-b border-admin-border flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterType === 'all' 
                      ? 'bg-admin-accent text-white' 
                      : 'bg-white border border-admin-border text-admin-primary hover:border-admin-accent'
                  }`}
                  onClick={() => setFilterType('all')}
                >
                  All (127)
                </button>
                <button 
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterType === 'elite' 
                      ? 'bg-admin-accent text-white' 
                      : 'bg-white border border-admin-border text-admin-primary hover:border-admin-accent'
                  }`}
                  onClick={() => setFilterType('elite')}
                >
                  Elite (45)
                </button>
                <button 
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterType === 'premium' 
                      ? 'bg-admin-accent text-white' 
                      : 'bg-white border border-admin-border text-admin-primary hover:border-admin-accent'
                  }`}
                  onClick={() => setFilterType('premium')}
                >
                  Premium (52)
                </button>
                <button 
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterType === 'standard' 
                      ? 'bg-admin-accent text-white' 
                      : 'bg-white border border-admin-border text-admin-primary hover:border-admin-accent'
                  }`}
                  onClick={() => setFilterType('standard')}
                >
                  Standard (30)
                </button>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 rounded-md bg-white border border-admin-border text-xs font-medium text-admin-primary hover:border-admin-accent transition-colors">
                  Low Risk
                </button>
                <button className="px-4 py-1.5 rounded-md bg-white border border-admin-border text-xs font-medium text-admin-primary hover:border-admin-accent transition-colors">
                  Medium Risk
                </button>
                <button className="px-4 py-1.5 rounded-md bg-white border border-admin-border text-xs font-medium text-admin-primary hover:border-admin-accent transition-colors">
                  High Risk
                </button>
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-admin-surface">
                <tr>
                  <th className="w-10 px-8 py-4 text-left">
                    <Checkbox 
                      checked={selectedItems.length === contentQueue.length}
                      onCheckedChange={selectAll}
                      className="border-admin-accent data-[state=checked]:bg-admin-accent data-[state=checked]:border-admin-accent"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[1.5px] text-admin-secondary">
                    Content ID
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[1.5px] text-admin-secondary">
                    Elite Advisor
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[1.5px] text-admin-secondary">
                    Content Type
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[1.5px] text-admin-secondary">
                    Risk Score
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[1.5px] text-admin-secondary">
                    Compliance
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[1.5px] text-admin-secondary">
                    Timestamp
                  </th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[1.5px] text-admin-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {contentQueue.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-100 hover:bg-[#fffef7] transition-colors ${
                      item.selected ? 'bg-gradient-to-r from-[#fffef7] to-admin-accent-light/30' : ''
                    }`}
                  >
                    <td className="px-8 py-5">
                      <Checkbox 
                        checked={selectedItems.includes(item.id) || item.selected}
                        onCheckedChange={() => toggleSelection(item.id)}
                        className="border-admin-accent data-[state=checked]:bg-admin-accent data-[state=checked]:border-admin-accent"
                      />
                    </td>
                    <td className="px-4 py-5">
                      <span className="font-semibold">#{item.id}</span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-secondary border-2 border-admin-accent rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {item.advisor.initials}
                        </div>
                        <div>
                          <div className="font-medium">{item.advisor.name}</div>
                          <div className="text-[11px] text-admin-secondary">{item.advisor.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="px-3 py-1 bg-admin-surface rounded text-xs font-medium">
                        {item.contentType}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-semibold ${
                        item.riskLevel === 'low' 
                          ? 'bg-green-50 text-green-600' 
                          : item.riskLevel === 'medium'
                          ? 'bg-admin-accent-light text-admin-warning'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {item.riskLevel === 'low' ? 'Low' : item.riskLevel === 'medium' ? 'Medium' : 'High'} {item.riskScore}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-sm">{item.compliance}</td>
                    <td className="px-4 py-5 text-sm text-admin-secondary">{item.timestamp}</td>
                    <td className="px-4 py-5">
                      <a href="#" className="text-admin-accent font-medium text-[13px] hover:underline">
                        Preview →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-admin-border px-8 py-5 sticky bottom-0 flex justify-between items-center">
          <div className="flex gap-8">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span>WhatsApp API: Optimal</span>
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="w-1.5 h-1.5 rounded-full bg-admin-accent"></span>
              <span>Rate Limit: 68%</span>
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span>AI Service: 89ms</span>
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span>Queue: 8 jobs</span>
            </div>
          </div>
          <div className="bg-admin-surface px-4 py-2 rounded-md text-[11px] text-admin-secondary uppercase tracking-[0.5px]">
            ⌘A Select All • ⌘↵ Approve • ⌘R Reject • Space Preview
          </div>
        </div>
      </main>
    </div>
  )
}