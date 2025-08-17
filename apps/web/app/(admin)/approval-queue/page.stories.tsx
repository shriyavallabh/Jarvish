import type { Meta, StoryObj } from '@storybook/react'
import AdminApprovalQueuePage from './page'

const meta = {
  title: 'Pages/AdminApprovalQueue',
  component: AdminApprovalQueuePage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AdminApprovalQueuePage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}