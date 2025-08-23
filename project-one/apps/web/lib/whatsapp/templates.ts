// WhatsApp Template Definitions for SEBI Compliance

export interface TemplateVariable {
  key: string
  type: 'text' | 'image' | 'document'
  example: string
}

export interface MessageTemplate {
  name: string
  category: 'UTILITY' | 'MARKETING'
  language: string
  variables: TemplateVariable[]
  components: {
    header?: {
      type: 'TEXT' | 'IMAGE'
      text?: string
      example?: string
    }
    body: {
      text: string
      examples?: string[][]
    }
    footer?: {
      text: string
    }
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
      text: string
      url?: string
      phone?: string
    }>
  }
}

// SEBI-Compliant Templates
export const TEMPLATES = {
  // Daily content delivery template
  DAILY_CONTENT: {
    name: 'daily_market_update',
    category: 'UTILITY' as const,
    language: 'en',
    variables: [
      { key: 'advisor_name', type: 'text' as const, example: 'Rajesh Kumar' },
      { key: 'date', type: 'text' as const, example: 'January 19, 2025' },
      { key: 'market_summary', type: 'text' as const, example: 'Sensex up 1.2%' },
      { key: 'content', type: 'text' as const, example: 'Today\'s investment insights...' }
    ],
    components: {
      header: {
        type: 'TEXT' as const,
        text: 'Daily Market Update - {{1}}',
        example: 'January 19, 2025'
      },
      body: {
        text: `Good morning! Here's your daily market update from {{1}}.

📊 Market Summary: {{2}}

💡 Today's Insights:
{{3}}

⚠️ SEBI Disclaimer: This is for informational purposes only. Please consult your financial advisor before making investment decisions.`,
        examples: [
          ['Rajesh Kumar', 'January 19, 2025', 'Sensex up 1.2%, Nifty gains 0.8%', 'Focus on blue-chip stocks today...']
        ]
      },
      footer: {
        text: 'Powered by Hubix | SEBI Registered'
      },
      buttons: [
        {
          type: 'URL' as const,
          text: 'View Full Analysis',
          url: 'https://hubix.app/content/{{1}}'
        }
      ]
    }
  },

  // Hindi version of daily content
  DAILY_CONTENT_HINDI: {
    name: 'daily_market_update_hindi',
    category: 'UTILITY' as const,
    language: 'hi',
    variables: [
      { key: 'advisor_name', type: 'text' as const, example: 'राजेश कुमार' },
      { key: 'date', type: 'text' as const, example: '19 जनवरी 2025' },
      { key: 'market_summary', type: 'text' as const, example: 'सेंसेक्स 1.2% ऊपर' },
      { key: 'content', type: 'text' as const, example: 'आज के निवेश सुझाव...' }
    ],
    components: {
      header: {
        type: 'TEXT' as const,
        text: 'दैनिक बाजार अपडेट - {{1}}',
        example: '19 जनवरी 2025'
      },
      body: {
        text: `शुभ प्रभात! {{1}} की ओर से आज का बाजार अपडेट।

📊 बाजार सारांश: {{2}}

💡 आज की जानकारी:
{{3}}

⚠️ सेबी चेतावनी: यह केवल जानकारी के लिए है। निवेश निर्णय लेने से पहले अपने वित्तीय सलाहकार से परामर्श करें।`,
        examples: [
          ['राजेश कुमार', '19 जनवरी 2025', 'सेंसेक्स 1.2% ऊपर, निफ्टी 0.8% लाभ', 'आज ब्लू-चिप शेयरों पर फोकस करें...']
        ]
      },
      footer: {
        text: 'Hubix द्वारा संचालित | सेबी पंजीकृत'
      }
    }
  },

  // Welcome message for new advisors
  WELCOME_ADVISOR: {
    name: 'welcome_advisor',
    category: 'UTILITY' as const,
    language: 'en',
    variables: [
      { key: 'advisor_name', type: 'text' as const, example: 'Priya Sharma' },
      { key: 'euin', type: 'text' as const, example: 'E123456' }
    ],
    components: {
      body: {
        text: `Welcome to Hubix, {{1}}! 🎉

Your EUIN {{2}} has been verified successfully.

You can now:
✅ Generate AI-powered content
✅ Schedule daily WhatsApp updates
✅ Access compliance tools
✅ Track client engagement

Your daily content will be delivered at 6 AM IST.

Need help? Reply HELP to this message.`,
        examples: [
          ['Priya Sharma', 'E123456']
        ]
      },
      footer: {
        text: 'Hubix - AI for Financial Advisors'
      },
      buttons: [
        {
          type: 'QUICK_REPLY' as const,
          text: 'Get Started'
        },
        {
          type: 'QUICK_REPLY' as const,
          text: 'Help'
        }
      ]
    }
  },

  // Subscription reminder
  SUBSCRIPTION_REMINDER: {
    name: 'subscription_reminder',
    category: 'MARKETING' as const,
    language: 'en',
    variables: [
      { key: 'advisor_name', type: 'text' as const, example: 'Amit Patel' },
      { key: 'days_remaining', type: 'text' as const, example: '3' },
      { key: 'plan_name', type: 'text' as const, example: 'Pro Plan' }
    ],
    components: {
      body: {
        text: `Hi {{1}},

Your {{3}} subscription expires in {{2}} days.

Renew now to continue enjoying:
• Daily AI-generated content
• WhatsApp automation
• Compliance tools
• Priority support

Don't let your content pipeline stop!`,
        examples: [
          ['Amit Patel', '3', 'Pro Plan']
        ]
      },
      buttons: [
        {
          type: 'URL' as const,
          text: 'Renew Now',
          url: 'https://hubix.app/pricing'
        }
      ]
    }
  },

  // Content approval notification
  CONTENT_APPROVED: {
    name: 'content_approved',
    category: 'UTILITY' as const,
    language: 'en',
    variables: [
      { key: 'advisor_name', type: 'text' as const, example: 'Neha Gupta' },
      { key: 'content_title', type: 'text' as const, example: 'Mutual Fund Benefits' },
      { key: 'scheduled_time', type: 'text' as const, example: '6:00 AM tomorrow' }
    ],
    components: {
      body: {
        text: `Great news, {{1}}! ✅

Your content "{{2}}" has been approved and scheduled for {{3}}.

Compliance Score: ✓ Passed
AI Quality Score: ✓ Excellent

Your clients will receive this content automatically.`,
        examples: [
          ['Neha Gupta', 'Mutual Fund Benefits', '6:00 AM tomorrow']
        ]
      }
    }
  },

  // Failed delivery notification
  DELIVERY_FAILED: {
    name: 'delivery_failed',
    category: 'UTILITY' as const,
    language: 'en',
    variables: [
      { key: 'advisor_name', type: 'text' as const, example: 'Vikram Singh' },
      { key: 'content_title', type: 'text' as const, example: 'Market Analysis' },
      { key: 'reason', type: 'text' as const, example: 'Invalid phone number' }
    ],
    components: {
      body: {
        text: `Hi {{1}},

We couldn't deliver your content "{{2}}".

Reason: {{3}}

Please check your settings and try again. Our support team has been notified.`,
        examples: [
          ['Vikram Singh', 'Market Analysis', 'Invalid phone number format']
        ]
      },
      buttons: [
        {
          type: 'URL' as const,
          text: 'View Details',
          url: 'https://hubix.app/delivery-status'
        }
      ]
    }
  }
}

// Template manager class
export class TemplateManager {
  // Get template by name
  static getTemplate(templateName: keyof typeof TEMPLATES): MessageTemplate {
    return TEMPLATES[templateName]
  }

  // Format template with actual values
  static formatTemplate(
    template: MessageTemplate,
    values: Record<string, string>
  ): {
    header?: { text: string }
    body: string
    components?: any[]
  } {
    let bodyText = template.components.body.text
    let headerText = template.components.header?.text

    // Replace variables in body
    template.variables.forEach((variable, index) => {
      const placeholder = `{{${index + 1}}}`
      const value = values[variable.key] || variable.example
      bodyText = bodyText.replace(placeholder, value)
      if (headerText) {
        headerText = headerText.replace(placeholder, value)
      }
    })

    // Build components array for WhatsApp API
    const components = []

    if (template.components.header) {
      components.push({
        type: 'header',
        parameters: template.variables
          .filter(v => headerText?.includes(`{{${template.variables.indexOf(v) + 1}}}`))
          .map(v => ({
            type: 'text',
            text: values[v.key] || v.example
          }))
      })
    }

    components.push({
      type: 'body',
      parameters: template.variables.map(v => ({
        type: 'text',
        text: values[v.key] || v.example
      }))
    })

    return {
      header: headerText ? { text: headerText } : undefined,
      body: bodyText,
      components
    }
  }

  // Validate template variables
  static validateVariables(
    template: MessageTemplate,
    values: Record<string, string>
  ): { valid: boolean; missing: string[] } {
    const missing = template.variables
      .filter(v => !values[v.key])
      .map(v => v.key)

    return {
      valid: missing.length === 0,
      missing
    }
  }

  // Get template for specific use case
  static getTemplateForUseCase(
    useCase: 'daily_content' | 'welcome' | 'subscription' | 'approval' | 'failure',
    language: 'en' | 'hi' = 'en'
  ): MessageTemplate | null {
    switch (useCase) {
      case 'daily_content':
        return language === 'hi' ? TEMPLATES.DAILY_CONTENT_HINDI : TEMPLATES.DAILY_CONTENT
      case 'welcome':
        return TEMPLATES.WELCOME_ADVISOR
      case 'subscription':
        return TEMPLATES.SUBSCRIPTION_REMINDER
      case 'approval':
        return TEMPLATES.CONTENT_APPROVED
      case 'failure':
        return TEMPLATES.DELIVERY_FAILED
      default:
        return null
    }
  }
}