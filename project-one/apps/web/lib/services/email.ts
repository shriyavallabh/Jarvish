// Email service for sending transactional emails
// This would integrate with services like SendGrid, AWS SES, or Resend

interface EmailParams {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  try {
    // In production, this would integrate with an email service provider
    // For now, we'll simulate email sending
    
    if (process.env.NODE_ENV === 'test') {
      // Mock implementation for testing
      return {
        success: true,
        messageId: `msg-${Date.now()}`,
      }
    }
    
    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // 
    // const msg = {
    //   to: params.to,
    //   from: process.env.FROM_EMAIL,
    //   subject: params.subject,
    //   html: await renderTemplate(params.template, params.data),
    // }
    // 
    // const result = await sgMail.send(msg)
    
    console.log('Email would be sent:', {
      to: params.to,
      subject: params.subject,
      template: params.template,
    })
    
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

// Email templates
export const emailTemplates = {
  'email-verification': {
    subject: 'Verify your Jarvish account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0B1F33; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #0C310C; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .disclaimer { 
              background: #fff3cd; 
              border: 1px solid #ffc107; 
              padding: 10px; 
              margin: 20px 0; 
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Jarvish</h1>
              <p>AI-Powered Content for Financial Advisors</p>
            </div>
            <div class="content">
              <h2>Hello {{firstName}},</h2>
              <p>Thank you for registering with Jarvish. Please verify your email address to complete your registration.</p>
              
              <div style="text-align: center;">
                <a href="{{verificationLink}}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">
                {{verificationLink}}
              </p>
              
              <p>This link will expire in {{expiryTime}}.</p>
              
              <div class="disclaimer">
                <strong>Important:</strong> {{disclaimer}}
              </div>
              
              <p><small>{{regulatoryNote}}</small></p>
            </div>
            <div class="footer">
              <p>© 2024 Jarvish. All rights reserved.</p>
              <p>This email was sent to {{email}}. If you did not request this, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  'mobile-verification': {
    subject: 'Verify your mobile number',
    html: `<!-- Mobile verification template -->`,
  },
  'welcome': {
    subject: 'Welcome to Jarvish',
    html: `<!-- Welcome email template -->`,
  },
}