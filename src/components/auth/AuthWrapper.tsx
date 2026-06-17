"use client";
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CompanySetup from './CompanySetup';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, needsCompanySetup, loading, completeCompanySetup } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup', '/auth/callback', '/error-404', '/landing'];
  const authRoutes = ['/signin', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isLandingPage = pathname === '/landing';
  
  // Handle redirects based on authentication state
  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    // Redirect unauthenticated users to landing page (except for public routes)
    if (!user && !isPublicRoute) {
      router.push('/landing');
      return;
    }

    // Check if user email is confirmed
    if (user && !user.email_confirmed_at && !isPublicRoute) {
      // Sign out unconfirmed users and redirect to sign in
      router.push('/signin?message=Please confirm your email address before signing in.');
      return;
    }

    // Redirect authenticated users away from auth pages and landing page to dashboard
    if (user && user.email_confirmed_at && !needsCompanySetup && (isAuthRoute || isLandingPage)) {
      router.push('/');
      return;
    }
  }, [loading, user, needsCompanySetup, isPublicRoute, isAuthRoute, isLandingPage, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow public routes to render without authentication
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If user is not authenticated and it's not a public route, show loading
  // (the useEffect above will handle the redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // If user exists but email is not confirmed, show loading while redirecting
  if (user && !user.email_confirmed_at && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email Confirmation Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please confirm your email address to continue.</p>
        </div>
      </div>
    );
  }

  // Show company setup if user is authenticated but needs company setup
  if (user && needsCompanySetup) {
    return <CompanySetup user={user} onComplete={completeCompanySetup} />;
  }

  // Show children (normal app content) - user is authenticated and has completed setup
  return <>{children}</>;
} 