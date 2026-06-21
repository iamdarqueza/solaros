"use client";
import { useEffect, useState } from "react";
import { useTech } from "@/components/technician/TechContext";
import TechProfileSwitcher from "@/components/technician/TechProfileSwitcher";
import { technicianPortalService } from "@/services/technicianPortalService";

export default function ProfilePage() {
  const { profile } = useTech();
  const [stats, setStats] = useState({ todayJobs: 0, activeJob: false, priorityJobs: 0, openJobs: 0, completedThisWeek: 0 });

  useEffect(() => {
    technicianPortalService.getDashboardStats(profile.id).then(setStats);
  }, [profile.id]);

  return (
    <div className="px-4 pt-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <p className="text-xs text-white/40 mt-0.5">Technician demo profile</p>
        </div>
        <TechProfileSwitcher />
      </div>

      <div
        className="rounded-3xl p-5 mb-5"
        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(255,255,255,0.04))", border: "1px solid rgba(245,158,11,0.2)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-black"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            {profile.initials}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{profile.name}</p>
            <p className="text-sm text-white/45">{profile.specialty}</p>
            <p className="text-xs text-amber-400 mt-1">Field technician</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: "Today", value: stats.todayJobs, sub: "scheduled" },
          { label: "Open", value: stats.openJobs, sub: "assigned" },
          { label: "Priority", value: stats.priorityJobs, sub: "urgent/high" },
          { label: "Week", value: stats.completedThisWeek, sub: "completed" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p className="text-xs text-white/35">{item.label} · {item.sub}</p>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Mock App Notes</h2>
        <div className="space-y-2 text-sm text-white/50">
          <p>• Profile switching is local demo state only.</p>
          <p>• Uploads, GPS, and time tracking are mocked for now.</p>
          <p>• Maintenance, support, and warranty work all appear as Jobs.</p>
        </div>
      </div>
    </div>
  );
}
