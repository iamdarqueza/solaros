"use client";
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import CompanySetup from './CompanySetup';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const {
    user,
    authStatus,
    organizationStatus,
    needsCompanySetup,
    authError,
    loading,
    completeCompanySetup,
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup', '/auth/callback', '/error-404', '/landing'];
  const authRoutes = ['/signin', '/signup'];
  const companySetupRoute = '/company-setup';
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isCompanySetupRoute = pathname === companySetupRoute;
  const isLandingPage = pathname === '/landing';
  const inviteCode = searchParams.get('invite');
  const companySetupTarget = inviteCode
    ? `${companySetupRoute}?invite=${encodeURIComponent(inviteCode)}`
    : companySetupRoute;
  
  // Handle redirects based on authentication state
  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    if (inviteCode) {
      window.localStorage.setItem('solaros_pending_invite', inviteCode);
    }

    if (!user && isCompanySetupRoute) {
      const inviteQuery = inviteCode ? `?invite=${encodeURIComponent(inviteCode)}` : '';
      router.push(`/signup${inviteQuery}`);
      return;
    }

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

    if (user && user.email_confirmed_at && needsCompanySetup && !isCompanySetupRoute) {
      const pendingInvite = inviteCode || window.localStorage.getItem('solaros_pending_invite');
      router.push(pendingInvite ? `${companySetupRoute}?invite=${encodeURIComponent(pendingInvite)}` : companySetupTarget);
      return;
    }

    if (user && user.email_confirmed_at && !needsCompanySetup && isCompanySetupRoute) {
      router.push('/');
      return;
    }

    // Redirect authenticated users away from auth pages and landing page to dashboard
    if (user && user.email_confirmed_at && !needsCompanySetup && (isAuthRoute || isLandingPage)) {
      router.push('/');
      return;
    }
  }, [loading, user, needsCompanySetup, isPublicRoute, isAuthRoute, isCompanySetupRoute, isLandingPage, router, inviteCode, companySetupTarget]);

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

  if (authStatus === 'error' || organizationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm dark:border-red-900/40 dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            We could not load your workspace
          </h2>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            {authError || 'Please refresh the page or sign in again.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Retry
          </button>
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