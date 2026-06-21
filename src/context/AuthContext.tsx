"use client";
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, User, Organization } from '@/lib/supabase'
import { fetchAuthWorkspaceAction } from '@/actions/authActions'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'
type OrganizationStatus = 'unknown' | 'ready' | 'needs_setup' | 'error'

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function logSupabaseError(label: string, error: unknown) {
  const supabaseError = error as SupabaseErrorLike | null | undefined;
  const errorObject =
    error && typeof error === 'object'
      ? Object.fromEntries(Object.getOwnPropertyNames(error).map((key) => [key, (error as Record<string, unknown>)[key]]))
      : null;

  console.error(label, {
    name: error instanceof Error ? error.name : undefined,
    message: supabaseError?.message,
    details: supabaseError?.details,
    hint: supabaseError?.hint,
    code: supabaseError?.code,
    stack: error instanceof Error ? error.stack : undefined,
    errorObject,
    raw: error,
  });
}

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  organization: Organization | null
  session: Session | null
  loading: boolean
  authStatus: AuthStatus
  organizationStatus: OrganizationStatus
  needsCompanySetup: boolean
  authError: string | null
  signInWithEmail: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signUpWithEmail: (email: string, password: string, fullName: string, inviteCode?: string | null) => Promise<{ data: unknown; error: unknown }>
  signInWithGoogle: () => Promise<{ data: unknown; error: unknown }>
  signOut: () => Promise<{ error: unknown }>
  hasRole: (role: string) => boolean
  completeCompanySetup: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [organizationStatus, setOrganizationStatus] = useState<OrganizationStatus>('unknown')
  const [authError, setAuthError] = useState<string | null>(null)
  const [needsCompanySetup, setNeedsCompanySetup] = useState(false)

  const markNeedsSetup = () => {
    setUserProfile(null)
    setOrganization(null)
    setNeedsCompanySetup(true)
    setAuthStatus('authenticated')
    setOrganizationStatus('needs_setup')
    setAuthError(null)
  }

  const clearAuthenticatedState = () => {
    setUserProfile(null)
    setOrganization(null)
    setNeedsCompanySetup(false)
    setAuthStatus('unauthenticated')
    setOrganizationStatus('unknown')
    setAuthError(null)
  }

  useEffect(() => {
    // Safety net: force loading done after 8s in case of DB/network stall
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 8000)

    // onAuthStateChange fires INITIAL_SESSION immediately with the cached session,
    // so there is no need for a separate getInitialSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          setAuthStatus('authenticated')
          setAuthError(null)

          if (!session.user.email_confirmed_at) {
            setUserProfile(null)
            setOrganization(null)
            setNeedsCompanySetup(false)
            setOrganizationStatus('unknown')
            setLoading(false)
            return
          }

          await fetchUserProfile(session.user.id)
        } else {
          clearAuthenticatedState()
        }

        setLoading(false)
      }
    )

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('Your session expired. Please sign in again.');
      }

      const workspaceState = await fetchAuthWorkspaceAction({ accessToken });

      if ('legacyUser' in workspaceState && workspaceState.legacyUser) {
        const legacyUser = workspaceState.legacyUser;

        if (!legacyUser.org_id) {
          markNeedsSetup();
          return;
        }

        if (workspaceState.organization) {
          setOrganization(workspaceState.organization as Organization);
        }

        setUserProfile({
          id: legacyUser.id,
          org_id: legacyUser.org_id,
          role: legacyUser.role as User['role'],
          full_name: legacyUser.full_name || '',
          email: legacyUser.email || user?.email,
          avatar_url: null,
          phone: null,
          created_at: legacyUser.created_at,
        });
        setNeedsCompanySetup(false);
        setAuthStatus('authenticated');
        setOrganizationStatus('ready');
        setAuthError(null);
        return;
      }

      if (!workspaceState.profile || !workspaceState.membership) {
        console.log('No active organization membership found, needs company setup');
        markNeedsSetup();
        return;
      }

      if (workspaceState.organization) {
        console.log('Organization fetched successfully:', workspaceState.organization);
        setOrganization(workspaceState.organization as Organization);
      }

      setUserProfile({
        id: workspaceState.profile.id,
        org_id: workspaceState.membership.organization_id,
        role: workspaceState.membership.role as User['role'],
        full_name: workspaceState.profile.full_name || '',
        email: user?.email,
        avatar_url: workspaceState.profile.avatar_url,
        phone: workspaceState.profile.phone,
        created_at: workspaceState.profile.created_at,
      });
      setNeedsCompanySetup(false);
      setAuthStatus('authenticated');
      setOrganizationStatus('ready');
      setAuthError(null);
    } catch (error) {
      logSupabaseError('Error in fetchUserProfile:', error);
      setAuthStatus('error');
      setOrganizationStatus('error');
      setAuthError(error instanceof Error ? error.message : 'We could not load your account. Please try again.');
      setNeedsCompanySetup(false);
      setUserProfile(null);
      setOrganization(null);
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Check if sign in was successful but email not confirmed
    if (data.user && !data.user.email_confirmed_at) {
      // Sign out the user since email is not confirmed
      await supabase.auth.signOut()
      return { 
        data: null, 
        error: new Error('Please confirm your email address before signing in. Check your inbox for a confirmation link.') 
      }
    }
    
    return { data, error }
  }

  const signUpWithEmail = async (email: string, password: string, fullName: string, inviteCode?: string | null) => {
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (inviteCode) {
      callbackUrl.searchParams.set("invite", inviteCode);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: callbackUrl.toString()
      }
    })
    
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setUserProfile(null)
      setOrganization(null)
      setSession(null)
      setNeedsCompanySetup(false)
      setAuthStatus('unauthenticated')
      setOrganizationStatus('unknown')
      setAuthError(null)
    }
    return { error }
  }

  const hasRole = (role: string) => {
    return userProfile?.role === role
  }

  const completeCompanySetup = async () => {
    setNeedsCompanySetup(false)
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const value = {
    user,
    userProfile,
    organization,
    session,
    loading,
    authStatus,
    organizationStatus,
    needsCompanySetup,
    authError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    hasRole,
    completeCompanySetup,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 