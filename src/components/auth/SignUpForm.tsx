"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function SignUpForm() {
  const [mode, setMode] = useState<"choice" | "email">("choice");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState("");

  const { signUpWithEmail, signInWithGoogle } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get("error");
    const urlMessage = urlParams.get("message");
    const inviteCode = urlParams.get("invite");

    if (inviteCode) {
      window.localStorage.setItem("solaros_pending_invite", inviteCode);
      setInviteCode(inviteCode);
      setMode("email");
    }

    if (urlError === "email_not_allowed" && urlMessage) {
      setError(decodeURIComponent(urlMessage));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlError === "auth_callback_error") {
      setError("Authentication failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError("");
    const { error } = await signInWithGoogle();
    if (error) {
      setError((error as Error).message || "Google sign up failed");
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    setResentMessage("");

    const fullName = `${firstName} ${lastName}`.trim();
    const pendingInvite = inviteCode || window.localStorage.getItem("solaros_pending_invite");
    const { data, error } = await signUpWithEmail(email, password, fullName, pendingInvite);

    if (error) {
      setError((error as Error).message || "Sign up failed");
      setLoading(false);
    } else {
      const authData = data as { user?: unknown; session?: unknown };
      if (authData?.user && !authData?.session) {
        setEmailSent(true);
      } else if (authData?.user && authData?.session) {
        window.location.href = pendingInvite ? `/company-setup?invite=${encodeURIComponent(pendingInvite)}` : "/";
      } else {
        setEmailSent(true);
      }
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Enter the email you used to sign up.");
      return;
    }

    setResending(true);
    setError("");
    setResentMessage("");

    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    const pendingInvite = inviteCode || window.localStorage.getItem("solaros_pending_invite");
    if (pendingInvite) {
      callbackUrl.searchParams.set("invite", pendingInvite);
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setError(error.message || "Could not resend confirmation email.");
    } else {
      setResentMessage("Confirmation email resent. Please check your inbox and spam folder.");
    }

    setResending(false);
  };

  if (emailSent) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6">
          <div className="text-center">
            {/* Animated envelope */}
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-brand-50 dark:bg-brand-900/20 animate-bounce">
              <svg className="w-10 h-10 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Check your email
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              We sent a confirmation link to
            </p>
            <p className="font-semibold text-gray-800 dark:text-white mb-6">{email}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Click the link in the email to confirm your address and complete sign up.
            </p>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/10 dark:text-amber-300">
              This confirmation email is sent by Supabase Auth. If it does not arrive after resending, check your Supabase Auth email/SMTP settings.
            </div>
            {error && (
              <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}
            {resentMessage && (
              <div className="mt-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl dark:bg-green-900/10 dark:border-green-800 dark:text-green-400">
                {resentMessage}
              </div>
            )}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="mb-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend confirmation email"}
              </button>
              <Link href="/signin" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Start managing your solar operations
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {mode === "choice" ? (
          <div className="space-y-3">
            {/* Google button */}
            <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              type="button"
              className="group w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z" fill="#4285F4"/>
                <path d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z" fill="#34A853"/>
                <path d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z" fill="#FBBC05"/>
                <path d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z" fill="#EB4335"/>
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {loading ? "Connecting…" : "Continue with Google"}
              </span>
            </button>

            {/* Email button */}
            <button
              onClick={() => setMode("email")}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Continue with Email
              </span>
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link href="/signin" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => { setMode("choice"); setError(""); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">First name</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Last name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="john@solarfuture.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-2"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/signin" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
