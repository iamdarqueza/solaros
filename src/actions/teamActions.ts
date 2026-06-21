"use server";

import { randomBytes } from "crypto";
import { Resend } from "resend";
import { createServerActionClient, createServiceRoleClient } from "@/lib/supabaseServer";

export type OrganizationRole = "owner" | "admin" | "manager" | "support_agent" | "technician";

export type TeamMember = {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: OrganizationRole;
  isActive: boolean;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
};

export type TeamInvite = {
  code: string;
  email: string;
  fullName: string;
  role: OrganizationRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  emailSentAt?: string;
  emailError?: string;
};

interface AccessTokenInput {
  accessToken: string;
}

interface CreateTeamInviteInput extends AccessTokenInput {
  email: string;
  fullName?: string;
  role: OrganizationRole;
}

interface UpdateTeamMemberInput extends AccessTokenInput {
  membershipId: string;
  fullName: string;
  phone?: string;
  role: OrganizationRole;
  isActive: boolean;
}

interface SupabaseErrorLike {
  message?: string;
}

type SettingsRow = {
  id: string;
  organization_id: string;
  settings: {
    team_invites?: TeamInvite[];
    [key: string]: unknown;
  } | null;
};

type MembershipRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  is_active: boolean;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type OrganizationRow = {
  id: string;
  name: string;
};

type EmailDelivery = {
  status: "sent" | "skipped" | "failed";
  message: string;
};

const INVITE_TTL_DAYS = 14;
const TEAM_ROLES: OrganizationRole[] = ["owner", "admin", "manager", "support_agent", "technician"];

function toActionError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) return error;

  const supabaseError = error as SupabaseErrorLike;
  if (supabaseError?.message) {
    return new Error(supabaseError.message);
  }

  return new Error(fallbackMessage);
}

function assertRole(role: OrganizationRole) {
  if (!TEAM_ROLES.includes(role)) {
    throw new Error("Choose a valid team role.");
  }
}

function canManageTeam(role: string) {
  return role === "owner" || role === "admin";
}

function normalizeInviteCode(value: string) {
  const trimmed = value.trim();
  const fromUrl = trimmed.match(/[?&]invite=([^&]+)/)?.[1] ?? trimmed.split("/").pop() ?? trimmed;
  return decodeURIComponent(fromUrl).trim().toUpperCase();
}

function generateInviteCode() {
  return `SOLAROS-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function authUserExistsByEmail(
  adminSupabase: ReturnType<typeof createServiceRoleClient>,
  email: string,
) {
  const targetEmail = email.toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw toActionError(error, "Failed to validate invite email.");
    }

    const users = data.users ?? [];
    if (users.some((user) => user.email?.toLowerCase() === targetEmail)) {
      return true;
    }

    if (users.length < 1000) {
      return false;
    }
  }

  return false;
}

function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function buildInviteUrl(code: string) {
  return `${getAppUrl()}/company-setup?invite=${encodeURIComponent(code)}`;
}

function getInviteEmailHtml({
  invite,
  organizationName,
  inviteUrl,
}: {
  invite: TeamInvite;
  organizationName: string;
  inviteUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 12px;">You have been invited to ${organizationName}</h1>
      <p>${invite.fullName ? `Hi ${invite.fullName},` : "Hi,"}</p>
      <p>An owner or admin invited you to join ${organizationName} on SolarOS as ${invite.role.replace("_", " ")}.</p>
      <p>
        <a href="${inviteUrl}" style="display: inline-block; background: #465fff; color: white; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          Accept invite
        </a>
      </p>
      <p>If the button does not work, copy this link into your browser:</p>
      <p style="word-break: break-all;"><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p>Your invite code is:</p>
      <p style="font-family: monospace; font-size: 18px; font-weight: 700; letter-spacing: 0.04em;">${invite.code}</p>
      <p>This invite expires on ${new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(invite.expiresAt))}.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 13px;">
        New to SolarOS? Create an account using this email address, set a password, then use the invite code above to join the organization.
      </p>
    </div>
  `;
}

async function sendInviteEmail({
  invite,
  organizationName,
}: {
  invite: TeamInvite;
  organizationName: string;
}): Promise<EmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "SolarOS <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      status: "skipped",
      message: "Invite code created. Add RESEND_API_KEY to send invite emails.",
    };
  }

  const resend = new Resend(apiKey);
  const inviteUrl = buildInviteUrl(invite.code);
  const { error } = await resend.emails.send({
    from,
    to: invite.email,
    subject: `Join ${organizationName} on SolarOS`,
    html: getInviteEmailHtml({ invite, organizationName, inviteUrl }),
    text: [
      `You have been invited to join ${organizationName} on SolarOS.`,
      `Role: ${invite.role.replace("_", " ")}`,
      `Accept invite: ${inviteUrl}`,
      `Invite code: ${invite.code}`,
      "If you are new to SolarOS, create an account with this email address and set a password first.",
    ].join("\n\n"),
  });

  if (error) {
    return {
      status: "failed",
      message: error.message || "Invite code created, but email delivery failed.",
    };
  }

  return {
    status: "sent",
    message: "Invite code created and email sent.",
  };
}

async function getVerifiedMembership(accessToken: string) {
  const authSupabase = createServerActionClient(accessToken);
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to manage team access.");
  }

  const adminSupabase = createServiceRoleClient();
  const { data: membership, error: membershipError } = await adminSupabase
    .from("organization_members")
    .select("id, organization_id, user_id, role, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw toActionError(membershipError, "Failed to load your organization membership.");
  }

  if (!membership) {
    throw new Error("You need an organization membership before managing team access.");
  }

  return {
    adminSupabase,
    user,
    membership: membership as {
      id: string;
      organization_id: string;
      user_id: string;
      role: OrganizationRole;
      is_active: boolean;
    },
  };
}

async function getSettingsRow(
  adminSupabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
) {
  const { data, error } = await adminSupabase
    .from("organization_settings")
    .select("id, organization_id, settings")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw toActionError(error, "Failed to load organization settings.");
  }

  if (data) return data as SettingsRow;

  const { data: created, error: createError } = await adminSupabase
    .from("organization_settings")
    .insert({
      organization_id: organizationId,
      settings: {},
    })
    .select("id, organization_id, settings")
    .single();

  if (createError) {
    throw toActionError(createError, "Failed to create organization settings.");
  }

  return created as SettingsRow;
}

async function saveInvites(
  adminSupabase: ReturnType<typeof createServiceRoleClient>,
  settingsRow: SettingsRow,
  invites: TeamInvite[],
) {
  const nextSettings = {
    ...(settingsRow.settings ?? {}),
    team_invites: invites,
  };

  const { error } = await adminSupabase
    .from("organization_settings")
    .update({ settings: nextSettings })
    .eq("id", settingsRow.id);

  if (error) {
    throw toActionError(error, "Failed to save team invite.");
  }
}

function getInviteStatus(invite: TeamInvite): TeamInvite["status"] {
  if (invite.status !== "pending") return invite.status;
  return new Date(invite.expiresAt).getTime() < Date.now() ? "expired" : "pending";
}

async function buildTeamState(adminSupabase: ReturnType<typeof createServiceRoleClient>, organizationId: string) {
  const { data: memberships, error: membershipsError } = await adminSupabase
    .from("organization_members")
    .select("id, organization_id, user_id, role, is_active, invited_at, joined_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (membershipsError) {
    throw toActionError(membershipsError, "Failed to load team members.");
  }

  const membershipRows = (memberships ?? []) as MembershipRow[];
  const userIds = membershipRows.map((member) => member.user_id);

  const { data: profiles, error: profilesError } = userIds.length
    ? await adminSupabase.from("profiles").select("id, full_name, phone").in("id", userIds)
    : { data: [], error: null };

  if (profilesError) {
    throw toActionError(profilesError, "Failed to load team profiles.");
  }

  const profileById = new Map((profiles as ProfileRow[]).map((profile) => [profile.id, profile]));
  const authUsers = await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await adminSupabase.auth.admin.getUserById(userId);
      return {
        userId,
        email: error ? "" : data.user?.email ?? "",
      };
    }),
  );
  const emailById = new Map(authUsers.map((authUser) => [authUser.userId, authUser.email]));

  const settingsRow = await getSettingsRow(adminSupabase, organizationId);
  const invites = (settingsRow.settings?.team_invites ?? []).map((invite) => ({
    ...invite,
    status: getInviteStatus(invite),
  }));

  const members: TeamMember[] = membershipRows.map((member) => {
    const profile = profileById.get(member.user_id);

    return {
      membershipId: member.id,
      userId: member.user_id,
      fullName: profile?.full_name || "SolarOS User",
      email: emailById.get(member.user_id) || "",
      phone: profile?.phone || "",
      role: member.role,
      isActive: member.is_active,
      invitedAt: member.invited_at,
      joinedAt: member.joined_at,
      createdAt: member.created_at,
    };
  });

  return {
    members,
    invites,
  };
}

export async function getOrganizationTeamAction(input: AccessTokenInput) {
  const { adminSupabase, membership } = await getVerifiedMembership(input.accessToken);
  return buildTeamState(adminSupabase, membership.organization_id);
}

export async function createTeamInviteAction(input: CreateTeamInviteInput) {
  assertRole(input.role);

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const { adminSupabase, user, membership } = await getVerifiedMembership(input.accessToken);

  if (!canManageTeam(membership.role)) {
    throw new Error("Only owners and admins can invite team members.");
  }

  if (await authUserExistsByEmail(adminSupabase, email)) {
    throw new Error("This email already exists in SolarOS. Please use another email address for a new teammate invite.");
  }

  const { data: organization, error: organizationError } = await adminSupabase
    .from("organizations")
    .select("id, name")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (organizationError) {
    throw toActionError(organizationError, "Failed to load organization details.");
  }

  const organizationName = (organization as OrganizationRow | null)?.name || "your SolarOS workspace";
  const settingsRow = await getSettingsRow(adminSupabase, membership.organization_id);
  const currentInvites = settingsRow.settings?.team_invites ?? [];
  const activeDuplicate = currentInvites.find(
    (invite) => invite.email.toLowerCase() === email && getInviteStatus(invite) === "pending",
  );

  if (activeDuplicate) {
    throw new Error("This email already has a pending invite.");
  }

  const invite: TeamInvite = {
    code: generateInviteCode(),
    email,
    fullName: input.fullName?.trim() || "",
    role: input.role,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy: user.id,
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };

  await saveInvites(adminSupabase, settingsRow, [...currentInvites, invite]);

  const emailDelivery = await sendInviteEmail({ invite, organizationName });

  if (emailDelivery.status !== "skipped") {
    const refreshedSettings = await getSettingsRow(adminSupabase, membership.organization_id);
    const refreshedInvites = refreshedSettings.settings?.team_invites ?? [];
    const nextInvites = refreshedInvites.map((candidate) =>
      candidate.code === invite.code
        ? {
            ...candidate,
            emailSentAt: emailDelivery.status === "sent" ? new Date().toISOString() : candidate.emailSentAt,
            emailError: emailDelivery.status === "failed" ? emailDelivery.message : undefined,
          }
        : candidate,
    );

    await saveInvites(adminSupabase, refreshedSettings, nextInvites);
  }

  return {
    invite,
    emailDelivery,
    ...(await buildTeamState(adminSupabase, membership.organization_id)),
  };
}

export async function updateTeamMemberAction(input: UpdateTeamMemberInput) {
  assertRole(input.role);

  const { adminSupabase, user, membership } = await getVerifiedMembership(input.accessToken);

  if (!canManageTeam(membership.role)) {
    throw new Error("Only owners and admins can edit team members.");
  }

  const { data: targetMembership, error: targetError } = await adminSupabase
    .from("organization_members")
    .select("id, organization_id, user_id, role, is_active")
    .eq("id", input.membershipId)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (targetError) {
    throw toActionError(targetError, "Failed to load team member.");
  }

  if (!targetMembership) {
    throw new Error("Team member was not found.");
  }

  const target = targetMembership as {
    id: string;
    organization_id: string;
    user_id: string;
    role: OrganizationRole;
    is_active: boolean;
  };

  if (target.user_id === user.id && (!input.isActive || input.role !== "owner")) {
    throw new Error("You cannot remove or demote your own owner access.");
  }

  if (target.role === "owner" && (!input.isActive || input.role !== "owner")) {
    const { count, error: ownerCountError } = await adminSupabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id)
      .eq("role", "owner")
      .eq("is_active", true);

    if (ownerCountError) {
      throw toActionError(ownerCountError, "Failed to verify organization owners.");
    }

    if ((count ?? 0) <= 1) {
      throw new Error("An organization must keep at least one active owner.");
    }
  }

  const { error: profileError } = await adminSupabase.from("profiles").upsert({
    id: target.user_id,
    full_name: input.fullName.trim() || "SolarOS User",
    phone: input.phone?.trim() || null,
  });

  if (profileError) {
    throw toActionError(profileError, "Failed to update team profile.");
  }

  const { error: membershipError } = await adminSupabase
    .from("organization_members")
    .update({
      role: input.role,
      is_active: input.isActive,
    })
    .eq("id", input.membershipId);

  if (membershipError) {
    throw toActionError(membershipError, "Failed to update team access.");
  }

  return buildTeamState(adminSupabase, membership.organization_id);
}

export async function acceptOrganizationInviteAction(input: AccessTokenInput & { inviteCode: string }) {
  const inviteCode = normalizeInviteCode(input.inviteCode);
  if (!inviteCode) {
    throw new Error("Enter an invite code or invite link.");
  }

  const authSupabase = createServerActionClient(input.accessToken);
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to join a workspace.");
  }

  const adminSupabase = createServiceRoleClient();
  const { data: settingsRows, error: settingsError } = await adminSupabase
    .from("organization_settings")
    .select("id, organization_id, settings");

  if (settingsError) {
    throw toActionError(settingsError, "Failed to validate invite code.");
  }

  const rows = (settingsRows ?? []) as SettingsRow[];
  const settingsRow = rows.find((row) =>
    (row.settings?.team_invites ?? []).some((invite) => invite.code.toUpperCase() === inviteCode),
  );

  if (!settingsRow) {
    throw new Error("Invite code was not found.");
  }

  const invites = settingsRow.settings?.team_invites ?? [];
  const invite = invites.find((candidate) => candidate.code.toUpperCase() === inviteCode);

  if (!invite) {
    throw new Error("Invite code was not found.");
  }

  const inviteStatus = getInviteStatus(invite);
  if (inviteStatus !== "pending") {
    throw new Error(`This invite is ${inviteStatus}. Ask an admin for a new invite.`);
  }

  if (invite.email && user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error("This invite was issued for a different email address.");
  }

  const { data: existingMembership, error: existingMembershipError } = await adminSupabase
    .from("organization_members")
    .select("id, organization_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (existingMembershipError) {
    throw toActionError(existingMembershipError, "Failed to check your existing workspace access.");
  }

  if (existingMembership) {
    return { organizationId: existingMembership.organization_id as string };
  }

  const fullName = user.user_metadata?.full_name || invite.fullName || user.email || "SolarOS User";
  const { error: profileError } = await adminSupabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
  });

  if (profileError) {
    throw toActionError(profileError, "Failed to create your user profile.");
  }

  const joinedAt = new Date().toISOString();
  const { error: memberError } = await adminSupabase.from("organization_members").insert({
    organization_id: settingsRow.organization_id,
    user_id: user.id,
    role: invite.role,
    is_active: true,
    invited_at: invite.createdAt,
    joined_at: joinedAt,
  });

  if (memberError) {
    throw toActionError(memberError, "Failed to join organization.");
  }

  const nextInvites = invites.map((candidate) =>
    candidate.code === invite.code
      ? {
          ...candidate,
          status: "accepted" as const,
          acceptedAt: joinedAt,
          acceptedBy: user.id,
        }
      : candidate,
  );

  await saveInvites(adminSupabase, settingsRow, nextInvites);

  return { organizationId: settingsRow.organization_id };
}
