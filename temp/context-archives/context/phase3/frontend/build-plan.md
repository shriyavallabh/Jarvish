# Frontend Build Plan - Next.js 14 App Router Implementation 🚀

## Overview
Comprehensive frontend build plan for Project One's Next.js 14 App Router implementation, including component architecture, state management, routing strategy, and integration points with backend services.

## Project Structure & Architecture

### Next.js 14 App Router File Structure
```
src/
├── app/                          # App Router directory
│   ├── (auth)/                   # Route groups
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Auth layout
│   │
│   ├── (advisor)/                # Advisor portal routes
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── create/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── library/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── whatsapp/
│   │   │   │   └── page.tsx
│   │   │   ├── billing/
│   │   │   │   └── page.tsx
│   │   │   └── notifications/
│   │   │       └── page.tsx
│   │   └── layout.tsx            # Advisor portal layout
│   │
│   ├── (admin)/                  # Admin portal routes
│   │   ├── queue/
│   │   │   ├── page.tsx
│   │   │   └── [contentId]/
│   │   │       └── page.tsx
│   │   ├── compliance/
│   │   │   └── page.tsx
│   │   ├── advisors/
│   │   │   ├── page.tsx
│   │   │   └── [advisorId]/
│   │   │       └── page.tsx
│   │   ├── system/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Admin portal layout
│   │
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   ├── whatsapp/
│   │   │   │   └── route.ts
│   │   │   └── stripe/
│   │   │       └── route.ts
│   │   └── health/
│   │       └── route.ts
│   │
│   ├── globals.css               # Global styles & Tailwind imports
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Global loading UI
│   ├── error.tsx                 # Global error boundary
│   └── not-found.tsx             # 404 page
│
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── advisor/                  # Advisor-specific components
│   │   ├── dashboard/
│   │   │   ├── metric-card.tsx
│   │   │   ├── quick-actions.tsx
│   │   │   └── activity-feed.tsx
│   │   ├── create/
│   │   │   ├── topic-selection.tsx
│   │   │   ├── ai-generation.tsx
│   │   │   ├── content-editor.tsx
│   │   │   └── compliance-review.tsx
│   │   ├── library/
│   │   │   ├── content-grid.tsx
│   │   │   ├── content-card.tsx
│   │   │   └── filter-tabs.tsx
│   │   └── analytics/
│   │       ├── performance-chart.tsx
│   │       ├── engagement-metrics.tsx
│   │       └── insights-summary.tsx
│   │
│   ├── admin/                    # Admin-specific components
│   │   ├── queue/
│   │   │   ├── queue-list.tsx
│   │   │   ├── review-panel.tsx
│   │   │   └── batch-actions.tsx
│   │   ├── compliance/
│   │   │   ├── risk-dashboard.tsx
│   │   │   ├── advisor-heatmap.tsx
│   │   │   └── incident-log.tsx
│   │   └── advisors/
│   │       ├── advisor-table.tsx
│   │       └── advisor-detail.tsx
│   │
│   ├── shared/                   # Shared components
│   │   ├── navigation/
│   │   │   ├── sidebar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── breadcrumb.tsx
│   │   ├── layout/
│   │   │   ├── app-shell.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── content-wrapper.tsx
│   │   ├── forms/
│   │   │   ├── form-field.tsx
│   │   │   ├── multi-step-form.tsx
│   │   │   └── validation-message.tsx
│   │   └── feedback/
│   │       ├── toast.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       └── empty-state.tsx
│   │
│   └── fintech/                  # Financial advisor specific components
│       ├── compliance-meter.tsx
│       ├── delivery-schedule.tsx
│       ├── whatsapp-preview.tsx
│       ├── risk-badge.tsx
│       └── language-toggle.tsx
│
├── hooks/                        # Custom React hooks
│   ├── use-content.ts
│   ├── use-compliance.ts
│   ├── use-analytics.ts
│   ├── use-auth.ts
│   ├── use-whatsapp.ts
│   └── use-debounce.ts
│
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Clerk authentication setup
│   ├── api.ts                    # API client configuration
│   ├── utils.ts                  # General utilities
│   ├── validations.ts            # Zod schemas
│   ├── constants.ts              # App constants
│   └── types.ts                  # TypeScript type definitions
│
├── store/                        # State management
│   ├── index.ts                  # Zustand store setup
│   ├── auth-store.ts
│   ├── content-store.ts
│   ├── compliance-store.ts
│   └── ui-store.ts
│
└── styles/                       # Styling
    ├── globals.css
    ├── components.css
    └── animations.css
```

## App Router Implementation Strategy

### Route Groups & Layouts
```typescript
// app/layout.tsx - Root layout
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import '@/styles/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="light">
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

// app/(advisor)/layout.tsx - Advisor portal layout
import { AdvisorSidebar } from '@/components/advisor/sidebar'
import { AdvisorHeader } from '@/components/advisor/header'
import { MobileNav } from '@/components/shared/navigation/mobile-nav'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdvisorSidebar className="hidden lg:flex" />
      <MobileNav className="lg:hidden" userType="advisor" />
      
      <div className="lg:pl-72">
        <AdvisorHeader />
        <main className="py-6 pb-20 lg:pb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### Server Components & Data Fetching Strategy
```typescript
// app/(advisor)/dashboard/page.tsx - Server component with data fetching
import { AdvisorDashboard } from '@/components/advisor/dashboard'
import { getAdvisorDashboardData } from '@/lib/api/advisor'
import { auth } from '@clerk/nextjs'

export default async function DashboardPage() {
  const { userId } = auth()
  
  // Fetch data server-side
  const dashboardData = await getAdvisorDashboardData(userId!)
  
  return <AdvisorDashboard data={dashboardData} />
}

// Data fetching utility
// lib/api/advisor.ts
export async function getAdvisorDashboardData(advisorId: string) {
  const response = await fetch(`${process.env.API_BASE_URL}/advisors/${advisorId}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${await getApiToken()}`,
    },
    cache: 'no-store', // Always fresh for dashboard
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  
  return response.json()
}
```

### Client Components & Interactivity
```typescript
// components/advisor/create/content-editor.tsx - Client component
'use client'

import { useState, useCallback } from 'react'
import { useComplianceCheck } from '@/hooks/use-compliance'
import { ContentPreview } from './content-preview'
import { ComplianceReview } from './compliance-review'

interface ContentEditorProps {
  initialContent: string
  onSave: (content: string) => Promise<void>
}

export function ContentEditor({ initialContent, onSave }: ContentEditorProps) {
  const [content, setContent] = useState(initialContent)
  const { checkCompliance, isChecking, riskScore } = useComplianceCheck()
  
  const handleContentChange = useCallback(
    debounce(async (newContent: string) => {
      setContent(newContent)
      await checkCompliance(newContent)
    }, 500),
    []
  )
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-64 p-4 border rounded-lg resize-none"
          placeholder="Enter your content..."
        />
        
        <ComplianceReview 
          riskScore={riskScore}
          isChecking={isChecking}
        />
      </div>
      
      <ContentPreview content={content} />
    </div>
  )
}
```

## Component Architecture

### shadcn/ui Integration Plan
```typescript
// components/ui/index.ts - Barrel exports for shadcn/ui components
export { Button } from './button'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
export { Input } from './input'
export { Label } from './label'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
export { Badge } from './badge'
export { Progress } from './progress'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast'

// Extended components with Project One customizations
export { ComplianceButton } from './compliance-button'
export { RiskMeter } from './risk-meter'
export { LanguageToggle } from './language-toggle'
```

### Custom Component Extensions
```typescript
// components/ui/compliance-button.tsx - Extended Button for compliance contexts
import { Button, ButtonProps } from './button'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

interface ComplianceButtonProps extends ButtonProps {
  riskScore?: number
  complianceStatus?: 'safe' | 'warning' | 'danger'
}

export function ComplianceButton({ 
  riskScore, 
  complianceStatus, 
  children, 
  className,
  ...props 
}: ComplianceButtonProps) {
  const getComplianceVariant = () => {
    if (complianceStatus === 'safe' || (riskScore && riskScore < 25)) return 'compliance-safe'
    if (complianceStatus === 'warning' || (riskScore && riskScore < 75)) return 'compliance-warning'
    return 'destructive'
  }
  
  return (
    <Button 
      variant={getComplianceVariant()}
      className={cn('relative', className)}
      {...props}
    >
      {children}
      {riskScore && (
        <Badge className="ml-2 h-5 text-xs">
          {riskScore}/100
        </Badge>
      )}
    </Button>
  )
}
```

## State Management Strategy

### Zustand Store Architecture
```typescript
// store/index.ts - Main store setup
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { contentSlice, ContentSlice } from './content-store'
import { authSlice, AuthSlice } from './auth-store'
import { uiSlice, UISlice } from './ui-store'

export interface AppStore extends ContentSlice, AuthSlice, UISlice {}

export const useStore = create<AppStore>()(
  devtools(
    persist(
      (...args) => ({
        ...contentSlice(...args),
        ...authSlice(...args),
        ...uiSlice(...args),
      }),
      {
        name: 'project-one-store',
        partialize: (state) => ({
          // Only persist auth and UI preferences
          user: state.user,
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    )
  )
)

// store/content-store.ts - Content management slice
export interface ContentSlice {
  contents: Content[]
  selectedContent: Content | null
  isLoading: boolean
  
  // Actions
  fetchContents: () => Promise<void>
  selectContent: (id: string) => void
  updateContent: (id: string, updates: Partial<Content>) => Promise<void>
  deleteContent: (id: string) => Promise<void>
}

export const contentSlice: StateCreator<AppStore, [], [], ContentSlice> = (set, get) => ({
  contents: [],
  selectedContent: null,
  isLoading: false,
  
  fetchContents: async () => {
    set({ isLoading: true })
    try {
      const contents = await getAdvisorContents()
      set({ contents, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  
  selectContent: (id) => {
    const content = get().contents.find(c => c.id === id)
    set({ selectedContent: content || null })
  },
  
  updateContent: async (id, updates) => {
    const updatedContent = await updateContent(id, updates)
    set(state => ({
      contents: state.contents.map(c => 
        c.id === id ? { ...c, ...updatedContent } : c
      ),
    }))
  },
  
  deleteContent: async (id) => {
    await deleteContent(id)
    set(state => ({
      contents: state.contents.filter(c => c.id !== id),
      selectedContent: state.selectedContent?.id === id ? null : state.selectedContent,
    }))
  },
})
```

### Custom Hooks for Data Management
```typescript
// hooks/use-content.ts - Content management hook
import { useStore } from '@/store'
import { useCallback } from 'react'

export function useContent() {
  const {
    contents,
    selectedContent,
    isLoading,
    fetchContents,
    selectContent,
    updateContent,
    deleteContent,
  } = useStore()
  
  const createContent = useCallback(async (contentData: CreateContentData) => {
    const newContent = await createContent(contentData)
    // Optimistically update store
    useStore.setState(state => ({
      contents: [newContent, ...state.contents]
    }))
    return newContent
  }, [])
  
  const submitForApproval = useCallback(async (contentId: string) => {
    await submitContentForApproval(contentId)
    await updateContent(contentId, { status: 'pending' })
  }, [updateContent])
  
  return {
    contents,
    selectedContent,
    isLoading,
    actions: {
      fetch: fetchContents,
      select: selectContent,
      create: createContent,
      update: updateContent,
      delete: deleteContent,
      submitForApproval,
    }
  }
}

// hooks/use-compliance.ts - Compliance checking hook
import { useState, useCallback } from 'react'
import { debounce } from 'lodash'

export function useComplianceCheck() {
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)
  
  const checkCompliance = useCallback(
    debounce(async (content: string) => {
      if (!content.trim()) {
        setRiskScore(null)
        setSuggestions([])
        return
      }
      
      setIsChecking(true)
      try {
        const result = await checkContentCompliance(content)
        setRiskScore(result.riskScore)
        setSuggestions(result.suggestions)
      } catch (error) {
        console.error('Compliance check failed:', error)
      } finally {
        setIsChecking(false)
      }
    }, 500),
    []
  )
  
  return {
    riskScore,
    suggestions,
    isChecking,
    checkCompliance,
  }
}
```

## API Integration Strategy

### API Client Configuration
```typescript
// lib/api.ts - Centralized API client
import { auth } from '@clerk/nextjs'

class ApiClient {
  private baseURL: string
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  }
  
  private async getAuthHeaders() {
    const { getToken } = auth()
    const token = await getToken()
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: await this.getAuthHeaders(),
    })
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text())
    }
    
    return response.json()
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text())
    }
    
    return response.json()
  }
  
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text())
    }
    
    return response.json()
  }
  
  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    })
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text())
    }
  }
}

export const api = new ApiClient()

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}
```

### Typed API Endpoints
```typescript
// lib/api/content.ts - Content API endpoints
import { api } from '../api'
import type { Content, CreateContentData, UpdateContentData } from '../types'

export const contentApi = {
  // Get advisor's content library
  getAll: () => api.get<Content[]>('/content'),
  
  // Get specific content
  getById: (id: string) => api.get<Content>(`/content/${id}`),
  
  // Create new content
  create: (data: CreateContentData) => api.post<Content>('/content', data),
  
  // Update content
  update: (id: string, data: UpdateContentData) => 
    api.put<Content>(`/content/${id}`, data),
  
  // Delete content
  delete: (id: string) => api.delete(`/content/${id}`),
  
  // Submit for approval
  submitForApproval: (id: string) => 
    api.post(`/content/${id}/submit`, {}),
  
  // Generate AI content
  generateContent: (prompt: string, language: string) =>
    api.post<{ content: string }>('/content/generate', { prompt, language }),
  
  // Check compliance
  checkCompliance: (content: string) =>
    api.post<{ riskScore: number; suggestions: string[] }>('/content/compliance-check', { content }),
}
```

## Styling & Design System Integration

### Tailwind CSS Configuration
```javascript
// tailwind.config.js - Extended with Project One design tokens
const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Project One color palette
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        // Compliance-specific colors
        compliance: {
          excellent: "#10b981",
          good: "#3b82f6",
          caution: "#f59e0b",
          danger: "#ef4444",
        }
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        mono: ["JetBrains Mono", ...fontFamily.mono],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "compliance-pulse": "compliancePulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        compliancePulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### CSS Custom Properties Integration
```css
/* styles/globals.css - Global styles with CSS custom properties */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Semantic color tokens */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 199 89% 48%;
    --primary-foreground: 210 40% 98%;
    
    /* Compliance colors */
    --compliance-excellent: 142 76% 36%;
    --compliance-good: 217 91% 60%;
    --compliance-caution: 32 95% 44%;
    --compliance-danger: 0 84% 60%;
    
    /* Animation durations */
    --duration-fast: 150ms;
    --duration-medium: 300ms;
    --duration-slow: 500ms;
    
    /* Spacing scale */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
  }
  
  @media (prefers-reduced-motion: reduce) {
    :root {
      --duration-fast: 0ms;
      --duration-medium: 0ms;
      --duration-slow: 100ms;
    }
  }
}

@layer components {
  /* Project One specific component styles */
  .compliance-meter {
    @apply relative w-full h-4 bg-gray-200 rounded-full overflow-hidden;
  }
  
  .compliance-meter-fill {
    @apply h-full transition-all duration-500 ease-out;
  }
  
  .whatsapp-preview {
    @apply max-w-sm mx-auto bg-white rounded-2xl shadow-lg overflow-hidden;
    @apply border border-gray-200;
  }
  
  .content-card-hover {
    @apply transition-all duration-200 ease-out;
    @apply hover:shadow-md hover:-translate-y-0.5;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .animation-delay-100 {
    animation-delay: 100ms;
  }
  
  .animation-delay-200 {
    animation-delay: 200ms;
  }
}
```

## Storybook Integration Plan

### Storybook Configuration
```javascript
// .storybook/main.js
const config = {
  stories: [
    "../components/**/*.stories.@(js|jsx|ts|tsx|mdx)",
    "../app/**/*.stories.@(js|jsx|ts|tsx|mdx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "@storybook/addon-design-tokens",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
}

export default config
```

### Component Story Templates
```typescript
// components/ui/button.stories.tsx - Button component stories
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Primary button component with compliance variants for Project One.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive', 'compliance-safe', 'compliance-warning'],
      description: 'Button visual variant'
    },
    size: {
      control: 'select', 
      options: ['sm', 'default', 'lg', 'icon'],
      description: 'Button size'
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Create Content',
  },
}

export const ComplianceSafe: Story = {
  args: {
    variant: 'compliance-safe',
    children: 'Submit for Approval',
  },
}

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    loadingText: 'Generating...',
    children: 'Generate Content',
  },
}

// components/fintech/compliance-meter.stories.tsx - Compliance meter stories
import type { Meta, StoryObj } from '@storybook/react'
import { ComplianceMeter } from './compliance-meter'

const meta: Meta<typeof ComplianceMeter> = {
  title: 'Fintech/ComplianceMeter',
  component: ComplianceMeter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Visual risk score meter for SEBI compliance scoring (0-100 scale).'
      }
    }
  },
  argTypes: {
    score: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Risk score from 0 (lowest risk) to 100 (highest risk)'
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Excellent: Story = {
  args: {
    score: 15,
    showDetails: true,
    recommendations: ['Content looks great for SEBI compliance!']
  },
}

export const Warning: Story = {
  args: {
    score: 65,
    showDetails: true,
    recommendations: [
      'Consider softening language around guaranteed returns',
      'Add appropriate risk disclaimers'
    ]
  },
}

export const Danger: Story = {
  args: {
    score: 85,
    showDetails: true,
    recommendations: [
      'Remove all guarantee language',
      'Add mandatory risk disclaimers',
      'Consider completely rewriting content'
    ]
  },
}
```

## Performance Optimization Strategy

### Code Splitting & Lazy Loading
```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load heavy chart components
const AnalyticsChart = dynamic(() => import('@/components/advisor/analytics/performance-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Client-side only for charts
})

// Lazy load admin components
const AdminQueue = dynamic(() => import('@/components/admin/queue/queue-list'), {
  loading: () => <QueueSkeleton />
})

// Code splitting by route
export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <div className="space-y-6">
        <PageHeader title="Performance Analytics" />
        
        <Suspense fallback={<ChartSkeleton />}>
          <AnalyticsChart />
        </Suspense>
      </div>
    </Suspense>
  )
}
```

### Image Optimization
```typescript
// components/shared/optimized-image.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

export function OptimizedImage({ src, alt, width, height, className }: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  
  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        onLoad={() => setIsLoading(false)}
        priority={false} // Lazy load by default
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </div>
  )
}
```

## Build & Deployment Configuration

### Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  webpack(config) {
    // Optimize bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    }
    
    return config
  },
}

module.exports = nextConfig
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/styles/*": ["./src/styles/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

This comprehensive frontend build plan provides a complete roadmap for implementing Project One's Next.js 14 App Router application with proper component architecture, state management, and performance optimization strategies.