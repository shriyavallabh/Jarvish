import type { Meta, StoryObj } from '@storybook/react'
import { Badge, ComplianceBadge, StatusBadge } from './badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline', 'premium', 'compliance', 'compliance-warning', 'compliance-error'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Premium: Story = {
  args: {
    variant: 'premium',
    children: 'Premium',
  },
}

export const Compliance: Story = {
  args: {
    variant: 'compliance',
    children: 'SEBI Compliant',
  },
}

export const ComplianceScore: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <ComplianceBadge score={98} />
      <ComplianceBadge score={85} />
      <ComplianceBadge score={72} />
      <ComplianceBadge score={45} />
    </div>
  ),
}

export const Status: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <StatusBadge status="approved" />
      <StatusBadge status="pending" />
      <StatusBadge status="rejected" />
      <StatusBadge status="scheduled" />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="premium">Premium</Badge>
      <Badge variant="compliance">Compliance</Badge>
      <Badge variant="compliance-warning">Warning</Badge>
      <Badge variant="compliance-error">Error</Badge>
    </div>
  ),
}