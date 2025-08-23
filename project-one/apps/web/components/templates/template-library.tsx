'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTemplateStore } from '@/lib/stores/template-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Plus, 
  Copy, 
  Edit, 
  Share2, 
  Trash2, 
  MoreVertical,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  Users,
  Download,
  Upload
} from 'lucide-react';
import type { Template, TemplateCategory, TemplateFilter, TemplateLanguage } from '@/lib/types/templates';

const categoryIcons: Record<TemplateCategory, React.ReactNode> = {
  educational: <FileText className="h-4 w-4" />,
  'market-update': <TrendingUp className="h-4 w-4" />,
  'seasonal-greetings': <Globe className="h-4 w-4" />,
  'investment-tips': <CheckCircle className="h-4 w-4" />,
  'risk-disclosure': <AlertCircle className="h-4 w-4" />,
  custom: <Edit className="h-4 w-4" />
};

const categoryColors: Record<TemplateCategory, string> = {
  educational: 'bg-blue-100 text-blue-800',
  'market-update': 'bg-green-100 text-green-800',
  'seasonal-greetings': 'bg-purple-100 text-purple-800',
  'investment-tips': 'bg-yellow-100 text-yellow-800',
  'risk-disclosure': 'bg-red-100 text-red-800',
  custom: 'bg-gray-100 text-gray-800'
};

const languageLabels: Record<TemplateLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी'
};

export function TemplateLibrary() {
  const { user } = useUser();
  const {
    templates,
    selectedTemplate,
    filter,
    isLoading,
    error,
    loadTemplates,
    selectTemplate,
    setFilter,
    deleteTemplate,
    useTemplate,
    cloneFromLibrary,
    exportTemplates,
    clearError
  } = useTemplateStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<TemplateCategory[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<TemplateLanguage[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadTemplates(user.id);
    }
  }, [user?.id, filter]);

  useEffect(() => {
    // Update filter when search or category changes
    setFilter({
      ...filter,
      searchQuery: searchQuery || undefined,
      category: selectedCategories.length > 0 ? selectedCategories : undefined,
      language: selectedLanguages.length > 0 ? selectedLanguages : undefined
    });
  }, [searchQuery, selectedCategories, selectedLanguages]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Apply local filtering for immediate UI response
      if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(template.category)) {
        return false;
      }
      if (selectedLanguages.length > 0 && !selectedLanguages.includes(template.language)) {
        return false;
      }
      return true;
    });
  }, [templates, searchQuery, selectedCategories, selectedLanguages]);

  const handleUseTemplate = async (template: Template) => {
    if (!user?.id) return;
    await useTemplate(template.id, user.id);
    selectTemplate(template);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user?.id) return;
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(templateId, user.id);
    }
  };

  const handleExport = async () => {
    if (!user?.id) return;
    const exportData = await exportTemplates(selectedTemplateIds, user.id);
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templates-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSelectedTemplateIds([]);
  };

  const handleCloneFromLibrary = async (category: TemplateCategory) => {
    if (!user?.id) return;
    const template = await cloneFromLibrary(category, user.id, {
      name: `${category} Template - ${new Date().toLocaleDateString()}`
    });
    selectTemplate(template);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Library</h2>
          <p className="text-muted-foreground">
            Manage and customize your content templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          {selectedTemplateIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export ({selectedTemplateIds.length})
            </Button>
          )}
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Category
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['educational', 'market-update', 'seasonal-greetings', 'investment-tips', 'risk-disclosure', 'custom'] as TemplateCategory[]).map(category => (
                  <DropdownMenuItem
                    key={category}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Checkbox
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="flex items-center gap-2">
                      {categoryIcons[category]}
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  Language
                  {selectedLanguages.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedLanguages.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Filter by Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['en', 'hi', 'mr'] as TemplateLanguage[]).map(lang => (
                  <DropdownMenuItem
                    key={lang}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Checkbox
                      checked={selectedLanguages.includes(lang)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLanguages([...selectedLanguages, lang]);
                        } else {
                          setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                        }
                      }}
                      className="mr-2"
                    />
                    {languageLabels[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <Tabs defaultValue="my-templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-templates">
            My Templates ({filteredTemplates.filter(t => t.metadata.author === user?.id).length})
          </TabsTrigger>
          <TabsTrigger value="shared">
            Shared with Me ({filteredTemplates.filter(t => t.isShared && t.metadata.author !== user?.id).length})
          </TabsTrigger>
          <TabsTrigger value="library">
            Template Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates
              .filter(t => t.metadata.author === user?.id)
              .map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                  onEdit={() => selectTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                  onShare={() => {
                    selectTemplate(template);
                    setShowShareDialog(true);
                  }}
                  isSelected={selectedTemplateIds.includes(template.id)}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedTemplateIds([...selectedTemplateIds, template.id]);
                    } else {
                      setSelectedTemplateIds(selectedTemplateIds.filter(id => id !== template.id));
                    }
                  }}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates
              .filter(t => t.isShared && t.metadata.author !== user?.id)
              .map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                  onEdit={() => selectTemplate(template)}
                  isShared
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(['educational', 'market-update', 'seasonal-greetings', 'investment-tips', 'risk-disclosure'] as TemplateCategory[]).map(category => (
              <Card key={category} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {categoryIcons[category]}
                    {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardTitle>
                  <CardDescription>
                    Pre-built SEBI-compliant template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge className={categoryColors[category]}>
                    {category}
                  </Badge>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    Professional template for {category.replace('-', ' ')} content with built-in compliance checks and variable placeholders.
                  </p>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleCloneFromLibrary(category)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onUse: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  isShared?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

function TemplateCard({
  template,
  onUse,
  onEdit,
  onDelete,
  onShare,
  isShared = false,
  isSelected = false,
  onSelect
}: TemplateCardProps) {
  const getStatusColor = (status: Template['status']) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceIcon = (status: Template['compliance']['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'requires-review': return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {template.name}
              {isShared && <Users className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="mt-1">
              v{template.currentVersion} • {languageLabels[template.language]}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getComplianceIcon(template.compliance.status)}
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onUse}>
                  <FileText className="h-4 w-4 mr-2" />
                  Use Template
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Badge className={categoryColors[template.category]}>
            {template.category}
          </Badge>
          <Badge className={getStatusColor(template.status)}>
            {template.status}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.metadata.description || template.content.substring(0, 100)}...
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {template.metadata.usageCount} uses
          </span>
          <span>
            {new Date(template.metadata.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {template.metadata.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {template.metadata.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.metadata.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.metadata.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}