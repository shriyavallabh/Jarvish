# Component APIs & Design System - Project One

## Overview

This document defines comprehensive component specifications with props, events, and accessibility features for Project One's financial advisor platform. Each component is designed for shadcn-ui compatibility while meeting financial services requirements and SEBI compliance needs.

## Component Architecture Principles

### Design System Foundation
```yaml
component_design_principles:
  atomic_design:
    atoms: "buttons, inputs, icons, typography"
    molecules: "form fields, cards, navigation items"
    organisms: "forms, dashboards, content editors"
    templates: "page layouts with content structure"
    pages: "specific implementations with real data"
    
  shadcn_compatibility:
    base_framework: "Radix UI primitives"
    styling: "Tailwind CSS with CSS variables"
    customization: "Theme-aware design tokens"
    composition: "Compound component patterns"
    
  financial_services_standards:
    trust_indicators: "Compliance scores, verification badges"
    data_protection: "Sensitive data masking and encryption"
    audit_trails: "User action logging and traceability"
    error_handling: "Graceful degradation with recovery options"
```

## Core Design Tokens Integration

### Color System
```typescript
// Referenced from design-tokens.ts
interface ColorTokens {
  // Brand colors
  primary: string;          // #2563EB - Trust blue
  secondary: string;        // #059669 - Success green
  accent: string;          // #DC2626 - Alert red
  
  // Semantic colors
  success: string;         // #10B981 - Approval, positive actions
  warning: string;         // #F59E0B - Caution, pending states
  error: string;          // #EF4444 - Errors, violations
  info: string;           // #3B82F6 - Information, neutral
  
  // Compliance-specific
  compliant: string;      // #059669 - SEBI compliant
  riskLow: string;        // #10B981 - Low risk content
  riskMedium: string;     // #F59E0B - Medium risk content
  riskHigh: string;       // #EF4444 - High risk content
  riskCritical: string;   // #DC2626 - Critical compliance issues
}
```

## 1. Core UI Components

### Button Component API
```typescript
interface ButtonProps {
  // Visual variants
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'compliance';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  
  // State management
  loading?: boolean;
  disabled?: boolean;
  
  // Content
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Interaction
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
  
  // Financial services specific
  complianceLevel?: 'safe' | 'caution' | 'warning' | 'blocked';
  auditAction?: string; // For audit trail logging
  confirmationRequired?: boolean;
  
  // Styling
  className?: string;
  fullWidth?: boolean;
}

// Usage Examples
<Button variant="primary" size="lg" loading={isSubmitting}>
  Submit for Approval
</Button>

<Button 
  variant="compliance" 
  complianceLevel="warning"
  confirmationRequired={true}
  auditAction="approve_high_risk_content"
>
  Approve with Risk
</Button>
```

### Input Component API
```typescript
interface InputProps {
  // Form integration
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  
  // Input configuration
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  
  // Validation
  error?: string;
  helperText?: string;
  success?: boolean;
  
  // Labeling
  label?: string;
  description?: string;
  
  // Financial services specific
  sensitiveData?: boolean; // Masks data in audit logs
  complianceValidation?: boolean; // Real-time compliance checking
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  className?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

// Usage Examples
<Input
  label="SEBI Registration Number"
  placeholder="INA123456789"
  complianceValidation={true}
  sensitiveData={true}
  error={validationError}
/>
```

### Card Component API
```typescript
interface CardProps {
  // Content
  children: React.ReactNode;
  title?: string;
  description?: string;
  
  // Visual variants
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive' | 'compliance';
  
  // Status indicators
  status?: 'default' | 'success' | 'warning' | 'error' | 'pending';
  complianceScore?: number; // 0-100 for compliance-related cards
  
  // Interaction
  onClick?: () => void;
  href?: string; // For navigation cards
  
  // Layout
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
  
  // Financial services specific
  sensitiveContent?: boolean; // Adds privacy indicators
  auditContext?: string; // Context for audit logging
}

// Usage Examples
<Card 
  variant="compliance" 
  status="warning"
  complianceScore={73}
  title="Content Review Required"
>
  <p>This content needs manual review before approval.</p>
</Card>
```

## 2. Financial Services Specific Components

### ComplianceIndicator Component
```typescript
interface ComplianceIndicatorProps {
  // Compliance data
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Status information
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  lastUpdated?: Date;
  
  // Display options
  variant?: 'full' | 'compact' | 'badge' | 'icon';
  showScore?: boolean;
  showDetails?: boolean;
  
  // Interaction
  onClick?: () => void;
  onDetailsRequest?: () => void;
  
  // Content
  details?: string[];
  recommendations?: string[];
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

// Events
interface ComplianceIndicatorEvents {
  onScoreUpdate: (newScore: number, details: ComplianceDetail[]) => void;
  onRiskLevelChange: (newLevel: string, reasons: string[]) => void;
  onDetailsExpand: (expanded: boolean) => void;
}

// Usage Examples
<ComplianceIndicator
  score={85}
  riskLevel="medium"
  status="under_review"
  variant="full"
  showDetails={true}
  onClick={handleComplianceClick}
/>
```

### ContentPreview Component
```typescript
interface ContentPreviewProps {
  // Content data
  content: {
    title: string;
    body: string;
    language: 'en' | 'hi' | 'mr';
    images?: string[];
    disclaimer?: string;
  };
  
  // Preview configuration
  platform: 'whatsapp' | 'linkedin' | 'status';
  variant?: 'mobile' | 'desktop' | 'compact';
  
  // Advisor branding
  advisorInfo?: {
    name: string;
    sebiRegNo: string;
    profileImage?: string;
    businessName?: string;
  };
  
  // Interaction
  onEdit?: () => void;
  onLanguageChange?: (language: string) => void;
  
  // Display options
  showBranding?: boolean;
  showCompliance?: boolean;
  realTimePreview?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

// Events
interface ContentPreviewEvents {
  onContentChange: (updatedContent: ContentData) => void;
  onPlatformSwitch: (platform: string) => void;
  onBrandingToggle: (enabled: boolean) => void;
}

// Usage Examples
<ContentPreview
  content={contentData}
  platform="whatsapp"
  advisorInfo={advisorProfile}
  showBranding={true}
  realTimePreview={true}
  onEdit={handleEditContent}
/>
```

### AIGenerationStudio Component
```typescript
interface AIGenerationStudioProps {
  // Generation configuration
  topic?: string;
  language: 'en' | 'hi' | 'mr';
  tone: 'professional' | 'friendly' | 'educational';
  length: 'short' | 'medium' | 'long';
  
  // AI settings
  model?: 'gpt-4' | 'gpt-4-mini';
  temperature?: number; // 0-1
  
  // Content constraints
  complianceLevel: 'strict' | 'moderate' | 'relaxed';
  includeBranding?: boolean;
  
  // State management
  loading?: boolean;
  error?: string;
  
  // Callbacks
  onGenerate: (params: GenerationParams) => Promise<GeneratedContent>;
  onContentUpdate: (content: string) => void;
  onParameterChange: (param: string, value: any) => void;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

// Events
interface AIGenerationStudioEvents {
  onGenerationStart: (parameters: GenerationParams) => void;
  onGenerationComplete: (content: GeneratedContent, metadata: AIMetadata) => void;
  onGenerationError: (error: Error, retryCount: number) => void;
  onParameterValidation: (param: string, isValid: boolean) => void;
}

// Usage Examples
<AIGenerationStudio
  topic="Market Volatility Guide"
  language="en"
  tone="professional"
  complianceLevel="strict"
  onGenerate={handleContentGeneration}
  onContentUpdate={handleContentChange}
/>
```

## 3. Data Display Components

### DataTable Component
```typescript
interface DataTableProps<T> {
  // Data
  data: T[];
  columns: ColumnDefinition<T>[];
  
  // Configuration
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  
  // Pagination
  pagination?: {
    pageSize: number;
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  
  // Loading states
  loading?: boolean;
  error?: string;
  
  // Row interaction
  onRowClick?: (item: T, index: number) => void;
  onRowSelect?: (selectedItems: T[]) => void;
  
  // Bulk operations
  bulkActions?: BulkAction<T>[];
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
  
  // Financial services specific
  sensitiveColumns?: string[]; // Columns with sensitive data
  auditLogging?: boolean;
}

interface ColumnDefinition<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sensitive?: boolean; // For audit logging
}

// Usage Examples
<DataTable
  data={contentList}
  columns={contentColumns}
  sortable={true}
  filterable={true}
  onRowClick={handleContentView}
  sensitiveColumns={['sebi_reg_no']}
  auditLogging={true}
/>
```

### AnalyticsChart Component
```typescript
interface AnalyticsChartProps {
  // Chart configuration
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: ChartDataPoint[];
  
  // Display options
  title?: string;
  description?: string;
  height?: number;
  responsive?: boolean;
  
  // Interaction
  interactive?: boolean;
  onDataPointClick?: (point: ChartDataPoint) => void;
  
  // Styling
  colorScheme?: 'default' | 'financial' | 'compliance';
  showLegend?: boolean;
  showGrid?: boolean;
  
  // Financial metrics
  comparisonData?: ChartDataPoint[]; // For peer comparison
  benchmark?: number; // Industry benchmark line
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
  altText?: string; // Screen reader description
}

interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

// Usage Examples
<AnalyticsChart
  type="line"
  data={engagementData}
  title="Weekly Engagement Trends"
  comparisonData={peerData}
  benchmark={75}
  colorScheme="financial"
  onDataPointClick={handlePointClick}
/>
```

## 4. Form Components

### FormField Component
```typescript
interface FormFieldProps {
  // Field configuration
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  
  // Validation
  required?: boolean;
  validation?: ValidationRule[];
  
  // Options (for select/radio)
  options?: SelectOption[];
  
  // Content
  placeholder?: string;
  helpText?: string;
  
  // State
  disabled?: boolean;
  loading?: boolean;
  
  // Financial services specific
  complianceValidation?: boolean;
  sensitiveData?: boolean;
  sebiRequired?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

interface ValidationRule {
  type: 'required' | 'email' | 'sebi_reg' | 'phone' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
}

// Usage Examples
<FormField
  name="sebi_registration"
  label="SEBI Registration Number"
  type="text"
  required={true}
  complianceValidation={true}
  sensitiveData={true}
  validation={[
    { type: 'required', message: 'SEBI registration is required' },
    { type: 'sebi_reg', message: 'Please enter a valid SEBI registration number' }
  ]}
/>
```

### MultiStepForm Component
```typescript
interface MultiStepFormProps {
  // Steps configuration
  steps: FormStep[];
  currentStep: number;
  
  // State management
  data: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
  onStepChange: (step: number) => void;
  
  // Navigation
  allowSkip?: boolean;
  showProgress?: boolean;
  
  // Submission
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitText?: string;
  
  // Validation
  validateOnStepChange?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldProps[];
  validation?: (data: any) => ValidationResult;
  skippable?: boolean;
}

// Usage Examples
<MultiStepForm
  steps={onboardingSteps}
  currentStep={currentStep}
  data={formData}
  showProgress={true}
  onDataChange={handleDataChange}
  onStepChange={handleStepChange}
  onSubmit={handleSubmission}
/>
```

## 5. Navigation Components

### NavigationMenu Component
```typescript
interface NavigationMenuProps {
  // Menu items
  items: NavigationItem[];
  
  // Current state
  activeItem?: string;
  
  // Configuration
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'pills' | 'underline' | 'sidebar';
  
  // Interaction
  onItemClick: (item: NavigationItem) => void;
  
  // Mobile specific
  collapsible?: boolean;
  mobileBreakpoint?: number;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
  
  // Financial services specific
  complianceIndicators?: boolean; // Show compliance status per section
  notificationCounts?: Record<string, number>;
}

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: NavigationItem[];
  
  // Financial services specific
  complianceRequired?: boolean;
  auditLevel?: 'low' | 'medium' | 'high';
}

// Usage Examples
<NavigationMenu
  items={advisorMenuItems}
  activeItem="dashboard"
  orientation="horizontal"
  variant="pills"
  complianceIndicators={true}
  onItemClick={handleNavigation}
/>
```

### Breadcrumb Component
```typescript
interface BreadcrumbProps {
  // Path items
  items: BreadcrumbItem[];
  
  // Configuration
  separator?: React.ReactNode;
  maxItems?: number;
  
  // Interaction
  onItemClick: (item: BreadcrumbItem) => void;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  disabled?: boolean;
}

// Usage Examples
<Breadcrumb
  items={breadcrumbItems}
  maxItems={4}
  onItemClick={handleBreadcrumbClick}
/>
```

## 6. Feedback Components

### Alert Component
```typescript
interface AlertProps {
  // Content
  title?: string;
  description: string;
  
  // Variant
  variant: 'info' | 'success' | 'warning' | 'error' | 'compliance';
  
  // Behavior
  dismissible?: boolean;
  autoHide?: boolean;
  duration?: number; // in milliseconds
  
  // Actions
  actions?: AlertAction[];
  onDismiss?: () => void;
  
  // Financial services specific
  complianceLevel?: 'info' | 'warning' | 'violation';
  sebiReference?: string; // Reference to SEBI regulation
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
  role?: 'alert' | 'alertdialog' | 'status';
}

interface AlertAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// Usage Examples
<Alert
  variant="compliance"
  title="SEBI Compliance Warning"
  description="This content mentions guaranteed returns without proper disclaimers."
  complianceLevel="violation"
  sebiReference="SEBI (Investment Advisers) Regulations, 2013"
  actions={[
    { label: "Auto Fix", action: handleAutoFix, variant: "primary" },
    { label: "Manual Edit", action: handleManualEdit }
  ]}
/>
```

### Toast Component
```typescript
interface ToastProps {
  // Content
  title?: string;
  description: string;
  
  // Variant
  variant: 'default' | 'success' | 'warning' | 'error' | 'loading';
  
  // Behavior
  duration?: number;
  persistent?: boolean;
  
  // Actions
  action?: ToastAction;
  onDismiss?: () => void;
  
  // Position
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

interface ToastAction {
  label: string;
  action: () => void;
}

// Usage Examples - via hook
const { toast } = useToast();

toast({
  title: "Content Approved",
  description: "Your market update has been approved and will be delivered at 6:00 AM.",
  variant: "success",
  duration: 5000
});
```

## 7. Modal and Dialog Components

### Modal Component
```typescript
interface ModalProps {
  // State
  open: boolean;
  onClose: () => void;
  
  // Content
  title?: string;
  description?: string;
  children: React.ReactNode;
  
  // Configuration
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  
  // Behavior
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  
  // Footer actions
  footer?: React.ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
  
  // Financial services specific
  complianceLevel?: 'standard' | 'sensitive' | 'confidential';
  auditContext?: string;
}

interface ModalAction {
  label: string;
  action: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
}

// Usage Examples
<Modal
  open={showApprovalModal}
  onClose={handleCloseModal}
  title="Content Approval Required"
  size="lg"
  complianceLevel="sensitive"
  primaryAction={{
    label: "Approve",
    action: handleApprove,
    loading: isApproving
  }}
  secondaryAction={{
    label: "Request Changes",
    action: handleRequestChanges
  }}
>
  <ContentReviewInterface content={selectedContent} />
</Modal>
```

### ConfirmationDialog Component
```typescript
interface ConfirmationDialogProps {
  // State
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  
  // Content
  title: string;
  description: string;
  
  // Variant
  variant: 'default' | 'destructive' | 'warning' | 'compliance';
  
  // Configuration
  confirmText?: string;
  cancelText?: string;
  
  // Behavior
  requiresTyping?: boolean; // User must type confirmation
  confirmationText?: string; // Text to type for confirmation
  
  // Loading state
  loading?: boolean;
  
  // Financial services specific
  auditAction?: string;
  complianceWarning?: string;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

// Usage Examples
<ConfirmationDialog
  open={showDeleteDialog}
  title="Delete Content Permanently"
  description="This action cannot be undone. The content and all its analytics will be permanently deleted."
  variant="destructive"
  requiresTyping={true}
  confirmationText="DELETE"
  auditAction="delete_content_permanent"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

## 8. Specialized Financial Components

### SEBIComplianceChecker Component
```typescript
interface SEBIComplianceCheckerProps {
  // Content to check
  content: string;
  
  // Configuration
  strictMode?: boolean;
  autoFix?: boolean;
  
  // Callbacks
  onComplianceCheck: (result: ComplianceResult) => void;
  onAutoFix?: (fixedContent: string, changes: ComplianceChange[]) => void;
  
  // Display
  showDetails?: boolean;
  realTime?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

interface ComplianceResult {
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: ComplianceViolation[];
  suggestions: ComplianceSuggestion[];
  approved: boolean;
}

interface ComplianceViolation {
  rule: string;
  severity: 'warning' | 'error' | 'critical';
  description: string;
  location?: { start: number; end: number };
  sebiReference?: string;
}

// Usage Examples
<SEBIComplianceChecker
  content={contentText}
  strictMode={true}
  autoFix={true}
  realTime={true}
  showDetails={true}
  onComplianceCheck={handleComplianceResult}
  onAutoFix={handleAutoFix}
/>
```

### AdvisorVerificationBadge Component
```typescript
interface AdvisorVerificationBadgeProps {
  // Advisor information
  advisorData: {
    name: string;
    sebiRegNo: string;
    type: 'RIA' | 'MFD';
    verificationStatus: 'verified' | 'pending' | 'expired' | 'suspended';
    verificationDate?: Date;
  };
  
  // Display options
  variant: 'full' | 'compact' | 'icon';
  showDetails?: boolean;
  
  // Interaction
  onClick?: () => void;
  onVerificationCheck?: () => void;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

// Usage Examples
<AdvisorVerificationBadge
  advisorData={advisorInfo}
  variant="full"
  showDetails={true}
  onVerificationCheck={handleVerificationCheck}
/>
```

### WhatsAppPreview Component
```typescript
interface WhatsAppPreviewProps {
  // Message content
  message: {
    text: string;
    image?: string;
    timestamp?: Date;
  };
  
  // Sender information
  sender: {
    name: string;
    profileImage?: string;
    businessBadge?: boolean;
  };
  
  // Display configuration
  variant: 'mobile' | 'desktop' | 'status';
  theme: 'light' | 'dark';
  
  // Interaction
  onImageClick?: () => void;
  onMessageClick?: () => void;
  
  // Status indicators
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read';
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

// Usage Examples
<WhatsAppPreview
  message={{
    text: contentText,
    image: generatedImage,
    timestamp: new Date()
  }}
  sender={{
    name: advisorName,
    businessBadge: true
  }}
  variant="mobile"
  theme="light"
  deliveryStatus="delivered"
/>
```

## 9. Component Composition Patterns

### ComplianceAwareForm Pattern
```typescript
// Higher-order component for compliance-aware forms
function withComplianceChecking<T>(WrappedComponent: React.ComponentType<T>) {
  return function ComplianceAwareComponent(props: T & ComplianceAwareProps) {
    const { complianceLevel, sensitiveFields, onComplianceChange, ...restProps } = props;
    
    // Compliance checking logic
    const [complianceState, setComplianceState] = useState<ComplianceState>();
    
    return (
      <div className="compliance-aware-form">
        {complianceLevel === 'high' && (
          <Alert variant="warning">
            This form contains sensitive financial information. Please ensure accuracy.
          </Alert>
        )}
        <WrappedComponent {...restProps} />
        {complianceState && (
          <ComplianceIndicator 
            score={complianceState.score}
            riskLevel={complianceState.riskLevel}
          />
        )}
      </div>
    );
  };
}

// Usage
const ComplianceAwareContentForm = withComplianceChecking(ContentCreationForm);
```

### AuditTrailProvider Pattern
```typescript
// Context provider for audit trail logging
interface AuditTrailContextValue {
  logAction: (action: string, details?: Record<string, any>) => void;
  getAuditTrail: () => AuditEntry[];
}

const AuditTrailContext = createContext<AuditTrailContextValue | null>(null);

export function AuditTrailProvider({ children }: { children: React.ReactNode }) {
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  
  const logAction = useCallback((action: string, details?: Record<string, any>) => {
    const entry: AuditEntry = {
      id: generateId(),
      timestamp: new Date(),
      action,
      details,
      userId: getCurrentUserId(),
      sessionId: getSessionId()
    };
    
    setAuditTrail(prev => [...prev, entry]);
    
    // Send to audit service
    auditService.logEntry(entry);
  }, []);
  
  return (
    <AuditTrailContext.Provider value={{ logAction, getAuditTrail: () => auditTrail }}>
      {children}
    </AuditTrailContext.Provider>
  );
}

// Hook for using audit trail
export function useAuditTrail() {
  const context = useContext(AuditTrailContext);
  if (!context) {
    throw new Error('useAuditTrail must be used within AuditTrailProvider');
  }
  return context;
}
```

## 10. Accessibility Implementation

### Screen Reader Support
```typescript
// Aria live region for dynamic content updates
interface LiveRegionProps {
  children: React.ReactNode;
  politeness: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

function LiveRegion({ children, politeness, atomic = false, relevant = 'all' }: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Usage for compliance updates
<LiveRegion politeness="assertive">
  {complianceScore && `Compliance score updated: ${complianceScore}/100`}
</LiveRegion>
```

### Keyboard Navigation
```typescript
// Hook for keyboard navigation
function useKeyboardNavigation(items: NavigationItem[], onSelect: (item: NavigationItem) => void) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(items.length - 1, prev + 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(items[focusedIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        setFocusedIndex(0);
        break;
    }
  }, [items, focusedIndex, onSelect]);
  
  return { focusedIndex, handleKeyDown };
}
```

## 11. Testing Utilities

### Component Testing Helpers
```typescript
// Testing utilities for financial components
export const financialTestUtils = {
  // Mock compliance data
  mockComplianceResult: (overrides?: Partial<ComplianceResult>): ComplianceResult => ({
    score: 85,
    riskLevel: 'medium',
    violations: [],
    suggestions: [],
    approved: true,
    ...overrides
  }),
  
  // Mock advisor data
  mockAdvisorData: (overrides?: Partial<AdvisorData>): AdvisorData => ({
    name: 'Test Advisor',
    sebiRegNo: 'INA123456789',
    type: 'RIA',
    verificationStatus: 'verified',
    tier: 'standard',
    ...overrides
  }),
  
  // Test compliance scenarios
  testComplianceScenarios: [
    {
      name: 'High risk content',
      content: 'Guaranteed returns with zero risk',
      expectedScore: 15,
      expectedViolations: ['guaranteed_returns', 'risk_disclaimer_missing']
    },
    {
      name: 'Compliant content',
      content: 'SIP investments help build wealth over time. Subject to market risks.',
      expectedScore: 95,
      expectedViolations: []
    }
  ]
};

// Test wrapper with required providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    theme?: Theme;
    auditTrail?: boolean;
    compliance?: boolean;
  }
) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={options?.theme || defaultTheme}>
      {options?.auditTrail && (
        <AuditTrailProvider>
          {options?.compliance ? (
            <ComplianceProvider>
              {children}
            </ComplianceProvider>
          ) : children}
        </AuditTrailProvider>
      )}
      {!options?.auditTrail && options?.compliance && (
        <ComplianceProvider>
          {children}
        </ComplianceProvider>
      )}
      {!options?.auditTrail && !options?.compliance && children}
    </ThemeProvider>
  );
  
  return render(ui, { wrapper: AllProviders, ...options });
}
```

This comprehensive component API specification provides the foundation for building a robust, accessible, and compliant financial advisor platform. Each component is designed to work seamlessly with shadcn-ui while meeting the specific requirements of SEBI compliance and financial services workflows.