# Journey Timeline Component - Integration Guide

## Overview
A sophisticated, multi-variant journey timeline component designed for the Jarvish FinTech platform. This component visualizes the advisor onboarding journey from setup to scale in 30 days.

## Component Variants

### 1. Horizontal Timeline (Hero)
**Use Case:** Landing page hero sections, onboarding flows
**Features:**
- Full-width responsive layout
- Animated progress bar
- Interactive step markers with hover effects
- Gradient backgrounds and professional styling

### 2. Vertical Timeline (Sidebar)
**Use Case:** Dashboard sidebars, progress tracking panels
**Features:**
- Compact vertical layout
- Space-efficient design
- Real-time progress visualization
- Perfect for navigation sidebars

### 3. Compact Progress Indicator
**Use Case:** Admin dashboards, overview screens
**Features:**
- Minimal height footprint
- At-a-glance progress tracking
- Grid-based detail view
- Status indicators

## Installation & Setup

### 1. Install Dependencies
```bash
npm install clsx tailwind-merge
# or
yarn add clsx tailwind-merge
```

### 2. Add Utility Function
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3. Update Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: '#0B1F33',
        gold: '#CEA200',
        cta: '#0C310C',
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': {
            'box-shadow': '0 0 0 0 rgba(206, 162, 0, 0.4)',
          },
          '50%': {
            'box-shadow': '0 0 0 20px rgba(206, 162, 0, 0)',
          },
        },
      },
    },
  },
}
```

## Usage Examples

### Basic Implementation
```tsx
import { JourneyTimeline } from '@/components/JourneyTimeline';

function LandingPage() {
  return (
    <JourneyTimeline 
      variant="horizontal"
      animated={true}
      onStepClick={(stepId, index) => {
        console.log(`Step ${stepId} clicked at index ${index}`);
      }}
    />
  );
}
```

### Custom Steps
```tsx
const customSteps = [
  {
    id: 'register',
    title: 'Registration',
    description: 'Create account and verify SEBI registration',
    duration: 'Day 1',
    status: 'completed',
    dayRange: [1, 1]
  },
  {
    id: 'kyc',
    title: 'KYC Verification',
    description: 'Complete KYC and compliance checks',
    duration: 'Day 2-3',
    status: 'active',
    dayRange: [2, 3]
  },
  // ... more steps
];

<JourneyTimeline 
  variant="vertical"
  steps={customSteps}
  currentStep={1}
/>
```

### Dashboard Integration
```tsx
function AdvisorDashboard() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar with vertical timeline */}
      <aside className="col-span-3">
        <JourneyTimeline variant="vertical" />
      </aside>
      
      {/* Main content */}
      <main className="col-span-9">
        {/* Dashboard content */}
      </main>
    </div>
  );
}
```

### Admin Overview
```tsx
function AdminDashboard() {
  const advisors = useAdvisors();
  
  return (
    <div className="space-y-4">
      {advisors.map(advisor => (
        <div key={advisor.id} className="bg-white rounded-lg p-4">
          <h4>{advisor.name}</h4>
          <JourneyTimeline 
            variant="compact"
            steps={advisor.onboardingSteps}
            className="mt-2"
          />
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'horizontal' \| 'vertical' \| 'compact'` | `'horizontal'` | Timeline layout variant |
| steps | `TimelineStep[]` | Default journey steps | Array of timeline steps |
| currentStep | `number` | Calculated from steps | Currently active step index |
| onStepClick | `(stepId: string, index: number) => void` | undefined | Callback when step is clicked |
| className | `string` | undefined | Additional CSS classes |
| animated | `boolean` | `true` | Enable/disable animations |

### TimelineStep Interface
```typescript
interface TimelineStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'pending' | 'active' | 'completed';
  dayRange: [number, number];
}
```

## Styling Customization

### CSS Variables
```css
:root {
  --timeline-primary: #0B1F33;
  --timeline-accent: #CEA200;
  --timeline-success: #0C310C;
  --timeline-border: #E2E8F0;
  --timeline-surface: #FAFBFC;
}
```

### Custom Theme
```tsx
<JourneyTimeline 
  variant="horizontal"
  className="custom-timeline"
/>

/* Custom CSS */
.custom-timeline {
  --gradient-start: #your-color;
  --gradient-end: #your-color;
}
```

## Accessibility Features

- **WCAG 2.1 AA Compliant**: Proper color contrast ratios
- **Keyboard Navigation**: Full keyboard support with Enter/Space activation
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Indicators**: Clear focus states for all interactive elements
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

## Performance Optimization

### Bundle Size
- **Component**: ~8KB minified
- **Styles**: ~4KB minified
- **Total**: <15KB gzipped

### Best Practices
1. Use `React.memo()` for parent components
2. Implement virtual scrolling for multiple timelines
3. Lazy load for below-the-fold content
4. Use CSS containment for better paint performance

## Mobile Responsiveness

### Breakpoints
- **Desktop**: ≥1280px - Full horizontal layout
- **Tablet**: 768px-1279px - Adjusted spacing and sizing
- **Mobile**: ≤767px - Vertical stack for horizontal variant

### Touch Optimization
- 44px minimum touch targets
- Swipe gestures for mobile navigation
- Haptic feedback on supported devices

## Integration with Backend

### API Integration Example
```tsx
function ConnectedTimeline() {
  const { data: steps, loading } = useQuery(GET_ONBOARDING_STEPS);
  
  if (loading) return <TimelineSkeleton />;
  
  return (
    <JourneyTimeline 
      steps={steps}
      onStepClick={async (stepId) => {
        await updateStep(stepId);
      }}
    />
  );
}
```

### WebSocket Updates
```tsx
useEffect(() => {
  const ws = new WebSocket('wss://api.jarvish.ai/timeline');
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    setSteps(prev => updateStepStatus(prev, update));
  };
  
  return () => ws.close();
}, []);
```

## Troubleshooting

### Common Issues

1. **Animations not working**
   - Ensure Tailwind animations are configured
   - Check if `animated` prop is set to true

2. **Styling conflicts**
   - Use CSS modules or styled-components for isolation
   - Check specificity of custom styles

3. **Performance issues**
   - Reduce animation complexity on low-end devices
   - Implement progressive enhancement

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## License & Credits

Component designed and developed for Jarvish FinTech Platform
Design tokens aligned with brand guidelines
Optimized for Indian financial advisory market