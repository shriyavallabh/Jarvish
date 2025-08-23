/**
 * Template Management Service
 * Handles all template operations with SEBI compliance
 */

import type {
  Template,
  TemplateCreateInput,
  TemplateUpdateInput,
  TemplateFilter,
  TemplateShareInput,
  TemplateCategory,
  TemplateLanguage,
  TemplateVariable,
  TemplateVersion,
  ComplianceCheck,
  ComplianceStatus,
  TemplateUsageStats,
  TemplateBulkAction,
  TemplateStatus,
  TEMPLATE_EXAMPLES,
  COMPLIANCE_RULES
} from '@/lib/types/templates';

// Import the constants properly
const TEMPLATE_LIBRARY = {
  educational: `Dear {{clientName}},

Understanding mutual funds is essential for long-term wealth creation. Here are key points to consider:

1. Diversification benefits
2. Professional management
3. Systematic investment options

{{customContent}}

*Disclaimer: Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.*

Best regards,
{{advisorName}}
{{advisorRegistration}}`,

  'market-update': `Market Update - {{date}}

Dear {{clientName}},

Today's market highlights:
- Sensex: {{sensexValue}} ({{sensexChange}})
- Nifty: {{niftyValue}} ({{niftyChange}})

{{marketAnalysis}}

*This is for informational purposes only. Past performance does not guarantee future results.*

{{advisorName}}
{{advisorRegistration}}`,

  'seasonal-greetings': `Dear {{clientName}},

{{greetingMessage}}

May this {{occasion}} bring prosperity and happiness to you and your family.

Warm regards,
{{advisorName}}
{{advisorRegistration}}`,

  'investment-tips': `Investment Tip of the Week

Dear {{clientName}},

{{tipTitle}}

{{tipContent}}

Remember: {{keyTakeaway}}

*Investment decisions should be based on individual risk profile and financial goals.*

{{advisorName}}
{{advisorRegistration}}`,

  'risk-disclosure': `IMPORTANT RISK DISCLOSURE

Dear {{clientName}},

Before making any investment decision, please consider:

{{riskFactors}}

- All investments carry risk
- Returns are not guaranteed
- Past performance is not indicative of future results
- Please read all documents carefully

{{additionalDisclosures}}

{{advisorName}}
{{advisorRegistration}}`,

  custom: `{{customTemplate}}`
};

const COMPLIANCE_CONFIG = {
  mandatoryDisclaimer: 'Mutual fund investments are subject to market risks',
  prohibitedTerms: ['guaranteed', 'assured returns', 'risk-free', 'no loss'],
  requiredFields: ['advisorName', 'advisorRegistration'],
  maxContentLength: 4096,
  minDisclaimerLength: 50
};

export class TemplateManagementService {
  private templates: Map<string, Template> = new Map();
  private templateStats: Map<string, TemplateUsageStats> = new Map();
  private idCounter = 1;

  /**
   * Create a new template
   */
  async createTemplate(input: TemplateCreateInput, userId: string): Promise<Template> {
    // Auto-add disclaimer if missing for financial content
    let content = input.content;
    if (this.requiresDisclaimer(input.category) && !content.toLowerCase().includes('market risk')) {
      content += `\n\n*${COMPLIANCE_CONFIG.mandatoryDisclaimer}. Read all scheme-related documents carefully.*\n\n{{advisorName}}\n{{advisorRegistration}}`;
    }

    // Validate compliance after auto-adding disclaimer
    const complianceCheck = await this.validateCompliance(content);
    
    // Only throw error for prohibited terms, not missing disclaimers (since we auto-add them)
    const hasProhibitedTerms = complianceCheck.issues?.some(issue => 
      issue.includes('prohibited')
    ) || false;
    
    if (hasProhibitedTerms) {
      throw new Error(`Template contains prohibited terms: ${complianceCheck.issues?.join(', ')}`);
    }

    // Extract variables from content
    const variables = this.extractVariables(content);

    // Create template
    const template: Template = {
      id: `template-${this.idCounter++}`,
      name: input.name,
      category: input.category,
      language: input.language,
      status: 'draft',
      content,
      variables,
      metadata: {
        author: userId,
        authorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        tags: input.tags || [],
        description: input.description
      },
      compliance: {
        ...complianceCheck,
        checkedAt: new Date(),
        checkedBy: 'system'
      },
      versions: [{
        id: `version-1`,
        version: '1.0.0',
        content,
        variables,
        createdAt: new Date(),
        createdBy: userId,
        compliance: {
          ...complianceCheck,
          checkedAt: new Date(),
          checkedBy: 'system'
        }
      }],
      currentVersion: '1.0.0',
      teamId: input.teamId,
      isShared: false,
      sharedWith: [],
      permissions: {
        canEdit: [userId],
        canView: [userId],
        canShare: [userId]
      }
    };

    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Get templates with optional filtering
   */
  async getTemplates(userId: string, filter?: TemplateFilter): Promise<Template[]> {
    let templates = Array.from(this.templates.values()).filter(t => 
      t.metadata.author === userId || t.sharedWith?.includes(userId)
    );

    if (filter) {
      // Apply category filter
      if (filter.category?.length) {
        templates = templates.filter(t => filter.category!.includes(t.category));
      }

      // Apply language filter
      if (filter.language?.length) {
        templates = templates.filter(t => filter.language!.includes(t.language));
      }

      // Apply status filter
      if (filter.status?.length) {
        templates = templates.filter(t => filter.status!.includes(t.status));
      }

      // Apply search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(query) ||
          t.content.toLowerCase().includes(query) ||
          t.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply compliance status filter
      if (filter.complianceStatus?.length) {
        templates = templates.filter(t => 
          filter.complianceStatus!.includes(t.compliance.status)
        );
      }

      // Apply date range filter
      if (filter.dateRange) {
        templates = templates.filter(t => {
          const createdAt = t.metadata.createdAt.getTime();
          const start = filter.dateRange!.start.getTime();
          const end = filter.dateRange!.end.getTime();
          return createdAt >= start && createdAt <= end;
        });
      }
    }

    return templates;
  }

  /**
   * Get templates sorted by usage frequency
   */
  async getTemplatesByUsage(userId: string): Promise<Template[]> {
    const templates = await this.getTemplates(userId);
    return templates.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string, userId: string): Promise<Template> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Check permissions
    if (template.metadata.author !== userId && !template.sharedWith?.includes(userId)) {
      throw new Error('Insufficient permissions');
    }

    return template;
  }

  /**
   * Update template and create new version
   */
  async updateTemplate(
    templateId: string,
    update: TemplateUpdateInput,
    userId: string
  ): Promise<Template> {
    const template = await this.getTemplateById(templateId, userId);

    // Check edit permissions
    if (!template.permissions?.canEdit?.includes(userId)) {
      throw new Error('Insufficient permissions');
    }

    // Validate compliance if content is updated
    if (update.content) {
      const complianceCheck = await this.validateCompliance(update.content);
      
      // Only throw error for prohibited terms
      const hasProhibitedTerms = complianceCheck.issues?.some(issue => 
        issue.includes('prohibited')
      ) || false;
      
      if (hasProhibitedTerms) {
        throw new Error(`Template contains prohibited terms: ${complianceCheck.issues?.join(', ')}`);
      }
    }

    // Apply updates
    const updatedContent = update.content || template.content;
    const updatedVariables = updatedContent !== template.content 
      ? this.extractVariables(updatedContent)
      : template.variables;

    // Create new version
    const newVersion = this.incrementVersion(template.currentVersion);
    const versionEntry: TemplateVersion = {
      id: `version-${template.versions.length + 1}`,
      version: newVersion,
      content: updatedContent,
      variables: updatedVariables,
      createdAt: new Date(),
      createdBy: userId,
      changeLog: `Updated by ${userId}`,
      compliance: await this.validateCompliance(updatedContent)
    };

    // Update template
    template.name = update.name || template.name;
    template.category = update.category || template.category;
    template.content = updatedContent;
    template.variables = updatedVariables;
    template.status = update.status || template.status;
    template.metadata.tags = update.tags || template.metadata.tags;
    template.metadata.description = update.description || template.metadata.description;
    template.metadata.updatedAt = new Date();
    template.versions.push(versionEntry);
    template.currentVersion = newVersion;
    template.compliance = versionEntry.compliance;

    return template;
  }

  /**
   * Restore a previous version
   */
  async restoreVersion(
    templateId: string,
    version: string,
    userId: string
  ): Promise<Template> {
    const template = await this.getTemplateById(templateId, userId);

    // Check edit permissions
    if (!template.permissions?.canEdit?.includes(userId)) {
      throw new Error('Insufficient permissions');
    }

    // Find the version to restore
    const versionToRestore = template.versions.find(v => v.version === version);
    if (!versionToRestore) {
      throw new Error('Version not found');
    }

    // Create new version from restored content
    const newVersion = this.incrementVersion(template.currentVersion);
    const restoredVersion: TemplateVersion = {
      ...versionToRestore,
      id: `version-${template.versions.length + 1}`,
      version: newVersion,
      createdAt: new Date(),
      createdBy: userId,
      changeLog: `Restored from version ${version} by ${userId}`
    };

    // Update template
    template.content = versionToRestore.content;
    template.variables = versionToRestore.variables;
    template.versions.push(restoredVersion);
    template.currentVersion = newVersion;
    template.compliance = versionToRestore.compliance;
    template.metadata.updatedAt = new Date();

    return template;
  }

  /**
   * Share template with team members
   */
  async shareTemplate(input: TemplateShareInput, userId: string): Promise<Template> {
    const template = await this.getTemplateById(input.templateId, userId);

    // Check share permissions
    if (!template.permissions?.canShare?.includes(userId)) {
      throw new Error('Insufficient permissions');
    }

    // Update sharing settings
    template.isShared = true;
    template.sharedWith = [...new Set([...(template.sharedWith || []), ...input.teamMemberIds])];

    // Update permissions
    if (!template.permissions) {
      template.permissions = { canEdit: [], canView: [], canShare: [] };
    }

    template.permissions.canView = [...new Set([
      ...template.permissions.canView,
      ...input.teamMemberIds
    ])];

    if (input.permissions.canEdit) {
      template.permissions.canEdit = [...new Set([
        ...template.permissions.canEdit,
        ...input.teamMemberIds
      ])];
    }

    if (input.permissions.canShare) {
      template.permissions.canShare = [...new Set([
        ...template.permissions.canShare,
        ...input.teamMemberIds
      ])];
    }

    return template;
  }

  /**
   * Revoke sharing access
   */
  async revokeSharing(
    templateId: string,
    memberIds: string[],
    userId: string
  ): Promise<Template> {
    const template = await this.getTemplateById(templateId, userId);

    // Check permissions
    if (template.metadata.author !== userId) {
      throw new Error('Only template owner can revoke sharing');
    }

    // Remove from shared list
    template.sharedWith = template.sharedWith?.filter(id => !memberIds.includes(id)) || [];
    
    // Remove permissions
    if (template.permissions) {
      template.permissions.canView = template.permissions.canView.filter(id => !memberIds.includes(id));
      template.permissions.canEdit = template.permissions.canEdit.filter(id => !memberIds.includes(id));
      template.permissions.canShare = template.permissions.canShare.filter(id => !memberIds.includes(id));
    }

    // Update shared status
    if (template.sharedWith.length === 0) {
      template.isShared = false;
    }

    return template;
  }

  /**
   * Use a template (track usage)
   */
  async useTemplate(templateId: string, userId: string): Promise<void> {
    const template = await this.getTemplateById(templateId, userId);
    
    // Update usage count
    template.metadata.usageCount++;
    template.metadata.lastUsedAt = new Date();

    // Update usage stats
    let stats = this.templateStats.get(templateId);
    if (!stats) {
      stats = {
        templateId,
        totalUsage: 0,
        usageByDay: [],
        usageByUser: []
      };
      this.templateStats.set(templateId, stats);
    }

    stats.totalUsage++;
    stats.lastUsed = new Date();

    // Update daily usage
    const today = new Date().toISOString().split('T')[0];
    const dayEntry = stats.usageByDay.find(d => d.date === today);
    if (dayEntry) {
      dayEntry.count++;
    } else {
      stats.usageByDay.push({ date: today, count: 1 });
    }

    // Update user usage
    const userEntry = stats.usageByUser.find(u => u.userId === userId);
    if (userEntry) {
      userEntry.count++;
    } else {
      stats.usageByUser.push({ userId, userName: userId, count: 1 });
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(templateId: string): Promise<TemplateUsageStats> {
    const stats = this.templateStats.get(templateId);
    if (!stats) {
      return {
        templateId,
        totalUsage: 0,
        usageByDay: [],
        usageByUser: []
      };
    }
    return stats;
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(teamId: string | undefined, limit: number = 10): Promise<Template[]> {
    let templates = Array.from(this.templates.values());
    
    if (teamId) {
      templates = templates.filter(t => t.teamId === teamId);
    }

    return templates
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, limit);
  }

  /**
   * Get template library
   */
  async getTemplateLibrary(): Promise<Record<TemplateCategory, string>> {
    return TEMPLATE_LIBRARY as Record<TemplateCategory, string>;
  }

  /**
   * Clone template from library
   */
  async cloneFromLibrary(
    category: TemplateCategory,
    userId: string,
    options?: { name?: string; teamId?: string; language?: TemplateLanguage }
  ): Promise<Template> {
    const libraryContent = TEMPLATE_LIBRARY[category];
    if (!libraryContent) {
      throw new Error('Template category not found in library');
    }

    return this.createTemplate({
      name: options?.name || `${category} Template`,
      category,
      language: options?.language || 'en',
      content: libraryContent,
      teamId: options?.teamId
    }, userId);
  }

  /**
   * Suggest category based on content
   */
  async suggestCategory(content: string): Promise<TemplateCategory> {
    const contentLower = content.toLowerCase();

    if (contentLower.includes('education') || contentLower.includes('learn') || contentLower.includes('sip')) {
      return 'educational';
    }
    if (contentLower.includes('sensex') || contentLower.includes('nifty') || contentLower.includes('market')) {
      return 'market-update';
    }
    if (contentLower.includes('happy') || contentLower.includes('wishes') || contentLower.includes('festival')) {
      return 'seasonal-greetings';
    }
    if (contentLower.includes('tip') || contentLower.includes('strategy') || contentLower.includes('invest')) {
      return 'investment-tips';
    }
    if (contentLower.includes('risk') || contentLower.includes('disclosure') || contentLower.includes('volatility')) {
      return 'risk-disclosure';
    }

    return 'custom';
  }

  /**
   * Validate SEBI compliance
   */
  async validateCompliance(content: string): Promise<ComplianceCheck> {
    const issues: string[] = [];
    let riskScore = 0;

    // Check for prohibited terms
    const contentLower = content.toLowerCase();
    for (const term of COMPLIANCE_CONFIG.prohibitedTerms) {
      if (contentLower.includes(term)) {
        issues.push('Contains prohibited terms');
        riskScore += 30;
        break;
      }
    }

    // Check for mandatory disclaimer
    const hasDisclaimer = contentLower.includes('subject to market risk') || 
                         contentLower.includes('market risks');
    if (!hasDisclaimer) {
      issues.push('Missing mandatory disclaimer');
      riskScore += 25;
    }

    // Check for advisor registration
    const hasRegistration = contentLower.includes('arn') || 
                           contentLower.includes('registration') ||
                           contentLower.includes('amfi');
    if (!hasRegistration) {
      issues.push('Missing advisor registration details');
      riskScore += 20;
    }

    // Check content length
    if (content.length > COMPLIANCE_CONFIG.maxContentLength) {
      issues.push('Content exceeds maximum length');
      riskScore += 10;
    }

    // Calculate final compliance status
    const sebiCompliant = issues.length === 0;
    const status: ComplianceStatus = sebiCompliant ? 'approved' : 
                                     riskScore > 50 ? 'rejected' : 'requires-review';

    return {
      status,
      checkedAt: new Date(),
      checkedBy: 'system',
      issues: issues.length > 0 ? issues : undefined,
      riskScore,
      sebiCompliant,
      disclaimerIncluded: hasDisclaimer
    };
  }

  /**
   * Bulk operations
   */
  async bulkOperation(operation: TemplateBulkAction, userId: string): Promise<void> {
    for (const templateId of operation.templateIds) {
      const template = await this.getTemplateById(templateId, userId);

      switch (operation.action) {
        case 'archive':
          template.status = 'archived';
          break;
        
        case 'delete':
          this.templates.delete(templateId);
          break;
        
        case 'share':
          if (operation.data) {
            await this.shareTemplate({
              templateId,
              teamMemberIds: operation.data.teamMemberIds,
              permissions: operation.data.permissions
            }, userId);
          }
          break;
        
        case 'categorize':
          if (operation.data?.category) {
            template.category = operation.data.category;
          }
          break;
      }
    }
  }

  /**
   * Export templates
   */
  async exportTemplates(templateIds: string[], userId: string): Promise<any> {
    const templates = [];
    
    for (const id of templateIds) {
      const template = await this.getTemplateById(id, userId);
      templates.push({
        name: template.name,
        category: template.category,
        language: template.language,
        content: template.content,
        variables: template.variables,
        tags: template.metadata.tags
      });
    }

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      templates
    };
  }

  /**
   * Import templates
   */
  async importTemplates(data: any, userId: string): Promise<Template[]> {
    const imported: Template[] = [];

    for (const templateData of data.templates) {
      // Validate compliance before import
      const compliance = await this.validateCompliance(templateData.content);
      
      // Only reject if there are prohibited terms
      const hasProhibitedTerms = compliance.issues?.some(issue => 
        issue.includes('prohibited')
      ) || false;
      
      if (hasProhibitedTerms) {
        throw new Error('Imported templates failed compliance validation');
      }

      const template = await this.createTemplate({
        name: templateData.name,
        category: templateData.category,
        language: templateData.language,
        content: templateData.content,
        tags: [...(templateData.tags || []), 'imported']
      }, userId);

      imported.push(template);
    }

    return imported;
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(content: string): TemplateVariable[] {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = content.matchAll(variablePattern);
    const variables: TemplateVariable[] = [];
    const seen = new Set<string>();

    for (const match of matches) {
      const key = match[1];
      if (!seen.has(key)) {
        seen.add(key);
        variables.push({
          key,
          label: this.formatLabel(key),
          type: this.inferVariableType(key),
          required: true
        });
      }
    }

    return variables;
  }

  /**
   * Format variable label
   */
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Infer variable type from key name
   */
  private inferVariableType(key: string): TemplateVariable['type'] {
    if (key.toLowerCase().includes('date')) return 'date';
    if (key.toLowerCase().includes('value') || key.toLowerCase().includes('amount')) return 'number';
    return 'text';
  }

  /**
   * Check if category requires disclaimer
   */
  private requiresDisclaimer(category: TemplateCategory): boolean {
    return ['educational', 'market-update', 'investment-tips', 'risk-disclosure'].includes(category);
  }

  /**
   * Increment version number
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.').map(Number);
    parts[1]++; // Increment minor version
    return parts.join('.');
  }
}