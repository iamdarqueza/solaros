"use client";
import React, { createContext, useContext } from "react";
import { TECHNICIAN_PROFILES, type TechnicianProfile } from "@/services/technicianPortalService";

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
