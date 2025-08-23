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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Executive Clarity Theme (Landing Page)
        'hubix-ink': '#0B1F33',
        'hubix-gold': '#CEA200',
        'hubix-cta': '#0C310C',
        'hubix-success': '#198754',
        'hubix-gray': {
          100: '#F7F8FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
        },
        // Premium Professional Theme (Admin)
        'admin-primary': '#0f172a',
        'admin-secondary': '#1e293b',
        'admin-accent': '#d4af37',
        'admin-accent-light': '#f4e4bc',
        'admin-success': '#065f46',
        'admin-warning': '#b45309',
        'admin-danger': '#991b1b',
        'admin-surface': '#fafaf9',
        'admin-border': '#e7e5e4',
        // Advisor Dashboard Theme
        'advisor-primary': '#0f172a',
        'advisor-accent': '#fbbf24',
        // SEBI Compliance colors
        'compliance-low': '#10B981',
        'compliance-medium': '#F59E0B',
        'compliance-high': '#EF4444',
        'compliance-critical': '#DC2626',
        // WhatsApp Brand
        'whatsapp': '#25D366',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        // Specific font stacks for different themes
        'executive': ['Fraunces', 'serif'],
        'body': ['Poppins', 'sans-serif'],
        'admin': ['Helvetica Neue', '-apple-system', 'sans-serif'],
        'advisor': ['Inter', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'financial-xs': '0.75rem',
        'financial-sm': '0.875rem',
        'financial-base': '1rem',
        'financial-lg': '1.125rem',
        'financial-xl': '1.25rem',
        'financial-2xl': '1.5rem',
        'financial-3xl': '1.875rem',
        'financial-4xl': '2.25rem',
        'financial-5xl': '3rem',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}