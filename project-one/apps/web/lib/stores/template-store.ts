/**
 * Template Store - Zustand store for template state management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TemplateManagementService } from '@/lib/services/template-management';
import type {
  Template,
  TemplateFilter,
  TemplateCreateInput,
  TemplateUpdateInput,
  TemplateShareInput,
  TemplateCategory,
  TemplateUsageStats
} from '@/lib/types/templates';

interface TemplateState {
  // State
  templates: Template[];
  selectedTemplate: Template | null;
  filter: TemplateFilter;
  isLoading: boolean;
  error: string | null;
  templateStats: Map<string, TemplateUsageStats>;
  
  // Service instance
  service: TemplateManagementService;
  
  // Actions
  loadTemplates: (userId: string) => Promise<void>;
  createTemplate: (input: TemplateCreateInput, userId: string) => Promise<Template>;
  updateTemplate: (templateId: string, update: TemplateUpdateInput, userId: string) => Promise<Template>;
  deleteTemplate: (templateId: string, userId: string) => Promise<void>;
  selectTemplate: (template: Template | null) => void;
  setFilter: (filter: TemplateFilter) => void;
  shareTemplate: (input: TemplateShareInput, userId: string) => Promise<Template>;
  useTemplate: (templateId: string, userId: string) => Promise<void>;
  cloneFromLibrary: (category: TemplateCategory, userId: string, options?: any) => Promise<Template>;
  getPopularTemplates: (teamId?: string) => Promise<Template[]>;
  exportTemplates: (templateIds: string[], userId: string) => Promise<any>;
  importTemplates: (data: any, userId: string) => Promise<Template[]>;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        templates: [],
        selectedTemplate: null,
        filter: {},
        isLoading: false,
        error: null,
        templateStats: new Map(),
        service: new TemplateManagementService(),

        // Load templates
        loadTemplates: async (userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const { service, filter } = get();
            const templates = await service.getTemplates(userId, filter);
            
            // Load stats for each template
            const statsMap = new Map();
            for (const template of templates) {
              const stats = await service.getTemplateStats(template.id);
              statsMap.set(template.id, stats);
            }
            
            set({ 
              templates, 
              templateStats: statsMap,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load templates',
              isLoading: false 
            });
          }
        },

        // Create template
        createTemplate: async (input: TemplateCreateInput, userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const { service } = get();
            const template = await service.createTemplate(input, userId);
            
            set(state => ({
              templates: [...state.templates, template],
              selectedTemplate: template,
              isLoading: false
            }));
            
            return template;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create template',
              isLoading: false 
            });
            throw error;
          }
        },

        // Update template
        updateTemplate: async (templateId: string, update: TemplateUpdateInput, userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const { service } = get();
            const updatedTemplate = await service.updateTemplate(templateId, update, userId);
            
            set(state => ({
              templates: state.templates.map(t => 
                t.id === templateId ? updatedTemplate : t
              ),
              selectedTemplate: state.selectedTemplate?.id === templateId 
                ? updatedTemplate 
                : state.selectedTemplate,
              isLoading: false
            }));
            
            return updatedTemplate;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update template',
              isLoading: false 
            });
            throw error;
          }
        },

        // Delete template
        deleteTemplate: async (templateId: string, userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const { service } = get();
            await service.bulkOperation({
              action: 'delete',
              templateIds: [templateId]
            }, userId);
            
            set(state => ({
              templates: state.templates.filter(t => t.id !== templateId),
              selectedTemplate: state.selectedTemplate?.id === templateId 
                ? null 
                : state.selectedTemplate,
              isLoading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete template',
              isLoading: false 
            });
            throw error;
          }
        },

        // Select template
        selectTemplate: (template: Template | null) => {
          set({ selectedTemplate: template });
        },

        // Set filter
        setFilter: (filter: TemplateFilter) => {
          set({ filter });
        },

        // Share template
        shareTemplate: async (input: TemplateShareInput, userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const { service } = get();
            const sharedTemplate = await service.shareTemplate(input, userId);
            
            set(state => ({
              templates: state.templates.map(t => 
                t.id === input.templateId ? sharedTemplate : t
              ),
              selectedTemplate: state.selectedTemplate?.id === input.templateId 
                ? sharedTemplate 
                : state.selectedTemplate,
              isLoading: false
            }));
            
            return sharedTemplate;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to share template',
              isLoading: false 
            });
            throw error;
          }
        },

        // Use template
        useTemplate: async (templateId: string, userId: string) => {
          try {
            const { service } = get();
            await service.useTemplate(templateId, userId);
            
            // Update stats
            const stats = await service.getTemplateStats(templateId);
            set(state => {
              const newStats = new Map(state.templateStats);
              newStats.set(templateId, stats);
              return { templateStats: newStats };
            });
            
            // Update template usage count in list
            set(state => ({
              templates: state.templates.map(t => {
                if (t.id === templateId) {
                  return {
                    ...t,
                    metadata: {
                      ...t.metadata,
                      usageCount: t.metadata.usageCount + 1,
                      lastUsedAt: new Date()
                    }
                  };
                }
                return t;
              })
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to track template usage'
            });
          }
        },

        // Clone from library
        cloneFromLibrary: async (category: TemplateCategory, userId: string, options?: any) => {
          set({ isLoading: true, error: null });
          try {
            const { service } = get();
            const template = await service.cloneFromLibrary(category, userId, options);
            
            set(state => ({
              templates: [...state.templates, template],
              selectedTemplate: template,
              isLoading: false
            }));
            
            return template;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to clone template',
              isLoading: false 
            });
            throw error;
          }
        },

        // Get popular templates
        getPopularTemplates: async (teamId?: string) => {
          try {
            const { service } = get();
            return await service.getPopularTemplates(teamId, 10);
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to get popular templates'
            });
            return [];
          }
        },

        // Export templates
        exportTemplates: async (templateIds: string[], userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const { service } = get();
            const exportData = await service.exportTemplates(templateIds, userId);
            set({ isLoading: false });
            return exportData;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to export templates',
              isLoading: false 
            });
            throw error;
          }
        },

        // Import templates
        importTemplates: async (data: any, userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const { service } = get();
            const imported = await service.importTemplates(data, userId);
            
            set(state => ({
              templates: [...state.templates, ...imported],
              isLoading: false
            }));
            
            return imported;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to import templates',
              isLoading: false 
            });
            throw error;
          }
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        }
      }),
      {
        name: 'template-store',
        partialize: (state) => ({
          filter: state.filter,
          selectedTemplate: state.selectedTemplate
        })
      }
    )
  )
);