/**
 * App Provider - Main application wrapper with all providers
 * Handles authentication, theme, and global state management
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const { currentUser } = useLearningStore();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to onboarding if no user and not already on onboarding page
  useEffect(() => {
    if (!currentUser && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [currentUser, pathname, router]);

  // Show loading screen on initial load
  if (typeof window !== 'undefined' && !currentUser && localStorage.getItem('nuru-learning-store')) {
    return <LoadingScreen />;
  }

  // Show loading while redirecting to onboarding
  if (!currentUser && pathname !== '/onboarding') {
    return <LoadingScreen />;
  }

  // Allow onboarding page to render without MainLayout
  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Main app with authenticated user
  return <MainLayout>{children}</MainLayout>;
}
