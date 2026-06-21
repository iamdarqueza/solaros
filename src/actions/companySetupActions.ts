"use server";

import { createServerActionClient, slugifyOrganizationName } from "@/lib/supabaseServer";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { acceptOrganizationInviteAction } from "@/actions/teamActions";

interface CompleteCompanySetupInput {
  accessToken: string;
  companyName: string;
  businessType?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  systemsInstalled?: string | null;
  biggestChallenge?: string | null;
}

interface JoinOrganizationInput {
  accessToken: string;
  inviteCode: string;
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

function missingWorkspaceSchemaError() {
  return new Error(
    "Your Supabase database is missing the workspace tables. Run the SolarOS schema in md_files/001_solaros_mvp_schema.sql, then try creating the workspace again.",
  );
}

export async function completeCompanySetupAction(input: CompleteCompanySetupInput) {
  const supabase = createServerActionClient(input.accessToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to create a workspace.");
  }

  const adminSupabase = createServiceRoleClient();
  const fullName = user.user_metadata?.full_name || user.email || "SolarOS User";

  const { error: profileError } = await adminSupabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
  });

  if (isMissingTableError(profileError, "profiles")) {
    return completeLegacyCompanySetup(input, user.id, user.email, fullName);
  }

  if (profileError) {
    throw toActionError(profileError, "Failed to create your user profile.");
  }

  const { data: existingMembership, error: membershipLookupError } = await adminSupabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (isMissingTableError(membershipLookupError, "organization_members")) {
    return completeLegacyCompanySetup(input, user.id, user.email, fullName);
  }

  if (membershipLookupError) {
    throw toActionError(membershipLookupError, "Failed to check your workspace membership.");
  }

  if (existingMembership) {
    return { organizationId: existingMembership.organization_id };
  }

  const { data: organization, error: orgError } = await adminSupabase
    .from("organizations")
    .insert({
      name: input.companyName.trim(),
      slug: slugifyOrganizationName(input.companyName),
      phone: input.phone?.trim() || null,
      website: input.website?.trim() || null,
      address: input.address?.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (orgError) {
    throw toActionError(orgError, "Failed to create your organization.");
  }

  const { error: memberError } = await adminSupabase.from("organization_members").insert({
    organization_id: organization.id,
    user_id: user.id,
    role: "owner",
    is_active: true,
    invited_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    throw toActionError(memberError, "Failed to add you to the workspace.");
  }

  const { error: settingsError } = await adminSupabase.from("organization_settings").insert({
    organization_id: organization.id,
    settings: {
      onboarding: {
        business_type: input.businessType?.trim() || null,
        systems_installed: input.systemsInstalled ?? null,
        biggest_challenge: input.biggestChallenge ?? null,
      },
    },
  });

  if (settingsError) {
    throw toActionError(settingsError, "Failed to create organization settings.");
  }

  return { organizationId: organization.id };
}

export async function joinOrganizationAction(input: JoinOrganizationInput) {
  return acceptOrganizationInviteAction(input);
}

async function completeLegacyCompanySetup(
  input: CompleteCompanySetupInput,
  userId: string,
  email: string | undefined,
  fullName: string,
) {
  const adminSupabase = createServiceRoleClient();

  const { data: existingUser, error: userLookupError } = await adminSupabase
    .from("users")
    .select("org_id")
    .eq("id", userId)
    .maybeSingle();

  if (isMissingTableError(userLookupError, "users")) {
    throw missingWorkspaceSchemaError();
  }

  if (userLookupError) {
    throw toActionError(userLookupError, "Failed to check your existing workspace.");
  }

  if (existingUser?.org_id) {
    return { organizationId: existingUser.org_id };
  }

  const { data: organization, error: orgError } = await adminSupabase
    .from("organizations")
    .insert({
      name: input.companyName.trim(),
      slug: slugifyOrganizationName(input.companyName),
      phone: input.phone?.trim() || null,
      website: input.website?.trim() || null,
      address: input.address?.trim() || null,
    })
    .select("id")
    .single();

  if (orgError) {
    throw toActionError(orgError, "Failed to create your organization.");
  }

  if (existingUser) {
    const { error: updateUserError } = await adminSupabase
      .from("users")
      .update({
        org_id: organization.id,
        role: "admin",
        full_name: fullName,
        email: email ?? `${userId}@unknown.local`,
      })
      .eq("id", userId);

    if (updateUserError) {
      throw toActionError(updateUserError, "Failed to update your workspace access.");
    }
  } else {
    const { error: insertUserError } = await adminSupabase.from("users").insert({
      id: userId,
      org_id: organization.id,
      role: "admin",
      full_name: fullName,
      email: email ?? `${userId}@unknown.local`,
    });

    if (insertUserError) {
      throw toActionError(insertUserError, "Failed to create your workspace access.");
    }
  }

  return { organizationId: organization.id };
}
