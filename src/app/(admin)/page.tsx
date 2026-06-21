import type { Metadata } from "next";
import SolarDashboard from "@/components/dashboard/SolarDashboard";

export const metadata: Metadata = {
  title: "Operations Overview | SolarOS — Solar Service & Warranty Management",
  description:
    "Manage solar installations, open support tickets, technician assignments, warranty expirations, and maintenance schedules in one place.",
};

export default function DashboardPage() {
  return <SolarDashboard />;
}
