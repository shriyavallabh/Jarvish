/**
 * Template Types for Jarvish Content Management System
 * Supports SEBI-compliant financial advisory content templates
 */

export type TemplateCategory = 
  | 'educational'
  | 'market-update'
  | 'seasonal-greetings'
  | 'investment-tips'
  | 'risk-disclosure'
  | 'custom';

export type TemplateLanguage = 'en' | 'hi' | 'mr';

export type TemplateStatus = 'draft' | 'published' | 'archived';

export type ComplianceStatus = 'pending' | 'approved' | 'rejected' | 'requires-review';

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  defaultValue?: string;
  options?: string[]; // For select type
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface TemplateMetadata {
  author: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
  tags: string[];
  description?: string;
}

export interface ComplianceCheck {
  status: ComplianceStatus;
  checkedAt: Date;
  checkedBy: string;
  issues?: string[];
  riskScore?: number;
  sebiCompliant: boolean;
  disclaimerIncluded: boolean;
}

export interface TemplateVersion {
  id: string;
  version: string;
  content: string;
  variables: TemplateVariable[];
  createdAt: Date;
  createdBy: string;
  changeLog?: string;
  compliance: ComplianceCheck;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  status: TemplateStatus;
  content: string;
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
  compliance: ComplianceCheck;
  versions: TemplateVersion[];
  currentVersion: string;
  teamId?: string;
  isShared: boolean;
  sharedWith?: string[]; // Team member IDs
  permissions?: {
    canEdit: string[];
    canView: string[];
    canShare: string[];
  };
}

export interface TemplateFilter {
  category?: TemplateCategory[];
  language?: TemplateLanguage[];
  status?: TemplateStatus[];
  tags?: string[];
  author?: string;
  teamId?: string;
  searchQuery?: string;
  complianceStatus?: ComplianceStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TemplateCreateInput {
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  content: string;
  variables?: TemplateVariable[];
  tags?: string[];
  description?: string;
  teamId?: string;
}

export interface TemplateUpdateInput {
  name?: string;
  category?: TemplateCategory;
  content?: string;
  variables?: TemplateVariable[];
  tags?: string[];
  description?: string;
  status?: TemplateStatus;
}

export interface TemplateShareInput {
  templateId: string;
  teamMemberIds: string[];
  permissions: {
    canEdit?: boolean;
    canShare?: boolean;
  };
}

export interface TemplateUsageStats {
  templateId: string;
  totalUsage: number;
  usageByDay: { date: string; count: number }[];
  usageByUser: { userId: string; userName: string; count: number }[];
  averageEngagement?: number;
  lastUsed?: Date;
}

export interface TemplateBulkAction {
  action: 'archive' | 'delete' | 'share' | 'categorize';
  templateIds: string[];
  data?: any;
}

// Predefined template examples
export const TEMPLATE_EXAMPLES: Record<TemplateCategory, string> = {
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

// Compliance rules for templates
export const COMPLIANCE_RULES = {
  mandatoryDisclaimer: 'Mutual fund investments are subject to market risks',
  prohibitedTerms: ['guaranteed', 'assured returns', 'risk-free', 'no loss'],
  requiredFields: ['advisorName', 'advisorRegistration'],
  maxContentLength: 4096, // WhatsApp message limit
  minDisclaimerLength: 50
};