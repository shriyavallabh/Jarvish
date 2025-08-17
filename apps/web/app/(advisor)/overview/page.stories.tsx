import type { Meta, StoryObj } from '@storybook/react'
import AdvisorOverviewPage from './page'

const meta = {
  title: 'Pages/AdvisorOverview',
  component: AdvisorOverviewPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AdvisorOverviewPage>

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