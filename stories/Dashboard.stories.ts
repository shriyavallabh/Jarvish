import type { Meta, StoryObj } from '@storybook/react';
import { Dashboard } from '../apps/web/components/Dashboard';

const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main advisor dashboard with daily content overview, compliance status, and quick actions for content creation and delivery management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    advisorId: {
      control: 'text',
      description: 'Unique advisor identifier for personalization',
    },
    view: {
      control: { type: 'select' },
      options: ['overview', 'today', 'pending', 'analytics'],
      description: 'Dashboard view mode',
    },
    complianceLevel: {
      control: { type: 'select' },
      options: ['low', 'medium', 'high', 'critical'],
      description: 'Current compliance risk level',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default advisor dashboard view
export const Default: Story = {
  args: {
    advisorId: 'advisor-001',
    view: 'overview',
    complianceLevel: 'low',
  },
};

// Today's content focus view
export const TodayView: Story = {
  args: {
    advisorId: 'advisor-001',
    view: 'today',
    complianceLevel: 'low',
  },
};

// High compliance risk state
export const HighRisk: Story = {
  args: {
    advisorId: 'advisor-001',
    view: 'overview',
    complianceLevel: 'high',
  },
};

// Mobile viewport
export const Mobile: Story = {
  args: {
    advisorId: 'advisor-001',
    view: 'overview',
    complianceLevel: 'low',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Analytics view
export const Analytics: Story = {
  args: {
    advisorId: 'advisor-001',
    view: 'analytics',
    complianceLevel: 'low',
  },
};