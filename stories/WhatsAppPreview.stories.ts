import type { Meta, StoryObj } from '@storybook/react';
import { WhatsAppPreview } from '../apps/web/components/WhatsAppPreview';

const meta: Meta<typeof WhatsAppPreview> = {
  title: 'Components/WhatsAppPreview',
  component: WhatsAppPreview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'WhatsApp message preview component showing how content will appear to advisor clients with proper formatting and media.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Message content text',
    },
    mediaType: {
      control: { type: 'select' },
      options: ['none', 'image', 'document'],
      description: 'Type of media attachment',
    },
    hasDisclaimer: {
      control: 'boolean',
      description: 'Include SEBI disclaimer',
    },
    advisorBranding: {
      control: 'boolean',
      description: 'Show advisor branding (Pro tier)',
    },
    language: {
      control: { type: 'select' },
      options: ['en', 'hi', 'mr'],
      description: 'Content language',
    },
    timestamp: {
      control: 'text',
      description: 'Message timestamp',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic text message
export const TextMessage: Story = {
  args: {
    content: 'Good morning! Here\'s today\'s market update: Nifty 50 opened strong at 19,850 points, showing positive momentum in banking and IT sectors.',
    mediaType: 'none',
    hasDisclaimer: true,
    advisorBranding: false,
    language: 'en',
    timestamp: '06:00 AM',
  },
};

// Message with image
export const WithImage: Story = {
  args: {
    content: 'Market insights for today - see the attached infographic for detailed sector performance.',
    mediaType: 'image',
    hasDisclaimer: true,
    advisorBranding: false,
    language: 'en',
    timestamp: '06:00 AM',
  },
};

// Pro tier with branding
export const ProTierBranding: Story = {
  args: {
    content: 'Your trusted advisor bringing you today\'s market opportunities. Contact us for personalized investment guidance.',
    mediaType: 'image',
    hasDisclaimer: true,
    advisorBranding: true,
    language: 'en',
    timestamp: '06:00 AM',
  },
};

// Hindi language content
export const HindiContent: Story = {
  args: {
    content: 'नमस्ते! आज का बाजार अपडेट: निफ्टी 50 ने 19,850 पॉइंट्स पर मजबूत शुरुआत की है। बैंकिंग और IT सेक्टर में सकारात्मक गति दिख रही है।',
    mediaType: 'none',
    hasDisclaimer: true,
    advisorBranding: false,
    language: 'hi',
    timestamp: '06:00 AM',
  },
};

// Document attachment
export const WithDocument: Story = {
  args: {
    content: 'Please find attached the detailed mutual fund performance report for Q3 2024.',
    mediaType: 'document',
    hasDisclaimer: true,
    advisorBranding: true,
    language: 'en',
    timestamp: '06:00 AM',
  },
};

// Long message with disclaimer
export const LongMessage: Story = {
  args: {
    content: 'Today\'s market analysis reveals interesting trends across multiple sectors. Banking stocks are showing strong momentum with HDFC Bank and ICICI Bank leading the gains. Technology sector remains resilient with TCS and Infosys posting positive results. However, investors should note that market conditions can change rapidly and past performance does not guarantee future results.',
    mediaType: 'image',
    hasDisclaimer: true,
    advisorBranding: true,
    language: 'en',
    timestamp: '06:00 AM',
  },
};

// Without disclaimer (for internal preview)
export const NoDisclaimer: Story = {
  args: {
    content: 'Quick market update: Strong opening today across major indices.',
    mediaType: 'none',
    hasDisclaimer: false,
    advisorBranding: false,
    language: 'en',
    timestamp: '06:00 AM',
  },
};