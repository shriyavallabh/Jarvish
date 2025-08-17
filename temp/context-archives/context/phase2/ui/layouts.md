# Layout Specifications - Route Skeletons 📐

## Overview
Comprehensive layout specifications for Project One's Advisor and Admin portals, including responsive design patterns, component arrangements, and route-specific skeleton structures.

## Layout Architecture

### Base App Shell Structure
```typescript
// AppShell.tsx - Core layout wrapper
interface AppShellProps {
  userType: 'advisor' | 'admin'
  children: React.ReactNode
  currentRoute: string
}

const AppShell = ({ userType, children, currentRoute }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar 
        userType={userType} 
        currentRoute={currentRoute}
        className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72"
      />
      
      {/* Mobile Navigation */}
      <MobileNavigation 
        userType={userType}
        className="lg:hidden fixed bottom-0 inset-x-0 z-50"
      />
      
      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <Header 
          className="sticky top-0 z-40 bg-white border-b border-gray-200"
        />
        
        {/* Page Content */}
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

### Responsive Layout Grid System
```yaml
grid_system:
  breakpoints:
    sm: "640px"   # Mobile landscape
    md: "768px"   # Tablet portrait
    lg: "1024px"  # Desktop
    xl: "1280px"  # Large desktop
    "2xl": "1536px" # Extra large desktop
    
  container_widths:
    sm: "100%"
    md: "100%" 
    lg: "100%"
    xl: "1280px"
    "2xl": "1536px"
    
  grid_columns:
    mobile: "1 column (full width)"
    tablet: "2-3 columns responsive"
    desktop: "3-4 columns with sidebar"
    
  spacing_system:
    mobile: "16px margins, 12px gaps"
    tablet: "24px margins, 16px gaps"  
    desktop: "32px margins, 24px gaps"
```

## Advisor Portal Layouts

### 1. Dashboard Layout (`/dashboard`)
```typescript
// DashboardLayout.tsx
const DashboardLayout = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {advisor.name}! 👋
          </h1>
          <p className="text-gray-600">
            {advisor.tier} tier • {advisor.healthScore}/100 health score
          </p>
        </div>
        <NotificationBell />
      </div>
      
      {/* Today's Status Card */}
      <Card className="p-6 bg-gradient-to-r from-primary-50 to-blue-50">
        <TodayStatusWidget />
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard 
          title="Create Content"
          icon={<Plus />}
          href="/create"
          variant="primary"
        />
        <QuickActionCard 
          title="View Analytics" 
          icon={<BarChart3 />}
          href="/analytics"
        />
        <QuickActionCard 
          title="Content Library"
          icon={<Library />} 
          href="/library"
        />
        <QuickActionCard 
          title="Settings"
          icon={<Settings />}
          href="/settings"
        />
      </div>
      
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="This Week's Delivery"
          value="5/5"
          trend="+100%"
          status="success"
        />
        <MetricCard 
          title="Average Read Rate" 
          value="78%"
          trend="+12%"
          comparison="vs last week"
        />
        <MetricCard 
          title="Compliance Score"
          value="95/100"
          status="Excellent"
          showRiskMeter={true}
        />
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Weekly Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyInsightsSummary />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### 2. Content Creation Layout (`/create`)
```typescript
// ContentCreationLayout.tsx
const ContentCreationLayout = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <Breadcrumb>
          <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
          <BreadcrumbItem>Create Content</BreadcrumbItem>
        </Breadcrumb>
        
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Tomorrow's Content
          </h1>
          <StepProgress 
            currentStep={currentStep}
            steps={[
              "Topic Selection",
              "AI Generation", 
              "Edit & Preview",
              "Compliance Review",
              "Submit"
            ]}
          />
        </div>
      </div>
      
      {/* Main Creation Flow */}
      <Card className="p-8">
        <div className="min-h-[500px]">
          {/* Dynamic step content */}
          {currentStep === 1 && <TopicSelection />}
          {currentStep === 2 && <AIGeneration />}
          {currentStep === 3 && <EditAndPreview />}
          {currentStep === 4 && <ComplianceReview />}
          {currentStep === 5 && <SubmissionConfirmation />}
        </div>
        
        {/* Navigation Footer */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button 
            variant="ghost" 
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
          >
            ← Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep} of 5
          </div>
          
          <Button 
            onClick={handleNextStep}
            disabled={!canProceed}
          >
            {currentStep === 5 ? "Submit for Approval" : "Next →"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

### 3. Content Library Layout (`/library`)
```typescript
// ContentLibraryLayout.tsx  
const ContentLibraryLayout = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600">Manage your content creation history</p>
        </div>
        
        <div className="flex items-center gap-3">
          <SearchInput placeholder="Search content..." />
          <SortDropdown />
          <Button href="/create">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="all">All Content (24)</TabsTrigger>
          <TabsTrigger value="drafts">Drafts (3)</TabsTrigger>
          <TabsTrigger value="pending">Pending (2)</TabsTrigger>
          <TabsTrigger value="approved">Approved (15)</TabsTrigger>
          <TabsTrigger value="sent">Sent (4)</TabsTrigger>
        </TabsList>
        
        {/* Content Grid */}
        <div className="mt-6">
          <TabsContent value="all">
            <ContentGrid contents={allContent} />
          </TabsContent>
          <TabsContent value="drafts">
            <ContentGrid contents={drafts} />
          </TabsContent>
          {/* Additional tab content... */}
        </div>
      </Tabs>
      
      {/* Bulk Actions Bar - appears when items selected */}
      <BulkActionsBar 
        selectedCount={selectedItems.length}
        onArchive={handleBulkArchive}
        onDuplicate={handleBulkDuplicate}
        onDelete={handleBulkDelete}
      />
    </div>
  )
}
```

### 4. Analytics Dashboard Layout (`/analytics`)
```typescript
// AnalyticsLayout.tsx
const AnalyticsLayout = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600">Track your content performance and engagement</p>
        </div>
        
        <div className="flex items-center gap-3">
          <DateRangePicker />
          <ExportButton />
        </div>
      </div>
      
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="This Week's Delivery"
          value="5/5"
          trend="Perfect streak!"
          icon={<CheckCircle />}
          variant="success"
        />
        <MetricCard 
          title="Average Read Rate"
          value="78%"
          trend="↑12% vs last week"
          icon={<Eye />}
        />
        <MetricCard 
          title="Compliance Score"
          value="95/100" 
          status="Excellent"
          icon={<Shield />}
          variant="success"
        />
        <MetricCard 
          title="Client Engagement"
          value="High"
          trend="Above platform average"
          icon={<TrendingUp />}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Performance</CardTitle>
            <CardDescription>7-day delivery success tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryPerformanceChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Content Effectiveness</CardTitle>
            <CardDescription>Performance by content type</CardDescription>
          </CardHeader>
          <CardContent>
            <ContentEffectivenessChart />
          </CardContent>
        </Card>
      </div>
      
      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Insights</CardTitle>
          <CardDescription>Personalized recommendations for improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyInsightsDisplay />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 5. Settings Layout (`/settings`)
```typescript
// SettingsLayout.tsx
const SettingsLayout = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            <SettingsNavItem href="/settings" active={section === 'profile'}>
              <User className="w-4 h-4" />
              Profile & Branding
            </SettingsNavItem>
            <SettingsNavItem href="/settings/whatsapp" active={section === 'whatsapp'}>
              <MessageSquare className="w-4 h-4" />
              WhatsApp Integration
            </SettingsNavItem>
            <SettingsNavItem href="/settings/delivery" active={section === 'delivery'}>
              <Clock className="w-4 h-4" />
              Delivery Preferences
            </SettingsNavItem>
            <SettingsNavItem href="/settings/billing" active={section === 'billing'}>
              <CreditCard className="w-4 h-4" />
              Subscription & Billing
            </SettingsNavItem>
            <SettingsNavItem href="/settings/notifications" active={section === 'notifications'}>
              <Bell className="w-4 h-4" />
              Notifications
            </SettingsNavItem>
          </nav>
        </div>
        
        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{getSectionTitle(section)}</CardTitle>
              <CardDescription>{getSectionDescription(section)}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Dynamic settings content based on section */}
              {section === 'profile' && <ProfileSettings />}
              {section === 'whatsapp' && <WhatsAppSettings />}
              {section === 'delivery' && <DeliverySettings />}
              {section === 'billing' && <BillingSettings />}
              {section === 'notifications' && <NotificationSettings />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

## Admin Portal Layouts

### 1. Approval Queue Layout (`/admin/queue`)
```typescript
// AdminQueueLayout.tsx
const AdminQueueLayout = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Queue Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Approval Queue</h1>
            <p className="text-gray-600">
              {queueStats.pending} items pending • 
              Average review time: {queueStats.avgReviewTime} minutes
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={queueStats.pending > 50 ? 'error' : 'default'}>
              {queueStats.pending} pending
            </Badge>
            <BatchActionsDropdown />
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <QueueFilters />
          <SortByDropdown />
          <SearchInput placeholder="Search content or advisor..." />
        </div>
      </div>
      
      {/* Main Queue Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Queue List */}
        <div className="w-2/3 overflow-auto border-r">
          <QueueItemList 
            items={queueItems}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
          />
        </div>
        
        {/* Review Panel */}
        <div className="w-1/3 flex flex-col">
          {selectedItem ? (
            <ReviewPanel 
              content={selectedItem}
              onApprove={handleApprove}
              onReject={handleReject}
              onEscalate={handleEscalate}
            />
          ) : (
            <EmptyReviewPanel />
          )}
        </div>
      </div>
    </div>
  )
}
```

### 2. Compliance Dashboard Layout (`/admin/compliance`)
```typescript
// ComplianceDashboardLayout.tsx
const ComplianceDashboardLayout = () => {
  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600">Real-time platform compliance monitoring</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="ghost">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      {/* Alert Banner */}
      {complianceAlerts.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Compliance Alerts ({complianceAlerts.length})</AlertTitle>
          <AlertDescription>
            {complianceAlerts[0].message}
            {complianceAlerts.length > 1 && ` and ${complianceAlerts.length - 1} more`}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Zero Violations"
          value="30 days"
          status="success"
          icon={<ShieldCheck />}
        />
        <MetricCard 
          title="Average Risk Score"
          value="23/100"
          status="excellent"
          trend="↓5 points this week"
        />
        <MetricCard 
          title="High-Risk Content"
          value="2.3%"
          trend="↓0.5% vs last week"
          status="good"
        />
        <MetricCard 
          title="Review SLA"
          value="98.5%"
          status="success"
          description="Within 4 hours"
        />
      </div>
      
      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Advisor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvisorComplianceHeatmap />
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ComplianceActivityLog />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. Advisor Management Layout (`/admin/advisors`)
```typescript
// AdvisorManagementLayout.tsx
const AdvisorManagementLayout = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advisor Management</h1>
          <p className="text-gray-600">{advisorStats.total} total advisors • {advisorStats.pending} pending approval</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportAdvisorData />
          <InviteAdvisorButton />
        </div>
      </div>
      
      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Advisors"
          value={advisorStats.active}
          icon={<Users />}
          trend="+12 this month"
        />
        <StatCard 
          title="Pending Approval"
          value={advisorStats.pending}
          variant="warning"
          icon={<Clock />}
        />
        <StatCard 
          title="Health Score Avg"
          value={`${advisorStats.avgHealthScore}/100`}
          icon={<Activity />}
          status="good"
        />
        <StatCard 
          title="Monthly Churn"
          value={`${advisorStats.churnRate}%`}
          icon={<TrendingDown />}
          trend="↓0.5% vs last month"
        />
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Advisor Directory</CardTitle>
            <div className="flex items-center gap-3">
              <SearchInput placeholder="Search advisors..." />
              <FilterDropdown />
              <ViewToggle /> {/* List vs Grid view */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdvisorDataTable 
            advisors={advisors}
            onStatusChange={handleStatusChange}
            onHealthScoreClick={handleHealthScoreDetails}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

## Mobile Layout Adaptations

### Mobile Navigation Pattern
```typescript
// MobileNavigation.tsx
const MobileNavigation = ({ userType }) => {
  const advisorNavItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Create', icon: Plus, href: '/create' },
    { label: 'Library', icon: Library, href: '/library' },
    { label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { label: 'Profile', icon: User, href: '/settings' }
  ]
  
  const adminNavItems = [
    { label: 'Queue', icon: List, href: '/admin/queue' },
    { label: 'Compliance', icon: Shield, href: '/admin/compliance' },
    { label: 'Advisors', icon: Users, href: '/admin/advisors' },
    { label: 'Reports', icon: FileText, href: '/admin/reports' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' }
  ]
  
  const navItems = userType === 'advisor' ? advisorNavItems : adminNavItems
  
  return (
    <nav className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className="flex flex-col items-center py-2 px-3 rounded-md text-xs"
          >
            <item.icon className="w-5 h-5 mb-1" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

### Responsive Layout Patterns
```yaml
mobile_adaptations:
  content_creation:
    layout: "single_column_full_width"
    navigation: "step_progress_horizontal_scroll"
    preview: "full_screen_modal_overlay"
    
  content_library:
    layout: "card_stack_infinite_scroll"
    filters: "bottom_sheet_modal"
    actions: "swipe_gestures_left_right"
    
  admin_queue:
    layout: "full_screen_list_detail_drill_down"
    queue_list: "full_screen_with_floating_filters"
    review_panel: "slide_up_modal_overlay"
    
  analytics:
    layout: "stacked_cards_vertical_scroll"
    charts: "horizontally_scrollable_tabs"
    metrics: "2x2_grid_compact"
```

## Loading & Error State Layouts

### Loading Skeletons
```typescript
// Skeleton layouts for each major page type
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-64" /> {/* Page title */}
    <Skeleton className="h-32 w-full" /> {/* Status card */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  </div>
)

const ContentLibrarySkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  </div>
)
```

### Error State Layouts
```yaml
error_layouts:
  network_error:
    layout: "centered_error_card_with_retry"
    illustration: "disconnected_icon_or_image"
    actions: "retry_button_contact_support_link"
    
  not_found:
    layout: "centered_404_with_navigation_back"
    content: "helpful_message_suggested_actions"
    
  permission_denied:
    layout: "centered_access_denied_message"
    actions: "contact_admin_login_different_account"
    
  maintenance_mode:
    layout: "full_screen_maintenance_banner"
    content: "estimated_downtime_status_page_link"
```

This comprehensive layout specification ensures consistent, responsive, and user-friendly page structures across all of Project One's advisor and admin interfaces.