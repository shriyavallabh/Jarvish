import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './header'

const meta = {
  title: 'UI/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['landing', 'admin', 'advisor'],
    },
  },
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Landing: Story = {
  args: {
    variant: 'landing',
  },
}

export const Admin: Story = {
  args: {
    variant: 'admin',
    user: {
      name: 'Admin User',
      tier: 'elite',
    },
  },
}

export const AdvisorBasic: Story = {
  args: {
    variant: 'advisor',
    user: {
      name: 'Rajesh Kumar',
      tier: 'basic',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=RK',
    },
  },
}

export const AdvisorPremium: Story = {
  args: {
    variant: 'advisor',
    user: {
      name: 'Priya Sharma',
      tier: 'premium',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PS',
    },
  },
}

export const AdvisorElite: Story = {
  args: {
    variant: 'advisor',
    user: {
      name: 'Amit Patel',
      tier: 'elite',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Landing Page Header</h3>
        <Header variant="landing" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Admin Header</h3>
        <Header 
          variant="admin" 
          user={{
            name: 'Admin User',
            tier: 'elite',
          }}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Advisor Header (Elite)</h3>
        <Header 
          variant="advisor" 
          user={{
            name: 'Amit Patel',
            tier: 'elite',
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
          }}
        />
      </div>
    </div>
  ),
}