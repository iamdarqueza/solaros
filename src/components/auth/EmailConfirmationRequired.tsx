"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface EmailConfirmationRequiredProps {
  email: string;
  onBack: () => void;
}

export default function EmailConfirmationRequired({ email, onBack }: EmailConfirmationRequiredProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      console.error('Error resending email:', error);
    } else {
      setResent(true);
    }
    
    setResending(false);
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto pt-10">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Check Your Email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              We&apos;ve sent a confirmation link to:
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-6">
              {email}
            </p>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Please click the confirmation link in your email to complete your registration. You may need to check your spam folder.
            </p>
          </div>

          {resent && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/10 dark:border-green-800 dark:text-green-400">
              Confirmation email sent! Please check your inbox.
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={resending || resent}
              className="w-full px-4 py-3 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "Resending..." : resent ? "Email Sent!" : "Resend Confirmation Email"}
            </button>
            
            <button
              onClick={onBack}
              className="w-full px-4 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Back to Sign Up
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already confirmed your email?{" "}
              <a href="/signin" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 