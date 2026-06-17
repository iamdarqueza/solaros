"use client";
import { useState, useRef, useEffect } from "react";
import { useTech } from "@/app/(technician)/layout";
import type { TechnicianProfile } from "@/services/technicianPortalService";

export default function TechProfileSwitcher() {
  const { profile, setProfile, allProfiles } = useTech();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(p: TechnicianProfile) {
    setProfile(p);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          {profile.initials}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-white leading-none">{profile.name}</p>
          <p className="text-[10px] text-amber-400 mt-0.5">{profile.specialty}</p>
        </div>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-white/40 ml-1 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-64 rounded-2xl overflow-hidden z-50"
          style={{
            background: "rgba(22, 27, 34, 0.97)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="px-3 py-2 border-b border-white/5">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Switch Technician</p>
          </div>
          {allProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => select(p)}
              className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-white/5"
              style={{
                background: p.id === profile.id ? "rgba(245,158,11,0.08)" : "transparent",
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{
                  background: p.id === profile.id
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "rgba(255,255,255,0.1)",
                }}
              >
                {p.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-[10px] text-white/40">{p.specialty}</p>
              </div>
              {p.id === profile.id && (
                <div className="ml-auto w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
