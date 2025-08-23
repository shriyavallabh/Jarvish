/**
 * WhatsApp Template Manager
 * Handles template creation, submission, approval tracking, and rotation
 * Ensures compliance with WhatsApp policies and manages multi-language support
 */

const axios = require('axios');
const EventEmitter = require('events');

class WhatsAppTemplateManager extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      businessId: config.businessId,
      accessToken: config.accessToken,
      apiVersion: config.apiVersion || 'v20.0',
      baseUrl: 'https://graph.facebook.com',
      ...config
    };
    
    // Template status tracking
    this.templates = new Map();
    this.approvalQueue = [];
    this.activeTemplates = new Map();
    
    // Language support
    this.supportedLanguages = {
      'en_US': 'English',
      'hi_IN': 'Hindi',
      'mr_IN': 'Marathi'
    };
    
    // Template categories and their usage
    this.categories = {
      UTILITY: {
        description: 'Transaction updates, account alerts, appointment reminders',
        cost: 0.125,
        requiresOptIn: false
      },
      MARKETING: {
        description: 'Promotional content, offers, product announcements',
        cost: 0.88,
        requiresOptIn: true
      },
      AUTHENTICATION: {
        description: 'OTP, verification codes, authentication',
        cost: 0.125,
        requiresOptIn: false
      }
    };
    
    this.initializeTemplateRotation();
  }
  
  /**
   * Create and submit a new template for approval
   * @param {Object} templateData Template configuration
   * @returns {Promise<Object>} Submission result
   */
  async createTemplate(templateData) {
    const {
      name,
      category = 'UTILITY',
      languages = ['en_US'],
      components,
      allowCategoryChange = false
    } = templateData;
    
    // Validate template name
    if (!/^[a-z0-9_]+$/.test(name)) {
      throw new Error('Template name must contain only lowercase letters, numbers, and underscores');
    }
    
    // Create template for each language
    const submissions = [];
    
    for (const languageCode of languages) {
      const templatePayload = this.buildTemplatePayload({
        name,
        category,
        languageCode,
        components,
        allowCategoryChange
      });
      
      try {
        const response = await this.submitTemplate(templatePayload);
        
        // Track template in internal registry
        const templateId = `${name}_${languageCode}`;
        this.templates.set(templateId, {
          id: response.id,
          name,
          language: languageCode,
          category,
          status: 'PENDING',
          submittedAt: new Date().toISOString(),
          components,
          estimatedApprovalTime: this.estimateApprovalTime(category)
        });
        
        this.approvalQueue.push(templateId);
        submissions.push({
          language: languageCode,
          success: true,
          id: response.id,
          estimatedApproval: this.estimateApprovalTime(category)
        });
        
        this.emit('template:submitted', {
          name,
          language: languageCode,
          category,
          id: response.id
        });
      } catch (error) {
        submissions.push({
          language: languageCode,
          success: false,
          error: error.message
        });
        
        this.emit('template:submission_failed', {
          name,
          language: languageCode,
          error: error.message
        });
      }
    }
    
    return {
      name,
      category,
      submissions,
      totalSubmitted: submissions.filter(s => s.success).length,
      totalFailed: submissions.filter(s => !s.success).length
    };
  }
  
  /**
   * Build template payload for submission
   * @private
   */
  buildTemplatePayload(params) {
    const { name, category, languageCode, components, allowCategoryChange } = params;
    
    const payload = {
      name: `${name}_${languageCode}`,
      category,
      allow_category_change: allowCategoryChange,
      language: languageCode,
      components: []
    };
    
    // Process header component
    if (components.header) {
      const headerComponent = {
        type: 'HEADER',
        format: components.header.format || 'TEXT'
      };
      
      if (components.header.format === 'TEXT') {
        headerComponent.text = components.header.text;
        if (components.header.variables) {
          headerComponent.example = {
            header_text: components.header.variables
          };
        }
      } else if (components.header.format === 'IMAGE') {
        headerComponent.example = {
          header_handle: [components.header.exampleMediaUrl || 'https://example.com/image.jpg']
        };
      }
      
      payload.components.push(headerComponent);
    }
    
    // Process body component (required)
    if (!components.body || !components.body.text) {
      throw new Error('Template body is required');
    }
    
    const bodyComponent = {
      type: 'BODY',
      text: components.body.text
    };
    
    // Add example values for variables
    if (components.body.examples) {
      bodyComponent.example = {
        body_text: [components.body.examples]
      };
    }
    
    payload.components.push(bodyComponent);
    
    // Process footer component (optional)
    if (components.footer) {
      payload.components.push({
        type: 'FOOTER',
        text: components.footer.text
      });
    }
    
    // Process buttons (optional)
    if (components.buttons && components.buttons.length > 0) {
      const buttonComponents = components.buttons.map(button => {
        const btnComponent = {
          type: 'BUTTONS'
        };
        
        if (button.type === 'QUICK_REPLY') {
          btnComponent.buttons = [{
            type: 'QUICK_REPLY',
            text: button.text
          }];
        } else if (button.type === 'PHONE_NUMBER') {
          btnComponent.buttons = [{
            type: 'PHONE_NUMBER',
            text: button.text,
            phone_number: button.phoneNumber
          }];
        } else if (button.type === 'URL') {
          btnComponent.buttons = [{
            type: 'URL',
            text: button.text,
            url: button.url,
            example: button.example ? [button.example] : undefined
          }];
        }
        
        return btnComponent;
      });
      
      payload.components.push(...buttonComponents);
    }
    
    return payload;
  }
  
  /**
   * Submit template to WhatsApp for approval
   * @private
   */
  async submitTemplate(payload) {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.businessId}/message_templates`;
    
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.error?.message || 'Template submission failed';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
  
  /**
   * Check approval status of pending templates
   * @returns {Promise<Array>} Status updates
   */
  async checkApprovalStatus() {
    const updates = [];
    
    for (const templateId of this.approvalQueue) {
      const template = this.templates.get(templateId);
      if (!template || template.status !== 'PENDING') continue;
      
      try {
        const status = await this.getTemplateStatus(template.id);
        
        if (status.status !== template.status) {
          // Status changed
          template.status = status.status;
          template.lastChecked = new Date().toISOString();
          
          if (status.status === 'APPROVED') {
            template.approvedAt = new Date().toISOString();
            this.activeTemplates.set(templateId, template);
            this.approvalQueue = this.approvalQueue.filter(id => id !== templateId);
            
            this.emit('template:approved', {
              name: template.name,
              language: template.language,
              id: template.id
            });
          } else if (status.status === 'REJECTED') {
            template.rejectedAt = new Date().toISOString();
            template.rejectionReason = status.rejected_reason;
            this.approvalQueue = this.approvalQueue.filter(id => id !== templateId);
            
            this.emit('template:rejected', {
              name: template.name,
              language: template.language,
              reason: status.rejected_reason
            });
          }
          
          updates.push({
            templateId,
            name: template.name,
            language: template.language,
            oldStatus: 'PENDING',
            newStatus: status.status,
            reason: status.rejected_reason
          });
        }
      } catch (error) {
        console.error(`Failed to check status for ${templateId}:`, error.message);
      }
    }
    
    return updates;
  }
  
  /**
   * Get template status from API
   * @private
   */
  async getTemplateStatus(templateId) {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/${templateId}?fields=status,rejected_reason`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get template status: ${error.message}`);
    }
  }
  
  /**
   * Get best available template for sending
   * @param {string} purpose Template purpose/name
   * @param {string} language Preferred language
   * @returns {Object|null} Template configuration
   */
  getBestTemplate(purpose, language = 'en_US') {
    // First try exact match
    let templateId = `${purpose}_${language}`;
    let template = this.activeTemplates.get(templateId);
    
    if (template && template.status === 'APPROVED') {
      return {
        name: template.name,
        language: template.language,
        category: template.category,
        components: template.components
      };
    }
    
    // Fallback to English if preferred language not available
    if (language !== 'en_US') {
      templateId = `${purpose}_en_US`;
      template = this.activeTemplates.get(templateId);
      
      if (template && template.status === 'APPROVED') {
        return {
          name: template.name,
          language: template.language,
          category: template.category,
          components: template.components,
          fallback: true
        };
      }
    }
    
    // Try to find any approved template with similar purpose
    for (const [id, tpl] of this.activeTemplates) {
      if (tpl.status === 'APPROVED' && tpl.name.includes(purpose)) {
        return {
          name: tpl.name,
          language: tpl.language,
          category: tpl.category,
          components: tpl.components,
          alternative: true
        };
      }
    }
    
    return null;
  }
  
  /**
   * Initialize template rotation strategy
   * @private
   */
  initializeTemplateRotation() {
    // Check for templates needing rotation every hour
    setInterval(() => {
      this.checkTemplatePerformance();
    }, 3600000); // 1 hour
    
    // Check approval status every 30 minutes
    setInterval(() => {
      this.checkApprovalStatus();
    }, 1800000); // 30 minutes
  }
  
  /**
   * Check template performance and rotate if needed
   * @private
   */
  async checkTemplatePerformance() {
    for (const [templateId, template] of this.activeTemplates) {
      // Get template metrics (this would come from your analytics)
      const metrics = await this.getTemplateMetrics(templateId);
      
      if (metrics.blockRate > 0.02 || metrics.reportRate > 0.01) {
        // Template performing poorly, mark for rotation
        template.performanceIssue = true;
        template.metrics = metrics;
        
        this.emit('template:performance_issue', {
          templateId,
          name: template.name,
          metrics
        });
        
        // Attempt to rotate to alternative template
        this.rotateTemplate(templateId);
      }
    }
  }
  
  /**
   * Get template performance metrics
   * @private
   */
  async getTemplateMetrics(templateId) {
    // This would integrate with your analytics system
    // For now, returning mock data
    return {
      sent: 1000,
      delivered: 980,
      read: 750,
      blocked: 5,
      reported: 3,
      blockRate: 0.005,
      reportRate: 0.003,
      readRate: 0.765
    };
  }
  
  /**
   * Rotate problematic template
   * @private
   */
  rotateTemplate(templateId) {
    const template = this.activeTemplates.get(templateId);
    if (!template) return;
    
    // Mark template as inactive
    template.status = 'ROTATED';
    template.rotatedAt = new Date().toISOString();
    this.activeTemplates.delete(templateId);
    
    // Find or create replacement template
    const replacementName = `${template.name}_v${Date.now()}`;
    
    // Auto-create improved version with slight modifications
    this.createTemplate({
      name: replacementName,
      category: template.category,
      languages: [template.language],
      components: this.improveTemplateContent(template.components)
    });
  }
  
  /**
   * Improve template content based on best practices
   * @private
   */
  improveTemplateContent(components) {
    // Apply improvements based on common issues
    const improved = { ...components };
    
    if (improved.body && improved.body.text) {
      // Make message more personalized
      if (!improved.body.text.includes('{{1}}')) {
        improved.body.text = `Hi {{1}}, ${improved.body.text}`;
      }
      
      // Ensure clear value proposition
      if (improved.body.text.length > 160) {
        // Shorten message for better engagement
        improved.body.text = improved.body.text.substring(0, 160) + '...';
      }
    }
    
    return improved;
  }
  
  /**
   * Estimate template approval time based on category
   * @private
   */
  estimateApprovalTime(category) {
    const estimates = {
      UTILITY: '24-48 hours',
      MARKETING: '48-72 hours',
      AUTHENTICATION: '24-48 hours'
    };
    
    return estimates[category] || '48-72 hours';
  }
  
  /**
   * Get all templates with their current status
   */
  getAllTemplates() {
    const all = [];
    
    for (const [id, template] of this.templates) {
      all.push({
        id,
        name: template.name,
        language: this.supportedLanguages[template.language],
        category: template.category,
        status: template.status,
        submittedAt: template.submittedAt,
        approvedAt: template.approvedAt,
        rejectedAt: template.rejectedAt,
        rejectionReason: template.rejectionReason
      });
    }
    
    return all;
  }
  
  /**
   * Get template statistics
   */
  getStatistics() {
    const stats = {
      total: this.templates.size,
      pending: 0,
      approved: 0,
      rejected: 0,
      rotated: 0,
      byLanguage: {},
      byCategory: {}
    };
    
    for (const template of this.templates.values()) {
      stats[template.status.toLowerCase()]++;
      
      // Count by language
      if (!stats.byLanguage[template.language]) {
        stats.byLanguage[template.language] = 0;
      }
      stats.byLanguage[template.language]++;
      
      // Count by category
      if (!stats.byCategory[template.category]) {
        stats.byCategory[template.category] = 0;
      }
      stats.byCategory[template.category]++;
    }
    
    return stats;
  }
}

module.exports = WhatsAppTemplateManager;