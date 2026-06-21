"use server";

import { createServerActionClient, createServiceRoleClient } from "@/lib/supabaseServer";

interface FetchAuthWorkspaceInput {
  accessToken: string;
}

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

function isMissingTableError(error: unknown, tableName: string) {
  const supabaseError = error as SupabaseErrorLike;
  return (
    supabaseError?.code === "PGRST205" &&
    typeof supabaseError.message === "string" &&
    supabaseError.message.includes(`public.${tableName}`)
  );
}

function toActionError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) return error;

  const supabaseError = error as SupabaseErrorLike;
  if (supabaseError?.message) {
    return new Error(supabaseError.message);
  }

  return new Error(fallbackMessage);
}

export async function fetchAuthWorkspaceAction(input: FetchAuthWorkspaceInput) {
  const authSupabase = createServerActionClient(input.accessToken);
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to load your workspace.");
  }

  const adminSupabase = createServiceRoleClient();

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (isMissingTableError(profileError, "profiles")) {
    return fetchLegacyAuthWorkspace(user.id);
  }

  if (profileError) {
    throw toActionError(profileError, "Failed to load your user profile.");
  }

  if (!profile) {
    return {
      profile: null,
      membership: null,
      organization: null,
    };
  }

  const { data: membership, error: membershipError } = await adminSupabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (isMissingTableError(membershipError, "organization_members")) {
    return fetchLegacyAuthWorkspace(user.id);
  }

  if (membershipError) {
    throw toActionError(membershipError, "Failed to load your organization membership.");
  }

  if (!membership) {
    return {
      profile,
      membership: null,
      organization: null,
    };
  }

  const { data: organization, error: organizationError } = await adminSupabase
    .from("organizations")
    .select("id, name, slug, created_at")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (organizationError) {
    throw toActionError(organizationError, "Failed to load your organization.");
  }

  return {
    profile,
    membership,
    organization,
  };
}

async function fetchLegacyAuthWorkspace(userId: string) {
  const adminSupabase = createServiceRoleClient();

  const { data: legacyUser, error: legacyUserError } = await adminSupabase
    .from("users")
    .select("id, org_id, role, full_name, email, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (legacyUserError) {
    throw toActionError(legacyUserError, "Failed to load your legacy user profile.");
  }

  if (!legacyUser?.org_id) {
    return {
      legacyUser,
      profile: null,
      membership: null,
      organization: null,
    };
  }

  const { data: organization, error: organizationError } = await adminSupabase
    .from("organizations")
    .select("id, name, slug, created_at")
    .eq("id", legacyUser.org_id)
    .maybeSingle();

  if (organizationError) {
    throw toActionError(organizationError, "Failed to load your legacy organization.");
  }

  return {
    legacyUser,
    profile: null,
    membership: null,
    organization,
  };
}
