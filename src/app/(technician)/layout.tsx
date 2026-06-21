"use client";
import React, { useEffect, useState } from "react";
import { TECHNICIAN_PROFILES, type TechnicianProfile } from "@/services/technicianPortalService";
import { TechContext } from "@/components/technician/TechContext";
import BottomNav from "@/components/technician/BottomNav";

/* ── Layout ───────────────────────────────────────────────────────────────── */

const DEFAULT_DEMO_TECH_ID = "tech-003";
const DEFAULT_DEMO_TECH =
  TECHNICIAN_PROFILES.find((profile) => profile.id === DEFAULT_DEMO_TECH_ID) ?? TECHNICIAN_PROFILES[0];

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfileState] = useState<TechnicianProfile>(DEFAULT_DEMO_TECH);

  // Persist active technician in localStorage for demo
  useEffect(() => {
    const saved = localStorage.getItem("activeTechId");
    if (saved) {
      const found = TECHNICIAN_PROFILES.find((p) => p.id === saved);
      if (found) setProfileState(found);
    }
  }, []);

  function setProfile(p: TechnicianProfile) {
    setProfileState(p);
    localStorage.setItem("activeTechId", p.id);
  }

  return (
    <TechContext.Provider value={{ profile, setProfile, allProfiles: TECHNICIAN_PROFILES }}>
      {/* Full-screen dark field-ready shell */}
      <div className="min-h-screen bg-[#0d1117] text-white font-outfit">
        {/* Main scrollable content — padded bottom for bottom nav */}
        <main className="pb-24 min-h-screen">
          {children}
        </main>
        {/* Sticky bottom nav */}
        <BottomNav />
      </div>
    </TechContext.Provider>
  );
}
