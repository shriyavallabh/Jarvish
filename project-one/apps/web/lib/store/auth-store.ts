import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginRequest, LoginResponse } from '@/lib/types/api';
import { api, setTokens, clearTokens, getTokens } from '@/lib/api/client';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  
  // OTP flow
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  otpSent: boolean;
  otpExpiresAt: number | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpSent: false,
      otpExpiresAt: null,
      
      // Login action
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<LoginResponse>('/auth/login', credentials);
          const { user, token, refreshToken } = response as any;
          
          // Set tokens in API client
          setTokens(token, refreshToken);
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Login failed',
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },
      
      // Send OTP
      sendOtp: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/send-otp', { phone });
          const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
          set({ 
            otpSent: true, 
            otpExpiresAt: expiresAt,
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to send OTP',
            otpSent: false
          });
          throw error;
        }
      },
      
      // Verify OTP
      verifyOtp: async (phone: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<LoginResponse>('/auth/verify-otp', { 
            phone, 
            otp 
          });
          const { user, token, refreshToken } = response as any;
          
          // Set tokens in API client
          setTokens(token, refreshToken);
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null,
            otpSent: false,
            otpExpiresAt: null
          });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Invalid OTP'
          });
          throw error;
        }
      },
      
      // Logout action
      logout: async () => {
        set({ isLoading: true });
        try {
          // Call logout endpoint if available
          await api.post('/auth/logout').catch(() => {
            // Ignore logout endpoint errors
          });
        } finally {
          // Clear local state regardless
          clearTokens();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
        }
      },
      
      // Update profile
      updateProfile: async (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) {
          throw new Error('No user logged in');
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await api.patch<User>('/user/profile', updates);
          const updatedUser = response as any;
          
          set({ 
            user: updatedUser, 
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update profile'
          });
          throw error;
        }
      },
      
      // Check authentication status
      checkAuth: async () => {
        const { accessToken } = getTokens();
        if (!accessToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        
        set({ isLoading: true });
        try {
          const response = await api.get<User>('/user/me');
          const user = response as any;
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          // Token might be invalid
          clearTokens();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false
          });
        }
      },
      
      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);