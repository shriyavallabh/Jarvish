'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTemplateStore } from '@/lib/stores/template-store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Save,
  X,
  Eye,
  Code,
  AlertCircle,
  CheckCircle,
  Clock,
  History,
  Share2,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Variable,
  Shield,
  Globe,
  Tag,
  Users
} from 'lucide-react';
import type { 
  Template, 
  TemplateCategory, 
  TemplateLanguage,
  TemplateVariable,
  TemplateCreateInput,
  TemplateUpdateInput
} from '@/lib/types/templates';

const languageLabels: Record<TemplateLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी'
};

interface TemplateEditorProps {
  template?: Template | null;
  onSave?: (template: Template) => void;
  onCancel?: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const { user } = useUser();
  const {
    createTemplate,
    updateTemplate,
    isLoading,
    error,
    clearError
  } = useTemplateStore();

  // Form state
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category || 'educational');
  const [language, setLanguage] = useState<TemplateLanguage>(template?.language || 'en');
  const [content, setContent] = useState(template?.content || '');
  const [description, setDescription] = useState(template?.metadata?.description || '');
  const [tags, setTags] = useState<string[]>(template?.metadata?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'variables' | 'compliance'>('edit');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(template?.currentVersion);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [complianceIssues, setComplianceIssues] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Extract variables from content
  const extractedVariables = useMemo(() => {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = content.matchAll(variablePattern);
    const variables: TemplateVariable[] = [];
    const seen = new Set<string>();

    for (const match of matches) {
      const key = match[1];
      if (!seen.has(key)) {
        seen.add(key);
        
        // Find existing variable config or create new
        const existing = template?.variables?.find(v => v.key === key);
        variables.push(existing || {
          key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
          type: inferVariableType(key),
          required: true
        });
      }
    }

    return variables;
  }, [content, template?.variables]);

  // Preview with sample data
  const previewContent = useMemo(() => {
    let preview = content;
    const sampleData: Record<string, string> = {
      clientName: 'Mr. Sharma',
      advisorName: 'John Doe',
      advisorRegistration: 'ARN-123456',
      date: new Date().toLocaleDateString(),
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      occasion: 'Diwali',
      sensexValue: '65,000',
      sensexChange: '+250 (0.4%)',
      niftyValue: '19,500',
      niftyChange: '+80 (0.4%)',
      greetingMessage: 'Wishing you prosperity and happiness',
      marketAnalysis: 'Markets showed positive momentum today',
      tipTitle: 'Diversification is Key',
      tipContent: 'Spread your investments across different asset classes',
      keyTakeaway: 'Never put all eggs in one basket',
      riskFactors: 'Market volatility, inflation risk, liquidity risk',
      additionalDisclosures: 'Please consult your financial advisor',
      customContent: 'Your custom content here',
      customTemplate: 'Your custom template content'
    };

    extractedVariables.forEach(variable => {
      const value = sampleData[variable.key] || `[${variable.label}]`;
      preview = preview.replace(new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g'), value);
    });

    return preview;
  }, [content, extractedVariables]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Template name is required';
    }
    if (!content.trim()) {
      errors.content = 'Template content is required';
    }
    if (content.length > 4096) {
      errors.content = 'Content exceeds maximum length (4096 characters)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, content]);

  // Validate compliance
  const validateCompliance = useCallback(async () => {
    setIsValidating(true);
    const issues: string[] = [];
    
    // Check for prohibited terms
    const prohibitedTerms = ['guaranteed', 'assured returns', 'risk-free', 'no loss'];
    const contentLower = content.toLowerCase();
    
    for (const term of prohibitedTerms) {
      if (contentLower.includes(term)) {
        issues.push(`Contains prohibited term: "${term}"`);
      }
    }

    // Check for mandatory disclaimer (except seasonal greetings)
    if (category !== 'seasonal-greetings') {
      if (!contentLower.includes('subject to market risk') && !contentLower.includes('market risks')) {
        issues.push('Missing mandatory risk disclaimer');
      }
    }

    // Check for advisor details
    if (!content.includes('{{advisorName}}') || !content.includes('{{advisorRegistration}}')) {
      issues.push('Missing advisor identification placeholders');
    }

    setComplianceIssues(issues);
    setIsValidating(false);
    
    return issues.length === 0;
  }, [content, category]);

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      setActiveTab('edit');
      return;
    }

    if (!user?.id) return;

    try {
      let savedTemplate: Template;
      
      if (template?.id) {
        // Update existing template
        const updateData: TemplateUpdateInput = {
          name,
          category,
          content,
          tags,
          description
        };
        savedTemplate = await updateTemplate(template.id, updateData, user.id);
      } else {
        // Create new template
        const createData: TemplateCreateInput = {
          name,
          category,
          language,
          content,
          tags,
          description
        };
        savedTemplate = await createTemplate(createData, user.id);
      }

      onSave?.(savedTemplate);
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Auto-validate compliance on content change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) {
        validateCompliance();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, validateCompliance]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">
              {template ? 'Edit Template' : 'Create Template'}
            </h2>
            <p className="text-muted-foreground">
              {template ? `Version ${template.currentVersion}` : 'Design your SEBI-compliant content template'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {template && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory(true)}
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {template ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Monthly Market Update"
                    className={validationErrors.name ? 'border-red-500' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>
                
                <div className="w-48">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="market-update">Market Update</SelectItem>
                      <SelectItem value="seasonal-greetings">Seasonal Greetings</SelectItem>
                      <SelectItem value="investment-tips">Investment Tips</SelectItem>
                      <SelectItem value="risk-disclosure">Risk Disclosure</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-32">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={language} 
                    onValueChange={(v) => setLanguage(v as TemplateLanguage)}
                    disabled={!!template}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                      <SelectItem value="mr">मराठी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="edit">
                    <Code className="h-4 w-4 mr-2" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="variables">
                    <Variable className="h-4 w-4 mr-2" />
                    Variables
                  </TabsTrigger>
                  <TabsTrigger value="compliance">
                    <Shield className="h-4 w-4 mr-2" />
                    Compliance
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="edit" className="space-y-4">
                <div>
                  <Label htmlFor="content">Template Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your template content. Use {{variableName}} for dynamic placeholders."
                    className={`min-h-[400px] font-mono text-sm ${validationErrors.content ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.content && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.content}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Use {{variableName}} for placeholders</span>
                    <span>{content.length} / 4096 characters</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of when to use this template"
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tags..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button size="sm" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This preview shows how your template will appear with sample data
                  </AlertDescription>
                </Alert>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="whitespace-pre-wrap text-sm">
                      {previewContent}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variables" className="space-y-4">
                <Alert>
                  <Variable className="h-4 w-4" />
                  <AlertDescription>
                    Variables are automatically extracted from your template content
                  </AlertDescription>
                </Alert>

                {extractedVariables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Variable className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No variables found</p>
                    <p className="text-sm mt-2">Add variables using {{variableName}} syntax in your template</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {extractedVariables.map(variable => (
                      <Card key={variable.key}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-mono text-sm">{{`{{${variable.key}}}`}}</div>
                            <Badge variant="outline">{variable.type}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {variable.label}
                          </div>
                          {variable.required && (
                            <Badge variant="secondary" className="mt-2">Required</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <div className="space-y-4">
                  {isValidating ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                      <p className="text-muted-foreground">Validating compliance...</p>
                    </div>
                  ) : complianceIssues.length === 0 ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Template is SEBI compliant
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          {complianceIssues.length} compliance issue{complianceIssues.length !== 1 ? 's' : ''} found
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        {complianceIssues.map((issue, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                            <span className="text-sm">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Compliance Checklist</h4>
                    <div className="space-y-2">
                      <ComplianceCheckItem
                        label="No prohibited terms (guaranteed, assured returns, etc.)"
                        checked={!complianceIssues.some(i => i.includes('prohibited'))}
                      />
                      <ComplianceCheckItem
                        label="Includes risk disclaimer (if applicable)"
                        checked={category === 'seasonal-greetings' || !complianceIssues.some(i => i.includes('disclaimer'))}
                      />
                      <ComplianceCheckItem
                        label="Contains advisor identification"
                        checked={!complianceIssues.some(i => i.includes('advisor'))}
                      />
                      <ComplianceCheckItem
                        label="Within character limit (4096)"
                        checked={content.length <= 4096}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Template
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Generate Documentation
              </Button>
            </CardContent>
          </Card>

          {/* Template Info */}
          {template && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(template.metadata.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(template.metadata.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage Count</span>
                  <span>{template.metadata.usageCount}</span>
                </div>
                {template.metadata.lastUsedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Used</span>
                    <span>{new Date(template.metadata.lastUsedAt).toLocaleDateString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span>{template.currentVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versions</span>
                  <span>{template.versions.length}</span>
                </div>
                {template.isShared && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Shared with {template.sharedWith?.length || 0} members
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Templates help maintain consistency while allowing personalization.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use {{`{{variables}}`}} for dynamic content
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Include mandatory disclaimers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Keep within 4096 characters
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Test with preview before saving
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ComplianceCheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-orange-600" />
      )}
      <span className={`text-sm ${checked ? 'text-green-800' : 'text-orange-800'}`}>
        {label}
      </span>
    </div>
  );
}

function inferVariableType(key: string): TemplateVariable['type'] {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('date')) return 'date';
  if (lowerKey.includes('value') || lowerKey.includes('amount') || lowerKey.includes('change')) return 'number';
  return 'text';
}