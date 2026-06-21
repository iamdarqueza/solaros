"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  createTeamInviteAction,
  getOrganizationTeamAction,
  updateTeamMemberAction,
  type OrganizationRole,
  type TeamInvite,
  type TeamMember,
} from "@/actions/teamActions";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type SettingsSection =
  | "company"
  | "users"
  | "service"
  | "workOrders"
  | "maintenance"
  | "warranty"
  | "notifications"
  | "portal"
  | "billing";

type CompanySettings = {
  companyName: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  timezone: string;
  currency: string;
  country: string;
};

type Role = {
  key: OrganizationRole | "customer_portal";
  name: string;
  description: string;
  permissions: string[];
};

type ToggleOption = {
  label: string;
  enabled: boolean;
};

const SECTION_TABS: { key: SettingsSection; label: string; description: string }[] = [
  { key: "company", label: "Company", description: "Brand, contact, and regional defaults" },
  { key: "users", label: "Users & Roles", description: "Team access and permission previews" },
  { key: "service", label: "Service Types", description: "Field service categories offered" },
  { key: "workOrders", label: "Work Orders", description: "Statuses, priorities, and job templates" },
  { key: "maintenance", label: "Maintenance", description: "Intervals, reminders, and checklists" },
  { key: "warranty", label: "Warranty", description: "Alert timing, types, and reminders" },
  { key: "notifications", label: "Notifications", description: "Customer, technician, and internal messaging" },
  { key: "portal", label: "Customer Portal", description: "Branding and customer-facing permissions" },
  { key: "billing", label: "Billing", description: "Future subscription and invoice controls" },
];

const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: "SolarOS Service Co.",
  address: "4200 Sunridge Parkway, San Diego, CA 92121",
  contactEmail: "support@solaros.example",
  contactPhone: "(555) 013-2048",
  timezone: "America/Los_Angeles",
  currency: "USD",
  country: "United States",
};

const ROLES: Role[] = [
  {
    key: "owner",
    name: "Owner",
    description: "Full account ownership, billing control, and system-wide settings.",
    permissions: ["Manage billing", "Invite admins", "Edit all settings", "View all customer records"],
  },
  {
    key: "admin",
    name: "Admin",
    description: "Operational admin access across customers, work orders, and reports.",
    permissions: ["Manage customers", "Assign jobs", "Edit documents", "Manage team users"],
  },
  {
    key: "manager",
    name: "Manager",
    description: "Regional manager access for service delivery and technician scheduling.",
    permissions: ["Dispatch technicians", "Review service reports", "Approve follow-ups"],
  },
  {
    key: "support_agent",
    name: "Support Agent",
    description: "Customer communication access for tickets and portal requests.",
    permissions: ["Manage tickets", "Reply to customers", "Link work orders", "View service history"],
  },
  {
    key: "technician",
    name: "Technician",
    description: "Mobile job portal access for assigned field service visits.",
    permissions: ["View assigned jobs", "Upload photos", "Submit service reports"],
  },
  {
    key: "customer_portal",
    name: "Customer",
    description: "Self-service portal access for site records, documents, and requests.",
    permissions: ["View own systems", "Create support requests", "Download visible documents"],
  },
];

const TEAM_ROLE_OPTIONS: { value: OrganizationRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "support_agent", label: "Support Agent" },
  { value: "technician", label: "Technician" },
];

const SERVICE_TYPES = ["Cleaning", "Repair", "Inspection", "Maintenance", "Warranty Service", "Emergency Visit"];
const WORK_ORDER_STATUSES = ["New", "Scheduled", "Assigned", "In Progress", "Requires Follow-up", "Completed", "Cancelled"];
const WORK_ORDER_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const JOB_CATEGORIES = ["Panel Cleaning", "Inverter Troubleshooting", "Battery Service", "Roof Access", "Warranty Evidence", "Customer Walkthrough"];
const WORK_ORDER_CHECKLISTS = ["Standard diagnostic visit", "Warranty claim evidence", "Preventive maintenance", "Emergency safety inspection"];
const MAINTENANCE_INTERVALS = ["Quarterly commercial inspection", "Semiannual residential cleaning", "Annual inverter health check", "Storm season roof review"];
const MAINTENANCE_REMINDERS = ["30 days before visit", "7 days before visit", "1 day before visit", "Missed appointment follow-up"];
const MAINTENANCE_CHECKLISTS = ["Panel cleaning", "Racking inspection", "Production comparison", "Inverter log review", "Customer sign-off"];
const WARRANTY_TYPES = ["Panel product warranty", "Panel performance warranty", "Inverter warranty", "Battery warranty", "Workmanship warranty"];
const WARRANTY_ALERTS = ["90 days before expiry", "60 days before expiry", "30 days before expiry", "At expiry"];
const NOTIFICATION_TEMPLATES = [
  { title: "Ticket received", channel: "Email", audience: "Customer", status: "Active" },
  { title: "Technician en route", channel: "SMS", audience: "Customer", status: "Draft" },
  { title: "Job assigned", channel: "Push", audience: "Technician", status: "Active" },
  { title: "Overdue follow-up", channel: "Email", audience: "Internal", status: "Active" },
];
const INITIAL_PORTAL_OPTIONS: ToggleOption[] = [
  { label: "View solar systems and equipment", enabled: true },
  { label: "View warranties and expiry dates", enabled: true },
  { label: "Download customer-visible documents", enabled: true },
  { label: "Request maintenance visits", enabled: true },
  { label: "Create support tickets", enabled: true },
  { label: "View technician notes", enabled: false },
  { label: "Approve paid work orders", enabled: false },
];

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description ? <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
      />
    </label>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
      {children}
    </span>
  );
}

function ToggleRow({
  option,
  onToggle,
}: {
  option: ToggleOption;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10"
    >
      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{option.label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          option.enabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            option.enabled ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
      <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Pill key={item}>{item}</Pill>
        ))}
      </div>
    </div>
  );
}

function getRoleLabel(role: OrganizationRole | "customer_portal") {
  return ROLES.find((item) => item.key === role)?.name ?? role;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function inviteLink(code: string) {
  if (typeof window === "undefined") return code;
  return `${window.location.origin}/company-setup?invite=${encodeURIComponent(code)}`;
}

export default function SettingsPage() {
  const { userProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("company");
  const [companySettings, setCompanySettings] = useState(INITIAL_COMPANY_SETTINGS);
  const [portalOptions, setPortalOptions] = useState(INITIAL_PORTAL_OPTIONS);
  const [saveMessage, setSaveMessage] = useState("Settings ready");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("manager");
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<OrganizationRole>("manager");
  const [editIsActive, setEditIsActive] = useState(true);

  const activeTab = useMemo(
    () => SECTION_TABS.find((section) => section.key === activeSection) ?? SECTION_TABS[0],
    [activeSection]
  );

  const updateCompanySetting = (field: keyof CompanySettings, value: string) => {
    setCompanySettings((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    setSaveMessage("Settings saved locally for this session");
  };

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      throw new Error("Your session expired. Please sign in again.");
    }

    return accessToken;
  };

  const loadTeam = async () => {
    setTeamLoading(true);
    setTeamError("");

    try {
      const accessToken = await getAccessToken();
      const teamState = await getOrganizationTeamAction({ accessToken });
      setTeamMembers(teamState.members);
      setTeamInvites(teamState.invites);
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "Failed to load team members.");
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "users") {
      loadTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setTeamLoading(true);
    setTeamError("");

    try {
      const accessToken = await getAccessToken();
      const teamState = await createTeamInviteAction({
        accessToken,
        email: inviteEmail,
        fullName: inviteFullName,
        role: inviteRole,
      });

      setTeamMembers(teamState.members);
      setTeamInvites(teamState.invites);
      setInviteEmail("");
      setInviteFullName("");
      setInviteRole("manager");
      setShowInviteForm(false);
      setSaveMessage(teamState.emailDelivery.message);
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "Failed to create team invite.");
    } finally {
      setTeamLoading(false);
    }
  };

  const startEditingMember = (member: TeamMember) => {
    setEditingMember(member);
    setEditFullName(member.fullName);
    setEditPhone(member.phone);
    setEditRole(member.role);
    setEditIsActive(member.isActive);
    setTeamError("");
  };

  const handleUpdateMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingMember) return;

    setTeamLoading(true);
    setTeamError("");

    try {
      const accessToken = await getAccessToken();
      const teamState = await updateTeamMemberAction({
        accessToken,
        membershipId: editingMember.membershipId,
        fullName: editFullName,
        phone: editPhone,
        role: editRole,
        isActive: editIsActive,
      });

      setTeamMembers(teamState.members);
      setTeamInvites(teamState.invites);
      setEditingMember(null);
      setSaveMessage("Team member updated");
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "Failed to update team member.");
    } finally {
      setTeamLoading(false);
    }
  };

  const roleCounts = useMemo(() => {
    return teamMembers.reduce<Record<string, number>>((counts, member) => {
      if (member.isActive) {
        counts[member.role] = (counts[member.role] ?? 0) + 1;
      }
      return counts;
    }, {});
  }, [teamMembers]);

  const canManageTeam = userProfile?.role === "owner" || userProfile?.role === "admin";

  const togglePortalOption = (label: string) => {
    setPortalOptions((current) =>
      current.map((option) =>
        option.label === label ? { ...option, enabled: !option.enabled } : option
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
              Demo configuration
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Solar company settings</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Configure how a solar service company manages customers, sites, warranties, maintenance,
              field jobs, notifications, and customer portal access.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {saveMessage}
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Save settings
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="space-y-1">
            {SECTION_TABS.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`w-full rounded-xl px-4 py-3 text-left transition ${
                  activeSection === section.key
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                }`}
              >
                <span className="block text-sm font-semibold">{section.label}</span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{section.description}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current section</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{activeTab.label}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{activeTab.description}</p>
          </div>

          {activeSection === "company" ? (
            <SectionCard
              title="Company Settings"
              description="Company identity and localization values used throughout the SolarOS workspace."
            >
              <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                    SO
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Logo placeholder</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Logo upload will connect to company storage later.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Company name"
                    value={companySettings.companyName}
                    onChange={(value) => updateCompanySetting("companyName", value)}
                  />
                  <Field
                    label="Contact email"
                    type="email"
                    value={companySettings.contactEmail}
                    onChange={(value) => updateCompanySetting("contactEmail", value)}
                  />
                  <Field
                    label="Contact phone"
                    type="tel"
                    value={companySettings.contactPhone}
                    onChange={(value) => updateCompanySetting("contactPhone", value)}
                  />
                  <Field
                    label="Timezone"
                    value={companySettings.timezone}
                    onChange={(value) => updateCompanySetting("timezone", value)}
                  />
                  <Field
                    label="Currency"
                    value={companySettings.currency}
                    onChange={(value) => updateCompanySetting("currency", value)}
                  />
                  <Field
                    label="Country"
                    value={companySettings.country}
                    onChange={(value) => updateCompanySetting("country", value)}
                  />
                  <div className="md:col-span-2">
                    <Field
                      label="Address"
                      value={companySettings.address}
                      onChange={(value) => updateCompanySetting("address", value)}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "users" ? (
            <SectionCard
              title="Users and Roles"
              description="Invite teammates, review active users, and manage workspace-level access."
            >
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use invites for new teammates. They create or sign into their own account, then join with the emailed link or code.
                  </p>
                  {!canManageTeam ? (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Only owners and admins can create invites or edit team access.
                    </p>
                  ) : null}
                  {canManageTeam ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email sending uses Resend when <code className="font-mono">RESEND_API_KEY</code> is configured. Codes still work without email.
                    </p>
                  ) : null}
                </div>
                {canManageTeam ? (
                  <button
                    type="button"
                    onClick={() => setShowInviteForm((current) => !current)}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
                  >
                    {showInviteForm ? "Close invite form" : "Invite team member"}
                  </button>
                ) : null}
              </div>

              {teamError ? (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400">
                  {teamError}
                </div>
              ) : null}

              {showInviteForm && canManageTeam ? (
                <form onSubmit={handleCreateInvite} className="mb-5 rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-500/20 dark:bg-brand-500/10">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Invite email" type="email" value={inviteEmail} onChange={setInviteEmail} />
                    <Field label="Full name" value={inviteFullName} onChange={setInviteFullName} />
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</span>
                      <select
                        value={inviteRole}
                        onChange={(event) => setInviteRole(event.target.value as OrganizationRole)}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      >
                        {TEAM_ROLE_OPTIONS.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={teamLoading}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {teamLoading ? "Creating invite..." : "Create invite and send email"}
                  </button>
                </form>
              ) : null}

              <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Pending Invites</h4>
                    <button
                      type="button"
                      onClick={loadTeam}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      Refresh
                    </button>
                  </div>
                  {teamInvites.filter((invite) => invite.status === "pending").length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No pending invites.</p>
                  ) : (
                    <div className="space-y-3">
                      {teamInvites
                        .filter((invite) => invite.status === "pending")
                        .map((invite) => (
                          <div key={invite.code} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{invite.code}</p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {invite.email} · {getRoleLabel(invite.role)} · expires {formatDate(invite.expiresAt)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {invite.emailSentAt
                                    ? `Email sent ${formatDate(invite.emailSentAt)}`
                                    : invite.emailError
                                      ? `Email failed: ${invite.emailError}`
                                      : "Email not sent yet"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(inviteLink(invite.code));
                                  setSaveMessage("Invite link copied");
                                }}
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                              >
                                Copy link
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Role Guide</h4>
                  <div className="grid gap-2">
                    {ROLES.map((role) => (
                      <div key={role.key} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm dark:bg-gray-800">
                        <span className="font-medium text-gray-800 dark:text-white/90">{role.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {role.key === "customer_portal" ? "Portal users" : `${roleCounts[role.key] ?? 0} active`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr_0.8fr] gap-3 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  <span>User</span>
                  <span>Contact</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {teamLoading && teamMembers.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400">Loading team members...</div>
                ) : null}
                {!teamLoading && teamMembers.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400">No team members found.</div>
                ) : null}
                {teamMembers.map((member) => (
                  <div
                    key={member.membershipId}
                    className="grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr_0.8fr] gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{member.fullName}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Joined {formatDate(member.joinedAt)}</p>
                    </div>
                    <div>
                      <p>{member.email || "No email"}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{member.phone || "No phone"}</p>
                    </div>
                    <span>{getRoleLabel(member.role)}</span>
                    <span className={member.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      disabled={!canManageTeam}
                      onClick={() => startEditingMember(member)}
                      className="text-left text-sm font-semibold text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>

              {editingMember && canManageTeam ? (
                <form onSubmit={handleUpdateMember} className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Edit team member</h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Email is managed by Supabase Auth and is read-only here: {editingMember.email || "No email"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingMember(null)}
                      className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Field label="Full name" value={editFullName} onChange={setEditFullName} />
                    <Field label="Phone" type="tel" value={editPhone} onChange={setEditPhone} />
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</span>
                      <select
                        value={editRole}
                        onChange={(event) => setEditRole(event.target.value as OrganizationRole)}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      >
                        {[{ value: "owner" as const, label: "Owner" }, ...TEAM_ROLE_OPTIONS].map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Access</span>
                      <select
                        value={editIsActive ? "active" : "inactive"}
                        onChange={(event) => setEditIsActive(event.target.value === "active")}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={teamLoading}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {teamLoading ? "Saving..." : "Save team member"}
                  </button>
                </form>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {ROLES.map((role) => (
                  <article
                    key={role.key}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{role.name}</h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                        {role.key === "customer_portal" ? "Customer portal" : `${roleCounts[role.key] ?? 0} active`}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <Pill key={permission}>{permission}</Pill>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "service" ? (
            <SectionCard title="Service Types" description="Field service types used by tickets, work orders, and maintenance visits.">
              <div className="grid gap-4 md:grid-cols-2">
                {SERVICE_TYPES.map((serviceType) => (
                  <div
                    key={serviceType}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <span className="font-medium text-gray-800 dark:text-white/90">{serviceType}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      Enabled
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "workOrders" ? (
            <SectionCard title="Work Order Settings" description="Defaults for actual field jobs assigned to technicians.">
              <div className="grid gap-4 lg:grid-cols-2">
                <ListCard title="Statuses" items={WORK_ORDER_STATUSES} />
                <ListCard title="Priorities" items={WORK_ORDER_PRIORITIES} />
                <ListCard title="Checklist templates" items={WORK_ORDER_CHECKLISTS} />
                <ListCard title="Job categories" items={JOB_CATEGORIES} />
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "maintenance" ? (
            <SectionCard title="Maintenance Settings" description="Recurring service defaults for planned solar maintenance.">
              <div className="grid gap-4 lg:grid-cols-3">
                <ListCard title="Default intervals" items={MAINTENANCE_INTERVALS} />
                <ListCard title="Reminder schedule" items={MAINTENANCE_REMINDERS} />
                <ListCard title="Checklist templates" items={MAINTENANCE_CHECKLISTS} />
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "warranty" ? (
            <SectionCard title="Warranty Settings" description="Warranty claim categories and expiry reminder defaults.">
              <div className="grid gap-4 lg:grid-cols-2">
                <ListCard title="Warranty alert timing" items={WARRANTY_ALERTS} />
                <ListCard title="Warranty types" items={WARRANTY_TYPES} />
                <ListCard title="Default reminders" items={["Notify owner", "Notify support queue", "Create review task"]} />
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "notifications" ? (
            <SectionCard title="Notification Settings" description="Templates for email, SMS, technician, and internal alerts.">
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-4 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  <span>Template</span>
                  <span>Channel</span>
                  <span>Audience</span>
                  <span>Status</span>
                </div>
                {NOTIFICATION_TEMPLATES.map((template) => (
                  <div
                    key={template.title}
                    className="grid grid-cols-4 border-t border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{template.title}</span>
                    <span>{template.channel}</span>
                    <span>{template.audience}</span>
                    <span>{template.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <ListCard title="Customer reminders" items={["Appointment reminders", "Ticket updates", "Document published"]} />
                <ListCard title="Technician notifications" items={["Job assigned", "Schedule changed", "Checklist due"]} />
                <ListCard title="Internal alerts" items={["Urgent ticket", "Overdue job", "Warranty expiry"]} />
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "portal" ? (
            <SectionCard title="Customer Portal Settings" description="Control what homeowners and business customers can see or request.">
              <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-500/20 dark:bg-brand-500/10">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Portal branding</p>
                <p className="mt-1 text-sm text-brand-700/80 dark:text-brand-200/80">
                  Uses company name, logo placeholder, support contact, and customer-friendly service language.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {portalOptions.map((option) => (
                  <ToggleRow key={option.label} option={option} onToggle={() => togglePortalOption(option.label)} />
                ))}
              </div>
            </SectionCard>
          ) : null}

          {activeSection === "billing" ? (
            <SectionCard title="Billing Settings" description="Placeholder only. No billing provider or real payment logic is implemented.">
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Billing module coming later</p>
                <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                  This placeholder reserves space for plan, invoice, and payment configuration without connecting to
                  real billing, subscriptions, or checkout flows.
                </p>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
