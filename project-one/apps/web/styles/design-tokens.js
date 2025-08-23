/**
 * JARVISH DESIGN TOKENS
 * Professional Financial Advisory Platform
 * 
 * Three distinct visual themes for different sections:
 * 1. Landing Page - Executive Clarity
 * 2. Admin Dashboard - Premium Professional
 * 3. Advisor Dashboard - Premium Professional
 */

export const designTokens = {
  // ==========================================
  // LANDING PAGE (Executive Clarity Theme)
  // ==========================================
  landing: {
    colors: {
      ink: '#0B1F33',        // Primary text, sophisticated navy
      gold: '#CEA200',       // Premium accent, trust gold
      cta: '#0C310C',        // Call-to-action, deep green
      bg: '#FFFFFF',         // Clean white background
      textPrimary: '#0B1F33',
      textSecondary: '#4A5568',
      textLight: '#718096',
    },
    
    typography: {
      fontHeading: "'Fraunces', serif",
      fontBody: "'Poppins', sans-serif",
      weights: {
        heading: [700, 900],
        body: [300, 400, 500, 600, 700],
      },
      sizes: {
        h1: 'clamp(2.5rem, 5vw, 4rem)',
        h2: 'clamp(2rem, 4vw, 3rem)',
        h3: 'clamp(1.5rem, 3vw, 2rem)',
        body: '1.125rem',
      },
    },
    
    gradients: {
      primary: 'linear-gradient(135deg, #0B1F33 0%, #1A365D 100%)',
      gold: 'linear-gradient(135deg, #CEA200 0%, #FFC700 50%, #CEA200 100%)',
      text: 'linear-gradient(135deg, #0B1F33 0%, #2C5282 50%, #0B1F33 100%)',
    },
    
    shadows: {
      sm: '0 1px 3px rgba(11, 31, 51, 0.08)',
      md: '0 4px 6px rgba(11, 31, 51, 0.1)',
      lg: '0 10px 15px rgba(11, 31, 51, 0.12)',
      xl: '0 20px 25px rgba(11, 31, 51, 0.15)',
      gold: '0 4px 14px rgba(206, 162, 0, 0.25)',
    },
  },
  
  // ==========================================
  // ADMIN DASHBOARD (Premium Professional)
  // ==========================================
  admin: {
    colors: {
      primary: '#0f172a',     // Deep slate, professional
      secondary: '#1e293b',   // Slate gray
      accent: '#d4af37',      // Premium gold accent
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F8FAFC',
      bgDark: '#0f172a',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textLight: '#94A3B8',
      textOnDark: '#F1F5F9',
    },
    
    typography: {
      fontPrimary: "'Inter', sans-serif",
      fontDisplay: "'Inter', sans-serif",
      weights: [300, 400, 500, 600, 700, 800],
      sizes: {
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.5rem',
        body: '0.875rem',
      },
    },
    
    gradients: {
      dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      accent: 'linear-gradient(135deg, #d4af37 0%, #FFD700 50%, #d4af37 100%)',
      premium: 'linear-gradient(135deg, #d4af37 0%, #F59E0B 100%)',
    },
    
    shadows: {
      sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
      md: '0 4px 6px rgba(15, 23, 42, 0.08)',
      lg: '0 10px 15px rgba(15, 23, 42, 0.1)',
      xl: '0 20px 25px rgba(15, 23, 42, 0.12)',
      gold: '0 0 20px rgba(212, 175, 55, 0.2)',
    },
  },
  
  // ==========================================
  // ADVISOR DASHBOARD (Premium Professional)
  // ==========================================
  advisor: {
    colors: {
      primary: '#0f172a',     // Deep slate
      secondary: '#d97706',   // Amber accent
      accent: '#0891b2',      // Cyan accent
      gold: '#fbbf24',        // Bright gold
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F8FAFC',
      bgCard: '#FFFFFF',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textLight: '#94A3B8',
    },
    
    typography: {
      fontHeading: "'Playfair Display', serif",
      fontBody: "'Inter', sans-serif",
      weights: {
        heading: [400, 700, 900],
        body: [300, 400, 500, 600, 700, 800],
      },
      sizes: {
        h1: '3rem',
        h2: '2.25rem',
        h3: '1.5rem',
        body: '0.875rem',
      },
    },
    
    gradients: {
      header: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      gold: 'linear-gradient(90deg, #FFA500, #FFD700, #FFA500)',
      premium: 'linear-gradient(135deg, #fbbf24 0%, #F59E0B 100%)',
    },
    
    shadows: {
      sm: '0 1px 3px rgba(15, 23, 42, 0.08)',
      md: '0 4px 6px rgba(15, 23, 42, 0.1)',
      lg: '0 10px 15px rgba(15, 23, 42, 0.12)',
      xl: '0 20px 25px rgba(15, 23, 42, 0.15)',
      premium: '0 4px 20px rgba(251, 191, 36, 0.25)',
    },
  },
  
  // ==========================================
  // SHARED SPACING SYSTEM
  // ==========================================
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
    '2xl': '4rem',   // 64px
    '3xl': '6rem',   // 96px
  },
  
  // ==========================================
  // RESPONSIVE BREAKPOINTS
  // ==========================================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // ==========================================
  // PROFESSIONAL ICON SYSTEM (No Emojis)
  // ==========================================
  icons: {
    check: '✓',     // Success/Complete
    star: '★',      // Premium/Featured
    arrow: '→',     // Direction/Action
    shield: '◈',    // Security/Trust
    lock: '⬢',      // Locked/Secure
    bullet: '•',    // List item
    dash: '—',      // Separator
    plus: '+',      // Add/Expand
    minus: '−',     // Remove/Collapse
    close: '×',     // Close/Cancel
  },
  
  // ==========================================
  // ANIMATION TIMINGS
  // ==========================================
  animations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Export as default for ES6 imports
export default designTokens;