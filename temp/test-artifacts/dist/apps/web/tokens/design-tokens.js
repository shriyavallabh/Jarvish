"use strict";
/**
 * Design Tokens for Project One Financial Advisor Platform
 *
 * This file defines the complete design system tokens for the B2B financial
 * services platform, optimized for SEBI compliance, trust-building, and
 * mobile-first advisor workflows.
 *
 * @version 1.0.0
 * @author Project One Design System
 * @compliance SEBI, DPDP Act 2023
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.theme = exports.components = exports.financial = exports.accessibility = exports.sizes = exports.animation = exports.breakpoints = exports.zIndex = exports.borderRadius = exports.shadows = exports.spacing = exports.typography = exports.colors = void 0;
// =============================================================================
// COLOR SYSTEM
// =============================================================================
/**
 * Primary Brand Colors
 * Carefully selected for financial services trust and professionalism
 */
exports.colors = {
    // Brand Identity
    brand: {
        primary: '#2563EB', // Professional trust blue
        secondary: '#059669', // Success/approval green  
        accent: '#DC2626', // Alert/critical red
        neutral: '#6B7280', // Balanced gray for secondary text
    },
    // Semantic Colors for User Interface
    semantic: {
        success: '#10B981', // Positive actions, approvals
        warning: '#F59E0B', // Cautions, pending states
        error: '#EF4444', // Errors, rejections, violations
        info: '#3B82F6', // Informational content
        background: '#FFFFFF', // Primary background
        surface: '#F9FAFB', // Card and container backgrounds
        border: '#E5E7EB', // Borders and dividers
    },
    // SEBI Compliance Specific Colors
    compliance: {
        compliant: '#059669', // SEBI approved/compliant content
        riskLow: '#10B981', // Low risk score (80-100)
        riskMedium: '#F59E0B', // Medium risk score (50-79)
        riskHigh: '#EF4444', // High risk score (25-49)
        riskCritical: '#DC2626', // Critical risk score (0-24)
        violation: '#B91C1C', // SEBI violations
        pending: '#6366F1', // Pending compliance review
    },
    // Text Colors with Accessibility Compliance
    text: {
        primary: '#111827', // Primary text (contrast ratio 16.75:1)
        secondary: '#4B5563', // Secondary text (contrast ratio 7.2:1)
        tertiary: '#6B7280', // Tertiary text (contrast ratio 4.6:1)
        inverse: '#FFFFFF', // White text on dark backgrounds
        disabled: '#9CA3AF', // Disabled text (contrast ratio 2.3:1)
        link: '#2563EB', // Link text
        linkHover: '#1D4ED8', // Link hover state
    },
    // Interactive Element Colors
    interactive: {
        // Primary Actions (Create Content, Submit, Approve)
        primaryDefault: '#2563EB',
        primaryHover: '#1D4ED8',
        primaryActive: '#1E40AF',
        primaryDisabled: '#93C5FD',
        // Secondary Actions (Edit, Cancel, Back)
        secondaryDefault: '#6B7280',
        secondaryHover: '#4B5563',
        secondaryActive: '#374151',
        secondaryDisabled: '#D1D5DB',
        // Destructive Actions (Delete, Reject)
        destructiveDefault: '#DC2626',
        destructiveHover: '#B91C1C',
        destructiveActive: '#991B1B',
        destructiveDisabled: '#FCA5A5',
        // Success Actions (Approve, Confirm)
        successDefault: '#059669',
        successHover: '#047857',
        successActive: '#065F46',
        successDisabled: '#6EE7B7',
    },
    // Background Variations
    backgrounds: {
        default: '#FFFFFF', // Main application background
        subtle: '#F9FAFB', // Cards, panels, secondary areas
        muted: '#F3F4F6', // Disabled areas, inactive states
        emphasis: '#F1F5F9', // Highlighted sections
        overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
    },
    // Financial Data Visualization
    charts: {
        positive: '#10B981', // Gains, positive performance
        negative: '#EF4444', // Losses, negative performance
        neutral: '#6B7280', // Neutral data points
        benchmark: '#8B5CF6', // Benchmark comparison lines
        prediction: '#06B6D4', // AI predictions, forecasts
    },
    // Status Indicators
    status: {
        delivered: '#10B981', // WhatsApp delivery success
        pending: '#F59E0B', // Pending approval/delivery
        failed: '#EF4444', // Delivery/approval failures
        draft: '#6B7280', // Draft content
        scheduled: '#3B82F6', // Scheduled for delivery
        archived: '#9CA3AF', // Archived content
    },
    // Platform-Specific Colors
    platforms: {
        whatsapp: '#25D366', // WhatsApp brand green
        linkedin: '#0A66C2', // LinkedIn brand blue
        email: '#6366F1', // Email communication
        sms: '#EC4899', // SMS backup delivery
    }
};
// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================
/**
 * Typography scale optimized for financial content readability
 * Follows Major Third (1.25) scale for harmonious progression
 */
exports.typography = {
    // Font Families
    fonts: {
        primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        secondary: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
        hindi: '"Noto Sans Devanagari", "Inter", sans-serif',
        marathi: '"Noto Sans Devanagari", "Inter", sans-serif',
    },
    // Font Sizes (Major Third Scale: 1.25)
    sizes: {
        xs: '0.75rem', // 12px - Small labels, captions
        sm: '0.875rem', // 14px - Secondary text, form labels
        base: '1rem', // 16px - Body text, minimum readable size
        lg: '1.125rem', // 18px - Emphasized body text
        xl: '1.25rem', // 20px - Small headings
        '2xl': '1.5rem', // 24px - Card titles, section headers
        '3xl': '1.875rem', // 30px - Page titles
        '4xl': '2.25rem', // 36px - Main headings
        '5xl': '3rem', // 48px - Display text
        '6xl': '3.75rem', // 60px - Hero text (desktop only)
    },
    // Font Weights
    weights: {
        thin: 100,
        extralight: 200,
        light: 300,
        normal: 400, // Body text
        medium: 500, // Emphasized text
        semibold: 600, // Headings, important labels
        bold: 700, // Strong emphasis
        extrabold: 800, // Display text
        black: 900, // Hero text
    },
    // Line Heights for Optimal Readability
    lineHeights: {
        tight: 1.25, // Display text, large headings
        snug: 1.375, // Headings
        normal: 1.5, // Body text (optimal for financial content)
        relaxed: 1.625, // Long-form content
        loose: 2, // Spaced content, legal text
    },
    // Letter Spacing
    letterSpacing: {
        tighter: '-0.05em', // Large display text
        tight: '-0.025em', // Headings
        normal: '0em', // Body text
        wide: '0.025em', // Small caps, UI labels
        wider: '0.05em', // Buttons, navigation
        widest: '0.1em', // Uppercase headings
    },
    // Text Sizes for Specific Use Cases
    textSizes: {
        // Mobile-optimized sizes
        mobile: {
            body: '1rem', // 16px minimum for mobile readability
            caption: '0.875rem', // 14px for labels and meta text
            button: '1rem', // 16px for touch targets
            heading: '1.25rem', // 20px for mobile headings
        },
        // Desktop sizes
        desktop: {
            body: '1rem', // 16px consistent across devices
            caption: '0.875rem', // 14px for labels
            button: '0.875rem', // 14px for desktop buttons
            heading: '1.5rem', // 24px for desktop headings
        },
    },
};
// =============================================================================
// SPACING SYSTEM
// =============================================================================
/**
 * Spacing scale based on 4px grid system
 * Ensures consistent spacing across all components
 */
exports.spacing = {
    // Base spacing unit (4px)
    px: '1px',
    0: '0px',
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px - Base unit
    1.5: '0.375rem', // 6px
    2: '0.5rem', // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem', // 12px
    3.5: '0.875rem', // 14px
    4: '1rem', // 16px - Standard element spacing
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px - Card padding
    7: '1.75rem', // 28px
    8: '2rem', // 32px - Section spacing
    9: '2.25rem', // 36px
    10: '2.5rem', // 40px
    11: '2.75rem', // 44px - Minimum touch target
    12: '3rem', // 48px - Large section spacing
    14: '3.5rem', // 56px
    16: '4rem', // 64px - Header height
    20: '5rem', // 80px
    24: '6rem', // 96px
    28: '7rem', // 112px
    32: '8rem', // 128px
    36: '9rem', // 144px
    40: '10rem', // 160px
    44: '11rem', // 176px
    48: '12rem', // 192px
    52: '13rem', // 208px
    56: '14rem', // 224px
    60: '15rem', // 240px
    64: '16rem', // 256px
    72: '18rem', // 288px
    80: '20rem', // 320px
    96: '24rem', // 384px
    // Component-specific spacing
    component: {
        buttonPadding: '0.75rem 1rem', // 12px 16px
        inputPadding: '0.75rem', // 12px
        cardPadding: '1.5rem', // 24px
        sectionPadding: '2rem', // 32px
        pagePadding: '1rem', // 16px mobile, 32px desktop
        headerHeight: '4rem', // 64px
        bottomNavHeight: '3.75rem', // 60px
        touchTarget: '2.75rem', // 44px minimum
    },
    // Layout spacing
    layout: {
        gutter: '1rem', // 16px mobile gutters
        gutterDesktop: '1.5rem', // 24px desktop gutters
        maxWidth: '75rem', // 1200px max container width
        contentWidth: '48rem', // 768px optimal reading width
    },
};
// =============================================================================
// SHADOWS & ELEVATION
// =============================================================================
/**
 * Shadow system for depth and elevation
 * Optimized for financial UI trustworthiness
 */
exports.shadows = {
    // Elevation levels
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Subtle borders
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // Cards
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Elevated cards
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Modals
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // Popovers
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // Large modals
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)', // Pressed states
    // Component-specific shadows
    button: {
        default: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        hover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        active: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    },
    card: {
        default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        hover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        focus: '0 0 0 3px rgba(37, 99, 235, 0.1)',
    },
    compliance: {
        approved: '0 0 0 2px rgba(5, 150, 105, 0.2)', // Green glow for approved
        warning: '0 0 0 2px rgba(245, 158, 11, 0.2)', // Yellow glow for warnings
        violation: '0 0 0 2px rgba(220, 38, 38, 0.2)', // Red glow for violations
    },
};
// =============================================================================
// BORDER RADIUS
// =============================================================================
/**
 * Border radius scale for consistent roundness
 */
exports.borderRadius = {
    none: '0px',
    sm: '0.125rem', // 2px - Small elements
    base: '0.25rem', // 4px - Standard buttons, inputs
    md: '0.375rem', // 6px - Cards, containers
    lg: '0.5rem', // 8px - Large cards, modals
    xl: '0.75rem', // 12px - Hero sections
    '2xl': '1rem', // 16px - Special containers
    '3xl': '1.5rem', // 24px - Large hero elements
    full: '9999px', // Fully rounded (pills, avatars)
    // Component-specific radius
    button: '0.375rem', // 6px
    input: '0.375rem', // 6px
    card: '0.5rem', // 8px
    modal: '0.75rem', // 12px
    avatar: '9999px', // Fully rounded
    badge: '9999px', // Fully rounded
};
// =============================================================================
// Z-INDEX SCALE
// =============================================================================
/**
 * Z-index scale for proper layering
 */
exports.zIndex = {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10, // Sticky elements
    dropdown: 1000, // Dropdowns, popovers
    sticky: 1020, // Sticky headers
    banner: 1030, // Banners, alerts
    overlay: 1040, // Modal overlays
    modal: 1050, // Modal content
    popover: 1060, // Popovers, tooltips
    tooltip: 1070, // Tooltips
    toast: 1080, // Toast notifications
    maximum: 2147483647, // Maximum z-index value
};
// =============================================================================
// BREAKPOINTS
// =============================================================================
/**
 * Responsive breakpoints for mobile-first design
 */
exports.breakpoints = {
    xs: '320px', // Small mobile devices
    sm: '480px', // Large mobile devices
    md: '768px', // Tablets
    lg: '1024px', // Small desktops
    xl: '1280px', // Large desktops
    '2xl': '1536px', // Extra large screens
};
// =============================================================================
// ANIMATION & TRANSITIONS
// =============================================================================
/**
 * Animation system for smooth, professional interactions
 */
exports.animation = {
    // Duration scales
    duration: {
        instant: '0ms',
        fast: '150ms', // Quick feedback
        normal: '200ms', // Standard interactions
        slow: '300ms', // Complex state changes
        slower: '500ms', // Page transitions
    },
    // Easing functions for natural motion
    easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        // Custom easing for financial UI
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material design
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Playful feedback
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)', // Quick attention
    },
    // Common transitions
    transition: {
        default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        colors: 'color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out',
        shadow: 'box-shadow 150ms ease-in-out',
        transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    // Specific component animations
    components: {
        button: 'all 150ms ease-in-out',
        modal: 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
        tooltip: 'opacity 150ms ease-in-out',
        slide: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
};
// =============================================================================
// COMPONENT SIZES
// =============================================================================
/**
 * Standardized component sizing
 */
exports.sizes = {
    // Button sizes
    button: {
        sm: { height: '2rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }, // 32px height
        md: { height: '2.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }, // 40px height
        lg: { height: '2.75rem', padding: '0.5rem 1.25rem', fontSize: '1rem' }, // 44px height (touch-friendly)
        xl: { height: '3rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }, // 48px height
    },
    // Input sizes
    input: {
        sm: { height: '2rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
        md: { height: '2.5rem', padding: '0.5rem 0.75rem', fontSize: '1rem' },
        lg: { height: '2.75rem', padding: '0.5rem 1rem', fontSize: '1rem' },
    },
    // Avatar sizes
    avatar: {
        xs: '1.5rem', // 24px
        sm: '2rem', // 32px
        md: '2.5rem', // 40px
        lg: '3rem', // 48px
        xl: '4rem', // 64px
        '2xl': '5rem', // 80px
    },
    // Icon sizes
    icon: {
        xs: '0.75rem', // 12px
        sm: '1rem', // 16px
        md: '1.25rem', // 20px
        lg: '1.5rem', // 24px
        xl: '2rem', // 32px
    },
    // Container max widths
    container: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        content: '768px', // Optimal reading width
        full: '100%',
    },
};
// =============================================================================
// ACCESSIBILITY TOKENS
// =============================================================================
/**
 * Accessibility-focused design tokens
 */
exports.accessibility = {
    // Focus indicators
    focus: {
        ring: {
            width: '2px',
            color: exports.colors.brand.primary,
            offset: '2px',
            style: 'solid',
        },
        shadow: `0 0 0 2px ${exports.colors.brand.primary}`,
        outline: `2px solid ${exports.colors.brand.primary}`,
    },
    // Touch targets (minimum 44px for WCAG compliance)
    touchTarget: {
        minimum: '2.75rem', // 44px
        comfortable: '3rem', // 48px
    },
    // High contrast alternatives
    highContrast: {
        text: '#000000',
        background: '#FFFFFF',
        border: '#000000',
        focus: '#0066CC',
    },
    // Motion preferences
    motion: {
        reduced: {
            transition: 'none',
            animation: 'none',
        },
    },
};
// =============================================================================
// FINANCIAL SERVICES SPECIFIC TOKENS
// =============================================================================
/**
 * Tokens specific to financial services and SEBI compliance
 */
exports.financial = {
    // Compliance score color mapping
    complianceColors: {
        excellent: exports.colors.compliance.compliant, // 90-100
        good: exports.colors.compliance.riskLow, // 75-89
        acceptable: exports.colors.compliance.riskMedium, // 60-74
        concerning: exports.colors.compliance.riskHigh, // 40-59
        critical: exports.colors.compliance.riskCritical, // 0-39
    },
    // Risk level indicators
    riskLevels: {
        low: { color: exports.colors.compliance.riskLow, background: '#ECFDF5' },
        medium: { color: exports.colors.compliance.riskMedium, background: '#FFFBEB' },
        high: { color: exports.colors.compliance.riskHigh, background: '#FEF2F2' },
        critical: { color: exports.colors.compliance.riskCritical, background: '#FEF2F2' },
    },
    // Platform brand colors
    platforms: {
        whatsapp: { primary: '#25D366', secondary: '#128C7E', background: '#E7FFDB' },
        linkedin: { primary: '#0A66C2', secondary: '#004182', background: '#E8F4FD' },
        email: { primary: '#6366F1', secondary: '#4338CA', background: '#EEF2FF' },
    },
    // Status indicators for financial content
    contentStatus: {
        draft: { color: exports.colors.status.draft, background: '#F9FAFB' },
        pending: { color: exports.colors.status.pending, background: '#FEF3C7' },
        approved: { color: exports.colors.status.delivered, background: '#ECFDF5' },
        rejected: { color: exports.colors.status.failed, background: '#FEF2F2' },
        scheduled: { color: exports.colors.status.scheduled, background: '#EFF6FF' },
        delivered: { color: exports.colors.status.delivered, background: '#ECFDF5' },
    },
    // Data visualization for financial metrics
    metrics: {
        positive: exports.colors.charts.positive,
        negative: exports.colors.charts.negative,
        neutral: exports.colors.charts.neutral,
        benchmark: exports.colors.charts.benchmark,
        prediction: exports.colors.charts.prediction,
    },
};
// =============================================================================
// COMPONENT TOKENS
// =============================================================================
/**
 * Component-specific token collections
 */
exports.components = {
    // Button component tokens
    button: {
        borderRadius: exports.borderRadius.md,
        fontWeight: exports.typography.weights.medium,
        transition: exports.animation.components.button,
        sizes: exports.sizes.button,
        shadows: exports.shadows.button,
    },
    // Card component tokens
    card: {
        borderRadius: exports.borderRadius.lg,
        padding: exports.spacing.component.cardPadding,
        shadow: exports.shadows.card.default,
        background: exports.colors.backgrounds.default,
        border: `1px solid ${exports.colors.semantic.border}`,
    },
    // Input component tokens
    input: {
        borderRadius: exports.borderRadius.md,
        border: `1px solid ${exports.colors.semantic.border}`,
        focusBorder: `1px solid ${exports.colors.brand.primary}`,
        shadow: exports.shadows.sm,
        focusShadow: exports.shadows.card.focus,
        sizes: exports.sizes.input,
    },
    // Modal component tokens
    modal: {
        borderRadius: exports.borderRadius.xl,
        shadow: exports.shadows.xl,
        overlay: exports.colors.backgrounds.overlay,
        background: exports.colors.backgrounds.default,
        padding: exports.spacing.component.cardPadding,
    },
    // Navigation component tokens
    navigation: {
        height: exports.spacing.component.headerHeight,
        padding: exports.spacing.component.buttonPadding,
        background: exports.colors.backgrounds.default,
        border: `1px solid ${exports.colors.semantic.border}`,
        shadow: exports.shadows.sm,
    },
    // Typography component tokens
    typography: {
        heading: {
            fontFamily: exports.typography.fonts.primary,
            fontWeight: exports.typography.weights.semibold,
            lineHeight: exports.typography.lineHeights.tight,
            color: exports.colors.text.primary,
        },
        body: {
            fontFamily: exports.typography.fonts.primary,
            fontWeight: exports.typography.weights.normal,
            lineHeight: exports.typography.lineHeights.normal,
            color: exports.colors.text.primary,
        },
        caption: {
            fontFamily: exports.typography.fonts.primary,
            fontWeight: exports.typography.weights.normal,
            lineHeight: exports.typography.lineHeights.normal,
            color: exports.colors.text.secondary,
        },
    },
};
// =============================================================================
// THEME OBJECT
// =============================================================================
/**
 * Complete theme object combining all token categories
 */
exports.theme = {
    colors: exports.colors,
    typography: exports.typography,
    spacing: exports.spacing,
    shadows: exports.shadows,
    borderRadius: exports.borderRadius,
    zIndex: exports.zIndex,
    breakpoints: exports.breakpoints,
    animation: exports.animation,
    sizes: exports.sizes,
    accessibility: exports.accessibility,
    financial: exports.financial,
    components: exports.components,
};
// Default export
exports.default = exports.theme;
