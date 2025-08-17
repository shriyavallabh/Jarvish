import { create } from 'zustand';
import { Content, ComplianceCheckRequest, ComplianceCheckResponse, PaginationParams, PaginatedResponse } from '@/lib/types/api';
import { api } from '@/lib/api/client';

interface ContentState {
  // State
  contents: Content[];
  currentContent: Content | null;
  draftContent: Partial<Content> | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  
  // Compliance
  complianceResult: ComplianceCheckResponse | null;
  isCheckingCompliance: boolean;
  
  // Actions
  fetchContents: (params?: PaginationParams) => Promise<void>;
  fetchContent: (id: string) => Promise<void>;
  createContent: (content: Partial<Content>) => Promise<Content>;
  updateContent: (id: string, updates: Partial<Content>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  publishContent: (id: string) => Promise<void>;
  
  // Draft management
  setDraft: (draft: Partial<Content>) => void;
  clearDraft: () => void;
  saveDraft: () => Promise<void>;
  
  // Compliance
  checkCompliance: (request: ComplianceCheckRequest) => Promise<ComplianceCheckResponse>;
  clearComplianceResult: () => void;
  
  // Utility
  clearError: () => void;
  setCurrentContent: (content: Content | null) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  // Initial state
  contents: [],
  currentContent: null,
  draftContent: null,
  isLoading: false,
  isSaving: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  complianceResult: null,
  isCheckingCompliance: false,
  
  // Fetch all contents
  fetchContents: async (params?: PaginationParams) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams({
        page: String(params?.page || 1),
        limit: String(params?.limit || 10),
        ...(params?.sortBy && { sortBy: params.sortBy }),
        ...(params?.sortOrder && { sortOrder: params.sortOrder }),
      });
      
      const response = await api.get<PaginatedResponse<Content>>(
        `/content?${queryParams}`
      );
      const data = response as any;
      
      set({
        contents: data.data,
        currentPage: data.page,
        totalPages: data.totalPages,
        totalItems: data.total,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch contents',
      });
      throw error;
    }
  },
  
  // Fetch single content
  fetchContent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Content>(`/content/${id}`);
      const content = response as any;
      
      set({
        currentContent: content,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch content',
      });
      throw error;
    }
  },
  
  // Create content
  createContent: async (content: Partial<Content>) => {
    set({ isSaving: true, error: null });
    try {
      const response = await api.post<Content>('/content', content);
      const newContent = response as any;
      
      // Add to contents list
      set((state) => ({
        contents: [newContent, ...state.contents],
        currentContent: newContent,
        draftContent: null,
        isSaving: false,
        error: null,
      }));
      
      return newContent;
    } catch (error: any) {
      set({
        isSaving: false,
        error: error.message || 'Failed to create content',
      });
      throw error;
    }
  },
  
  // Update content
  updateContent: async (id: string, updates: Partial<Content>) => {
    set({ isSaving: true, error: null });
    try {
      const response = await api.patch<Content>(`/content/${id}`, updates);
      const updatedContent = response as any;
      
      set((state) => ({
        contents: state.contents.map((c) =>
          c.id === id ? updatedContent : c
        ),
        currentContent:
          state.currentContent?.id === id
            ? updatedContent
            : state.currentContent,
        isSaving: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isSaving: false,
        error: error.message || 'Failed to update content',
      });
      throw error;
    }
  },
  
  // Delete content
  deleteContent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/content/${id}`);
      
      set((state) => ({
        contents: state.contents.filter((c) => c.id !== id),
        currentContent:
          state.currentContent?.id === id ? null : state.currentContent,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to delete content',
      });
      throw error;
    }
  },
  
  // Publish content
  publishContent: async (id: string) => {
    set({ isSaving: true, error: null });
    try {
      const response = await api.post<Content>(`/content/${id}/publish`);
      const publishedContent = response as any;
      
      set((state) => ({
        contents: state.contents.map((c) =>
          c.id === id ? publishedContent : c
        ),
        currentContent:
          state.currentContent?.id === id
            ? publishedContent
            : state.currentContent,
        isSaving: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isSaving: false,
        error: error.message || 'Failed to publish content',
      });
      throw error;
    }
  },
  
  // Draft management
  setDraft: (draft: Partial<Content>) => {
    set({ draftContent: draft });
  },
  
  clearDraft: () => {
    set({ draftContent: null });
  },
  
  saveDraft: async () => {
    const { draftContent } = get();
    if (!draftContent) return;
    
    set({ isSaving: true, error: null });
    try {
      // Save draft to localStorage for now
      if (typeof window !== 'undefined') {
        localStorage.setItem('content_draft', JSON.stringify(draftContent));
      }
      
      // Optionally save to backend
      if (draftContent.id) {
        await get().updateContent(draftContent.id, draftContent);
      } else {
        await get().createContent({ ...draftContent, status: 'draft' });
      }
      
      set({ isSaving: false });
    } catch (error: any) {
      set({
        isSaving: false,
        error: error.message || 'Failed to save draft',
      });
      throw error;
    }
  },
  
  // Compliance checking
  checkCompliance: async (request: ComplianceCheckRequest) => {
    set({ isCheckingCompliance: true, error: null });
    try {
      const response = await api.post<ComplianceCheckResponse>(
        '/compliance/check',
        request
      );
      const result = response as any;
      
      set({
        complianceResult: result,
        isCheckingCompliance: false,
        error: null,
      });
      
      return result;
    } catch (error: any) {
      set({
        isCheckingCompliance: false,
        error: error.message || 'Compliance check failed',
      });
      throw error;
    }
  },
  
  clearComplianceResult: () => {
    set({ complianceResult: null });
  },
  
  // Utility
  clearError: () => set({ error: null }),
  
  setCurrentContent: (content: Content | null) => {
    set({ currentContent: content });
  },
}));