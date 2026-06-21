"use client";

import React, { useEffect, useState } from "react";
import { completeCompanySetupAction, joinOrganizationAction } from "@/actions/companySetupActions";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

interface CompanySetupProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  onComplete: () => Promise<void>;
}

type SetupMode = "choose" | "create" | "join";

interface ErrorLike {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const message = "message" in error ? error.message : null;
    if (typeof message === "string" && message.trim()) return message;
  }

  return "Something went wrong. Please try again.";
}

function logSetupError(label: string, error: unknown) {
  const setupError = error as ErrorLike | null | undefined;

  console.error(label, {
    message: setupError?.message,
    details: setupError?.details,
    hint: setupError?.hint,
    code: setupError?.code,
    raw: error,
  });
}

export default function CompanySetup({ onComplete }: CompanySetupProps) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<SetupMode>("choose");
  const [organizationName, setOrganizationName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const invite = searchParams.get("invite");
    if (invite) {
      setInviteCode(invite);
      setMode("join");
    }
  }, [searchParams]);

  const getAccessToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error("Your session expired. Please sign in again.");
    }

    return accessToken;
  };

  const handleCreateOrganization = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!organizationName.trim()) {
      setError("Organization name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const accessToken = await getAccessToken();

      await completeCompanySetupAction({
        accessToken,
        companyName: organizationName,
        businessType: businessType || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
      });

      await onComplete();
    } catch (err: unknown) {
      logSetupError("Error creating organization:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!inviteCode.trim()) {
      setError("Enter an invite code or invite link.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const accessToken = await getAccessToken();

      await joinOrganizationAction({
        accessToken,
        inviteCode,
      });

      window.localStorage.removeItem("solaros_pending_invite");
      await onComplete();
    } catch (err: unknown) {
      logSetupError("Error joining organization:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetMode = () => {
    setMode("choose");
    setError("");
  };

  return (
    <div className="min-h-screen bg-white px-6 py-10 dark:bg-gray-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-brand-950 p-8 text-white lg:p-10">
            <div className="mb-10 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              Company Setup
            </div>
            <h1 className="mb-4 text-3xl font-bold">
              Connect your account to an organization
            </h1>
            <p className="text-sm leading-6 text-white/70">
              SolarOS workspaces are scoped by organization. Create a new organization if you own the workspace, or join an existing one with an invite code.
            </p>
            <div className="mt-10 space-y-4 text-sm text-white/70">
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">1</span>
                <p>Organization data is kept separate with organization membership checks.</p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">2</span>
                <p>Admins and owners can manage customers, systems, tickets, warranties, and work orders.</p>
              </div>
            </div>
          </div>

          <div className="p-6 dark:bg-gray-900 sm:p-8 lg:p-10">
            {mode === "choose" && (
              <div>
                <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  How do you want to continue?
                </h2>
                <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
                  Choose the setup path that matches your SolarOS workspace.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode("create")}
                    className="rounded-2xl border border-gray-200 p-5 text-left transition hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/10"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h.01M9 13h.01M9 17h.01M13 17h.01M17 17h.01" />
                      </svg>
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Create Organization</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start a new SolarOS workspace and become the owner.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("join")}
                    className="rounded-2xl border border-gray-200 p-5 text-left transition hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/10"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M13 7a4 4 0 11-8 0 4 4 0 018 0zM3 21a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Join Organization</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use an invite code from an existing SolarOS organization.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {mode === "create" && (
              <form onSubmit={handleCreateOrganization}>
                <button
                  type="button"
                  onClick={resetMode}
                  className="mb-6 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Back
                </button>

                <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  Create your organization
                </h2>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  You will be added as the organization owner.
                </p>

                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <SetupField label="Organization name" required>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                      placeholder="Solar Future Inc"
                      className={INPUT_CLASS}
                      required
                    />
                  </SetupField>

                  <SetupField label="Business type" optional>
                    <input
                      type="text"
                      value={businessType}
                      onChange={(event) => setBusinessType(event.target.value)}
                      placeholder="Installer, EPC, O&M provider"
                      className={INPUT_CLASS}
                    />
                  </SetupField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SetupField label="Phone" optional>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+63 900 000 0000"
                        className={INPUT_CLASS}
                      />
                    </SetupField>

                    <SetupField label="Website" optional>
                      <input
                        type="url"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        placeholder="https://example.com"
                        className={INPUT_CLASS}
                      />
                    </SetupField>
                  </div>

                  <SetupField label="Address" optional>
                    <textarea
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Office address"
                      rows={3}
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </SetupField>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating organization..." : "Create Organization"}
                </button>
              </form>
            )}

            {mode === "join" && (
              <form onSubmit={handleJoinOrganization}>
                <button
                  type="button"
                  onClick={resetMode}
                  className="mb-6 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Back
                </button>

                <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  Join an organization
                </h2>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  Enter an invite code or paste the invite link from your workspace admin.
                </p>

                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400">
                    {error}
                  </div>
                )}

                <SetupField label="Invite code or link" required>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    placeholder="Paste invite code or link"
                    className={INPUT_CLASS}
                    required
                  />
                </SetupField>

                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
                  Ask an owner or admin for the invite code from Settings → Users & Roles.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Checking invite..." : "Join Organization"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupField({
  label,
  children,
  required,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-xs font-normal text-gray-400">(optional)</span>}
      </span>
      {children}
    </label>
  );
}