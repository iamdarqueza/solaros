"use client";

import React, { useMemo, useState } from "react";

type TimeFilter = "week" | "month" | "quarter";
type ReportCategory = "all" | "warranty" | "maintenance" | "work_orders" | "support" | "customers" | "technicians";
type Severity = "critical" | "warning" | "normal" | "success";

type MetricCard = {
  label: string;
  value: string;
  detail: string;
  severity: Severity;
};

type ReportSection = {
  category: Exclude<ReportCategory, "all">;
  title: string;
  subtitle: string;
  metrics: MetricCard[];
};

type ActionItem = {
  id: string;
  category: Exclude<ReportCategory, "all">;
  customer: string;
  item: string;
  owner: string;
  due: string;
  status: string;
  severity: Severity;
};

type ChartItem = {
  label: string;
  value: number;
  detail: string;
};

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  week: "This week",
  month: "This month",
  quarter: "This quarter",
};

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  all: "All reports",
  work_orders: "Work Orders",
  warranty: "Warranty",
  support: "Support",
  technicians: "Technicians",
  customers: "Customers",
  maintenance: "Maintenance",
};

const OPERATIONAL_CATEGORY_ORDER: Exclude<ReportCategory, "all">[] = [
  "work_orders",
  "warranty",
  "support",
  "technicians",
  "customers",
  "maintenance",
];

function sortOperationalSections(sections: ReportSection[]) {
  return [...sections].sort(
    (a, b) => OPERATIONAL_CATEGORY_ORDER.indexOf(a.category) - OPERATIONAL_CATEGORY_ORDER.indexOf(b.category)
  );
}

const REPORTS_BY_TIME: Record<TimeFilter, ReportSection[]> = {
  week: [
    {
      category: "warranty",
      title: "Warranty Reports",
      subtitle: "Expiring coverage and claim activity needing follow-up.",
      metrics: [
        { label: "Expiring soon", value: "8", detail: "3 expire within 30 days", severity: "warning" },
        { label: "Expired warranties", value: "4", detail: "2 linked to active customers", severity: "critical" },
        { label: "Active claims", value: "6", detail: "1 waiting on supplier evidence", severity: "warning" },
        { label: "Most claimed equipment", value: "Inverters", detail: "4 inverter-related claims", severity: "normal" },
      ],
    },
    {
      category: "maintenance",
      title: "Maintenance Reports",
      subtitle: "Scheduled, overdue, and completed preventive work.",
      metrics: [
        { label: "Upcoming maintenance", value: "18", detail: "12 residential, 6 commercial", severity: "normal" },
        { label: "Overdue maintenance", value: "5", detail: "Oldest overdue by 9 days", severity: "critical" },
        { label: "Completed visits", value: "24", detail: "7 more than last week", severity: "success" },
        { label: "Completion rate", value: "83%", detail: "Target is 90%", severity: "warning" },
      ],
    },
    {
      category: "work_orders",
      title: "Work Order Reports",
      subtitle: "Open field jobs, completions, technician load, and job mix.",
      metrics: [
        { label: "Open work orders", value: "32", detail: "11 scheduled, 9 in progress", severity: "warning" },
        { label: "Completed work orders", value: "29", detail: "18 customer-visible reports sent", severity: "success" },
        { label: "Avg completion time", value: "1.8 days", detail: "Down from 2.3 days", severity: "success" },
        { label: "Top job type", value: "Maintenance", detail: "41% of completed jobs", severity: "normal" },
      ],
    },
    {
      category: "support",
      title: "Support Reports",
      subtitle: "Unresolved tickets, priority mix, and response timing.",
      metrics: [
        { label: "Open tickets", value: "47", detail: "7 high priority", severity: "warning" },
        { label: "Tickets by priority", value: "7 High", detail: "24 medium, 16 low", severity: "warning" },
        { label: "Avg response time", value: "2h 04m", detail: "Within 4h SLA", severity: "success" },
        { label: "Avg resolution time", value: "1.6 days", detail: "Inverter issues take longest", severity: "normal" },
      ],
    },
    {
      category: "customers",
      title: "Customer Reports",
      subtitle: "Customer records with service risk or pending action.",
      metrics: [
        { label: "Overdue maintenance", value: "5", detail: "3 portal-enabled customers", severity: "critical" },
        { label: "Open issues", value: "31", detail: "9 have linked work orders", severity: "warning" },
        { label: "Expiring warranties", value: "8", detail: "5 customers need renewal outreach", severity: "warning" },
        { label: "Customer updates sent", value: "22", detail: "Includes service reports and ETAs", severity: "success" },
      ],
    },
    {
      category: "technicians",
      title: "Technician Reports",
      subtitle: "Capacity, overdue assignments, and completion timing.",
      metrics: [
        { label: "Jobs completed", value: "29", detail: "Carlos leads with 8 jobs", severity: "success" },
        { label: "Hours worked", value: "186", detail: "Includes travel and onsite time", severity: "normal" },
        { label: "Overdue assignments", value: "4", detail: "2 require rescheduling", severity: "critical" },
        { label: "Avg job completion", value: "5.1h", detail: "Battery jobs average 7.4h", severity: "normal" },
      ],
    },
  ],
  month: [
    {
      category: "warranty",
      title: "Warranty Reports",
      subtitle: "Monthly warranty health and supplier claim follow-up.",
      metrics: [
        { label: "Expiring soon", value: "19", detail: "8 expire within 30 days", severity: "warning" },
        { label: "Expired warranties", value: "11", detail: "4 linked to active systems", severity: "critical" },
        { label: "Active claims", value: "14", detail: "3 pending supplier response", severity: "warning" },
        { label: "Most claimed equipment", value: "Inverters", detail: "9 claims this month", severity: "normal" },
      ],
    },
    {
      category: "maintenance",
      title: "Maintenance Reports",
      subtitle: "Monthly preventive service performance.",
      metrics: [
        { label: "Upcoming maintenance", value: "56", detail: "21 due in the next 10 days", severity: "normal" },
        { label: "Overdue maintenance", value: "13", detail: "Oldest overdue by 17 days", severity: "critical" },
        { label: "Completed visits", value: "92", detail: "18 commercial sites completed", severity: "success" },
        { label: "Completion rate", value: "87%", detail: "3 points under target", severity: "warning" },
      ],
    },
    {
      category: "work_orders",
      title: "Work Order Reports",
      subtitle: "Monthly job flow and technician throughput.",
      metrics: [
        { label: "Open work orders", value: "74", detail: "18 require follow-up", severity: "warning" },
        { label: "Completed work orders", value: "118", detail: "96 reports sent to customers", severity: "success" },
        { label: "Avg completion time", value: "2.1 days", detail: "Replacement jobs average 3.4 days", severity: "normal" },
        { label: "Top job type", value: "Support", detail: "38% of work orders", severity: "normal" },
      ],
    },
    {
      category: "support",
      title: "Support Reports",
      subtitle: "Monthly customer issue and communication trends.",
      metrics: [
        { label: "Open tickets", value: "88", detail: "12 high priority", severity: "warning" },
        { label: "Tickets by priority", value: "12 High", detail: "43 medium, 33 low", severity: "warning" },
        { label: "Avg response time", value: "2h 18m", detail: "Improved 16 minutes", severity: "success" },
        { label: "Avg resolution time", value: "2.4 days", detail: "Monitoring issues are fastest", severity: "normal" },
      ],
    },
    {
      category: "customers",
      title: "Customer Reports",
      subtitle: "Monthly customer service obligations.",
      metrics: [
        { label: "Overdue maintenance", value: "13", detail: "7 customers need scheduling outreach", severity: "critical" },
        { label: "Open issues", value: "62", detail: "21 linked to field jobs", severity: "warning" },
        { label: "Expiring warranties", value: "19", detail: "11 renewal reminders queued", severity: "warning" },
        { label: "Customer updates sent", value: "104", detail: "Service reports, ETAs, and claim notes", severity: "success" },
      ],
    },
    {
      category: "technicians",
      title: "Technician Reports",
      subtitle: "Monthly workload, utilization, and overdue assignments.",
      metrics: [
        { label: "Jobs completed", value: "118", detail: "5 technicians above target", severity: "success" },
        { label: "Hours worked", value: "742", detail: "64 hours were emergency visits", severity: "normal" },
        { label: "Overdue assignments", value: "10", detail: "4 blocked by parts availability", severity: "critical" },
        { label: "Avg job completion", value: "5.6h", detail: "Commercial visits average 8.2h", severity: "normal" },
      ],
    },
  ],
  quarter: [
    {
      category: "warranty",
      title: "Warranty Reports",
      subtitle: "Quarterly warranty exposure and recurring equipment issues.",
      metrics: [
        { label: "Expiring soon", value: "44", detail: "19 expire within 30 days", severity: "warning" },
        { label: "Expired warranties", value: "27", detail: "10 have recent service history", severity: "critical" },
        { label: "Active claims", value: "31", detail: "8 awaiting manufacturer review", severity: "warning" },
        { label: "Most claimed equipment", value: "Inverters", detail: "21 claims this quarter", severity: "normal" },
      ],
    },
    {
      category: "maintenance",
      title: "Maintenance Reports",
      subtitle: "Quarterly maintenance backlog and completion health.",
      metrics: [
        { label: "Upcoming maintenance", value: "142", detail: "49 due this month", severity: "normal" },
        { label: "Overdue maintenance", value: "31", detail: "Oldest overdue by 28 days", severity: "critical" },
        { label: "Completed visits", value: "286", detail: "72 commercial visits completed", severity: "success" },
        { label: "Completion rate", value: "89%", detail: "1 point under target", severity: "warning" },
      ],
    },
    {
      category: "work_orders",
      title: "Work Order Reports",
      subtitle: "Quarterly field-service demand and job completion.",
      metrics: [
        { label: "Open work orders", value: "138", detail: "39 waiting on parts or access", severity: "warning" },
        { label: "Completed work orders", value: "364", detail: "312 reports sent to customers", severity: "success" },
        { label: "Avg completion time", value: "2.4 days", detail: "Down from 2.9 days last quarter", severity: "success" },
        { label: "Top job type", value: "Maintenance", detail: "36% of completed jobs", severity: "normal" },
      ],
    },
    {
      category: "support",
      title: "Support Reports",
      subtitle: "Quarterly support volume, priorities, and resolution trends.",
      metrics: [
        { label: "Open tickets", value: "164", detail: "23 high priority", severity: "warning" },
        { label: "Tickets by priority", value: "23 High", detail: "81 medium, 60 low", severity: "warning" },
        { label: "Avg response time", value: "2h 31m", detail: "Within 4h SLA", severity: "success" },
        { label: "Avg resolution time", value: "2.8 days", detail: "Supplier claims create longest delays", severity: "normal" },
      ],
    },
    {
      category: "customers",
      title: "Customer Reports",
      subtitle: "Quarterly customer risk and proactive outreach needs.",
      metrics: [
        { label: "Overdue maintenance", value: "31", detail: "14 need priority outreach", severity: "critical" },
        { label: "Open issues", value: "119", detail: "45 linked to field work", severity: "warning" },
        { label: "Expiring warranties", value: "44", detail: "27 customers need renewal outreach", severity: "warning" },
        { label: "Customer updates sent", value: "318", detail: "Across tickets, jobs, and claims", severity: "success" },
      ],
    },
    {
      category: "technicians",
      title: "Technician Reports",
      subtitle: "Quarterly technician capacity and completion performance.",
      metrics: [
        { label: "Jobs completed", value: "364", detail: "12% more than last quarter", severity: "success" },
        { label: "Hours worked", value: "2,184", detail: "312 emergency-service hours", severity: "normal" },
        { label: "Overdue assignments", value: "24", detail: "9 waiting for customer access", severity: "critical" },
        { label: "Avg job completion", value: "5.9h", detail: "Complex replacement work averages 9.1h", severity: "normal" },
      ],
    },
  ],
};

const ACTION_ITEMS: ActionItem[] = [
  {
    id: "WO-2025-1044",
    category: "work_orders",
    customer: "Marcus Delgado",
    item: "Inverter fault follow-up work order",
    owner: "Carlos Rivera",
    due: "Today",
    status: "In progress",
    severity: "critical",
  },
  {
    id: "WAR-2025-3318",
    category: "warranty",
    customer: "James Thornton",
    item: "SolarEdge inverter warranty expires soon",
    owner: "Avery Chen",
    due: "Expires in 18 days",
    status: "Customer outreach",
    severity: "warning",
  },
  {
    id: "TKT-2025-4490",
    category: "support",
    customer: "Roberto Morales",
    item: "Production drop reported after storm",
    owner: "Support Desk",
    due: "SLA due in 3h",
    status: "Awaiting triage",
    severity: "warning",
  },
  {
    id: "TECH-005",
    category: "technicians",
    customer: "David Park",
    item: "Battery jobs exceeding average completion time",
    owner: "Dispatch Lead",
    due: "Review Friday",
    status: "Capacity review",
    severity: "normal",
  },
  {
    id: "CUS-2025-0712",
    category: "customers",
    customer: "Fatima Al-Hassan",
    item: "Open support issue plus expiring permit",
    owner: "Jordan Lee",
    due: "This week",
    status: "Needs bundled update",
    severity: "warning",
  },
  {
    id: "MNT-2025-0882",
    category: "maintenance",
    customer: "Priya Nair",
    item: "Commercial roof array quarterly inspection",
    owner: "Jasmine Lee",
    due: "2 days overdue",
    status: "Needs reschedule",
    severity: "critical",
  },
];

const JOBS_BY_TECHNICIAN: Record<TimeFilter, ChartItem[]> = {
  week: [
    { label: "Carlos", value: 8, detail: "3 urgent jobs" },
    { label: "Sarah", value: 6, detail: "2 installs" },
    { label: "Jasmine", value: 7, detail: "4 inspections" },
    { label: "Mike", value: 5, detail: "2 repairs" },
    { label: "David", value: 3, detail: "Battery specialist" },
  ],
  month: [
    { label: "Carlos", value: 28, detail: "11 urgent jobs" },
    { label: "Sarah", value: 23, detail: "9 installs" },
    { label: "Jasmine", value: 27, detail: "16 inspections" },
    { label: "Mike", value: 21, detail: "12 repairs" },
    { label: "David", value: 19, detail: "Battery specialist" },
  ],
  quarter: [
    { label: "Carlos", value: 84, detail: "32 urgent jobs" },
    { label: "Sarah", value: 71, detail: "27 installs" },
    { label: "Jasmine", value: 79, detail: "44 inspections" },
    { label: "Mike", value: 68, detail: "36 repairs" },
    { label: "David", value: 62, detail: "Battery specialist" },
  ],
};

const JOBS_BY_TYPE: Record<TimeFilter, ChartItem[]> = {
  week: [
    { label: "Maintenance", value: 41, detail: "Planned visits" },
    { label: "Support", value: 29, detail: "Customer issues" },
    { label: "Replacement", value: 18, detail: "Equipment swaps" },
    { label: "Inspection", value: 12, detail: "Site checks" },
  ],
  month: [
    { label: "Support", value: 38, detail: "Customer issues" },
    { label: "Maintenance", value: 34, detail: "Planned visits" },
    { label: "Replacement", value: 17, detail: "Equipment swaps" },
    { label: "Inspection", value: 11, detail: "Site checks" },
  ],
  quarter: [
    { label: "Maintenance", value: 36, detail: "Planned visits" },
    { label: "Support", value: 33, detail: "Customer issues" },
    { label: "Replacement", value: 19, detail: "Equipment swaps" },
    { label: "Inspection", value: 12, detail: "Site checks" },
  ],
};

const TICKETS_BY_ISSUE_TYPE: Record<TimeFilter, ChartItem[]> = {
  week: [
    { label: "Monitoring", value: 16, detail: "Portal or alert questions" },
    { label: "Production", value: 12, detail: "Lower-than-expected output" },
    { label: "Inverter", value: 9, detail: "Faults and resets" },
    { label: "Billing", value: 6, detail: "Document or invoice requests" },
  ],
  month: [
    { label: "Monitoring", value: 39, detail: "Portal or alert questions" },
    { label: "Production", value: 28, detail: "Lower-than-expected output" },
    { label: "Inverter", value: 23, detail: "Faults and resets" },
    { label: "Billing", value: 15, detail: "Document or invoice requests" },
  ],
  quarter: [
    { label: "Monitoring", value: 92, detail: "Portal or alert questions" },
    { label: "Production", value: 71, detail: "Lower-than-expected output" },
    { label: "Inverter", value: 58, detail: "Faults and resets" },
    { label: "Billing", value: 33, detail: "Document or invoice requests" },
  ],
};

function severityClasses(severity: Severity) {
  const map: Record<Severity, string> = {
    critical: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    normal: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  return map[severity];
}

function severityLabel(severity: Severity) {
  const labels: Record<Severity, string> = {
    critical: "Critical",
    warning: "Watch",
    normal: "Normal",
    success: "On track",
  };

  return labels[severity];
}

function ReportsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19V5m0 14h16M8 16V9m4 7V7m4 9v-5" />
    </svg>
  );
}

function MetricCard({ metric }: { metric: MetricCard }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{metric.label}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityClasses(metric.severity)}`}>
          {severityLabel(metric.severity)}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{metric.detail}</p>
    </div>
  );
}

function BarList({ title, subtitle, items }: { title: string; subtitle: string; items: ChartItem[] }) {
  const max = Math.max(...items.map((item) => item.value));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.detail}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${Math.max((item.value / max) * 100, 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionTable({ items }: { items: ActionItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-5 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Priority Action Queue</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Frontend-only examples of overdue, expiring, unresolved, assigned, and completed work that needs attention.
        </p>
      </div>

      <div className="hidden xl:block">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Record</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer / Item</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Owner</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Due</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="px-5 py-4 align-top">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.id}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[item.category]}</p>
                </td>
                <td className="px-5 py-4 align-top">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.customer}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.item}</p>
                </td>
                <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300">{item.owner}</td>
                <td className="px-5 py-4 align-top text-sm font-medium text-gray-800 dark:text-gray-100">{item.due}</td>
                <td className="px-5 py-4 align-top">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClasses(item.severity)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 xl:hidden">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{item.id}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[item.category]}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClasses(item.severity)}`}>
                {item.status}
              </span>
            </div>
            <p className="mt-4 font-semibold text-gray-900 dark:text-white">{item.customer}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.item}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Owner</p>
                <p className="mt-1 text-gray-700 dark:text-gray-200">{item.owner}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Due</p>
                <p className="mt-1 text-gray-700 dark:text-gray-200">{item.due}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function OperationalReportsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory>("all");

  const sections = useMemo(() => {
    const reports = sortOperationalSections(REPORTS_BY_TIME[timeFilter]);
    return categoryFilter === "all" ? reports : reports.filter((section) => section.category === categoryFilter);
  }, [categoryFilter, timeFilter]);

  const actionItems = useMemo(() => {
    return categoryFilter === "all"
      ? ACTION_ITEMS
      : ACTION_ITEMS.filter((item) => item.category === categoryFilter);
  }, [categoryFilter]);

  const summary = useMemo(() => {
    const allMetrics = REPORTS_BY_TIME[timeFilter].flatMap((section) => section.metrics);
    return [
      {
        label: "Overdue or critical",
        value: allMetrics.filter((metric) => metric.severity === "critical").length,
        detail: "Report lines that need immediate scheduling or follow-up",
      },
      {
        label: "Expiring or unresolved",
        value: allMetrics.filter((metric) => metric.severity === "warning").length,
        detail: "Items to monitor before they become escalations",
      },
      {
        label: "Completed or on track",
        value: allMetrics.filter((metric) => metric.severity === "success").length,
        detail: "Operational areas meeting the current target",
      },
      {
        label: "Visible reports",
        value: sections.length,
        detail: `${TIME_FILTER_LABELS[timeFilter]} across ${CATEGORY_LABELS[categoryFilter].toLowerCase()}`,
      },
    ];
  }, [categoryFilter, sections.length, timeFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <ReportsIcon />
              Operational reports
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Monitor overdue work, expiring warranties, unresolved tickets, technician assignments,
              and customers needing attention.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={timeFilter}
              onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
            >
              {Object.entries(TIME_FILTER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as ReportCategory)}
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {sections.map((section) => (
          <section key={section.category} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{section.subtitle}</p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {TIME_FILTER_LABELS[timeFilter]}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {section.metrics.map((metric) => (
                <MetricCard key={`${section.category}-${metric.label}`} metric={metric} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <BarList
          title="Jobs by Technician"
          subtitle="Completed and assigned field work by technician."
          items={JOBS_BY_TECHNICIAN[timeFilter]}
        />
        <BarList
          title="Jobs by Type"
          subtitle="Operational work order mix for the selected period."
          items={JOBS_BY_TYPE[timeFilter]}
        />
        <BarList
          title="Tickets by Issue Type"
          subtitle="Support request mix by customer-reported issue."
          items={TICKETS_BY_ISSUE_TYPE[timeFilter]}
        />
      </div>

      <ActionTable items={actionItems} />
    </div>
  );
}
