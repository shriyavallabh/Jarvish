import type { Meta, StoryObj } from '@storybook/react';
import { AdminApproval } from '../apps/web/components/AdminApproval';

const meta: Meta<typeof AdminApproval> = {
  title: 'Pages/AdminApproval',
  component: AdminApproval,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Admin approval workflow for reviewing advisor-generated content with compliance scoring, batch operations, and escalation management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    view: {
      control: { type: 'select' },
      options: ['queue', 'review', 'history', 'escalations'],
      description: 'Admin workflow view',
    },
    priorityFilter: {
      control: { type: 'select' },
      options: ['all', 'high-risk', 'pending', 'escalated'],
      description: 'Content priority filter',
    },
    batchMode: {
      control: 'boolean',
      description: 'Enable batch approval operations',
    },
    queueSize: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Number of items in approval queue',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default approval queue view
export const Default: Story = {
  args: {
    view: 'queue',
    priorityFilter: 'all',
    batchMode: false,
    queueSize: 15,
  },
};

// High-risk content filter
export const HighRiskFilter: Story = {
  args: {
    view: 'queue',
    priorityFilter: 'high-risk',
    batchMode: false,
    queueSize: 8,
  },
};

// Batch approval mode
export const BatchMode: Story = {
  args: {
    view: 'queue',
    priorityFilter: 'all',
    batchMode: true,
    queueSize: 25,
  },
};

// Content review detail view
export const ReviewDetail: Story = {
  args: {
    view: 'review',
    priorityFilter: 'all',
    batchMode: false,
    queueSize: 15,
  },
};

// Escalations management
export const Escalations: Story = {
  args: {
    view: 'escalations',
    priorityFilter: 'escalated',
    batchMode: false,
    queueSize: 3,
  },
};

// Empty queue state
export const EmptyQueue: Story = {
  args: {
    view: 'queue',
    priorityFilter: 'all',
    batchMode: false,
    queueSize: 0,
  },
};

// Full queue state
export const FullQueue: Story = {
  args: {
    view: 'queue',
    priorityFilter: 'all',
    batchMode: true,
    queueSize: 100,
  },
};