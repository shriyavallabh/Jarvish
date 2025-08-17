/**
 * Jarvish Component Specifications
 * shadcn-ui Component Customizations for Financial Services
 * 
 * This file provides implementation-ready component specifications
 * that integrate with the premium theme system.
 */

// ============================================
// BUTTON COMPONENT SPECIFICATIONS
// ============================================

export const buttonVariants = {
  // Primary Button - Main CTA actions
  primary: `
    bg-[var(--color-primary)]
    text-[var(--color-background)]
    hover:opacity-90
    active:scale-[0.98]
    shadow-[var(--shadow-md)]
    hover:shadow-[var(--shadow-lg)]
    px-6 py-3
    rounded-[var(--radius-md)]
    font-semibold
    transition-all duration-[var(--transition-base)]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[var(--color-accent)]
    focus-visible:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
  `,

  // Secondary Button - Supporting actions
  secondary: `
    bg-[var(--color-surface)]
    text-[var(--color-primary)]
    border border-[var(--color-border)]
    hover:bg-[var(--color-border)]
    active:scale-[0.98]
    px-6 py-3
    rounded-[var(--radius-md)]
    font-medium
    transition-all duration-[var(--transition-base)]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[var(--color-accent)]
    focus-visible:ring-offset-2
  `,

  // Accent Button - Gold premium actions
  accent: `
    bg-[var(--color-accent)]
    text-[var(--color-primary)]
    hover:opacity-90
    active:scale-[0.98]
    shadow-[var(--shadow-md)]
    hover:shadow-[var(--shadow-lg)]
    px-6 py-3
    rounded-[var(--radius-md)]
    font-semibold
    transition-all duration-[var(--transition-base)]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[var(--color-accent)]
    focus-visible:ring-offset-2
  `,

  // Ghost Button - Minimal actions
  ghost: `
    text-[var(--color-secondary)]
    hover:text-[var(--color-primary)]
    hover:bg-[var(--color-surface)]
    active:scale-[0.98]
    px-4 py-2
    rounded-[var(--radius-md)]
    font-medium
    transition-all duration-[var(--transition-fast)]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[var(--color-accent)]
    focus-visible:ring-offset-2
  `,

  // Success Button - Positive actions
  success: `
    bg-[var(--color-success)]
    text-white
    hover:opacity-90
    active:scale-[0.98]
    shadow-[var(--shadow-sm)]
    hover:shadow-[var(--shadow-md)]
    px-6 py-3
    rounded-[var(--radius-md)]
    font-semibold
    transition-all duration-[var(--transition-base)]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[var(--color-success)]
    focus-visible:ring-offset-2
  `,

  // Danger Button - Destructive actions
  danger: `
    bg-[var(--color-error)]
    text-white
    hover:opacity-90
    active:scale-[0.98]
    shadow-[var(--shadow-sm)]
    hover:shadow-[var(--shadow-md)]
    px-6 py-3
    rounded-[var(--radius-md)]
    font-semibold
    transition-all duration-[var(--transition-base)]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[var(--color-error)]
    focus-visible:ring-offset-2
  `,
};

// Button Size Variants
export const buttonSizes = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
};

// ============================================
// CARD COMPONENT SPECIFICATIONS
// ============================================

export const cardVariants = {
  // Default Card
  default: `
    bg-[var(--color-background)]
    border border-[var(--color-border)]
    rounded-[var(--radius-lg)]
    p-6
    shadow-[var(--shadow-sm)]
    hover:shadow-[var(--shadow-md)]
    transition-shadow duration-[var(--transition-base)]
  `,

  // Elevated Card
  elevated: `
    bg-[var(--color-surface)]
    rounded-[var(--radius-lg)]
    p-6
    shadow-[var(--shadow-md)]
    hover:shadow-[var(--shadow-lg)]
    transition-shadow duration-[var(--transition-base)]
  `,

  // Interactive Card
  interactive: `
    bg-[var(--color-background)]
    border border-[var(--color-border)]
    rounded-[var(--radius-lg)]
    p-6
    shadow-[var(--shadow-sm)]
    hover:shadow-[var(--shadow-md)]
    hover:border-[var(--color-accent)]
    cursor-pointer
    transition-all duration-[var(--transition-base)]
  `,

  // Premium Card (with gold accent)
  premium: `
    bg-[var(--color-background)]
    border-2 border-[var(--color-accent)]
    rounded-[var(--radius-lg)]
    p-8
    shadow-[var(--shadow-md)]
    relative
    overflow-hidden
    before:content-['']
    before:absolute
    before:top-0
    before:left-0
    before:right-0
    before:h-1
    before:bg-gradient-to-r
    before:from-[var(--color-accent)]
    before:to-[var(--color-accent-light)]
  `,

  // Glass Card (for modern themes)
  glass: `
    bg-[var(--glass-bg)]
    backdrop-blur-[var(--backdrop-blur)]
    border border-[var(--glass-border)]
    rounded-[var(--radius-xl)]
    p-6
    shadow-[var(--shadow-lg)]
  `,
};

// ============================================
// FORM COMPONENT SPECIFICATIONS
// ============================================

export const formComponents = {
  // Input Field
  input: `
    w-full
    px-4 py-3
    bg-[var(--color-background)]
    text-[var(--color-primary)]
    border border-[var(--color-border)]
    rounded-[var(--radius-md)]
    font-[var(--font-body)]
    text-[var(--text-body)]
    placeholder:text-[var(--color-secondary)]
    transition-all duration-[var(--transition-fast)]
    focus:outline-none
    focus:border-[var(--color-accent)]
    focus:ring-2
    focus:ring-[var(--color-accent)]
    focus:ring-opacity-20
    disabled:opacity-50
    disabled:cursor-not-allowed
  `,

  // Textarea
  textarea: `
    w-full
    px-4 py-3
    bg-[var(--color-background)]
    text-[var(--color-primary)]
    border border-[var(--color-border)]
    rounded-[var(--radius-md)]
    font-[var(--font-body)]
    text-[var(--text-body)]
    placeholder:text-[var(--color-secondary)]
    resize-y
    min-h-[120px]
    transition-all duration-[var(--transition-fast)]
    focus:outline-none
    focus:border-[var(--color-accent)]
    focus:ring-2
    focus:ring-[var(--color-accent)]
    focus:ring-opacity-20
  `,

  // Select Dropdown
  select: `
    w-full
    px-4 py-3
    bg-[var(--color-background)]
    text-[var(--color-primary)]
    border border-[var(--color-border)]
    rounded-[var(--radius-md)]
    font-[var(--font-body)]
    text-[var(--text-body)]
    cursor-pointer
    transition-all duration-[var(--transition-fast)]
    focus:outline-none
    focus:border-[var(--color-accent)]
    focus:ring-2
    focus:ring-[var(--color-accent)]
    focus:ring-opacity-20
  `,

  // Checkbox
  checkbox: `
    w-5 h-5
    rounded-[var(--radius-sm)]
    border-2 border-[var(--color-border)]
    text-[var(--color-accent)]
    cursor-pointer
    transition-all duration-[var(--transition-fast)]
    focus:outline-none
    focus:ring-2
    focus:ring-[var(--color-accent)]
    focus:ring-opacity-20
    checked:bg-[var(--color-accent)]
    checked:border-[var(--color-accent)]
  `,

  // Radio Button
  radio: `
    w-5 h-5
    border-2 border-[var(--color-border)]
    text-[var(--color-accent)]
    cursor-pointer
    transition-all duration-[var(--transition-fast)]
    focus:outline-none
    focus:ring-2
    focus:ring-[var(--color-accent)]
    focus:ring-opacity-20
    checked:bg-[var(--color-accent)]
    checked:border-[var(--color-accent)]
  `,

  // Label
  label: `
    block
    mb-2
    font-[var(--font-body)]
    text-[var(--text-small)]
    font-medium
    text-[var(--color-secondary)]
  `,

  // Error Message
  errorMessage: `
    mt-1
    text-[var(--text-caption)]
    text-[var(--color-error)]
    font-[var(--font-body)]
  `,

  // Success Message
  successMessage: `
    mt-1
    text-[var(--text-caption)]
    text-[var(--color-success)]
    font-[var(--font-body)]
  `,
};

// ============================================
// NAVIGATION COMPONENT SPECIFICATIONS
// ============================================

export const navigationComponents = {
  // Sidebar Navigation
  sidebar: `
    w-64
    h-full
    bg-[var(--color-surface)]
    border-r border-[var(--color-border)]
    p-4
    overflow-y-auto
  `,

  // Navigation Item
  navItem: `
    flex items-center
    px-4 py-3
    mb-1
    text-[var(--color-secondary)]
    rounded-[var(--radius-md)]
    font-[var(--font-body)]
    text-[var(--text-body)]
    transition-all duration-[var(--transition-fast)]
    hover:bg-[var(--color-background)]
    hover:text-[var(--color-primary)]
    cursor-pointer
    group
  `,

  // Active Navigation Item
  navItemActive: `
    bg-[var(--color-background)]
    text-[var(--color-primary)]
    border-l-4 border-[var(--color-accent)]
    font-semibold
  `,

  // Top Navigation Bar
  topNav: `
    w-full
    h-16
    bg-[var(--color-background)]
    border-b border-[var(--color-border)]
    px-6
    flex items-center justify-between
    shadow-[var(--shadow-sm)]
  `,

  // Mobile Navigation Menu
  mobileMenu: `
    fixed bottom-0 left-0 right-0
    bg-[var(--color-background)]
    border-t border-[var(--color-border)]
    px-4 py-2
    flex justify-around items-center
    shadow-[var(--shadow-lg)]
    z-50
  `,

  // Breadcrumb
  breadcrumb: `
    flex items-center
    space-x-2
    text-[var(--text-small)]
    text-[var(--color-secondary)]
    font-[var(--font-body)]
  `,

  // Tab Navigation
  tabNav: `
    flex space-x-1
    border-b border-[var(--color-border)]
    mb-4
  `,

  // Tab Item
  tabItem: `
    px-4 py-2
    text-[var(--color-secondary)]
    border-b-2 border-transparent
    font-[var(--font-body)]
    text-[var(--text-body)]
    transition-all duration-[var(--transition-fast)]
    hover:text-[var(--color-primary)]
    cursor-pointer
  `,

  // Active Tab Item
  tabItemActive: `
    text-[var(--color-primary)]
    border-b-2 border-[var(--color-accent)]
    font-semibold
  `,
};

// ============================================
// BADGE & INDICATOR SPECIFICATIONS
// ============================================

export const badgeComponents = {
  // Default Badge
  default: `
    inline-flex items-center
    px-2.5 py-0.5
    rounded-full
    text-[var(--text-caption)]
    font-medium
    bg-[var(--color-surface)]
    text-[var(--color-secondary)]
    border border-[var(--color-border)]
  `,

  // Success Badge
  success: `
    inline-flex items-center
    px-2.5 py-0.5
    rounded-full
    text-[var(--text-caption)]
    font-medium
    bg-green-100
    text-green-800
    dark:bg-green-900
    dark:text-green-200
  `,

  // Warning Badge
  warning: `
    inline-flex items-center
    px-2.5 py-0.5
    rounded-full
    text-[var(--text-caption)]
    font-medium
    bg-amber-100
    text-amber-800
    dark:bg-amber-900
    dark:text-amber-200
  `,

  // Error Badge
  error: `
    inline-flex items-center
    px-2.5 py-0.5
    rounded-full
    text-[var(--text-caption)]
    font-medium
    bg-red-100
    text-red-800
    dark:bg-red-900
    dark:text-red-200
  `,

  // Premium Badge (Gold)
  premium: `
    inline-flex items-center
    px-3 py-1
    rounded-full
    text-[var(--text-caption)]
    font-bold
    bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)]
    text-[var(--color-primary)]
    uppercase
    tracking-wider
    shadow-[var(--shadow-md)]
  `,

  // SEBI Compliance Badge
  sebiCompliance: `
    inline-flex items-center
    px-3 py-1
    rounded-[var(--radius-sm)]
    text-[var(--text-caption)]
    font-semibold
    bg-[var(--color-surface)]
    text-[var(--color-primary)]
    border-2 border-[var(--color-accent)]
    uppercase
    tracking-wide
  `,
};

// ============================================
// MODAL & DIALOG SPECIFICATIONS
// ============================================

export const modalComponents = {
  // Modal Overlay
  overlay: `
    fixed inset-0
    bg-black bg-opacity-50
    backdrop-blur-sm
    z-[var(--z-overlay)]
    animate-in fade-in duration-200
  `,

  // Modal Container
  container: `
    fixed left-1/2 top-1/2
    -translate-x-1/2 -translate-y-1/2
    bg-[var(--color-background)]
    rounded-[var(--radius-xl)]
    shadow-[var(--shadow-xl)]
    p-6
    w-full max-w-md
    z-[var(--z-modal)]
    animate-in zoom-in-95 duration-200
  `,

  // Modal Header
  header: `
    mb-4
    pb-4
    border-b border-[var(--color-border)]
  `,

  // Modal Title
  title: `
    font-[var(--font-heading)]
    text-[var(--text-h3)]
    text-[var(--color-primary)]
    font-bold
  `,

  // Modal Body
  body: `
    py-4
    text-[var(--color-secondary)]
    font-[var(--font-body)]
    text-[var(--text-body)]
    line-height-[var(--line-height-base)]
  `,

  // Modal Footer
  footer: `
    mt-6
    pt-4
    border-t border-[var(--color-border)]
    flex justify-end
    space-x-3
  `,
};

// ============================================
// DATA DISPLAY SPECIFICATIONS
// ============================================

export const dataComponents = {
  // Table Container
  tableContainer: `
    w-full
    overflow-x-auto
    rounded-[var(--radius-lg)]
    border border-[var(--color-border)]
  `,

  // Table
  table: `
    w-full
    text-[var(--text-body)]
    font-[var(--font-body)]
  `,

  // Table Header
  tableHeader: `
    bg-[var(--color-surface)]
    border-b border-[var(--color-border)]
  `,

  // Table Header Cell
  tableHeaderCell: `
    px-4 py-3
    text-left
    font-semibold
    text-[var(--color-primary)]
    text-[var(--text-small)]
    uppercase
    tracking-wider
  `,

  // Table Body
  tableBody: `
    bg-[var(--color-background)]
    divide-y divide-[var(--color-border)]
  `,

  // Table Row
  tableRow: `
    hover:bg-[var(--color-surface)]
    transition-colors duration-[var(--transition-fast)]
  `,

  // Table Cell
  tableCell: `
    px-4 py-3
    text-[var(--color-secondary)]
  `,

  // Stats Card
  statsCard: `
    bg-[var(--color-background)]
    border border-[var(--color-border)]
    rounded-[var(--radius-lg)]
    p-6
  `,

  // Stats Value
  statsValue: `
    font-[var(--font-heading)]
    text-[var(--text-h2)]
    text-[var(--color-primary)]
    font-bold
  `,

  // Stats Label
  statsLabel: `
    text-[var(--text-small)]
    text-[var(--color-secondary)]
    font-[var(--font-body)]
    uppercase
    tracking-wider
    mt-2
  `,

  // Progress Bar Container
  progressContainer: `
    w-full
    h-2
    bg-[var(--color-surface)]
    rounded-full
    overflow-hidden
  `,

  // Progress Bar Fill
  progressFill: `
    h-full
    bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)]
    transition-all duration-500 ease-out
  `,
};

// ============================================
// ALERT & NOTIFICATION SPECIFICATIONS
// ============================================

export const alertComponents = {
  // Default Alert
  default: `
    p-4
    rounded-[var(--radius-md)]
    border border-[var(--color-border)]
    bg-[var(--color-surface)]
    text-[var(--color-secondary)]
    font-[var(--font-body)]
    text-[var(--text-body)]
  `,

  // Success Alert
  success: `
    p-4
    rounded-[var(--radius-md)]
    border border-green-200
    bg-green-50
    text-green-800
    font-[var(--font-body)]
    text-[var(--text-body)]
    dark:bg-green-900
    dark:text-green-200
    dark:border-green-800
  `,

  // Warning Alert
  warning: `
    p-4
    rounded-[var(--radius-md)]
    border border-amber-200
    bg-amber-50
    text-amber-800
    font-[var(--font-body)]
    text-[var(--text-body)]
    dark:bg-amber-900
    dark:text-amber-200
    dark:border-amber-800
  `,

  // Error Alert
  error: `
    p-4
    rounded-[var(--radius-md)]
    border border-red-200
    bg-red-50
    text-red-800
    font-[var(--font-body)]
    text-[var(--text-body)]
    dark:bg-red-900
    dark:text-red-200
    dark:border-red-800
  `,

  // Info Alert
  info: `
    p-4
    rounded-[var(--radius-md)]
    border border-blue-200
    bg-blue-50
    text-blue-800
    font-[var(--font-body)]
    text-[var(--text-body)]
    dark:bg-blue-900
    dark:text-blue-200
    dark:border-blue-800
  `,

  // Toast Notification
  toast: `
    fixed bottom-4 right-4
    p-4
    rounded-[var(--radius-md)]
    bg-[var(--color-surface)]
    border border-[var(--color-border)]
    shadow-[var(--shadow-lg)]
    max-w-sm
    z-[var(--z-notification)]
    animate-in slide-in-from-bottom duration-300
  `,
};

// ============================================
// LOADING & SKELETON SPECIFICATIONS
// ============================================

export const loadingComponents = {
  // Spinner
  spinner: `
    inline-block
    w-6 h-6
    border-3 border-[var(--color-border)]
    border-t-[var(--color-accent)]
    rounded-full
    animate-spin
  `,

  // Loading Bar
  loadingBar: `
    fixed top-0 left-0 right-0
    h-1
    bg-[var(--color-surface)]
    z-[var(--z-notification)]
    overflow-hidden
    before:content-['']
    before:absolute
    before:top-0
    before:left-0
    before:h-full
    before:w-1/3
    before:bg-gradient-to-r
    before:from-transparent
    before:via-[var(--color-accent)]
    before:to-transparent
    before:animate-loading
  `,

  // Skeleton
  skeleton: `
    bg-[var(--color-surface)]
    rounded-[var(--radius-md)]
    animate-pulse
  `,

  // Skeleton Text
  skeletonText: `
    h-4
    bg-[var(--color-surface)]
    rounded-[var(--radius-sm)]
    animate-pulse
  `,

  // Skeleton Card
  skeletonCard: `
    bg-[var(--color-surface)]
    border border-[var(--color-border)]
    rounded-[var(--radius-lg)]
    p-6
    animate-pulse
  `,
};

// ============================================
// SPECIAL FINANCIAL COMPONENTS
// ============================================

export const financialComponents = {
  // Risk Score Indicator
  riskIndicator: `
    relative
    w-32 h-32
    rounded-full
    border-8 border-[var(--color-surface)]
    flex items-center justify-center
  `,

  // Compliance Status Card
  complianceCard: `
    bg-[var(--color-background)]
    border-2 border-[var(--color-accent)]
    rounded-[var(--radius-lg)]
    p-6
    position-relative
    before:content-['']
    before:absolute
    before:top-2
    before:right-2
    before:w-3
    before:h-3
    before:rounded-full
    before:bg-[var(--color-success)]
    before:animate-pulse
  `,

  // Portfolio Card
  portfolioCard: `
    bg-gradient-to-br
    from-[var(--color-surface)]
    to-[var(--color-background)]
    border border-[var(--color-border)]
    rounded-[var(--radius-xl)]
    p-6
    shadow-[var(--shadow-md)]
    hover:shadow-[var(--shadow-lg)]
    transition-shadow duration-[var(--transition-base)]
  `,

  // Market Ticker
  marketTicker: `
    flex items-center space-x-4
    px-4 py-2
    bg-[var(--color-surface)]
    rounded-[var(--radius-md)]
    font-[var(--font-mono)]
    text-[var(--text-small)]
  `,

  // Price Up Indicator
  priceUp: `
    text-[var(--color-success)]
    flex items-center
    before:content-['▲']
    before:mr-1
    before:text-xs
  `,

  // Price Down Indicator
  priceDown: `
    text-[var(--color-error)]
    flex items-center
    before:content-['▼']
    before:mr-1
    before:text-xs
  `,
};

// ============================================
// MOBILE-SPECIFIC COMPONENTS
// ============================================

export const mobileComponents = {
  // Bottom Sheet
  bottomSheet: `
    fixed bottom-0 left-0 right-0
    bg-[var(--color-background)]
    rounded-t-[var(--radius-xl)]
    shadow-[var(--shadow-xl)]
    p-6
    max-h-[80vh]
    overflow-y-auto
    z-[var(--z-modal)]
    animate-in slide-in-from-bottom duration-300
  `,

  // Floating Action Button
  fab: `
    fixed bottom-6 right-6
    w-14 h-14
    bg-[var(--color-accent)]
    text-[var(--color-primary)]
    rounded-full
    shadow-[var(--shadow-lg)]
    flex items-center justify-center
    z-[var(--z-sticky)]
    hover:scale-110
    active:scale-95
    transition-transform duration-[var(--transition-fast)]
  `,

  // Mobile Header
  mobileHeader: `
    sticky top-0
    bg-[var(--color-background)]
    border-b border-[var(--color-border)]
    px-4 py-3
    flex items-center justify-between
    z-[var(--z-sticky)]
  `,

  // Pull to Refresh
  pullToRefresh: `
    flex justify-center
    py-4
    text-[var(--color-secondary)]
    text-[var(--text-small)]
    font-[var(--font-body)]
  `,
};

// ============================================
// ANIMATION CLASSES
// ============================================

export const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  zoomIn: 'animate-in zoom-in-95 duration-200',
  zoomOut: 'animate-out zoom-out-95 duration-200',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const utils = {
  // Theme Switcher
  setTheme: (themeName: string) => {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('preferred-theme', themeName);
    
    // Update meta theme-color for mobile
    const themeColors: Record<string, string> = {
      'executive-clarity': '#0B1F33',
      'trust-builder': '#1E3A5F',
      'growth-catalyst': '#0C310C',
      'premium-professional': '#0B1F33',
      'innovation-forward': '#0B1F33',
      'midnight-executive': '#0B1929',
      'stealth-wealth': '#1A1815',
      'focus-flow': '#111827',
      'elite-trader': '#000000',
      'quantum-professional': '#0F172A',
    };
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors[themeName] || '#0B1F33');
    }
  },

  // Get Current Theme
  getCurrentTheme: () => {
    return document.documentElement.getAttribute('data-theme') || 'executive-clarity';
  },

  // Auto Theme Detection
  detectPreferredTheme: () => {
    const stored = localStorage.getItem('preferred-theme');
    if (stored) return stored;
    
    const hour = new Date().getHours();
    const isDark = hour < 6 || hour > 20;
    const isWeekend = [0, 6].includes(new Date().getDay());
    
    if (isDark) {
      return 'midnight-executive';
    } else if (isWeekend) {
      return 'growth-catalyst';
    } else {
      return 'executive-clarity';
    }
  },

  // Apply Theme-Specific Class
  cn: (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
  },
};