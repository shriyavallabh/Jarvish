# Project One Storybook Stories

This directory contains Storybook stories for the Project One financial advisor platform components and pages. The stories are organized to demonstrate all key user scenarios and component states.

## Story Organization

### Pages
- **Dashboard.stories.ts** - Main advisor dashboard with compliance overview
- **ContentCreator.stories.ts** - AI-powered content creation studio
- **AdminApproval.stories.ts** - Admin workflow for content approval

### Components
- **ComplianceIndicator.stories.ts** - SEBI compliance scoring component
- **WhatsAppPreview.stories.ts** - WhatsApp message preview component

## Key Scenarios Covered

### Financial Services Contexts
- SEBI compliance states (low, medium, high, critical risk)
- Multi-language content (English, Hindi, Marathi)
- Pro tier advisor branding
- Regulatory disclaimer requirements

### User Workflows
- Daily advisor dashboard views
- Real-time content creation with AI assistance
- Admin approval queue management
- Compliance violation handling

### Device Responsiveness
- Mobile-first advisor workflows
- Desktop admin interfaces
- Cross-platform consistency

## Running Storybook

```bash
npm run storybook
```

## Story Development Guidelines

1. **Financial Services Focus**: All stories should reflect the professional, compliance-focused nature of financial advisory services
2. **Real Data Scenarios**: Use realistic financial content, advisor names, and compliance scenarios
3. **Accessibility**: Include stories testing screen reader support, keyboard navigation, and reduced motion
4. **Error States**: Cover loading, error, and empty states for robust UX testing
5. **Compliance States**: Always include various compliance risk levels and violation scenarios

## Component Documentation

Each story includes:
- Component description and usage context
- Props documentation with controls
- Accessibility considerations
- Mobile and desktop viewport testing
- Financial services compliance notes

This story collection enables comprehensive testing of the platform's UI components in isolation while maintaining the context of financial advisor workflows and regulatory requirements.