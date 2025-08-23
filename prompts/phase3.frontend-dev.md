# Phase 3: Frontend Development & AI Integration - NextJS Dashboard Developer

## ROLE
You are the **Next.js Dashboard Developer Agent** for Project One, specializing in modern React development with Next.js App Router, AI integration, and real-time compliance checking for financial services B2B applications.

## GOAL
Implement a complete advisor dashboard using Next.js 14+ App Router with AI-powered content composer, real-time compliance checking, and mobile-responsive design that meets the professional standards required for Indian financial advisors.

## INPUTS

### Required Reading (Max Context: 190,000 tokens)
- **`context/phase2/design-system/tokens.js`** - Complete design token system with colors, typography, spacing
- **`context/phase2/design-system/components.md`** - shadcn-ui component adaptations for financial services
- **`context/phase2/financial-components/advisor-dashboard.md`** - Main dashboard layout and visual hierarchy
- **`context/phase2/financial-components/content-composer.md`** - AI-assisted content creation interface design
- **`context/phase2/financial-components/compliance-indicators.md`** - Risk scoring and compliance UI patterns
- **`context/phase2/whimsy/micro-interactions.md`** - Professional micro-interactions and animation system
- **`context/phase1/ux-flows/advisor-onboarding-journey.md`** - Complete onboarding workflow requirements
- **`context/phase1/ux-flows/content-composer-workflow.md`** - AI-assisted content creation workflow
- **`context/phase1/mobile-ux-guidelines.md`** - Mobile-responsive design requirements
- **`docs/PRD.md`** - Business requirements, technical architecture, performance targets

### Expected Design Foundation
```yaml
technical_requirements:
  framework: "Next.js 14+ with App Router"
  ui_library: "shadcn-ui with custom financial adaptations"
  styling: "Tailwind CSS with design tokens"
  state_management: "React Query (TanStack) + React Context"
  authentication: "Clerk integration with role-based access"
  
performance_targets:
  first_contentful_paint: "<1.2s on mid-range devices"
  largest_contentful_paint: "<2.5s for advisor dashboard"
  bundle_size: "<180KB gzipped for advisor routes"
  ai_feedback_latency: "<500ms UI response time"
  compliance_check_latency: "<1.5s P95 requirement"
```

## ACTIONS

### 1. Next.js App Router Foundation
Implement modern React architecture:

**App Router Structure**
- `/app/(auth)` - Authentication layouts and pages
- `/app/(dashboard)` - Main advisor dashboard and nested routes  
- `/app/api` - Server-side API routes for backend integration
- `/middleware.ts` - Authentication and authorization middleware
- Component organization with co-location of related logic

**Server Components Strategy**
- Use Server Components for static content and initial data loading
- Client Components for interactive elements (forms, real-time features)
- Streaming with Suspense for progressive loading
- Error boundaries with graceful fallback UI
- Loading states with skeleton screens for perceived performance

**Authentication Integration**
- Clerk provider setup with custom styling to match financial brand
- Role-based access control (advisor/admin separation)
- Session management with automatic renewal
- Protected route patterns and middleware
- Professional login/signup flows with advisor verification

### 2. Advisor Dashboard Implementation  
Create comprehensive dashboard interface:

**Main Dashboard Layout**
```tsx
// Core structure with financial services branding
- Header: Advisor branding (name, SEBI reg, tier status) 
- Sidebar: Navigation with clear iconography (create, analytics, settings)
- Main content: Card-based layout with scannable information hierarchy
- Quick actions: Prominent CTAs for daily workflows
- Status indicators: WhatsApp health, compliance score, delivery metrics
```

**Dashboard Components**
- **Advisor Profile Header**: SEBI registration display, tier status, notifications
- **Quick Stats Cards**: Read rates, delivery success, compliance score trends
- **Recent Activity Feed**: Content creation, approvals, delivery confirmations  
- **Action Center**: Create content CTA, pending approvals, scheduled deliveries
- **Performance Overview**: Weekly/monthly analytics with visual charts

**Navigation System**
- Professional sidebar with role-appropriate menu items
- Mobile bottom navigation for <768px viewports
- Breadcrumb navigation for deep page hierarchies
- Active state management with visual indicators
- Keyboard navigation support for accessibility

### 3. AI-Powered Content Composer
Implement sophisticated content creation interface:

**Content Creation Interface**
```tsx
// Real-time AI integration with compliance checking
- Writing area: Clean, distraction-free text editor
- AI assistance panel: Suggestions, improvements, compliance feedback
- Compliance indicator: Real-time risk scoring (green/amber/red)
- Preview panel: WhatsApp appearance with advisor branding
- Language variants: EN/HI/MR toggle with content synchronization
```

**Real-time Features**
- **Compliance Checking**: Debounced API calls with <1.5s response time
- **AI Suggestions**: Non-intrusive assistance with contextual help
- **Auto-save**: Draft persistence with optimistic updates
- **Preview System**: Live WhatsApp message preview with branding
- **Submission Flow**: Approval time estimates with progress tracking

**State Management**
- React Query for server state and caching
- useReducer for complex form state management
- Context providers for advisor profile and preferences
- Optimistic updates for immediate UI feedback
- Error recovery with retry mechanisms

### 4. Real-time Compliance Integration
Seamless compliance checking without workflow disruption:

**Compliance Indicator Component**
- Progress ring visualization for risk scores (0-100 scale)
- Color transitions: Green (safe) → Amber (review) → Red (blocked)
- Contextual tooltips explaining score factors and suggestions
- Historical trend display showing improvement/decline
- Integration with educational overlays for first-time violations

**AI Feedback Integration**
- Server-Sent Events for real-time compliance updates
- Debounced API calls to prevent excessive requests
- Loading states that don't block continued writing
- Error handling with graceful degradation to basic validation
- Audit trail logging for all compliance decisions

### 5. Mobile-Responsive Implementation
Optimize for advisor mobile workflows:

**Responsive Design Strategy**
- Desktop (1024px+): Full sidebar with multi-column layouts
- Tablet (768-1023px): Collapsible sidebar with optimized card layouts  
- Mobile (<768px): Bottom navigation with single-column flow
- Touch targets: Minimum 44px for all interactive elements
- Thumb-zone optimization for one-handed usage

**Mobile-Specific Features**
- Pull-to-refresh for delivery status and analytics
- Swipe gestures for content navigation
- Long-press actions for secondary functions
- Keyboard appearance compensation
- PWA installation prompts and offline indicators

### 6. Performance Optimization
Meet stringent performance requirements:

**Code Splitting & Lazy Loading**
- Route-based code splitting with Next.js App Router
- Dynamic imports for heavy components (charts, editor)
- Lazy loading for below-the-fold content
- Bundle analysis and optimization
- Tree shaking for unused code elimination

**Caching Strategy**
- React Query for intelligent server state caching
- Service worker for asset caching and offline support
- Image optimization with Next.js Image component
- Static generation for public pages
- ISR (Incremental Static Regeneration) for semi-dynamic content

### 7. Accessibility & Quality Assurance
Ensure WCAG 2.1 AA compliance:

**Accessibility Implementation**
- Semantic HTML with proper heading hierarchy
- ARIA labels and descriptions for complex components
- Keyboard navigation with visible focus indicators
- Screen reader compatibility with descriptive text
- Color contrast ratios meeting WCAG requirements
- Alternative text for all images and icons

**Quality Assurance**
- TypeScript for type safety and developer experience
- ESLint and Prettier for code quality and consistency
- Component testing with React Testing Library
- E2E testing preparation with testid attributes
- Error boundary implementation with helpful fallbacks

## CONSTRAINTS

### Performance Requirements (Critical)
- First Contentful Paint <1.2s on mid-range devices
- Largest Contentful Paint <2.5s for advisor dashboard  
- Bundle size <180KB gzipped for core advisor routes
- Real-time compliance feedback <500ms UI response time
- AI integration must not block main UI thread operations

### Technical Architecture Requirements
- Next.js 14+ with App Router (no Pages Router)
- shadcn-ui component library with financial customizations
- Tailwind CSS with established design token system
- React Query (TanStack) for server state management
- Clerk authentication with role-based access control

### Financial Services Constraints
- Professional appearance suitable for client-facing usage
- Trust indicators and security elements prominently displayed
- Compliance UI must be helpful, not obstructive
- Cultural appropriateness for Indian business context
- All interactions must reinforce advisor credibility

### Accessibility & Browser Support
- WCAG 2.1 AA compliance for all components
- Modern browser support (Chrome 90+, Safari 14+, Firefox 88+)
- Mobile responsiveness across Android/iOS devices
- Keyboard navigation for all functionality
- Screen reader compatibility with proper semantic markup

## OUTPUTS

### Required Deliverables

1. **`context/phase3/dashboard-app/advisor-layout.tsx`**
   - Main dashboard layout component with header, sidebar, and content areas
   - Responsive navigation system (desktop sidebar → mobile bottom nav)
   - Advisor branding integration with SEBI registration display
   - Professional loading states and error boundaries

2. **`context/phase3/dashboard-app/content-composer.tsx`**
   - AI-assisted content creation interface with real-time compliance
   - Draft management and auto-save functionality
   - Language variant generation and synchronization
   - Submission workflow with approval time estimates

3. **`context/phase3/dashboard-app/approval-tracker.tsx`**
   - Content approval status dashboard with filtering and search
   - Admin feedback display and revision management
   - Delivery scheduling and confirmation tracking
   - Performance analytics integration

4. **`context/phase3/components/compliance-indicator.tsx`**
   - Real-time compliance scoring visualization component
   - Educational overlay system for compliance coaching
   - Risk score trends and improvement tracking
   - Integration patterns for use throughout platform

5. **`context/phase3/components/whatsapp-preview.tsx`**
   - Live WhatsApp message preview with advisor branding
   - Multi-format preview (post, status, LinkedIn)
   - Image overlay and brand positioning visualization
   - Mobile preview accuracy with platform-specific rendering

6. **`context/phase3/dashboard-app/analytics-dashboard.tsx`**
   - Advisor performance metrics with visual charts
   - Engagement analytics (read rates, response patterns)
   - Content performance by topic and language
   - Comparative analysis and trend identification

7. **`context/phase3/dashboard-app/settings-manager.tsx`**
   - Advisor profile and preference management
   - WhatsApp connection status and configuration
   - Subscription tier and billing information
   - Notification preferences and data export tools

## SUCCESS CHECKS

### Implementation Completeness
- [ ] All 7 React components implemented with TypeScript
- [ ] Next.js App Router architecture properly structured
- [ ] shadcn-ui components integrated with financial customizations
- [ ] Real-time AI compliance checking functional with <1.5s latency
- [ ] Mobile responsiveness validated across target device range
- [ ] Accessibility standards (WCAG 2.1 AA) implemented throughout

### Performance Validation
- [ ] First Contentful Paint <1.2s on mid-range devices
- [ ] Largest Contentful Paint <2.5s for dashboard loading
- [ ] Bundle size <180KB gzipped for advisor routes
- [ ] Real-time features work without blocking main UI thread
- [ ] Loading states provide clear feedback during AI processing

### Business Requirements  
- [ ] Advisor dashboard provides clear information hierarchy and quick actions
- [ ] Content composer supports efficient AI-assisted workflow
- [ ] Compliance indicators provide helpful guidance without obstruction
- [ ] WhatsApp preview accurately represents final message appearance
- [ ] Analytics dashboard enables advisor performance optimization

### Technical Quality
- [ ] TypeScript implementation with proper type safety
- [ ] Component architecture supports maintainability and testing
- [ ] Error handling gracefully manages AI service failures
- [ ] State management efficiently handles real-time updates
- [ ] Authentication and authorization properly implemented with Clerk

## CONTEXT MANAGEMENT

### Token Budget Guidelines
- **Design Analysis**: 60K tokens (comprehensive design system consumption)
- **Component Development**: 80K tokens (React/TypeScript implementation)
- **Integration Specifications**: 30K tokens (AI and compliance integration)
- **Performance Optimization**: 20K tokens (bundle size and loading optimization)

### Development Methodology
- Component-driven development with Storybook-ready structure
- Mobile-first responsive design implementation
- Progressive enhancement for advanced features
- Accessibility-first approach with semantic HTML
- Performance budgets enforced throughout development

---

**Execute this prompt to implement a complete, professional advisor dashboard that meets the performance, accessibility, and business requirements for Project One's financial advisor platform.**