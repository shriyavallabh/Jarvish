# UI Component Specifications - shadcn/ui Mapping 🎨

## Overview
Comprehensive component specifications for Project One's UI system, built on shadcn/ui primitives with custom extensions for financial advisor workflows and Indian market requirements.

## Design System Foundation

### Color Palette & Tokens
```yaml
color_system:
  primary_brand:
    50: "#f0f9ff"   # lightest blue background
    100: "#e0f2fe"  # light blue surfaces
    500: "#0ea5e9"  # primary brand blue
    600: "#0284c7"  # primary hover state
    900: "#0c4a6e"  # dark text/headers
    
  semantic_colors:
    success:
      50: "#f0fdf4"  # success background
      500: "#22c55e" # success primary
      600: "#16a34a" # success hover
      
    warning:
      50: "#fffbeb"  # warning background  
      500: "#f59e0b" # warning primary
      600: "#d97706" # warning hover
      
    error:
      50: "#fef2f2"  # error background
      500: "#ef4444" # error primary
      600: "#dc2626" # error hover
      
    compliance:
      excellent: "#10b981" # green - low risk
      good: "#3b82f6"      # blue - medium low risk
      caution: "#f59e0b"   # yellow - medium risk
      danger: "#ef4444"    # red - high risk
      
  neutral_grays:
    50: "#f9fafb"   # lightest backgrounds
    100: "#f3f4f6"  # card backgrounds
    200: "#e5e7eb"  # borders
    300: "#d1d5db"  # disabled states
    500: "#6b7280"  # secondary text
    700: "#374151"  # primary text
    900: "#111827"  # headings
```

### Typography System
```yaml
typography_scale:
  font_families:
    sans: "Inter, system-ui, sans-serif"
    mono: "JetBrains Mono, Consolas, monospace"
    
  font_sizes:
    xs: "0.75rem"    # 12px - captions, badges
    sm: "0.875rem"   # 14px - body small, labels
    base: "1rem"     # 16px - body text
    lg: "1.125rem"   # 18px - body large
    xl: "1.25rem"    # 20px - headings H4
    "2xl": "1.5rem"  # 24px - headings H3
    "3xl": "1.875rem" # 30px - headings H2
    "4xl": "2.25rem"  # 36px - headings H1
    
  line_heights:
    tight: "1.25"    # headings
    normal: "1.5"    # body text
    relaxed: "1.625" # large text blocks
    
  font_weights:
    normal: "400"
    medium: "500"    # button text, labels
    semibold: "600"  # headings, emphasis
    bold: "700"      # important headings
```

### Spacing & Layout System
```yaml
spacing_scale:
  # Based on 4px base unit
  px: "1px"
  0: "0px"
  0.5: "0.125rem"  # 2px
  1: "0.25rem"     # 4px
  2: "0.5rem"      # 8px
  3: "0.75rem"     # 12px
  4: "1rem"        # 16px
  5: "1.25rem"     # 20px
  6: "1.5rem"      # 24px
  8: "2rem"        # 32px
  10: "2.5rem"     # 40px
  12: "3rem"       # 48px
  16: "4rem"       # 64px
  20: "5rem"       # 80px
  24: "6rem"       # 96px
  
layout_tokens:
  container_max_width: "1280px"
  sidebar_width: "280px"
  mobile_breakpoint: "768px"
  tablet_breakpoint: "1024px"
  header_height: "64px"
  mobile_nav_height: "56px"
```

## Core UI Components

### 1. Button Component System
```typescript
// Button.tsx - Extended from shadcn/ui Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'compliance-safe' | 'compliance-warning'
  size: 'sm' | 'default' | 'lg' | 'icon'
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  badge?: string | number
}

const buttonVariants = {
  primary: "bg-primary-500 hover:bg-primary-600 text-white shadow-sm",
  secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
  ghost: "hover:bg-gray-100 text-gray-700",
  destructive: "bg-error-500 hover:bg-error-600 text-white",
  'compliance-safe': "bg-success-500 hover:bg-success-600 text-white",
  'compliance-warning': "bg-warning-500 hover:bg-warning-600 text-white"
}

const buttonSizes = {
  sm: "h-8 px-3 text-sm",
  default: "h-10 px-4 text-base", 
  lg: "h-12 px-6 text-lg",
  icon: "h-10 w-10"
}
```

#### Button Usage Examples
```yaml
primary_actions:
  create_content: 
    variant: "primary"
    size: "lg"
    text: "Create Tomorrow's Content"
    leftIcon: "Plus"
    
  submit_approval:
    variant: "compliance-safe" 
    size: "default"
    text: "Submit for Approval"
    loading: true
    loadingText: "Submitting..."
    
destructive_actions:
  delete_content:
    variant: "destructive"
    size: "sm"
    text: "Delete Forever"
    rightIcon: "Trash2"
    
secondary_actions:
  save_draft:
    variant: "secondary"
    size: "default"
    text: "Save as Draft"
    leftIcon: "Save"
```

### 2. Card Component System
```typescript
// Card.tsx - Extended from shadcn/ui Card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: 'default' | 'elevated' | 'bordered' | 'success' | 'warning' | 'error'
  padding: 'none' | 'sm' | 'default' | 'lg'
  hover?: boolean
  interactive?: boolean
}

const cardVariants = {
  default: "bg-white border border-gray-200 rounded-lg shadow-sm",
  elevated: "bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow",
  bordered: "bg-white border-2 border-gray-200 rounded-lg",
  success: "bg-success-50 border border-success-200 rounded-lg",
  warning: "bg-warning-50 border border-warning-200 rounded-lg", 
  error: "bg-error-50 border border-error-200 rounded-lg"
}
```

#### Card Usage Patterns
```yaml
content_cards:
  content_library_item:
    variant: "elevated"
    padding: "default"
    hover: true
    interactive: true
    components:
      - "CardHeader with thumbnail and status badge"
      - "CardContent with title and metrics"
      - "CardFooter with action buttons"
      
  dashboard_metric:
    variant: "default"
    padding: "lg"
    components:
      - "Large metric value with trend indicator"
      - "Supporting context and comparison data"
      
  compliance_feedback:
    variant: "success | warning | error" # based on risk score
    padding: "default"
    components:
      - "Risk score display"
      - "Specific recommendations list"
      - "Action buttons for improvement"
```

### 3. Form Component System
```typescript
// Form components built on shadcn/ui Form primitives
interface FormFieldProps {
  label: string
  description?: string
  required?: boolean
  error?: string
  helpText?: string
}

interface TextInputProps extends FormFieldProps {
  type: 'text' | 'email' | 'tel' | 'password'
  placeholder?: string
  autoComplete?: string
  maxLength?: number
  pattern?: string
}

interface SelectProps extends FormFieldProps {
  options: Array<{value: string, label: string, disabled?: boolean}>
  placeholder?: string
  searchable?: boolean
  multiple?: boolean
}
```

#### Form Usage Examples
```yaml
advisor_registration_form:
  sebi_registration_field:
    component: "TextInput"
    label: "SEBI Registration Number"
    placeholder: "ARN-12345 or RIA-12345"
    required: true
    pattern: "^(ARN|RIA)-[0-9]+$"
    helpText: "Your SEBI registration number as it appears on your certificate"
    
  tier_selection:
    component: "RadioGroup"
    label: "Choose your subscription tier"
    options:
      - value: "basic", label: "Basic - ₹2,999/month"
      - value: "standard", label: "Standard - ₹5,999/month"  
      - value: "pro", label: "Pro - ₹11,999/month"
      
content_creation_form:
  topic_selection:
    component: "Select"
    label: "Content Topic"
    searchable: true
    options:
      - value: "market_update", label: "📈 Market Update"
      - value: "sip_education", label: "🎯 SIP Education"
      - value: "tax_planning", label: "💰 Tax Planning"
      
  language_selection:
    component: "CheckboxGroup"
    label: "Languages"
    options:
      - value: "en", label: "English", checked: true
      - value: "hi", label: "हिंदी (Hindi)"
      - value: "mr", label: "मराठी (Marathi)"
```

### 4. Data Display Components

#### Badge Component
```typescript
interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'error' | 'neutral'
  size: 'sm' | 'default' | 'lg'
  dot?: boolean
  pulse?: boolean
}

const badgeVariants = {
  success: "bg-success-100 text-success-800 border border-success-200",
  warning: "bg-warning-100 text-warning-800 border border-warning-200",
  error: "bg-error-100 text-error-800 border border-error-200",
  neutral: "bg-gray-100 text-gray-800 border border-gray-200"
}
```

#### Status Indicators
```yaml
content_status_badges:
  approved:
    variant: "success"
    text: "✅ Approved"
    dot: true
    
  pending:
    variant: "warning"  
    text: "⏳ Pending Review"
    pulse: true
    
  rejected:
    variant: "error"
    text: "❌ Rejected"
    
  scheduled:
    variant: "neutral"
    text: "📅 Scheduled"
    
delivery_status_badges:
  delivered:
    variant: "success"
    text: "✅ Delivered"
    
  failed:
    variant: "error"
    text: "❌ Failed"
    pulse: true
```

#### Progress Components
```typescript
interface ProgressProps {
  value: number // 0-100
  variant: 'default' | 'success' | 'warning' | 'error'
  size: 'sm' | 'default' | 'lg'
  showValue?: boolean
  animated?: boolean
}

interface CircularProgressProps extends ProgressProps {
  strokeWidth?: number
  radius?: number
}
```

### 5. Navigation Components

#### Sidebar Navigation
```typescript
interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  href: string
  badge?: string | number
  active?: boolean
  disabled?: boolean
}
```

#### Breadcrumb Navigation
```yaml
breadcrumb_examples:
  content_creation_flow:
    items:
      - text: "Dashboard", href: "/dashboard"
      - text: "Create Content", href: "/create"
      - text: "Topic Selection" # current page, no href
      
  admin_approval_queue:
    items:
      - text: "Admin", href: "/admin"
      - text: "Approval Queue", href: "/admin/queue"
      - text: "Review Content" # current page
```

#### Tab Navigation
```yaml
content_library_tabs:
  all_content:
    label: "All Content"
    count: 24
    
  drafts:
    label: "Drafts"  
    count: 3
    badge_variant: "warning"
    
  pending:
    label: "Pending"
    count: 2
    badge_variant: "warning"
    
  approved:
    label: "Approved"
    count: 15
    badge_variant: "success"
    
  sent:
    label: "Sent"
    count: 4
    badge_variant: "neutral"
```

### 6. Feedback Components

#### Alert Component
```typescript
interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error'
  title?: string
  description: string
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

const alertVariants = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-success-50 border-success-200 text-success-800", 
  warning: "bg-warning-50 border-warning-200 text-warning-800",
  error: "bg-error-50 border-error-200 text-error-800"
}
```

#### Toast Notifications
```yaml
toast_types:
  content_generated:
    variant: "success"
    title: "Content Generated!"
    description: "Your AI content is ready for review"
    duration: 4000
    
  approval_submitted:
    variant: "info"
    title: "Submitted for Approval"
    description: "You'll be notified when it's reviewed"
    duration: 5000
    
  delivery_failed:
    variant: "error"
    title: "Delivery Failed"  
    description: "We'll retry automatically"
    action:
      label: "View Details"
      onClick: "navigate_to_delivery_status"
    dismissible: true
```

#### Loading States
```typescript
interface SkeletonProps {
  variant: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  lines?: number // for text variant
}

interface SpinnerProps {
  size: 'sm' | 'default' | 'lg'
  variant: 'default' | 'primary'
}
```

## Specialized Components for Financial Advisory

### 1. Compliance Risk Meter
```typescript
interface ComplianceRiskMeterProps {
  score: number // 0-100
  showDetails?: boolean
  recommendations?: string[]
  size: 'sm' | 'default' | 'lg'
}

const riskLevels = {
  excellent: { range: [0, 25], color: 'success', label: 'Excellent' },
  good: { range: [26, 50], color: 'info', label: 'Good' },
  caution: { range: [51, 75], color: 'warning', label: 'Caution' },
  high_risk: { range: [76, 100], color: 'error', label: 'High Risk' }
}
```

### 2. Delivery Schedule Component
```typescript
interface DeliveryScheduleProps {
  scheduledTime: string // "06:00 IST"
  timeUntilDelivery?: number // minutes
  status: 'scheduled' | 'delivered' | 'failed'
  recipientCount?: number
}
```

### 3. Performance Metrics Cards
```yaml
advisor_dashboard_metrics:
  delivery_success_card:
    title: "This Week's Delivery"
    value: "5/5"
    trend: "+100%"
    trend_direction: "up"
    status_indicator: "success"
    
  read_rate_card:
    title: "Average Read Rate"
    value: "78%"
    trend: "+12%"
    trend_direction: "up" 
    comparison: "vs last week"
    
  compliance_score_card:
    title: "Compliance Score"
    value: "95/100"
    status: "Excellent"
    risk_meter: true
```

### 4. Content Preview Component
```typescript
interface ContentPreviewProps {
  content: {
    title: string
    body: string
    language: 'en' | 'hi' | 'mr'
  }
  platform: 'whatsapp' | 'status' | 'linkedin'
  branding?: {
    logo: string
    companyName: string
  }
  showSafeAreas?: boolean
}
```

### 5. Multi-language Toggle
```typescript
interface LanguageToggleProps {
  languages: Array<{
    code: 'en' | 'hi' | 'mr'
    label: string
    content: string
  }>
  activeLanguage: string
  onLanguageChange: (language: string) => void
}
```

## Layout Components

### 1. App Shell Structure
```typescript
interface AppShellProps {
  sidebar: React.ReactNode
  header: React.ReactNode
  children: React.ReactNode
  mobileSidebar?: React.ReactNode
}

const AppShell = ({ sidebar, header, children, mobileSidebar }) => (
  <div className="min-h-screen bg-gray-50">
    {/* Desktop Sidebar */}
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      {sidebar}
    </div>
    
    {/* Mobile Sidebar */}
    <div className="lg:hidden">
      {mobileSidebar}
    </div>
    
    {/* Main Content */}
    <div className="lg:pl-72">
      <div className="sticky top-0 z-40">
        {header}
      </div>
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  </div>
)
```

### 2. Page Layout Templates
```yaml
dashboard_layout:
  structure: "header + metrics_grid + quick_actions + activity_feed"
  grid: "responsive_3_column_mobile_1_column"
  spacing: "consistent_24px_gaps"
  
content_creation_layout:
  structure: "progress_header + step_content + navigation_footer"
  max_width: "800px_center_aligned"
  step_indicator: "visible_progress_with_labels"
  
admin_queue_layout:
  structure: "filters_bar + queue_list + review_panel"
  split: "70_30_desktop_full_width_mobile"
  sticky_elements: "filters_bar_review_panel_header"
```

## Responsive Design System

### Breakpoint Strategy
```yaml
breakpoints:
  sm: "640px"   # Mobile landscape
  md: "768px"   # Tablet portrait  
  lg: "1024px"  # Tablet landscape / Small desktop
  xl: "1280px"  # Desktop
  "2xl": "1536px" # Large desktop

responsive_patterns:
  navigation:
    mobile: "bottom_tab_bar_5_items"
    tablet: "side_drawer_collapsible"
    desktop: "persistent_sidebar_280px"
    
  content_grid:
    mobile: "single_column_full_width"
    tablet: "2_column_grid_equal_width"
    desktop: "3_column_grid_responsive"
    
  forms:
    mobile: "stacked_full_width_fields"
    tablet: "2_column_grouped_sections"
    desktop: "inline_labels_compact_layout"
```

### Mobile-First Component Adaptations
```yaml
mobile_optimizations:
  buttons:
    minimum_touch_target: "44px_height"
    mobile_spacing: "increased_16px_margins"
    loading_states: "reduced_animation_better_performance"
    
  cards:
    mobile_padding: "16px_vs_24px_desktop"
    touch_interactions: "tap_highlight_feedback"
    swipe_actions: "left_right_swipe_for_actions"
    
  forms:
    input_focus: "scroll_into_view_keyboard_avoidance"
    validation: "inline_immediate_feedback"
    progress: "step_indicators_compact"
```

This comprehensive component specification ensures consistent, accessible, and culturally appropriate UI elements throughout Project One's advisor and admin experiences while leveraging shadcn/ui's robust foundation.