"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { TECHNICIAN_PROFILES, type TechnicianProfile } from "@/services/technicianPortalService";
import BottomNav from "@/components/technician/BottomNav";

/* ── Tech Context ─────────────────────────────────────────────────────────── */

interface TechContextValue {
  profile: TechnicianProfile;
  setProfile: (p: TechnicianProfile) => void;
  allProfiles: TechnicianProfile[];
}

export const TechContext = createContext<TechContextValue>({
  profile: TECHNICIAN_PROFILES[0],
  setProfile: () => {},
  allProfiles: TECHNICIAN_PROFILES,
});

export function useTech() {
  return useContext(TechContext);
}

/* ── Layout ───────────────────────────────────────────────────────────────── */

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfileState] = useState<TechnicianProfile>(TECHNICIAN_PROFILES[0]);

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
