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
/**
 * Primary Brand Colors
 * Carefully selected for financial services trust and professionalism
 */
export declare const colors: {
    readonly brand: {
        readonly primary: "#2563EB";
        readonly secondary: "#059669";
        readonly accent: "#DC2626";
        readonly neutral: "#6B7280";
    };
    readonly semantic: {
        readonly success: "#10B981";
        readonly warning: "#F59E0B";
        readonly error: "#EF4444";
        readonly info: "#3B82F6";
        readonly background: "#FFFFFF";
        readonly surface: "#F9FAFB";
        readonly border: "#E5E7EB";
    };
    readonly compliance: {
        readonly compliant: "#059669";
        readonly riskLow: "#10B981";
        readonly riskMedium: "#F59E0B";
        readonly riskHigh: "#EF4444";
        readonly riskCritical: "#DC2626";
        readonly violation: "#B91C1C";
        readonly pending: "#6366F1";
    };
    readonly text: {
        readonly primary: "#111827";
        readonly secondary: "#4B5563";
        readonly tertiary: "#6B7280";
        readonly inverse: "#FFFFFF";
        readonly disabled: "#9CA3AF";
        readonly link: "#2563EB";
        readonly linkHover: "#1D4ED8";
    };
    readonly interactive: {
        readonly primaryDefault: "#2563EB";
        readonly primaryHover: "#1D4ED8";
        readonly primaryActive: "#1E40AF";
        readonly primaryDisabled: "#93C5FD";
        readonly secondaryDefault: "#6B7280";
        readonly secondaryHover: "#4B5563";
        readonly secondaryActive: "#374151";
        readonly secondaryDisabled: "#D1D5DB";
        readonly destructiveDefault: "#DC2626";
        readonly destructiveHover: "#B91C1C";
        readonly destructiveActive: "#991B1B";
        readonly destructiveDisabled: "#FCA5A5";
        readonly successDefault: "#059669";
        readonly successHover: "#047857";
        readonly successActive: "#065F46";
        readonly successDisabled: "#6EE7B7";
    };
    readonly backgrounds: {
        readonly default: "#FFFFFF";
        readonly subtle: "#F9FAFB";
        readonly muted: "#F3F4F6";
        readonly emphasis: "#F1F5F9";
        readonly overlay: "rgba(0, 0, 0, 0.5)";
    };
    readonly charts: {
        readonly positive: "#10B981";
        readonly negative: "#EF4444";
        readonly neutral: "#6B7280";
        readonly benchmark: "#8B5CF6";
        readonly prediction: "#06B6D4";
    };
    readonly status: {
        readonly delivered: "#10B981";
        readonly pending: "#F59E0B";
        readonly failed: "#EF4444";
        readonly draft: "#6B7280";
        readonly scheduled: "#3B82F6";
        readonly archived: "#9CA3AF";
    };
    readonly platforms: {
        readonly whatsapp: "#25D366";
        readonly linkedin: "#0A66C2";
        readonly email: "#6366F1";
        readonly sms: "#EC4899";
    };
};
/**
 * Typography scale optimized for financial content readability
 * Follows Major Third (1.25) scale for harmonious progression
 */
export declare const typography: {
    readonly fonts: {
        readonly primary: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
        readonly secondary: "\"Roboto\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
        readonly mono: "\"JetBrains Mono\", \"Fira Code\", Consolas, \"Liberation Mono\", Menlo, monospace";
        readonly hindi: "\"Noto Sans Devanagari\", \"Inter\", sans-serif";
        readonly marathi: "\"Noto Sans Devanagari\", \"Inter\", sans-serif";
    };
    readonly sizes: {
        readonly xs: "0.75rem";
        readonly sm: "0.875rem";
        readonly base: "1rem";
        readonly lg: "1.125rem";
        readonly xl: "1.25rem";
        readonly '2xl': "1.5rem";
        readonly '3xl': "1.875rem";
        readonly '4xl': "2.25rem";
        readonly '5xl': "3rem";
        readonly '6xl': "3.75rem";
    };
    readonly weights: {
        readonly thin: 100;
        readonly extralight: 200;
        readonly light: 300;
        readonly normal: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
        readonly extrabold: 800;
        readonly black: 900;
    };
    readonly lineHeights: {
        readonly tight: 1.25;
        readonly snug: 1.375;
        readonly normal: 1.5;
        readonly relaxed: 1.625;
        readonly loose: 2;
    };
    readonly letterSpacing: {
        readonly tighter: "-0.05em";
        readonly tight: "-0.025em";
        readonly normal: "0em";
        readonly wide: "0.025em";
        readonly wider: "0.05em";
        readonly widest: "0.1em";
    };
    readonly textSizes: {
        readonly mobile: {
            readonly body: "1rem";
            readonly caption: "0.875rem";
            readonly button: "1rem";
            readonly heading: "1.25rem";
        };
        readonly desktop: {
            readonly body: "1rem";
            readonly caption: "0.875rem";
            readonly button: "0.875rem";
            readonly heading: "1.5rem";
        };
    };
};
/**
 * Spacing scale based on 4px grid system
 * Ensures consistent spacing across all components
 */
export declare const spacing: {
    readonly px: "1px";
    readonly 0: "0px";
    readonly 0.5: "0.125rem";
    readonly 1: "0.25rem";
    readonly 1.5: "0.375rem";
    readonly 2: "0.5rem";
    readonly 2.5: "0.625rem";
    readonly 3: "0.75rem";
    readonly 3.5: "0.875rem";
    readonly 4: "1rem";
    readonly 5: "1.25rem";
    readonly 6: "1.5rem";
    readonly 7: "1.75rem";
    readonly 8: "2rem";
    readonly 9: "2.25rem";
    readonly 10: "2.5rem";
    readonly 11: "2.75rem";
    readonly 12: "3rem";
    readonly 14: "3.5rem";
    readonly 16: "4rem";
    readonly 20: "5rem";
    readonly 24: "6rem";
    readonly 28: "7rem";
    readonly 32: "8rem";
    readonly 36: "9rem";
    readonly 40: "10rem";
    readonly 44: "11rem";
    readonly 48: "12rem";
    readonly 52: "13rem";
    readonly 56: "14rem";
    readonly 60: "15rem";
    readonly 64: "16rem";
    readonly 72: "18rem";
    readonly 80: "20rem";
    readonly 96: "24rem";
    readonly component: {
        readonly buttonPadding: "0.75rem 1rem";
        readonly inputPadding: "0.75rem";
        readonly cardPadding: "1.5rem";
        readonly sectionPadding: "2rem";
        readonly pagePadding: "1rem";
        readonly headerHeight: "4rem";
        readonly bottomNavHeight: "3.75rem";
        readonly touchTarget: "2.75rem";
    };
    readonly layout: {
        readonly gutter: "1rem";
        readonly gutterDesktop: "1.5rem";
        readonly maxWidth: "75rem";
        readonly contentWidth: "48rem";
    };
};
/**
 * Shadow system for depth and elevation
 * Optimized for financial UI trustworthiness
 */
export declare const shadows: {
    readonly none: "none";
    readonly sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
    readonly base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
    readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
    readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
    readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
    readonly '2xl': "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
    readonly inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)";
    readonly button: {
        readonly default: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        readonly hover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
        readonly active: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)";
    };
    readonly card: {
        readonly default: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
        readonly hover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
        readonly focus: "0 0 0 3px rgba(37, 99, 235, 0.1)";
    };
    readonly compliance: {
        readonly approved: "0 0 0 2px rgba(5, 150, 105, 0.2)";
        readonly warning: "0 0 0 2px rgba(245, 158, 11, 0.2)";
        readonly violation: "0 0 0 2px rgba(220, 38, 38, 0.2)";
    };
};
/**
 * Border radius scale for consistent roundness
 */
export declare const borderRadius: {
    readonly none: "0px";
    readonly sm: "0.125rem";
    readonly base: "0.25rem";
    readonly md: "0.375rem";
    readonly lg: "0.5rem";
    readonly xl: "0.75rem";
    readonly '2xl': "1rem";
    readonly '3xl': "1.5rem";
    readonly full: "9999px";
    readonly button: "0.375rem";
    readonly input: "0.375rem";
    readonly card: "0.5rem";
    readonly modal: "0.75rem";
    readonly avatar: "9999px";
    readonly badge: "9999px";
};
/**
 * Z-index scale for proper layering
 */
export declare const zIndex: {
    readonly hide: -1;
    readonly auto: "auto";
    readonly base: 0;
    readonly docked: 10;
    readonly dropdown: 1000;
    readonly sticky: 1020;
    readonly banner: 1030;
    readonly overlay: 1040;
    readonly modal: 1050;
    readonly popover: 1060;
    readonly tooltip: 1070;
    readonly toast: 1080;
    readonly maximum: 2147483647;
};
/**
 * Responsive breakpoints for mobile-first design
 */
export declare const breakpoints: {
    readonly xs: "320px";
    readonly sm: "480px";
    readonly md: "768px";
    readonly lg: "1024px";
    readonly xl: "1280px";
    readonly '2xl': "1536px";
};
/**
 * Animation system for smooth, professional interactions
 */
export declare const animation: {
    readonly duration: {
        readonly instant: "0ms";
        readonly fast: "150ms";
        readonly normal: "200ms";
        readonly slow: "300ms";
        readonly slower: "500ms";
    };
    readonly easing: {
        readonly linear: "linear";
        readonly ease: "ease";
        readonly easeIn: "ease-in";
        readonly easeOut: "ease-out";
        readonly easeInOut: "ease-in-out";
        readonly smooth: "cubic-bezier(0.4, 0, 0.2, 1)";
        readonly bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
        readonly sharp: "cubic-bezier(0.4, 0, 0.6, 1)";
    };
    readonly transition: {
        readonly default: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)";
        readonly colors: "color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out";
        readonly shadow: "box-shadow 150ms ease-in-out";
        readonly transform: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)";
    };
    readonly components: {
        readonly button: "all 150ms ease-in-out";
        readonly modal: "opacity 200ms ease-in-out, transform 200ms ease-in-out";
        readonly tooltip: "opacity 150ms ease-in-out";
        readonly slide: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)";
    };
};
/**
 * Standardized component sizing
 */
export declare const sizes: {
    readonly button: {
        readonly sm: {
            readonly height: "2rem";
            readonly padding: "0.25rem 0.75rem";
            readonly fontSize: "0.875rem";
        };
        readonly md: {
            readonly height: "2.5rem";
            readonly padding: "0.5rem 1rem";
            readonly fontSize: "0.875rem";
        };
        readonly lg: {
            readonly height: "2.75rem";
            readonly padding: "0.5rem 1.25rem";
            readonly fontSize: "1rem";
        };
        readonly xl: {
            readonly height: "3rem";
            readonly padding: "0.75rem 1.5rem";
            readonly fontSize: "1rem";
        };
    };
    readonly input: {
        readonly sm: {
            readonly height: "2rem";
            readonly padding: "0.25rem 0.75rem";
            readonly fontSize: "0.875rem";
        };
        readonly md: {
            readonly height: "2.5rem";
            readonly padding: "0.5rem 0.75rem";
            readonly fontSize: "1rem";
        };
        readonly lg: {
            readonly height: "2.75rem";
            readonly padding: "0.5rem 1rem";
            readonly fontSize: "1rem";
        };
    };
    readonly avatar: {
        readonly xs: "1.5rem";
        readonly sm: "2rem";
        readonly md: "2.5rem";
        readonly lg: "3rem";
        readonly xl: "4rem";
        readonly '2xl': "5rem";
    };
    readonly icon: {
        readonly xs: "0.75rem";
        readonly sm: "1rem";
        readonly md: "1.25rem";
        readonly lg: "1.5rem";
        readonly xl: "2rem";
    };
    readonly container: {
        readonly sm: "640px";
        readonly md: "768px";
        readonly lg: "1024px";
        readonly xl: "1280px";
        readonly '2xl': "1536px";
        readonly content: "768px";
        readonly full: "100%";
    };
};
/**
 * Accessibility-focused design tokens
 */
export declare const accessibility: {
    readonly focus: {
        readonly ring: {
            readonly width: "2px";
            readonly color: "#2563EB";
            readonly offset: "2px";
            readonly style: "solid";
        };
        readonly shadow: "0 0 0 2px #2563EB";
        readonly outline: "2px solid #2563EB";
    };
    readonly touchTarget: {
        readonly minimum: "2.75rem";
        readonly comfortable: "3rem";
    };
    readonly highContrast: {
        readonly text: "#000000";
        readonly background: "#FFFFFF";
        readonly border: "#000000";
        readonly focus: "#0066CC";
    };
    readonly motion: {
        readonly reduced: {
            readonly transition: "none";
            readonly animation: "none";
        };
    };
};
/**
 * Tokens specific to financial services and SEBI compliance
 */
export declare const financial: {
    readonly complianceColors: {
        readonly excellent: "#059669";
        readonly good: "#10B981";
        readonly acceptable: "#F59E0B";
        readonly concerning: "#EF4444";
        readonly critical: "#DC2626";
    };
    readonly riskLevels: {
        readonly low: {
            readonly color: "#10B981";
            readonly background: "#ECFDF5";
        };
        readonly medium: {
            readonly color: "#F59E0B";
            readonly background: "#FFFBEB";
        };
        readonly high: {
            readonly color: "#EF4444";
            readonly background: "#FEF2F2";
        };
        readonly critical: {
            readonly color: "#DC2626";
            readonly background: "#FEF2F2";
        };
    };
    readonly platforms: {
        readonly whatsapp: {
            readonly primary: "#25D366";
            readonly secondary: "#128C7E";
            readonly background: "#E7FFDB";
        };
        readonly linkedin: {
            readonly primary: "#0A66C2";
            readonly secondary: "#004182";
            readonly background: "#E8F4FD";
        };
        readonly email: {
            readonly primary: "#6366F1";
            readonly secondary: "#4338CA";
            readonly background: "#EEF2FF";
        };
    };
    readonly contentStatus: {
        readonly draft: {
            readonly color: "#6B7280";
            readonly background: "#F9FAFB";
        };
        readonly pending: {
            readonly color: "#F59E0B";
            readonly background: "#FEF3C7";
        };
        readonly approved: {
            readonly color: "#10B981";
            readonly background: "#ECFDF5";
        };
        readonly rejected: {
            readonly color: "#EF4444";
            readonly background: "#FEF2F2";
        };
        readonly scheduled: {
            readonly color: "#3B82F6";
            readonly background: "#EFF6FF";
        };
        readonly delivered: {
            readonly color: "#10B981";
            readonly background: "#ECFDF5";
        };
    };
    readonly metrics: {
        readonly positive: "#10B981";
        readonly negative: "#EF4444";
        readonly neutral: "#6B7280";
        readonly benchmark: "#8B5CF6";
        readonly prediction: "#06B6D4";
    };
};
/**
 * Component-specific token collections
 */
export declare const components: {
    readonly button: {
        readonly borderRadius: "0.375rem";
        readonly fontWeight: 500;
        readonly transition: "all 150ms ease-in-out";
        readonly sizes: {
            readonly sm: {
                readonly height: "2rem";
                readonly padding: "0.25rem 0.75rem";
                readonly fontSize: "0.875rem";
            };
            readonly md: {
                readonly height: "2.5rem";
                readonly padding: "0.5rem 1rem";
                readonly fontSize: "0.875rem";
            };
            readonly lg: {
                readonly height: "2.75rem";
                readonly padding: "0.5rem 1.25rem";
                readonly fontSize: "1rem";
            };
            readonly xl: {
                readonly height: "3rem";
                readonly padding: "0.75rem 1.5rem";
                readonly fontSize: "1rem";
            };
        };
        readonly shadows: {
            readonly default: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            readonly hover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
            readonly active: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)";
        };
    };
    readonly card: {
        readonly borderRadius: "0.5rem";
        readonly padding: "1.5rem";
        readonly shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
        readonly background: "#FFFFFF";
        readonly border: "1px solid #E5E7EB";
    };
    readonly input: {
        readonly borderRadius: "0.375rem";
        readonly border: "1px solid #E5E7EB";
        readonly focusBorder: "1px solid #2563EB";
        readonly shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        readonly focusShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)";
        readonly sizes: {
            readonly sm: {
                readonly height: "2rem";
                readonly padding: "0.25rem 0.75rem";
                readonly fontSize: "0.875rem";
            };
            readonly md: {
                readonly height: "2.5rem";
                readonly padding: "0.5rem 0.75rem";
                readonly fontSize: "1rem";
            };
            readonly lg: {
                readonly height: "2.75rem";
                readonly padding: "0.5rem 1rem";
                readonly fontSize: "1rem";
            };
        };
    };
    readonly modal: {
        readonly borderRadius: "0.75rem";
        readonly shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
        readonly overlay: "rgba(0, 0, 0, 0.5)";
        readonly background: "#FFFFFF";
        readonly padding: "1.5rem";
    };
    readonly navigation: {
        readonly height: "4rem";
        readonly padding: "0.75rem 1rem";
        readonly background: "#FFFFFF";
        readonly border: "1px solid #E5E7EB";
        readonly shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
    };
    readonly typography: {
        readonly heading: {
            readonly fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
            readonly fontWeight: 600;
            readonly lineHeight: 1.25;
            readonly color: "#111827";
        };
        readonly body: {
            readonly fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
            readonly color: "#111827";
        };
        readonly caption: {
            readonly fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
            readonly color: "#4B5563";
        };
    };
};
/**
 * Complete theme object combining all token categories
 */
export declare const theme: {
    readonly colors: {
        readonly brand: {
            readonly primary: "#2563EB";
            readonly secondary: "#059669";
            readonly accent: "#DC2626";
            readonly neutral: "#6B7280";
        };
        readonly semantic: {
            readonly success: "#10B981";
            readonly warning: "#F59E0B";
            readonly error: "#EF4444";
            readonly info: "#3B82F6";
            readonly background: "#FFFFFF";
            readonly surface: "#F9FAFB";
            readonly border: "#E5E7EB";
        };
        readonly compliance: {
            readonly compliant: "#059669";
            readonly riskLow: "#10B981";
            readonly riskMedium: "#F59E0B";
            readonly riskHigh: "#EF4444";
            readonly riskCritical: "#DC2626";
            readonly violation: "#B91C1C";
            readonly pending: "#6366F1";
        };
        readonly text: {
            readonly primary: "#111827";
            readonly secondary: "#4B5563";
            readonly tertiary: "#6B7280";
            readonly inverse: "#FFFFFF";
            readonly disabled: "#9CA3AF";
            readonly link: "#2563EB";
            readonly linkHover: "#1D4ED8";
        };
        readonly interactive: {
            readonly primaryDefault: "#2563EB";
            readonly primaryHover: "#1D4ED8";
            readonly primaryActive: "#1E40AF";
            readonly primaryDisabled: "#93C5FD";
            readonly secondaryDefault: "#6B7280";
            readonly secondaryHover: "#4B5563";
            readonly secondaryActive: "#374151";
            readonly secondaryDisabled: "#D1D5DB";
            readonly destructiveDefault: "#DC2626";
            readonly destructiveHover: "#B91C1C";
            readonly destructiveActive: "#991B1B";
            readonly destructiveDisabled: "#FCA5A5";
            readonly successDefault: "#059669";
            readonly successHover: "#047857";
            readonly successActive: "#065F46";
            readonly successDisabled: "#6EE7B7";
        };
        readonly backgrounds: {
            readonly default: "#FFFFFF";
            readonly subtle: "#F9FAFB";
            readonly muted: "#F3F4F6";
            readonly emphasis: "#F1F5F9";
            readonly overlay: "rgba(0, 0, 0, 0.5)";
        };
        readonly charts: {
            readonly positive: "#10B981";
            readonly negative: "#EF4444";
            readonly neutral: "#6B7280";
            readonly benchmark: "#8B5CF6";
            readonly prediction: "#06B6D4";
        };
        readonly status: {
            readonly delivered: "#10B981";
            readonly pending: "#F59E0B";
            readonly failed: "#EF4444";
            readonly draft: "#6B7280";
            readonly scheduled: "#3B82F6";
            readonly archived: "#9CA3AF";
        };
        readonly platforms: {
            readonly whatsapp: "#25D366";
            readonly linkedin: "#0A66C2";
            readonly email: "#6366F1";
            readonly sms: "#EC4899";
        };
    };
    readonly typography: {
        readonly fonts: {
            readonly primary: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
            readonly secondary: "\"Roboto\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
            readonly mono: "\"JetBrains Mono\", \"Fira Code\", Consolas, \"Liberation Mono\", Menlo, monospace";
            readonly hindi: "\"Noto Sans Devanagari\", \"Inter\", sans-serif";
            readonly marathi: "\"Noto Sans Devanagari\", \"Inter\", sans-serif";
        };
        readonly sizes: {
            readonly xs: "0.75rem";
            readonly sm: "0.875rem";
            readonly base: "1rem";
            readonly lg: "1.125rem";
            readonly xl: "1.25rem";
            readonly '2xl': "1.5rem";
            readonly '3xl': "1.875rem";
            readonly '4xl': "2.25rem";
            readonly '5xl': "3rem";
            readonly '6xl': "3.75rem";
        };
        readonly weights: {
            readonly thin: 100;
            readonly extralight: 200;
            readonly light: 300;
            readonly normal: 400;
            readonly medium: 500;
            readonly semibold: 600;
            readonly bold: 700;
            readonly extrabold: 800;
            readonly black: 900;
        };
        readonly lineHeights: {
            readonly tight: 1.25;
            readonly snug: 1.375;
            readonly normal: 1.5;
            readonly relaxed: 1.625;
            readonly loose: 2;
        };
        readonly letterSpacing: {
            readonly tighter: "-0.05em";
            readonly tight: "-0.025em";
            readonly normal: "0em";
            readonly wide: "0.025em";
            readonly wider: "0.05em";
            readonly widest: "0.1em";
        };
        readonly textSizes: {
            readonly mobile: {
                readonly body: "1rem";
                readonly caption: "0.875rem";
                readonly button: "1rem";
                readonly heading: "1.25rem";
            };
            readonly desktop: {
                readonly body: "1rem";
                readonly caption: "0.875rem";
                readonly button: "0.875rem";
                readonly heading: "1.5rem";
            };
        };
    };
    readonly spacing: {
        readonly px: "1px";
        readonly 0: "0px";
        readonly 0.5: "0.125rem";
        readonly 1: "0.25rem";
        readonly 1.5: "0.375rem";
        readonly 2: "0.5rem";
        readonly 2.5: "0.625rem";
        readonly 3: "0.75rem";
        readonly 3.5: "0.875rem";
        readonly 4: "1rem";
        readonly 5: "1.25rem";
        readonly 6: "1.5rem";
        readonly 7: "1.75rem";
        readonly 8: "2rem";
        readonly 9: "2.25rem";
        readonly 10: "2.5rem";
        readonly 11: "2.75rem";
        readonly 12: "3rem";
        readonly 14: "3.5rem";
        readonly 16: "4rem";
        readonly 20: "5rem";
        readonly 24: "6rem";
        readonly 28: "7rem";
        readonly 32: "8rem";
        readonly 36: "9rem";
        readonly 40: "10rem";
        readonly 44: "11rem";
        readonly 48: "12rem";
        readonly 52: "13rem";
        readonly 56: "14rem";
        readonly 60: "15rem";
        readonly 64: "16rem";
        readonly 72: "18rem";
        readonly 80: "20rem";
        readonly 96: "24rem";
        readonly component: {
            readonly buttonPadding: "0.75rem 1rem";
            readonly inputPadding: "0.75rem";
            readonly cardPadding: "1.5rem";
            readonly sectionPadding: "2rem";
            readonly pagePadding: "1rem";
            readonly headerHeight: "4rem";
            readonly bottomNavHeight: "3.75rem";
            readonly touchTarget: "2.75rem";
        };
        readonly layout: {
            readonly gutter: "1rem";
            readonly gutterDesktop: "1.5rem";
            readonly maxWidth: "75rem";
            readonly contentWidth: "48rem";
        };
    };
    readonly shadows: {
        readonly none: "none";
        readonly sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        readonly base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
        readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
        readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
        readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
        readonly '2xl': "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
        readonly inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)";
        readonly button: {
            readonly default: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            readonly hover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
            readonly active: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)";
        };
        readonly card: {
            readonly default: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
            readonly hover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
            readonly focus: "0 0 0 3px rgba(37, 99, 235, 0.1)";
        };
        readonly compliance: {
            readonly approved: "0 0 0 2px rgba(5, 150, 105, 0.2)";
            readonly warning: "0 0 0 2px rgba(245, 158, 11, 0.2)";
            readonly violation: "0 0 0 2px rgba(220, 38, 38, 0.2)";
        };
    };
    readonly borderRadius: {
        readonly none: "0px";
        readonly sm: "0.125rem";
        readonly base: "0.25rem";
        readonly md: "0.375rem";
        readonly lg: "0.5rem";
        readonly xl: "0.75rem";
        readonly '2xl': "1rem";
        readonly '3xl': "1.5rem";
        readonly full: "9999px";
        readonly button: "0.375rem";
        readonly input: "0.375rem";
        readonly card: "0.5rem";
        readonly modal: "0.75rem";
        readonly avatar: "9999px";
        readonly badge: "9999px";
    };
    readonly zIndex: {
        readonly hide: -1;
        readonly auto: "auto";
        readonly base: 0;
        readonly docked: 10;
        readonly dropdown: 1000;
        readonly sticky: 1020;
        readonly banner: 1030;
        readonly overlay: 1040;
        readonly modal: 1050;
        readonly popover: 1060;
        readonly tooltip: 1070;
        readonly toast: 1080;
        readonly maximum: 2147483647;
    };
    readonly breakpoints: {
        readonly xs: "320px";
        readonly sm: "480px";
        readonly md: "768px";
        readonly lg: "1024px";
        readonly xl: "1280px";
        readonly '2xl': "1536px";
    };
    readonly animation: {
        readonly duration: {
            readonly instant: "0ms";
            readonly fast: "150ms";
            readonly normal: "200ms";
            readonly slow: "300ms";
            readonly slower: "500ms";
        };
        readonly easing: {
            readonly linear: "linear";
            readonly ease: "ease";
            readonly easeIn: "ease-in";
            readonly easeOut: "ease-out";
            readonly easeInOut: "ease-in-out";
            readonly smooth: "cubic-bezier(0.4, 0, 0.2, 1)";
            readonly bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
            readonly sharp: "cubic-bezier(0.4, 0, 0.6, 1)";
        };
        readonly transition: {
            readonly default: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)";
            readonly colors: "color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out";
            readonly shadow: "box-shadow 150ms ease-in-out";
            readonly transform: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)";
        };
        readonly components: {
            readonly button: "all 150ms ease-in-out";
            readonly modal: "opacity 200ms ease-in-out, transform 200ms ease-in-out";
            readonly tooltip: "opacity 150ms ease-in-out";
            readonly slide: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)";
        };
    };
    readonly sizes: {
        readonly button: {
            readonly sm: {
                readonly height: "2rem";
                readonly padding: "0.25rem 0.75rem";
                readonly fontSize: "0.875rem";
            };
            readonly md: {
                readonly height: "2.5rem";
                readonly padding: "0.5rem 1rem";
                readonly fontSize: "0.875rem";
            };
            readonly lg: {
                readonly height: "2.75rem";
                readonly padding: "0.5rem 1.25rem";
                readonly fontSize: "1rem";
            };
            readonly xl: {
                readonly height: "3rem";
                readonly padding: "0.75rem 1.5rem";
                readonly fontSize: "1rem";
            };
        };
        readonly input: {
            readonly sm: {
                readonly height: "2rem";
                readonly padding: "0.25rem 0.75rem";
                readonly fontSize: "0.875rem";
            };
            readonly md: {
                readonly height: "2.5rem";
                readonly padding: "0.5rem 0.75rem";
                readonly fontSize: "1rem";
            };
            readonly lg: {
                readonly height: "2.75rem";
                readonly padding: "0.5rem 1rem";
                readonly fontSize: "1rem";
            };
        };
        readonly avatar: {
            readonly xs: "1.5rem";
            readonly sm: "2rem";
            readonly md: "2.5rem";
            readonly lg: "3rem";
            readonly xl: "4rem";
            readonly '2xl': "5rem";
        };
        readonly icon: {
            readonly xs: "0.75rem";
            readonly sm: "1rem";
            readonly md: "1.25rem";
            readonly lg: "1.5rem";
            readonly xl: "2rem";
        };
        readonly container: {
            readonly sm: "640px";
            readonly md: "768px";
            readonly lg: "1024px";
            readonly xl: "1280px";
            readonly '2xl': "1536px";
            readonly content: "768px";
            readonly full: "100%";
        };
    };
    readonly accessibility: {
        readonly focus: {
            readonly ring: {
                readonly width: "2px";
                readonly color: "#2563EB";
                readonly offset: "2px";
                readonly style: "solid";
            };
            readonly shadow: "0 0 0 2px #2563EB";
            readonly outline: "2px solid #2563EB";
        };
        readonly touchTarget: {
            readonly minimum: "2.75rem";
            readonly comfortable: "3rem";
        };
        readonly highContrast: {
            readonly text: "#000000";
            readonly background: "#FFFFFF";
            readonly border: "#000000";
            readonly focus: "#0066CC";
        };
        readonly motion: {
            readonly reduced: {
                readonly transition: "none";
                readonly animation: "none";
            };
        };
    };
    readonly financial: {
        readonly complianceColors: {
            readonly excellent: "#059669";
            readonly good: "#10B981";
            readonly acceptable: "#F59E0B";
            readonly concerning: "#EF4444";
            readonly critical: "#DC2626";
        };
        readonly riskLevels: {
            readonly low: {
                readonly color: "#10B981";
                readonly background: "#ECFDF5";
            };
            readonly medium: {
                readonly color: "#F59E0B";
                readonly background: "#FFFBEB";
            };
            readonly high: {
                readonly color: "#EF4444";
                readonly background: "#FEF2F2";
            };
            readonly critical: {
                readonly color: "#DC2626";
                readonly background: "#FEF2F2";
            };
        };
        readonly platforms: {
            readonly whatsapp: {
                readonly primary: "#25D366";
                readonly secondary: "#128C7E";
                readonly background: "#E7FFDB";
            };
            readonly linkedin: {
                readonly primary: "#0A66C2";
                readonly secondary: "#004182";
                readonly background: "#E8F4FD";
            };
            readonly email: {
                readonly primary: "#6366F1";
                readonly secondary: "#4338CA";
                readonly background: "#EEF2FF";
            };
        };
        readonly contentStatus: {
            readonly draft: {
                readonly color: "#6B7280";
                readonly background: "#F9FAFB";
            };
            readonly pending: {
                readonly color: "#F59E0B";
                readonly background: "#FEF3C7";
            };
            readonly approved: {
                readonly color: "#10B981";
                readonly background: "#ECFDF5";
            };
            readonly rejected: {
                readonly color: "#EF4444";
                readonly background: "#FEF2F2";
            };
            readonly scheduled: {
                readonly color: "#3B82F6";
                readonly background: "#EFF6FF";
            };
            readonly delivered: {
                readonly color: "#10B981";
                readonly background: "#ECFDF5";
            };
        };
        readonly metrics: {
            readonly positive: "#10B981";
            readonly negative: "#EF4444";
            readonly neutral: "#6B7280";
            readonly benchmark: "#8B5CF6";
            readonly prediction: "#06B6D4";
        };
    };
    readonly components: {
        readonly button: {
            readonly borderRadius: "0.375rem";
            readonly fontWeight: 500;
            readonly transition: "all 150ms ease-in-out";
            readonly sizes: {
                readonly sm: {
                    readonly height: "2rem";
                    readonly padding: "0.25rem 0.75rem";
                    readonly fontSize: "0.875rem";
                };
                readonly md: {
                    readonly height: "2.5rem";
                    readonly padding: "0.5rem 1rem";
                    readonly fontSize: "0.875rem";
                };
                readonly lg: {
                    readonly height: "2.75rem";
                    readonly padding: "0.5rem 1.25rem";
                    readonly fontSize: "1rem";
                };
                readonly xl: {
                    readonly height: "3rem";
                    readonly padding: "0.75rem 1.5rem";
                    readonly fontSize: "1rem";
                };
            };
            readonly shadows: {
                readonly default: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
                readonly hover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                readonly active: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)";
            };
        };
        readonly card: {
            readonly borderRadius: "0.5rem";
            readonly padding: "1.5rem";
            readonly shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)";
            readonly background: "#FFFFFF";
            readonly border: "1px solid #E5E7EB";
        };
        readonly input: {
            readonly borderRadius: "0.375rem";
            readonly border: "1px solid #E5E7EB";
            readonly focusBorder: "1px solid #2563EB";
            readonly shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
            readonly focusShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)";
            readonly sizes: {
                readonly sm: {
                    readonly height: "2rem";
                    readonly padding: "0.25rem 0.75rem";
                    readonly fontSize: "0.875rem";
                };
                readonly md: {
                    readonly height: "2.5rem";
                    readonly padding: "0.5rem 0.75rem";
                    readonly fontSize: "1rem";
                };
                readonly lg: {
                    readonly height: "2.75rem";
                    readonly padding: "0.5rem 1rem";
                    readonly fontSize: "1rem";
                };
            };
        };
        readonly modal: {
            readonly borderRadius: "0.75rem";
            readonly shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
            readonly overlay: "rgba(0, 0, 0, 0.5)";
            readonly background: "#FFFFFF";
            readonly padding: "1.5rem";
        };
        readonly navigation: {
            readonly height: "4rem";
            readonly padding: "0.75rem 1rem";
            readonly background: "#FFFFFF";
            readonly border: "1px solid #E5E7EB";
            readonly shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        };
        readonly typography: {
            readonly heading: {
                readonly fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
                readonly fontWeight: 600;
                readonly lineHeight: 1.25;
                readonly color: "#111827";
            };
            readonly body: {
                readonly fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
                readonly fontWeight: 400;
                readonly lineHeight: 1.5;
                readonly color: "#111827";
            };
            readonly caption: {
                readonly fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
                readonly fontWeight: 400;
                readonly lineHeight: 1.5;
                readonly color: "#4B5563";
            };
        };
    };
};
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Shadows = typeof shadows;
export type BorderRadius = typeof borderRadius;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
export type Animation = typeof animation;
export type Sizes = typeof sizes;
export type Accessibility = typeof accessibility;
export type Financial = typeof financial;
export type Components = typeof components;
export default theme;
