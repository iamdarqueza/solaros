"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  WORK_ORDER_TYPE_LABELS,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
  workOrderService,
} from "@/services/workOrderService";

type Availability = "available" | "assigned" | "on_site" | "off_duty";
type TeamName = "Cleaning Team" | "Installation Team" | "Repair Team" | "Electrical Team" | "Inspection Team";
type TechnicianTab = "overview" | "schedule" | "assigned" | "completed" | "skills" | "certifications" | "documents" | "performance";
type TechnicianPageFocus = "team" | "assignments" | "availability";

type TechnicianProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Standby" | "Off Duty";
  availability: Availability;
  team: TeamName;
  skills: string[];
  certifications: string[];
  documents: string[];
  serviceRegion: string;
  capacityToday: number;
};

const TECHNICIAN_PROFILES: TechnicianProfile[] = [
  {
    id: "tech-001",
    name: "Carlos Rivera",
    email: "carlos.rivera@solaros.example",
    phone: "(555) 013-2041",
    role: "Senior Field Technician",
    status: "Active",
    availability: "on_site",
    team: "Electrical Team",
    skills: ["Inverters", "Electrical diagnostics", "Warranty evidence", "Battery commissioning"],
    certifications: ["NABCEP PV Associate", "OSHA 10", "Inverter Manufacturer Level 2"],
    documents: ["Electrical license", "Safety orientation", "Truck inventory checklist"],
    serviceRegion: "North Bay",
    capacityToday: 3,
  },
  {
    id: "tech-002",
    name: "Sarah Johnson",
    email: "sarah.johnson@solaros.example",
    phone: "(555) 013-8812",
    role: "Installation Lead",
    status: "Active",
    availability: "assigned",
    team: "Installation Team",
    skills: ["Panel installation", "Roof mounting", "Crew leadership", "Commissioning"],
    certifications: ["NABCEP PV Installation Professional", "Fall Protection", "First Aid"],
    documents: ["Roof safety card", "Commissioning checklist"],
    serviceRegion: "South Bay",
    capacityToday: 2,
  },
  {
    id: "tech-003",
    name: "Mike Torres",
    email: "mike.torres@solaros.example",
    phone: "(555) 013-4420",
    role: "Structural Technician",
    status: "Active",
    availability: "available",
    team: "Repair Team",
    skills: ["Mounting repair", "Leak inspection", "Racking", "Storm damage response"],
    certifications: ["Roof Access Safety", "OSHA 10", "Ladder Safety"],
    documents: ["Insurance authorization", "Roof assessment template"],
    serviceRegion: "East Valley",
    capacityToday: 3,
  },
  {
    id: "tech-004",
    name: "Jasmine Lee",
    email: "jasmine.lee@solaros.example",
    phone: "(555) 013-7195",
    role: "Diagnostics Technician",
    status: "Standby",
    availability: "available",
    team: "Inspection Team",
    skills: ["Performance testing", "Thermal imaging", "Monitoring setup", "Customer education"],
    certifications: ["Thermography Level 1", "Monitoring Platform Admin", "OSHA 10"],
    documents: ["Thermal camera calibration", "Customer walkthrough script"],
    serviceRegion: "Central Metro",
    capacityToday: 4,
  },
  {
    id: "tech-005",
    name: "David Park",
    email: "david.park@solaros.example",
    phone: "(555) 013-5288",
    role: "Battery Specialist",
    status: "Off Duty",
    availability: "off_duty",
    team: "Cleaning Team",
    skills: ["Battery storage", "Hybrid systems", "Panel cleaning", "Preventive maintenance"],
    certifications: ["Battery Storage Specialist", "CPR", "Manufacturer Storage Certified"],
    documents: ["Battery safety sheet", "Preventive maintenance checklist"],
    serviceRegion: "West Ridge",
    capacityToday: 0,
  },
];

const TEAM_DESCRIPTIONS: Record<TeamName, string> = {
  "Cleaning Team": "Panel cleaning, preventive checks, and customer-ready maintenance visits.",
  "Installation Team": "Commissioning, follow-up visits, and system activation support.",
  "Repair Team": "Break-fix work, storm damage, mounting issues, and field follow-up.",
  "Electrical Team": "Inverter, wiring, battery, and electrical safety troubleshooting.",
  "Inspection Team": "Site inspections, thermal scans, production checks, and QA visits.",
};

const TAB_LABELS: { key: TechnicianTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "schedule", label: "Schedule" },
  { key: "assigned", label: "Assigned Work Orders" },
  { key: "completed", label: "Completed Jobs" },
  { key: "skills", label: "Skills" },
  { key: "certifications", label: "Certifications" },
  { key: "documents", label: "Documents" },
  { key: "performance", label: "Performance" },
];

const ACTIVE_STATUSES: WorkOrderStatus[] = ["new", "scheduled", "assigned", "in_progress", "requires_follow_up"];

const PAGE_FOCUS_COPY: Record<TechnicianPageFocus, { eyebrow: string; title: string; description: string; initialTab: TechnicianTab }> = {
  team: {
    eyebrow: "Frontend-only team management",
    title: "Technicians",
    description:
      "View technician availability, skills, certifications, and linked mock work orders so dispatch can see who is assigned, overdue, or free today.",
    initialTab: "overview",
  },
  assignments: {
    eyebrow: "Dispatch workload",
    title: "Technician Assignments",
    description:
      "Review active field jobs by technician, spot overdue work, and open linked work orders for scheduling or reassignment.",
    initialTab: "assigned",
  },
  availability: {
    eyebrow: "Capacity planning",
    title: "Technician Availability",
    description:
      "Check who is available, assigned, on site, or off duty today, with team coverage and capacity context for dispatch.",
    initialTab: "overview",
  },
};

function formatDate(value: string | null) {
  if (!value) return "Unscheduled";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isToday(value: string | null) {
  if (!value) return false;
  const today = new Date().toISOString().split("T")[0];
  return value === today;
}

function isOverdue(order: WorkOrder) {
  if (!order.scheduled_date || !ACTIVE_STATUSES.includes(order.status)) return false;
  const today = new Date().toISOString().split("T")[0];
  return order.scheduled_date < today;
}

function availabilityConfig(availability: Availability) {
  const map: Record<Availability, { label: string; className: string; dot: string }> = {
    available: {
      label: "Available",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
    assigned: {
      label: "Assigned",
      className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
      dot: "bg-blue-500",
    },
    on_site: {
      label: "On Site",
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
      dot: "bg-amber-500",
    },
    off_duty: {
      label: "Off Duty",
      className: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
      dot: "bg-gray-400",
    },
  };

  return map[availability];
}

function statusConfig(status: WorkOrderStatus) {
  const map: Record<WorkOrderStatus, { label: string; className: string }> = {
    new: { label: "New", className: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
    scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
    assigned: { label: "Assigned", className: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" },
    in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
    completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    requires_follow_up: { label: "Follow-up", className: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
  };

  return map[status];
}

function priorityConfig(priority: WorkOrderPriority) {
  const map: Record<WorkOrderPriority, string> = {
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    medium: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    high: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    urgent: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  };

  return map[priority];
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
      {initials}
    </span>
  );
}

function AvailabilityBadge({ availability }: { availability: Availability }) {
  const config = availabilityConfig(availability);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const config = statusConfig(status);

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

function WorkOrderTable({ orders, emptyLabel }: { orders: WorkOrder[]; emptyLabel: string }) {
  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {["Work Order", "Customer / Site", "Type", "Technician", "Scheduled", "Priority", "Status"].map((heading) => (
                <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <Link href={`/work-orders/${order.id}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    {order.order_number}
                  </Link>
                  <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500 dark:text-gray-400">{order.title}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{order.customer_name}</p>
                  <p className="mt-0.5 max-w-[240px] truncate text-xs text-gray-500 dark:text-gray-400">{order.site_address}</p>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{WORK_ORDER_TYPE_LABELS[order.type]}</td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{order.technician_name ?? "Unassigned"}</td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(order.scheduled_date)}
                  {order.scheduled_time ? <span className="block text-xs text-gray-400">{order.scheduled_time}</span> : null}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityConfig(order.priority)}`}>
                    {order.priority}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <WorkOrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TechniciansPage({ focus = "team" }: { focus?: TechnicianPageFocus }) {
  const focusCopy = PAGE_FOCUS_COPY[focus];
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(TECHNICIAN_PROFILES[0].id);
  const [activeTab, setActiveTab] = useState<TechnicianTab>(focusCopy.initialTab);

  useEffect(() => {
    let mounted = true;

    workOrderService.getAllOrders().then((data) => {
      if (!mounted) return;
      setOrders(data);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedTechnician = TECHNICIAN_PROFILES.find((technician) => technician.id === selectedTechnicianId) ?? TECHNICIAN_PROFILES[0];

  const enrichedTechnicians = useMemo(() => {
    return TECHNICIAN_PROFILES.map((technician) => {
      const technicianOrders = orders.filter((order) => order.technician_id === technician.id);
      const assignedJobs = technicianOrders.filter((order) => ACTIVE_STATUSES.includes(order.status));
      const completedJobs = technicianOrders.filter((order) => order.status === "completed");

      return {
        ...technician,
        assignedJobs,
        completedJobs,
        assignedCount: assignedJobs.length,
        completedCount: completedJobs.length,
      };
    });
  }, [orders]);

  const selectedStats = enrichedTechnicians.find((technician) => technician.id === selectedTechnician.id) ?? enrichedTechnicians[0];
  const todayAssigned = orders.filter((order) => order.technician_id && isToday(order.scheduled_date) && ACTIVE_STATUSES.includes(order.status));
  const upcomingJobs = orders.filter((order) => order.technician_id && order.scheduled_date && order.scheduled_date > new Date().toISOString().split("T")[0] && ACTIVE_STATUSES.includes(order.status));
  const overdueJobs = orders.filter(isOverdue);
  const unassignedJobs = orders.filter((order) => !order.technician_id && ACTIVE_STATUSES.includes(order.status));
  const availableCount = TECHNICIAN_PROFILES.filter((technician) => technician.availability === "available").length;
  const activeAssignedCount = orders.filter((order) => order.technician_id && ACTIVE_STATUSES.includes(order.status)).length;

  const teamCards = (Object.keys(TEAM_DESCRIPTIONS) as TeamName[]).map((team) => {
    const members = enrichedTechnicians.filter((technician) => technician.team === team);
    const activeJobs = members.reduce((sum, technician) => sum + technician.assignedCount, 0);

    return { team, members, activeJobs };
  });

  const renderProfileTab = () => {
    if (activeTab === "overview") {
      return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Service Region</p>
            <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{selectedTechnician.serviceRegion}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selectedTechnician.team}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Assigned Jobs</p>
            <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{selectedStats.assignedCount}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Capacity today: {selectedTechnician.capacityToday}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Completed Jobs</p>
            <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{selectedStats.completedCount}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Mock performance total</p>
          </div>
        </div>
      );
    }

    if (activeTab === "schedule" || activeTab === "assigned") {
      return <WorkOrderTable orders={selectedStats.assignedJobs} emptyLabel="No active assignments for this technician." />;
    }

    if (activeTab === "completed") {
      return <WorkOrderTable orders={selectedStats.completedJobs} emptyLabel="No completed mock jobs for this technician yet." />;
    }

    if (activeTab === "skills") {
      return (
        <div className="flex flex-wrap gap-2">
          {selectedTechnician.skills.map((skill) => (
            <span key={skill} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              {skill}
            </span>
          ))}
        </div>
      );
    }

    if (activeTab === "certifications") {
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {selectedTechnician.certifications.map((certification) => (
            <div key={certification} className="rounded-xl border border-gray-200 p-4 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-300">
              {certification}
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "documents") {
      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {selectedTechnician.documents.map((document) => (
            <div key={document} className="rounded-xl border border-gray-200 p-4 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-300">
              {document}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Completion Rate</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">94%</p>
        </div>
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Avg Job Hours</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">2.8</p>
        </div>
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer Rating</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">4.8/5</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{focusCopy.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{focusCopy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              {focusCopy.description}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-900/60">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{TECHNICIAN_PROFILES.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Technicians</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10">
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{availableCount}</p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Available</p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3 dark:bg-blue-500/10">
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{activeAssignedCount}</p>
              <p className="text-xs text-blue-700/80 dark:text-blue-300/80">Assigned</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {teamCards.map(({ team, members, activeJobs }) => (
          <div key={team} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{team}</p>
            <p className="mt-2 min-h-10 text-xs text-gray-500 dark:text-gray-400">{TEAM_DESCRIPTIONS[team]}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{members.length} members</span>
              <span>{activeJobs} active jobs</span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Technician List</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Roster details include contact info, role, status, skills, certifications, jobs, and availability.</p>
          </div>
          {loading ? <span className="text-sm text-gray-400">Loading assignments...</span> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead>
              <tr>
                {["Name", "Email", "Phone", "Role", "Status", "Skills", "Certifications", "Assigned", "Completed", "Availability"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {enrichedTechnicians.map((technician) => (
                <tr
                  key={technician.id}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] ${selectedTechnicianId === technician.id ? "bg-brand-50/60 dark:bg-brand-500/5" : ""}`}
                  onClick={() => {
                    setSelectedTechnicianId(technician.id);
                    setActiveTab(focusCopy.initialTab);
                  }}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={technician.name} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{technician.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{technician.team}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{technician.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{technician.phone}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{technician.role}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">{technician.status}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{technician.skills.slice(0, 2).join(", ")}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{technician.certifications.length}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{technician.assignedCount}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{technician.completedCount}</td>
                  <td className="px-4 py-4">
                    <AvailabilityBadge availability={technician.availability} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={selectedTechnician.name} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTechnician.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTechnician.role} - {selectedTechnician.team}</p>
            </div>
          </div>
          <AvailabilityBadge availability={selectedTechnician.availability} />
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {TAB_LABELS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {renderProfileTab()}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today&apos;s Assigned Jobs</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{todayAssigned.length} jobs</span>
            </div>
            <WorkOrderTable orders={todayAssigned} emptyLabel="No jobs assigned for today." />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overdue Jobs</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{overdueJobs.length} jobs</span>
            </div>
            <WorkOrderTable orders={overdueJobs} emptyLabel="No overdue assigned work orders." />
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Jobs</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{upcomingJobs.length} jobs</span>
            </div>
            <WorkOrderTable orders={upcomingJobs.slice(0, 5)} emptyLabel="No upcoming assigned jobs." />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Unassigned Work Orders</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{unassignedJobs.length} jobs</span>
            </div>
            <WorkOrderTable orders={unassignedJobs.slice(0, 5)} emptyLabel="No unassigned work orders." />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
        This is intentionally frontend-only. Technician records, documents, availability, and dispatch assignments are mock UI data linked to the existing mock work orders.
      </section>
    </div>
  );
}
