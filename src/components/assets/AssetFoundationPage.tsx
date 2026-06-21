"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AssetFoundationData,
  AssetPhoto,
  Equipment,
  InstallationProject,
  Site,
  SolarSystem,
  assetLabels,
  assetsService,
} from "@/services/assetsService";

type AssetTab = "sites" | "systems" | "equipment" | "installations";

const tabs: Array<{ id: AssetTab; label: string; description: string }> = [
  { id: "sites", label: "Sites", description: "Physical properties and access context" },
  { id: "systems", label: "Solar Systems", description: "Installed solar setups at each site" },
  { id: "equipment", label: "Equipment", description: "Panels, inverters, batteries, and assets" },
  { id: "installations", label: "Installations", description: "Project, commissioning, and handover records" },
];

function formatDate(date: string) {
  if (!date) return "Not set";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ label, tone = "gray" }: { label: string; tone?: "green" | "blue" | "amber" | "red" | "gray" | "purple" }) {
  const tones = {
    green: "border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    amber: "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400",
    red: "border-error-200 bg-error-50 text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400",
    gray: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
    purple: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      {label}
    </span>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-dark">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-gray-800 dark:text-white/90">{value}</span>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function InlineRecordLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
      {children}
    </Link>
  );
}

function PhotoList({ photos }: { photos: AssetPhoto[] }) {
  if (photos.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">No photos attached yet.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {photos.map((photo) => (
        <div key={photo.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/60">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">{photo.label}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatDate(photo.capturedAt)} · {photo.category.replaceAll("_", " ")}
          </p>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children}
    </section>
  );
}

function getSystemTone(status: SolarSystem["status"]) {
  if (status === "active") return "green";
  if (status === "under_maintenance") return "amber";
  return "gray";
}

function getEquipmentTone(status: Equipment["status"]) {
  if (status === "active") return "green";
  if (status === "needs_service" || status === "under_warranty_review") return "amber";
  if (status === "replaced") return "gray";
  return "blue";
}

function getInstallationTone(status: InstallationProject["projectStatus"]) {
  if (status === "handover_completed" || status === "commissioned") return "green";
  if (status === "in_progress" || status === "installed") return "amber";
  if (status === "cancelled") return "red";
  return "blue";
}

interface AssetFoundationPageProps {
  initialTab?: AssetTab;
}

export default function AssetFoundationPage({ initialTab = "sites" }: AssetFoundationPageProps) {
  const [data, setData] = useState<AssetFoundationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AssetTab>(initialTab);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<AssetTab, string | null>>({
    sites: null,
    systems: null,
    equipment: null,
    installations: null,
  });

  useEffect(() => {
    assetsService.getAssetFoundation().then((assetData) => {
      setData(assetData);
      setSelectedIds({
        sites: assetData.sites[0]?.id ?? null,
        systems: assetData.solarSystems[0]?.id ?? null,
        equipment: assetData.equipment[0]?.id ?? null,
        installations: assetData.installations[0]?.id ?? null,
      });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const filtered = useMemo(() => {
    if (!data) return null;
    const q = search.trim().toLowerCase();
    const matches = (...values: string[]) => !q || values.some((value) => value.toLowerCase().includes(q));

    return {
      sites: data.sites.filter((site) => matches(site.name, site.customerName, site.address)),
      systems: data.solarSystems.filter((system) => matches(system.name, system.customerName, system.siteName, system.inverter, system.battery)),
      equipment: data.equipment.filter((item) =>
        matches(item.brand, item.modelNumber, item.serialNumber, item.customerName, assetLabels.equipmentType[item.equipmentType])
      ),
      installations: data.installations.filter((installation) =>
        matches(installation.customerName, installation.siteName, installation.assignedInstallationTeam, assetLabels.installationStatus[installation.projectStatus])
      ),
    };
  }, [data, search]);

  if (loading || !data || !filtered) {
    return (
      <div className="space-y-5">
        <div className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
          <div className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  const activeMeta = tabs.find((tab) => tab.id === activeTab)!;
  const counts = {
    sites: data.sites.length,
    systems: data.solarSystems.length,
    equipment: data.equipment.length,
    installations: data.installations.length,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-5 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-gray-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Asset Foundation</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Sites, Solar Systems, Equipment, and Installations</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
              This frontend view separates physical properties from installed systems, asset inventory, and handover projects so service teams can link tickets,
              maintenance visits, warranty claims, work orders, documents, and service history to the right record.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
            <MetricCard label="Sites" value={counts.sites} />
            <MetricCard label="Systems" value={counts.systems} />
            <MetricCard label="Equipment" value={counts.equipment} />
            <MetricCard label="Projects" value={counts.installations} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
        <div className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex min-w-max overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearch("");
                  }}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-medium transition-colors",
                    isActive
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                      isActive ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    )}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
          <div className="border-b border-gray-100 p-5 dark:border-gray-800 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{activeMeta.label}</h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{activeMeta.description}</p>
              </div>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${activeMeta.label.toLowerCase()}...`}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-transparent focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {activeTab === "sites" && (
              <SiteList sites={filtered.sites} selectedId={selectedIds.sites} onSelect={(id) => setSelectedIds((prev) => ({ ...prev, sites: id }))} />
            )}
            {activeTab === "systems" && (
              <SystemList systems={filtered.systems} selectedId={selectedIds.systems} onSelect={(id) => setSelectedIds((prev) => ({ ...prev, systems: id }))} />
            )}
            {activeTab === "equipment" && (
              <EquipmentList equipment={filtered.equipment} selectedId={selectedIds.equipment} onSelect={(id) => setSelectedIds((prev) => ({ ...prev, equipment: id }))} />
            )}
            {activeTab === "installations" && (
              <InstallationList
                installations={filtered.installations}
                selectedId={selectedIds.installations}
                onSelect={(id) => setSelectedIds((prev) => ({ ...prev, installations: id }))}
              />
            )}
          </div>

          <div className="p-5">
            {activeTab === "sites" && <SiteDetail site={data.sites.find((site) => site.id === selectedIds.sites) ?? filtered.sites[0]} data={data} />}
            {activeTab === "systems" && <SystemDetail system={data.solarSystems.find((system) => system.id === selectedIds.systems) ?? filtered.systems[0]} data={data} />}
            {activeTab === "equipment" && <EquipmentDetail equipment={data.equipment.find((item) => item.id === selectedIds.equipment) ?? filtered.equipment[0]} data={data} />}
            {activeTab === "installations" && (
              <InstallationDetail installation={data.installations.find((item) => item.id === selectedIds.installations) ?? filtered.installations[0]} data={data} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SiteList({ sites, selectedId, onSelect }: { sites: Site[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (sites.length === 0) return <EmptyState title="No sites found" message="Try a different search, or add a site when creation forms are introduced." />;

  return (
    <div className="space-y-2">
      {sites.map((site) => (
        <button
          key={site.id}
          onClick={() => onSelect(site.id)}
          className={cn(
            "w-full rounded-xl border p-4 text-left transition",
            selectedId === site.id
              ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
              : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-dark dark:hover:bg-white/[0.03]"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{site.name}</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{site.customerName}</p>
            </div>
            <StatusPill label={assetLabels.roofCondition[site.roofCondition]} tone={site.roofCondition === "needs_repair" ? "amber" : "green"} />
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{site.address}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{site.relatedSolarSystemIds.length} systems</span>
            <span>·</span>
            <span>{site.relatedWorkOrderIds.length} work orders</span>
            <span>·</span>
            <span>{site.relatedDocumentIds.length} documents</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function SystemList({ systems, selectedId, onSelect }: { systems: SolarSystem[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (systems.length === 0) return <EmptyState title="No solar systems found" message="Try a different search, or add system records after the install workflow exists." />;

  return (
    <div className="space-y-2">
      {systems.map((system) => (
        <button
          key={system.id}
          onClick={() => onSelect(system.id)}
          className={cn(
            "w-full rounded-xl border p-4 text-left transition",
            selectedId === system.id
              ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
              : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-dark dark:hover:bg-white/[0.03]"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{system.name}</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{system.siteName}</p>
            </div>
            <StatusPill label={assetLabels.systemStatus[system.status]} tone={getSystemTone(system.status)} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MetricCard label="Size" value={`${system.systemSizeKw} kW`} />
            <MetricCard label="Panels" value={system.panelCount} />
            <MetricCard label="Type" value={assetLabels.systemType[system.systemType]} />
          </div>
        </button>
      ))}
    </div>
  );
}

function EquipmentList({ equipment, selectedId, onSelect }: { equipment: Equipment[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (equipment.length === 0) return <EmptyState title="No equipment found" message="Try a different search, or add installed asset records from an installation." />;

  return (
    <div className="space-y-2">
      {equipment.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            "w-full rounded-xl border p-4 text-left transition",
            selectedId === item.id
              ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
              : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-dark dark:hover:bg-white/[0.03]"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.brand} {item.modelNumber}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{assetLabels.equipmentType[item.equipmentType]}</p>
            </div>
            <StatusPill label={assetLabels.equipmentStatus[item.status]} tone={getEquipmentTone(item.status)} />
          </div>
          <p className="mt-3 text-xs font-mono text-gray-400 dark:text-gray-500">{item.serialNumber}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Qty {item.quantity} · {item.systemName}
          </p>
        </button>
      ))}
    </div>
  );
}

function InstallationList({
  installations,
  selectedId,
  onSelect,
}: {
  installations: InstallationProject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (installations.length === 0) return <EmptyState title="No installation projects found" message="Try a different search, or create a planned installation record later." />;

  return (
    <div className="space-y-2">
      {installations.map((installation) => {
        const completedItems = installation.handoverChecklist.filter((item) => item.completed).length;
        return (
          <button
            key={installation.id}
            onClick={() => onSelect(installation.id)}
            className={cn(
              "w-full rounded-xl border p-4 text-left transition",
              selectedId === installation.id
                ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-dark dark:hover:bg-white/[0.03]"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{installation.siteName}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{installation.customerName}</p>
              </div>
              <StatusPill label={assetLabels.installationStatus[installation.projectStatus]} tone={getInstallationTone(installation.projectStatus)} />
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {formatDate(installation.installationDate)} · {installation.assignedInstallationTeam}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Handover checklist {completedItems}/{installation.handoverChecklist.length}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function SiteDetail({ site, data }: { site?: Site; data: AssetFoundationData }) {
  if (!site) return <EmptyState title="No site selected" message="Select a site from the list to view property details." />;
  const systems = data.solarSystems.filter((system) => site.relatedSolarSystemIds.includes(system.id));
  const documents = data.documents.filter((doc) => site.relatedDocumentIds.includes(doc.id));

  return (
    <div className="space-y-4">
      <Section title={site.name}>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusPill label={assetLabels.buildingType[site.buildingType]} tone="blue" />
          <StatusPill label={assetLabels.propertyType[site.propertyType]} tone="purple" />
          <StatusPill label={assetLabels.roofType[site.roofType]} />
        </div>
        <DetailRow label="Customer" value={<InlineRecordLink href={`/customers/${site.customerId}`}>{site.customerName}</InlineRecordLink>} />
        <DetailRow label="Address" value={site.address} />
        <DetailRow label="Roof condition" value={assetLabels.roofCondition[site.roofCondition]} />
        <DetailRow label="Contact person on site" value={site.contactPersonOnSite} />
        <DetailRow label="Access notes" value={site.accessNotes} />
        <DetailRow label="Safety notes" value={site.safetyNotes} />
      </Section>
      <Section title="Related Records">
        <div className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="Solar Systems" value={systems.length} />
          <MetricCard label="Documents" value={<InlineRecordLink href="/documents">{documents.length}</InlineRecordLink>} />
          <MetricCard label="Maintenance" value={site.relatedMaintenanceVisitIds.length} />
          <MetricCard label="Work Orders" value={<InlineRecordLink href="/work-orders">{site.relatedWorkOrderIds.length}</InlineRecordLink>} />
        </div>
        <div className="mt-4 space-y-2">
          {systems.map((system) => (
            <div key={system.id} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{system.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{system.systemSizeKw} kW · {assetLabels.systemStatus[system.status]}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Photos">
        <PhotoList photos={site.photos} />
      </Section>
    </div>
  );
}

function SystemDetail({ system, data }: { system?: SolarSystem; data: AssetFoundationData }) {
  if (!system) return <EmptyState title="No solar system selected" message="Select a solar system from the list to view its installed setup." />;
  const equipment = data.equipment.filter((item) => system.relatedEquipmentIds.includes(item.id));
  const documents = data.documents.filter((doc) => system.relatedDocumentIds.includes(doc.id));

  return (
    <div className="space-y-4">
      <Section title={system.name}>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusPill label={assetLabels.systemStatus[system.status]} tone={getSystemTone(system.status)} />
          <StatusPill label={assetLabels.systemType[system.systemType]} tone="blue" />
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <MetricCard label="Size" value={`${system.systemSizeKw} kW`} />
          <MetricCard label="Panels" value={system.panelCount} />
          <MetricCard label="Equipment" value={equipment.length} />
          <MetricCard label="Documents" value={documents.length} />
        </div>
        <DetailRow label="Customer" value={<InlineRecordLink href={`/customers/${system.customerId}`}>{system.customerName}</InlineRecordLink>} />
        <DetailRow label="Site" value={system.siteName} />
        <DetailRow label="Installation date" value={formatDate(system.installationDate)} />
        <DetailRow label="Inverter" value={system.inverter} />
        <DetailRow label="Battery" value={system.battery} />
        <DetailRow label="Installer/team" value={system.installerTeam} />
      </Section>
      <Section title="Related Equipment">
        <div className="space-y-2">
          {equipment.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.brand} {item.modelNumber}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{assetLabels.equipmentType[item.equipmentType]} · Qty {item.quantity}</p>
              </div>
              <StatusPill label={assetLabels.equipmentStatus[item.status]} tone={getEquipmentTone(item.status)} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Service History">
        <div className="space-y-2">
          {system.serviceHistory.map((event) => (
            <div key={event} className="rounded-xl border border-gray-100 p-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
              {event}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function EquipmentDetail({ equipment, data }: { equipment?: Equipment; data: AssetFoundationData }) {
  if (!equipment) return <EmptyState title="No equipment selected" message="Select equipment from the list to view model, warranty, and document details." />;
  const manual = data.documents.find((doc) => doc.id === equipment.manualDocumentId);
  const warranty = data.documents.find((doc) => doc.id === equipment.warrantyDocumentId);

  return (
    <div className="space-y-4">
      <Section title={`${equipment.brand} ${equipment.modelNumber}`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusPill label={assetLabels.equipmentType[equipment.equipmentType]} tone="blue" />
          <StatusPill label={assetLabels.equipmentStatus[equipment.status]} tone={getEquipmentTone(equipment.status)} />
        </div>
        <DetailRow label="Customer" value={<InlineRecordLink href={`/customers/${equipment.customerId}`}>{equipment.customerName}</InlineRecordLink>} />
        <DetailRow label="Solar system" value={equipment.systemName} />
        <DetailRow label="Serial number" value={<span className="font-mono">{equipment.serialNumber}</span>} />
        <DetailRow label="Quantity" value={equipment.quantity} />
        <DetailRow label="Installed date" value={formatDate(equipment.installedDate)} />
        <DetailRow label="Supplier" value={equipment.supplier} />
      </Section>
      <Section title="Warranty and Documents">
        <DetailRow label="Warranty start" value={formatDate(equipment.warrantyStartDate)} />
        <DetailRow label="Warranty end" value={formatDate(equipment.warrantyEndDate)} />
        <DetailRow label="Manual/document" value={manual ? <InlineRecordLink href="/documents">{manual.name}</InlineRecordLink> : "No manual attached"} />
        <DetailRow label="Warranty document" value={warranty ? <InlineRecordLink href="/documents">{warranty.name}</InlineRecordLink> : "No warranty document attached"} />
      </Section>
      <Section title="Photos">
        <PhotoList photos={equipment.photos} />
      </Section>
    </div>
  );
}

function InstallationDetail({ installation, data }: { installation?: InstallationProject; data: AssetFoundationData }) {
  if (!installation) return <EmptyState title="No installation selected" message="Select an installation project to view handover progress and installed equipment." />;
  const equipment = data.equipment.filter((item) => installation.installedEquipmentIds.includes(item.id));
  const documents = data.documents.filter((doc) => installation.documentIds.includes(doc.id));
  const completedItems = installation.handoverChecklist.filter((item) => item.completed).length;

  return (
    <div className="space-y-4">
      <Section title={`${installation.siteName} Installation`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusPill label={assetLabels.installationStatus[installation.projectStatus]} tone={getInstallationTone(installation.projectStatus)} />
          <StatusPill label={installation.customerSignOff.signed ? "Customer signed off" : "Sign-off pending"} tone={installation.customerSignOff.signed ? "green" : "amber"} />
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <MetricCard label="Installed Assets" value={equipment.length} />
          <MetricCard label="Pre Photos" value={installation.preInstallationPhotos.length} />
          <MetricCard label="Post Photos" value={installation.postInstallationPhotos.length} />
          <MetricCard label="Checklist" value={`${completedItems}/${installation.handoverChecklist.length}`} />
        </div>
        <DetailRow label="Customer" value={<InlineRecordLink href={`/customers/${installation.customerId}`}>{installation.customerName}</InlineRecordLink>} />
        <DetailRow label="Site" value={installation.siteName} />
        <DetailRow label="Installation date" value={formatDate(installation.installationDate)} />
        <DetailRow label="Assigned team" value={installation.assignedInstallationTeam} />
        <DetailRow label="Customer sign-off" value={installation.customerSignOff.signedBy ? `${installation.customerSignOff.signedBy}, ${formatDate(installation.customerSignOff.signedAt ?? "")}` : "Pending"} />
        <DetailRow label="Notes" value={installation.notes} />
      </Section>
      <Section title="Handover Checklist">
        <div className="space-y-2">
          {installation.handoverChecklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">{item.label}</span>
              <StatusPill label={item.completed ? "Done" : "Open"} tone={item.completed ? "green" : "amber"} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Installed Equipment">
        <div className="space-y-2">
          {equipment.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.brand} {item.modelNumber}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{assetLabels.equipmentType[item.equipmentType]} · Serial {item.serialNumber}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Photos and Documents">
        <div className="grid gap-4 xl:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Pre-installation photos</p>
            <PhotoList photos={installation.preInstallationPhotos} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Post-installation photos</p>
            <PhotoList photos={installation.postInstallationPhotos} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <InlineRecordLink href="/documents">{doc.name}</InlineRecordLink>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
