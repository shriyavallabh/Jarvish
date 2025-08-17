import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Download, CheckSquare, MessageSquare } from 'lucide-react'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'premium', 'whatsapp', 'compliance'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Premium: Story = {
  args: {
    variant: 'premium',
    children: 'Premium Feature',
  },
}

export const WhatsApp: Story = {
  args: {
    variant: 'whatsapp',
    children: 'Send to WhatsApp',
  },
}

export const Compliance: Story = {
  args: {
    variant: 'compliance',
    children: 'SEBI Compliant',
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'premium',
    children: (
      <>
        <Download className="h-4 w-4 mr-2" />
        Download Report
      </>
    ),
  },
}

export const IconButton: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <CheckSquare className="h-4 w-4" />,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="premium">Premium</Button>
      <Button variant="whatsapp">WhatsApp</Button>
      <Button variant="compliance">Compliance</Button>
    </div>
  ),
}