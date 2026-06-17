"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, User, Organization } from '@/lib/supabase'

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  organization: Organization | null
  session: Session | null
  loading: boolean
  needsCompanySetup: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ data: unknown; error: unknown }>
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
  const [needsCompanySetup, setNeedsCompanySetup] = useState(false)
  // Guards against fetchUserProfile resetting needsCompanySetup after setup is complete.
  // TODO: Remove this ref once Supabase backend writes are wired up (user profile will exist on re-fetch).
  const setupCompletedRef = useRef(false)

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
          if (!session.user.email_confirmed_at) {
            setUserProfile(null)
            setOrganization(null)
            setNeedsCompanySetup(false)
            setLoading(false)
            return
          }

          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          setOrganization(null)
          setNeedsCompanySetup(false)
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
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        // First check if user exists in users table
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .abortSignal(controller.signal)
          .single();

        if (error && error.code === 'PGRST116') {
          // User doesn't exist in users table
          clearTimeout(timeoutId);
          if (setupCompletedRef.current) {
            // Setup was already completed this session — don't re-trigger the wizard.
            // TODO: Remove this guard once Supabase backend writes are wired up.
            console.log('No DB profile found, but setup already completed — skipping wizard.');
            return;
          }
          console.log('User profile not found, needs company setup');
          setNeedsCompanySetup(true);
          setUserProfile(null);
          setOrganization(null);
          return;
        }

        if (error) {
          clearTimeout(timeoutId);
          console.error('Error fetching user profile:', error);
          throw error;
        }

        console.log('User profile fetched successfully:', profile);

        // Fetch organization separately
        if (profile.org_id) {
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.org_id)
            .abortSignal(controller.signal)
            .single();

          if (!orgError && org) {
            console.log('Organization fetched successfully:', org);
            setOrganization(org);
          } else {
            console.error('Error fetching organization:', orgError);
          }
        }

        clearTimeout(timeoutId);
        setUserProfile(profile);
        setNeedsCompanySetup(false);
      } catch (abortError: unknown) {
        clearTimeout(timeoutId);
        if (abortError instanceof Error && abortError.name === 'AbortError') {
          console.error('Request timed out while fetching user profile');
          throw new Error('Request timed out. Please try again.');
        }
        throw abortError;
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      if (!setupCompletedRef.current) {
        // Only trigger setup wizard on error if setup hasn't been completed yet.
        setNeedsCompanySetup(true);
        setUserProfile(null);
        setOrganization(null);
      }
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

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
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
    }
    return { error }
  }

  const hasRole = (role: string) => {
    return userProfile?.role === role
  }

  const completeCompanySetup = async () => {
    setupCompletedRef.current = true  // Prevent fetchUserProfile from re-triggering the wizard
    setNeedsCompanySetup(false)
    // TODO: Re-enable fetchUserProfile once Supabase backend writes are wired up.
    // Currently bypassed — re-fetching would find no user record and reset needsCompanySetup to true.
    // if (user) {
    //   await fetchUserProfile(user.id)
    // }
  }

  const value = {
    user,
    userProfile,
    organization,
    session,
    loading,
    needsCompanySetup,
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