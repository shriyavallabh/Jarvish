import type { Meta, StoryObj } from '@storybook/react';
import { ContentCreator } from '../apps/web/components/ContentCreator';

const meta: Meta<typeof ContentCreator> = {
  title: 'Pages/ContentCreator',
  component: ContentCreator,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'AI-powered content creation studio with real-time SEBI compliance checking, WhatsApp preview, and multi-language support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['create', 'edit', 'review'],
      description: 'Content creation mode',
    },
    contentType: {
      control: { type: 'select' },
      options: ['market-update', 'educational', 'product-spotlight', 'regulatory'],
      description: 'Type of content being created',
    },
    aiAssistanceLevel: {
      control: { type: 'select' },
      options: ['minimal', 'standard', 'enhanced'],
      description: 'Level of AI assistance',
    },
    language: {
      control: { type: 'select' },
      options: ['en', 'hi', 'mr'],
      description: 'Content language',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default content creation view
export const Default: Story = {
  args: {
    mode: 'create',
    contentType: 'market-update',
    aiAssistanceLevel: 'standard',
    language: 'en',
  },
};

// AI-enhanced creation mode
export const AIEnhanced: Story = {
  args: {
    mode: 'create',
    contentType: 'educational',
    aiAssistanceLevel: 'enhanced',
    language: 'en',
  },
};

// Hindi content creation
export const HindiContent: Story = {
  args: {
    mode: 'create',
    contentType: 'product-spotlight',
    aiAssistanceLevel: 'standard',
    language: 'hi',
  },
};

// Edit mode with existing content
export const EditMode: Story = {
  args: {
    mode: 'edit',
    contentType: 'market-update',
    aiAssistanceLevel: 'minimal',
    language: 'en',
  },
};

// Review mode for compliance checking
export const ReviewMode: Story = {
  args: {
    mode: 'review',
    contentType: 'regulatory',
    aiAssistanceLevel: 'standard',
    language: 'en',
  },
};

// Mobile content creation
export const Mobile: Story = {
  args: {
    mode: 'create',
    contentType: 'market-update',
    aiAssistanceLevel: 'standard',
    language: 'en',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};