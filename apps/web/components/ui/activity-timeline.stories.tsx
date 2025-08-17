import type { Meta, StoryObj } from '@storybook/react'
import { ActivityTimeline } from './activity-timeline'
import { mockActivities } from '@/lib/mock/data'

const meta = {
  title: 'UI/ActivityTimeline',
  component: ActivityTimeline,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    activities: mockActivities.slice(0, 4),
    title: 'Recent Activity',
  },
}

export const ShowAll: Story = {
  args: {
    activities: mockActivities,
    title: 'All Activities',
    showAll: true,
  },
}

export const CustomTitle: Story = {
  args: {
    activities: mockActivities.slice(0, 3),
    title: 'System Events',
  },
}

export const SingleActivity: Story = {
  args: {
    activities: [mockActivities[0]],
    title: 'Latest Update',
  },
}

export const MixedSeverity: Story = {
  args: {
    activities: [
      mockActivities.find(a => a.severity === 'success')!,
      mockActivities.find(a => a.severity === 'warning')!,
      mockActivities.find(a => a.severity === 'error')!,
      mockActivities.find(a => a.severity === 'info')!,
    ],
    title: 'Activity Log',
  },
}