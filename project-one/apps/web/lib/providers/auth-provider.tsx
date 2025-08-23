'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/about', '/pricing', '/contact'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Redirect logic based on authentication status
    const isPublicPath = PUBLIC_PATHS.includes(pathname);
    const isAdvisorPath = pathname.startsWith('/advisor');
    const isAdminPath = pathname.startsWith('/admin');

    if (!isAuthenticated && (isAdvisorPath || isAdminPath)) {
      // Redirect to login if trying to access protected routes
      router.push('/login');
    } else if (isAuthenticated && pathname === '/login') {
      // Redirect to appropriate dashboard if already logged in
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/advisor');
      }
    }
  }, [isAuthenticated, pathname, router, user]);

  return <>{children}</>;
}