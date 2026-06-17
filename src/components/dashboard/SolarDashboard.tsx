"use client";

import React, { useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconUsers = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconSolar = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7V5a5 5 0 0 1 10 0v2M12 11v6M9 14h6" />
  </svg>
);
const IconTicket = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01M12 16h.01M8 12h.01M8 16h.01" />
  </svg>
);
const IconWrench = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const IconCalendar = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);
const IconTrendUp = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const IconTrendDown = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconDot = ({ color }: { color: string }) => (
  <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
);
const IconSun = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMapPin = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconClock = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────
type KpiCard = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  accent: string;
  bg: string;
};

type Ticket = {
  id: string;
  customer: string;
  issue: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Pending";
  created: string;
};

type Technician = {
  name: string;
  avatar: string;
  task: string;
  location: string;
  status: "On Site" | "En Route" | "Available";
  eta?: string;
};

type Installation = {
  customer: string;
  address: string;
  system: string;
  kw: string;
  date: string;
  status: "Active" | "Commissioning";
};

type WarrantyAlert = {
  customer: string;
  system: string;
  expiry: string;
  daysLeft: number;
};

type Activity = {
  customer: string;
  action: string;
  time: string;
  type: "ticket" | "install" | "maintenance" | "warranty";
};

type MaintenanceEvent = {
  day: number;
  customer: string;
  type: string;
  tech: string;
};

// ── Mock Data ─────────────────────────────────────────────────────────────────
const kpiCards: KpiCard[] = [
  { label: "Total Customers", value: "1,284", change: "+12%", positive: true, icon: <IconUsers />, accent: "#465fff", bg: "rgba(70,95,255,0.08)" },
  { label: "Active Installations", value: "847", change: "+5%", positive: true, icon: <IconSolar />, accent: "#12b76a", bg: "rgba(18,183,106,0.08)" },
  { label: "Open Support Tickets", value: "34", change: "+8%", positive: false, icon: <IconTicket />, accent: "#f79009", bg: "rgba(247,144,9,0.08)" },
  { label: "Active Work Orders", value: "21", change: "-3%", positive: true, icon: <IconWrench />, accent: "#7a5af8", bg: "rgba(122,90,248,0.08)" },
  { label: "Upcoming Maintenance", value: "16", change: "This week", positive: true, icon: <IconCalendar />, accent: "#0ba5ec", bg: "rgba(11,165,236,0.08)" },
  { label: "Warranties Expiring (90d)", value: "9", change: "Needs action", positive: false, icon: <IconShield />, accent: "#f04438", bg: "rgba(240,68,56,0.08)" },
];

const tickets: Ticket[] = [
  { id: "T-2041", customer: "Greenfield Homes", issue: "Inverter fault — no output since Monday", priority: "Critical", status: "In Progress", created: "2h ago" },
  { id: "T-2039", customer: "Pacific Solar Co.", issue: "App reporting incorrect energy readings", priority: "High", status: "Open", created: "5h ago" },
  { id: "T-2037", customer: "Mesa Residential", issue: "Panel cracked after storm", priority: "High", status: "Open", created: "Yesterday" },
  { id: "T-2033", customer: "SunCrest Villas", issue: "Monitoring portal login issue", priority: "Medium", status: "Pending", created: "2d ago" },
  { id: "T-2031", customer: "Horizon Energy", issue: "Battery not charging to 100%", priority: "Medium", status: "Open", created: "2d ago" },
];

const technicians: Technician[] = [
  { name: "Marco Reyes", avatar: "MR", task: "Inverter replacement at Greenfield Homes", location: "Quezon City", status: "On Site", eta: undefined },
  { name: "Dana Cruz", avatar: "DC", task: "Annual inspection — Pacific Solar", location: "Makati", status: "En Route", eta: "20 min" },
  { name: "Josh Tan", avatar: "JT", task: "New install commissioning", location: "Paranaque", status: "On Site", eta: undefined },
  { name: "Leila Santos", avatar: "LS", task: "Panel cleaning & performance check", location: "Taguig", status: "Available", eta: undefined },
];

const installations: Installation[] = [
  { customer: "Ayala Residences", address: "Cebu City", system: "15kW Hybrid", kw: "15", date: "Jun 13", status: "Active" },
  { customer: "SM Solar Farm", address: "Pampanga", system: "100kW Commercial", kw: "100", date: "Jun 12", status: "Active" },
  { customer: "BF Homes", address: "Paranaque", system: "8kW Grid-Tied", kw: "8", date: "Jun 11", status: "Commissioning" },
  { customer: "Vista Land", address: "Laguna", system: "20kW Hybrid", kw: "20", date: "Jun 10", status: "Active" },
];

const warrantyAlerts: WarrantyAlert[] = [
  { customer: "EcoTech Residences", system: "SunPower 10kW", expiry: "Jul 5, 2026", daysLeft: 19 },
  { customer: "Marikina Homes", system: "Huawei 8kW", expiry: "Jul 14, 2026", daysLeft: 28 },
  { customer: "Cavite Solar Park", system: "Growatt 25kW", expiry: "Aug 1, 2026", daysLeft: 46 },
  { customer: "Laguna Heights", system: "SMA 12kW", expiry: "Aug 22, 2026", daysLeft: 67 },
  { customer: "Bulacan Residences", system: "Fronius 6kW", expiry: "Sep 1, 2026", daysLeft: 77 },
];

const recentActivity: Activity[] = [
  { customer: "Greenfield Homes", action: "Opened critical support ticket T-2041", time: "2h ago", type: "ticket" },
  { customer: "SM Solar Farm", action: "Installation activated and commissioned", time: "4h ago", type: "install" },
  { customer: "Pacific Solar Co.", action: "Maintenance schedule confirmed for Jun 18", time: "6h ago", type: "maintenance" },
  { customer: "EcoTech Residences", action: "Warranty renewal reminder sent", time: "Yesterday", type: "warranty" },
  { customer: "Mesa Residential", action: "Work order WO-815 created for panel replacement", time: "Yesterday", type: "ticket" },
  { customer: "Horizon Energy", action: "Annual inspection completed — passed", time: "2d ago", type: "maintenance" },
];

const maintenanceEvents: MaintenanceEvent[] = [
  { day: 16, customer: "Pacific Solar Co.", type: "Annual Inspection", tech: "Dana Cruz" },
  { day: 17, customer: "SunCrest Villas", type: "Panel Cleaning", tech: "Leila Santos" },
  { day: 18, customer: "Ayala Residences", type: "Inverter Check", tech: "Marco Reyes" },
  { day: 20, customer: "BF Homes", type: "Commissioning", tech: "Josh Tan" },
  { day: 23, customer: "Vista Land", type: "Performance Review", tech: "Dana Cruz" },
  { day: 25, customer: "Horizon Energy", type: "Battery Maintenance", tech: "Marco Reyes" },
];

// ── Helper Components ─────────────────────────────────────────────────────────
const priorityConfig = {
  Critical: { bg: "bg-error-50 dark:bg-error-500/10", text: "text-error-600 dark:text-error-400", dot: "#f04438" },
  High: { bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", dot: "#f79009" },
  Medium: { bg: "bg-warning-50 dark:bg-warning-500/10", text: "text-warning-600 dark:text-warning-500", dot: "#fec84b" },
  Low: { bg: "bg-success-50 dark:bg-success-500/10", text: "text-success-600 dark:text-success-400", dot: "#12b76a" },
};

const statusConfig = {
  "Open": { bg: "bg-error-50 dark:bg-error-500/10", text: "text-error-600 dark:text-error-400" },
  "In Progress": { bg: "bg-brand-50 dark:bg-brand-500/10", text: "text-brand-600 dark:text-brand-400" },
  "Pending": { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300" },
};

const techStatusConfig = {
  "On Site": { bg: "bg-success-50 dark:bg-success-500/10", text: "text-success-700 dark:text-success-400", dot: "#12b76a" },
  "En Route": { bg: "bg-brand-50 dark:bg-brand-500/10", text: "text-brand-700 dark:text-brand-400", dot: "#465fff" },
  "Available": { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300", dot: "#98a2b3" },
};

const activityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "ticket": return { icon: <IconTicket />, color: "#f79009", bg: "rgba(247,144,9,0.1)" };
    case "install": return { icon: <IconSolar />, color: "#12b76a", bg: "rgba(18,183,106,0.1)" };
    case "maintenance": return { icon: <IconWrench />, color: "#465fff", bg: "rgba(70,95,255,0.1)" };
    case "warranty": return { icon: <IconShield />, color: "#f04438", bg: "rgba(240,68,56,0.1)" };
  }
};

function getDaysLeftColor(days: number): string {
  if (days <= 20) return "#f04438";
  if (days <= 45) return "#f79009";
  return "#12b76a";
}

// ── Calendar Mini ─────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = "June 2026";
// June 2026 starts on Monday (index 1)
const START_DAY = 1;
const TOTAL_DAYS = 30;

function MiniCalendar({ events, selectedDay, onSelect }: { events: MaintenanceEvent[]; selectedDay: number | null; onSelect: (d: number) => void }) {
  const eventDays = new Set(events.map((e) => e.day));
  const cells: (number | null)[] = [];
  for (let i = 0; i < START_DAY; i++) cells.push(null);
  for (let d = 1; d <= TOTAL_DAYS; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const today = day === 16;
          const hasEvent = eventDays.has(day);
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              className={`relative mx-auto flex flex-col items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150
                ${isSelected ? "bg-brand-500 text-white shadow-sm" : today ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}
              `}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      {action && (
        <button className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors">
          {action} <IconChevronRight />
        </button>
      )}
    </div>
  );
}

// ── Card Wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SolarDashboard() {
  const [selectedDay, setSelectedDay] = useState<number | null>(16);
  const selectedEvents = maintenanceEvents.filter((e) => e.day === selectedDay);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Operations Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {MONTH} · Solar Service & Warranty Management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/10 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
            Live
          </div>
          <button className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm">
            + New Work Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:shadow-theme-md transition-shadow duration-200 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: kpi.bg, color: kpi.accent }}
              >
                {kpi.icon}
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  kpi.positive
                    ? "text-success-600 bg-success-50 dark:bg-success-500/10 dark:text-success-400"
                    : "text-error-600 bg-error-50 dark:bg-error-500/10 dark:text-error-400"
                }`}
              >
                {kpi.positive ? <IconTrendUp /> : <IconTrendDown />}
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{kpi.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Row 2: Calendar + Open Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <SectionHeader title="Upcoming Maintenance" />
          <MiniCalendar events={maintenanceEvents} selectedDay={selectedDay} onSelect={setSelectedDay} />
          {/* Events for selected day */}
          <div className="mt-5 space-y-2">
            {selectedDay && selectedEvents.length > 0 ? (
              selectedEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-500 dark:text-brand-400 flex-shrink-0">
                    <IconSun />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ev.customer}</p>
                    <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">{ev.tech}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-gray-400 dark:text-gray-600">
                <IconCalendar />
                <p className="text-xs mt-2">No events on Jun {selectedDay}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Open Tickets */}
        <Card className="lg:col-span-3">
          <SectionHeader title="Open Support Tickets" action="View All" />
          <div className="space-y-3">
            {tickets.map((t) => {
              const p = priorityConfig[t.priority];
              const s = statusConfig[t.status];
              return (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-150 cursor-pointer group"
                >
                  <IconDot color={p.dot} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-mono">{t.id}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>{t.priority}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{t.status}</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 truncate">{t.customer}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{t.issue}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.created}</p>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors mt-1">
                    <IconChevronRight />
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 3: Technicians + Recently Installed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Technician Assignments */}
        <Card>
          <SectionHeader title="Active Technician Assignments" action="Manage" />
          <div className="space-y-3">
            {technicians.map((tech) => {
              const ts = techStatusConfig[tech.status];
              return (
                <div key={tech.name} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-150">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400 flex-shrink-0">
                    {tech.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{tech.name}</p>
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${ts.bg} ${ts.text}`}>
                        <IconDot color={ts.dot} />
                        {tech.status}
                        {tech.eta && <span className="opacity-70">· {tech.eta}</span>}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 truncate">{tech.task}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <IconMapPin /> {tech.location}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recently Installed Systems */}
        <Card>
          <SectionHeader title="Recently Installed Systems" action="View All" />
          <div className="space-y-3">
            {installations.map((inst, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-150">
                <div className="w-9 h-9 rounded-xl bg-success-50 dark:bg-success-500/10 flex items-center justify-center text-success-600 dark:text-success-400 flex-shrink-0 text-sm font-bold">
                  {inst.kw}<span className="text-xs font-normal">kW</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{inst.customer}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{inst.system}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <IconMapPin /> {inst.address} · {inst.date}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                  inst.status === "Active"
                    ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                }`}>
                  {inst.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 4: Warranty Alerts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Warranty Expiration Alerts */}
        <Card className="lg:col-span-2">
          <SectionHeader title="Warranty Expiration Alerts" action="View All" />
          <div className="space-y-3">
            {warrantyAlerts.map((w, i) => {
              const color = getDaysLeftColor(w.daysLeft);
              const pct = Math.max(0, Math.min(100, (1 - w.daysLeft / 90) * 100));
              return (
                <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18`, color }}>
                        <IconAlert />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{w.customer}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{w.system}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color }}>
                      {w.daysLeft}d left
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Expires {w.expiry}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Customer Activity */}
        <Card className="lg:col-span-3">
          <SectionHeader title="Recent Customer Activity" action="View Log" />
          <div className="space-y-1">
            {recentActivity.map((a, i) => {
              const ai = activityIcon(a.type);
              return (
                <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 group cursor-pointer">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ai.bg, color: ai.color }}
                  >
                    {ai.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                      <span className="font-semibold">{a.customer}</span>
                      <span className="text-gray-500 dark:text-gray-400 font-normal"> — {a.action}</span>
                    </p>
                    <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      <IconClock /> {a.time}
                    </p>
                  </div>
                  <span className="text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors mt-1">
                    <IconChevronRight />
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
