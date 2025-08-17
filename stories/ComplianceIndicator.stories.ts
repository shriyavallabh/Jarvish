import type { Meta, StoryObj } from '@storybook/react';
import { ComplianceIndicator } from '../apps/web/components/ComplianceIndicator';

const meta: Meta<typeof ComplianceIndicator> = {
  title: 'Components/ComplianceIndicator',
  component: ComplianceIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Real-time SEBI compliance scoring indicator with visual feedback, violation details, and improvement suggestions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    score: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Compliance score (0-100)',
    },
    riskLevel: {
      control: { type: 'select' },
      options: ['low', 'medium', 'high', 'critical'],
      description: 'Risk level assessment',
    },
    violations: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Number of violations detected',
    },
    showDetails: {
      control: 'boolean',
      description: 'Show detailed violation breakdown',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Indicator size',
    },
    animated: {
      control: 'boolean',
      description: 'Enable score change animations',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Perfect compliance score
export const Perfect: Story = {
  args: {
    score: 100,
    riskLevel: 'low',
    violations: 0,
    showDetails: false,
    size: 'md',
    animated: true,
  },
};

// Good compliance with minor issues
export const Good: Story = {
  args: {
    score: 85,
    riskLevel: 'low',
    violations: 1,
    showDetails: true,
    size: 'md',
    animated: true,
  },
};

// Medium risk compliance
export const MediumRisk: Story = {
  args: {
    score: 65,
    riskLevel: 'medium',
    violations: 3,
    showDetails: true,
    size: 'md',
    animated: true,
  },
};

// High risk compliance
export const HighRisk: Story = {
  args: {
    score: 35,
    riskLevel: 'high',
    violations: 6,
    showDetails: true,
    size: 'md',
    animated: true,
  },
};

// Critical compliance violations
export const Critical: Story = {
  args: {
    score: 15,
    riskLevel: 'critical',
    violations: 8,
    showDetails: true,
    size: 'md',
    animated: true,
  },
};

// Small size variant
export const Small: Story = {
  args: {
    score: 78,
    riskLevel: 'low',
    violations: 2,
    showDetails: false,
    size: 'sm',
    animated: false,
  },
};

// Large size variant
export const Large: Story = {
  args: {
    score: 42,
    riskLevel: 'high',
    violations: 5,
    showDetails: true,
    size: 'lg',
    animated: true,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    score: 0,
    riskLevel: 'low',
    violations: 0,
    showDetails: false,
    size: 'md',
    animated: true,
  },
};