# Jarvish Premium Theme Implementation Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install @radix-ui/themes tailwindcss framer-motion
npm install -D @types/node
```

### 2. Include Design Tokens
```html
<!-- In your HTML head -->
<link rel="stylesheet" href="/design-tokens.css">
```

### 3. Initialize Theme System
```typescript
import { utils } from './component-specifications';

// On app initialization
const theme = utils.detectPreferredTheme();
utils.setTheme(theme);
```

## Theme Structure

### Available Themes
1. **Executive Clarity** - Default light theme for senior RIAs
2. **Trust Builder** - Traditional bank-like interface
3. **Growth Catalyst** - Energetic theme for young advisors
4. **Premium Professional** - Luxury feel with gold accents
5. **Innovation Forward** - Tech-savvy with AI aesthetics
6. **Midnight Executive** - Dark theme for late workers
7. **Stealth Wealth** - Understated luxury dark theme
8. **Focus Flow** - Distraction-free content creation
9. **Elite Trader** - Bloomberg-inspired trading interface
10. **Quantum Professional** - Futuristic AI-native design

## Implementation Examples

### Button Component with Theme Support
```tsx
import { buttonVariants, buttonSizes } from './component-specifications';

interface ButtonProps {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick
}) => {
  const className = `${buttonVariants[variant]} ${buttonSizes[size]}`;
  
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
};
```

### Card Component with Theme Support
```tsx
import { cardVariants } from './component-specifications';

interface CardProps {
  variant?: keyof typeof cardVariants;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children
}) => {
  return (
    <div className={cardVariants[variant]}>
      {children}
    </div>
  );
};
```

### Theme Switcher Component
```tsx
import { utils } from './component-specifications';

const themes = [
  { id: 'executive-clarity', name: 'Executive Clarity', type: 'light' },
  { id: 'trust-builder', name: 'Trust Builder', type: 'light' },
  { id: 'growth-catalyst', name: 'Growth Catalyst', type: 'light' },
  { id: 'premium-professional', name: 'Premium Professional', type: 'light' },
  { id: 'innovation-forward', name: 'Innovation Forward', type: 'light' },
  { id: 'midnight-executive', name: 'Midnight Executive', type: 'dark' },
  { id: 'stealth-wealth', name: 'Stealth Wealth', type: 'dark' },
  { id: 'focus-flow', name: 'Focus Flow', type: 'dark' },
  { id: 'elite-trader', name: 'Elite Trader', type: 'dark' },
  { id: 'quantum-professional', name: 'Quantum Professional', type: 'dark' },
];

export const ThemeSwitcher = () => {
  const [currentTheme, setCurrentTheme] = useState(utils.getCurrentTheme());

  const handleThemeChange = (themeId: string) => {
    utils.setTheme(themeId);
    setCurrentTheme(themeId);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {themes.map(theme => (
        <button
          key={theme.id}
          onClick={() => handleThemeChange(theme.id)}
          className={`
            px-4 py-2 rounded-lg border-2 transition-all
            ${currentTheme === theme.id 
              ? 'border-[var(--color-accent)] bg-[var(--color-surface)]' 
              : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'}
          `}
        >
          <span className="block text-sm font-medium">{theme.name}</span>
          <span className="block text-xs opacity-60">{theme.type}</span>
        </button>
      ))}
    </div>
  );
};
```

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        h1: 'var(--text-h1)',
        h2: 'var(--text-h2)',
        h3: 'var(--text-h3)',
        h4: 'var(--text-h4)',
        body: 'var(--text-body)',
        small: 'var(--text-small)',
        caption: 'var(--text-caption)',
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        focus: 'var(--shadow-focus)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'loading': 'loading 1.5s linear infinite',
        'holo-shift': 'holo-shift 3s ease infinite',
      },
    },
  },
  plugins: [],
};
```

## Mobile Responsive Implementation

### Responsive Navigation
```tsx
const Navigation = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <nav className={navigationComponents.mobileMenu}>
        {/* Mobile navigation items */}
      </nav>
    );
  }

  return (
    <nav className={navigationComponents.sidebar}>
      {/* Desktop navigation items */}
    </nav>
  );
};
```

### Touch-Optimized Components
```tsx
const MobileButton = ({ children, onClick }) => {
  return (
    <button
      className="min-h-[44px] min-w-[44px] touch-manipulation"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## Financial Component Examples

### SEBI Compliance Badge
```tsx
import { badgeComponents } from './component-specifications';

const SEBIBadge = ({ registrationNumber }) => {
  return (
    <div className={badgeComponents.sebiCompliance}>
      <svg className="w-4 h-4 mr-1" /* checkmark icon *//>
      <span>SEBI REG: {registrationNumber}</span>
    </div>
  );
};
```

### Risk Score Indicator
```tsx
const RiskScoreIndicator = ({ score, maxScore = 100 }) => {
  const percentage = (score / maxScore) * 100;
  const color = percentage < 30 ? 'green' : percentage < 70 ? 'amber' : 'red';
  
  return (
    <div className={financialComponents.riskIndicator}>
      <svg className="absolute inset-0">
        <circle
          cx="64"
          cy="64"
          r="60"
          stroke={`var(--color-${color})`}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${percentage * 3.77} 377`}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <span className="text-2xl font-bold">{score}</span>
    </div>
  );
};
```

### Portfolio Performance Card
```tsx
const PortfolioCard = ({ title, value, change, trend }) => {
  return (
    <div className={financialComponents.portfolioCard}>
      <h3 className="text-sm text-secondary mb-2">{title}</h3>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold">{value}</span>
        <span className={trend === 'up' ? financialComponents.priceUp : financialComponents.priceDown}>
          {change}
        </span>
      </div>
    </div>
  );
};
```

## Performance Optimization

### Lazy Load Themes
```typescript
const loadTheme = async (themeName: string) => {
  // Only load theme-specific assets when needed
  if (themeName.includes('quantum')) {
    await import('./themes/quantum-animations.css');
  }
  if (themeName.includes('trader')) {
    await import('./themes/trader-grid.css');
  }
};
```

### Critical CSS
```html
<!-- Inline critical theme variables -->
<style>
  :root {
    --color-primary: #0B1F33;
    --color-background: #FFFFFF;
    --color-accent: #CEA200;
    /* Include only critical variables for first paint */
  }
</style>
```

## Accessibility Considerations

### Focus Management
```css
/* Ensure focus is always visible */
*:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --border-width: 2px;
    --shadow-focus: 0 0 0 4px var(--color-accent);
  }
}
```

### Screen Reader Support
```tsx
const ComplianceIndicator = ({ status }) => {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Compliance status: {status}</span>
      <div className={`compliance-indicator ${status}`} aria-hidden="true">
        {/* Visual indicator */}
      </div>
    </div>
  );
};
```

## Testing Checklist

- [ ] All themes load correctly
- [ ] Theme switching is smooth (< 100ms)
- [ ] Mobile responsiveness works on all themes
- [ ] Touch targets are minimum 44x44px
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Animations respect prefers-reduced-motion
- [ ] Print styles work correctly
- [ ] Theme persists across sessions
- [ ] Components render correctly in all themes
- [ ] Performance metrics meet targets (LCP < 2.5s)

## Brand Compliance Verification

### Required Elements Per Theme
- Fraunces font for all headlines ✓
- Poppins font for all body text ✓
- Gold accent (#CEA200) present ✓
- CTA green (#0C310C) for positive actions ✓
- SEBI compliance indicators visible ✓
- Mobile-first responsive design ✓
- Professional financial aesthetic ✓

## Deployment Notes

1. **Font Loading**: Ensure Fraunces and Poppins are loaded before rendering
2. **Theme Persistence**: Store user preference in localStorage
3. **Performance**: Use CSS variables for instant theme switching
4. **Mobile**: Test on real devices, not just browser emulation
5. **Accessibility**: Run automated accessibility tests on all themes

## Support & Maintenance

- Theme updates should maintain backward compatibility
- New themes must follow the established token structure
- Component updates must be tested across all themes
- Monitor theme usage analytics to optimize defaults

This implementation guide ensures consistent, performant, and accessible theme implementation across the Jarvish platform.