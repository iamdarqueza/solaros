// assetsService.ts
// Frontend-only mock data for the SolarOS asset foundation.
// Replace with API/database calls when the backend schema is ready.

export type BuildingType = "single_family" | "multi_family" | "commercial" | "industrial" | "agricultural";
export type PropertyType = "owned" | "leased" | "hoa" | "tenant_occupied";
export type RoofType = "asphalt_shingle" | "tile" | "metal" | "flat_membrane" | "ground_mount";
export type RoofCondition = "excellent" | "good" | "fair" | "needs_repair";
export type SolarSystemType = "grid_tied" | "hybrid" | "off_grid";
export type SolarSystemStatus = "active" | "inactive" | "under_maintenance";
export type EquipmentType =
  | "solar_panel"
  | "inverter"
  | "battery"
  | "mounting_system"
  | "combiner_box"
  | "breaker"
  | "optimizer"
  | "monitoring_device";
export type EquipmentStatus = "active" | "inactive" | "replaced" | "under_warranty_review" | "needs_service";
export type InstallationProjectStatus =
  | "planned"
  | "scheduled"
  | "in_progress"
  | "installed"
  | "commissioned"
  | "handover_completed"
  | "cancelled";

export interface AssetDocumentLink {
  id: string;
  name: string;
  type: "contract" | "permit" | "warranty" | "manual" | "photo_report" | "handover" | "service_report";
  linkedTo: Array<"customer" | "site" | "system" | "equipment" | "warranty" | "ticket" | "work_order">;
}

export interface AssetPhoto {
  id: string;
  label: string;
  capturedAt: string;
  category: "site" | "pre_install" | "post_install" | "equipment" | "service";
}

export interface Site {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  address: string;
  buildingType: BuildingType;
  propertyType: PropertyType;
  roofType: RoofType;
  roofCondition: RoofCondition;
  accessNotes: string;
  safetyNotes: string;
  contactPersonOnSite: string;
  photos: AssetPhoto[];
  relatedSolarSystemIds: string[];
  relatedDocumentIds: string[];
  relatedMaintenanceVisitIds: string[];
  relatedWorkOrderIds: string[];
}

export interface SolarSystem {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  installationDate: string;
  systemSizeKw: number;
  systemType: SolarSystemType;
  panelCount: number;
  inverter: string;
  battery: string;
  installerTeam: string;
  status: SolarSystemStatus;
  relatedEquipmentIds: string[];
  relatedWarrantyIds: string[];
  relatedDocumentIds: string[];
  serviceHistory: string[];
}

export interface Equipment {
  id: string;
  systemId: string;
  systemName: string;
  siteId: string;
  customerId: string;
  customerName: string;
  equipmentType: EquipmentType;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  quantity: number;
  installedDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  supplier: string;
  status: EquipmentStatus;
  photos: AssetPhoto[];
  manualDocumentId?: string;
  warrantyDocumentId?: string;
}

export interface InstallationProject {
  id: string;
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  installationDate: string;
  projectStatus: InstallationProjectStatus;
  assignedInstallationTeam: string;
  installedEquipmentIds: string[];
  preInstallationPhotos: AssetPhoto[];
  postInstallationPhotos: AssetPhoto[];
  handoverChecklist: Array<{ label: string; completed: boolean }>;
  customerSignOff: {
    signed: boolean;
    signedBy?: string;
    signedAt?: string;
  };
  documentIds: string[];
  notes: string;
}

export interface AssetFoundationData {
  sites: Site[];
  solarSystems: SolarSystem[];
  equipment: Equipment[];
  installations: InstallationProject[];
  documents: AssetDocumentLink[];
}

export const assetLabels = {
  buildingType: {
    single_family: "Single family",
    multi_family: "Multi-family",
    commercial: "Commercial",
    industrial: "Industrial",
    agricultural: "Agricultural",
  } satisfies Record<BuildingType, string>,
  propertyType: {
    owned: "Owned",
    leased: "Leased",
    hoa: "HOA",
    tenant_occupied: "Tenant occupied",
  } satisfies Record<PropertyType, string>,
  roofType: {
    asphalt_shingle: "Asphalt shingle",
    tile: "Tile",
    metal: "Metal",
    flat_membrane: "Flat membrane",
    ground_mount: "Ground mount",
  } satisfies Record<RoofType, string>,
  roofCondition: {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    needs_repair: "Needs repair",
  } satisfies Record<RoofCondition, string>,
  systemType: {
    grid_tied: "Grid-tied",
    hybrid: "Hybrid",
    off_grid: "Off-grid",
  } satisfies Record<SolarSystemType, string>,
  systemStatus: {
    active: "Active",
    inactive: "Inactive",
    under_maintenance: "Under maintenance",
  } satisfies Record<SolarSystemStatus, string>,
  equipmentType: {
    solar_panel: "Solar panel",
    inverter: "Inverter",
    battery: "Battery",
    mounting_system: "Mounting system",
    combiner_box: "Combiner box",
    breaker: "Breaker",
    optimizer: "Optimizer",
    monitoring_device: "Monitoring device",
  } satisfies Record<EquipmentType, string>,
  equipmentStatus: {
    active: "Active",
    inactive: "Inactive",
    replaced: "Replaced",
    under_warranty_review: "Under warranty review",
    needs_service: "Needs service",
  } satisfies Record<EquipmentStatus, string>,
  installationStatus: {
    planned: "Planned",
    scheduled: "Scheduled",
    in_progress: "In Progress",
    installed: "Installed",
    commissioned: "Commissioned",
    handover_completed: "Handover Completed",
    cancelled: "Cancelled",
  } satisfies Record<InstallationProjectStatus, string>,
};

const MOCK_DOCUMENTS: AssetDocumentLink[] = [
  { id: "doc-001", name: "Delgado Residence signed installation contract", type: "contract", linkedTo: ["customer", "site", "system"] },
  { id: "doc-002", name: "San Diego building permit", type: "permit", linkedTo: ["site", "system"] },
  { id: "doc-003", name: "SunPower panel warranty certificate", type: "warranty", linkedTo: ["equipment", "warranty", "system"] },
  { id: "doc-004", name: "Enphase IQ8 installation manual", type: "manual", linkedTo: ["equipment"] },
  { id: "doc-005", name: "Coronado handover pack", type: "handover", linkedTo: ["customer", "site", "system", "work_order"] },
  { id: "doc-006", name: "Commercial commissioning report", type: "service_report", linkedTo: ["site", "system", "work_order"] },
];

const sitePhotos: AssetPhoto[] = [
  { id: "photo-site-001", label: "Main roof access from west gate", capturedAt: "2022-03-18", category: "site" },
  { id: "photo-site-002", label: "Electrical room panel clearance", capturedAt: "2022-03-18", category: "site" },
];

const preInstallPhotos: AssetPhoto[] = [
  { id: "photo-pre-001", label: "Roof before rail layout", capturedAt: "2022-04-08", category: "pre_install" },
  { id: "photo-pre-002", label: "Conduit path before installation", capturedAt: "2022-04-08", category: "pre_install" },
];

const postInstallPhotos: AssetPhoto[] = [
  { id: "photo-post-001", label: "Completed south roof array", capturedAt: "2022-04-10", category: "post_install" },
  { id: "photo-post-002", label: "Labeled combiner and disconnect", capturedAt: "2022-04-10", category: "post_install" },
];

const MOCK_SITES: Site[] = [
  {
    id: "site-001",
    name: "Delgado Residence",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    address: "4821 Sunset Ridge Dr, San Diego, CA 92103",
    buildingType: "single_family",
    propertyType: "owned",
    roofType: "asphalt_shingle",
    roofCondition: "good",
    accessNotes: "Use side gate code 0410. Inverter is in the garage on the north wall.",
    safetyNotes: "Steep east roof face; use fall protection and avoid driveway setup before 9 AM.",
    contactPersonOnSite: "Marcus Delgado, homeowner",
    photos: sitePhotos,
    relatedSolarSystemIds: ["sys-001"],
    relatedDocumentIds: ["doc-001", "doc-002"],
    relatedMaintenanceVisitIds: ["mnt-001a", "mnt-001c"],
    relatedWorkOrderIds: ["wo-001", "wo-013"],
  },
  {
    id: "site-002",
    name: "Harbor View Vacation Home",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    address: "200 Harbor View Ct, Coronado, CA 92118",
    buildingType: "single_family",
    propertyType: "owned",
    roofType: "tile",
    roofCondition: "fair",
    accessNotes: "Property manager keeps keys in lockbox near garage. Call before arrival.",
    safetyNotes: "Fragile clay tile. Bring walk pads and confirm weather before roof access.",
    contactPersonOnSite: "Nina Flores, property manager",
    photos: [{ id: "photo-site-003", label: "Tile roof and garage inverter wall", capturedAt: "2023-09-15", category: "site" }],
    relatedSolarSystemIds: ["sys-002"],
    relatedDocumentIds: ["doc-005"],
    relatedMaintenanceVisitIds: ["mnt-001b"],
    relatedWorkOrderIds: ["wo-1062"],
  },
  {
    id: "site-003",
    name: "Innovation Way HQ",
    customerId: "cust-002",
    customerName: "Priya Nair",
    address: "1100 Innovation Way, San Jose, CA 95110",
    buildingType: "commercial",
    propertyType: "leased",
    roofType: "flat_membrane",
    roofCondition: "excellent",
    accessNotes: "Check in at security desk. Roof hatch is inside mechanical room B.",
    safetyNotes: "Coordinate with facilities; roof has active HVAC work zones.",
    contactPersonOnSite: "Priya Nair, facilities lead",
    photos: [{ id: "photo-site-004", label: "Commercial roof array zone", capturedAt: "2023-02-10", category: "site" }],
    relatedSolarSystemIds: ["sys-003"],
    relatedDocumentIds: ["doc-006"],
    relatedMaintenanceVisitIds: ["mnt-002a"],
    relatedWorkOrderIds: ["wo-1098"],
  },
];

const MOCK_SOLAR_SYSTEMS: SolarSystem[] = [
  {
    id: "sys-001",
    name: "Sunset Ridge 9.6 kW PV",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    siteId: "site-001",
    siteName: "Delgado Residence",
    installationDate: "2022-04-10",
    systemSizeKw: 9.6,
    systemType: "grid_tied",
    panelCount: 24,
    inverter: "Enphase IQ8 microinverters",
    battery: "None",
    installerTeam: "Blue Crew",
    status: "active",
    relatedEquipmentIds: ["eq-001", "eq-002", "eq-003", "eq-004"],
    relatedWarrantyIds: ["war-001a", "war-001b"],
    relatedDocumentIds: ["doc-001", "doc-002", "doc-003", "doc-004"],
    serviceHistory: ["Annual inspection completed Nov 14, 2025", "Firmware update completed Apr 22, 2024"],
  },
  {
    id: "sys-002",
    name: "Harbor View 6.4 kW PV",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    siteId: "site-002",
    siteName: "Harbor View Vacation Home",
    installationDate: "2023-09-22",
    systemSizeKw: 6.4,
    systemType: "hybrid",
    panelCount: 16,
    inverter: "SolarEdge Energy Hub",
    battery: "Tesla Powerwall 2",
    installerTeam: "Coastal Crew",
    status: "under_maintenance",
    relatedEquipmentIds: ["eq-005", "eq-006", "eq-007"],
    relatedWarrantyIds: ["war-001c", "war-001d"],
    relatedDocumentIds: ["doc-005"],
    serviceHistory: ["Microinverter replacement visit Aug 5, 2025", "Battery handover completed Sep 25, 2023"],
  },
  {
    id: "sys-003",
    name: "Innovation Way 48 kW Rooftop",
    customerId: "cust-002",
    customerName: "Priya Nair",
    siteId: "site-003",
    siteName: "Innovation Way HQ",
    installationDate: "2023-02-15",
    systemSizeKw: 48,
    systemType: "grid_tied",
    panelCount: 120,
    inverter: "SMA Sunny Tripower Core1",
    battery: "None",
    installerTeam: "Commercial Team A",
    status: "active",
    relatedEquipmentIds: ["eq-008", "eq-009", "eq-010"],
    relatedWarrantyIds: ["war-002a", "war-002b"],
    relatedDocumentIds: ["doc-006"],
    serviceHistory: ["Commissioning report uploaded Feb 16, 2023", "Preventive maintenance Dec 2, 2025"],
  },
];

const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: "eq-001",
    systemId: "sys-001",
    systemName: "Sunset Ridge 9.6 kW PV",
    siteId: "site-001",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    equipmentType: "solar_panel",
    brand: "SunPower",
    modelNumber: "SPR-M400",
    serialNumber: "SP-400-BATCH-8842",
    quantity: 24,
    installedDate: "2022-04-10",
    warrantyStartDate: "2022-04-10",
    warrantyEndDate: "2047-04-10",
    supplier: "SunPower Distribution",
    status: "active",
    photos: [{ id: "photo-eq-001", label: "Panel serial group label", capturedAt: "2022-04-10", category: "equipment" }],
    manualDocumentId: "doc-004",
    warrantyDocumentId: "doc-003",
  },
  {
    id: "eq-002",
    systemId: "sys-001",
    systemName: "Sunset Ridge 9.6 kW PV",
    siteId: "site-001",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    equipmentType: "inverter",
    brand: "Enphase",
    modelNumber: "IQ8PLUS-72-2-US",
    serialNumber: "ENP-IQ8-449201",
    quantity: 24,
    installedDate: "2022-04-10",
    warrantyStartDate: "2022-04-10",
    warrantyEndDate: "2032-04-10",
    supplier: "Enphase Partner Network",
    status: "active",
    photos: [],
    manualDocumentId: "doc-004",
    warrantyDocumentId: "doc-003",
  },
  {
    id: "eq-003",
    systemId: "sys-001",
    systemName: "Sunset Ridge 9.6 kW PV",
    siteId: "site-001",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    equipmentType: "monitoring_device",
    brand: "Enphase",
    modelNumber: "IQ Gateway",
    serialNumber: "ENV-229384",
    quantity: 1,
    installedDate: "2022-04-10",
    warrantyStartDate: "2022-04-10",
    warrantyEndDate: "2027-04-10",
    supplier: "Enphase Partner Network",
    status: "needs_service",
    photos: [],
  },
  {
    id: "eq-004",
    systemId: "sys-001",
    systemName: "Sunset Ridge 9.6 kW PV",
    siteId: "site-001",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    equipmentType: "mounting_system",
    brand: "IronRidge",
    modelNumber: "XR100",
    serialNumber: "IR-ROOF-1044",
    quantity: 1,
    installedDate: "2022-04-10",
    warrantyStartDate: "2022-04-10",
    warrantyEndDate: "2042-04-10",
    supplier: "IronRidge",
    status: "active",
    photos: [],
  },
  {
    id: "eq-005",
    systemId: "sys-002",
    systemName: "Harbor View 6.4 kW PV",
    siteId: "site-002",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    equipmentType: "solar_panel",
    brand: "LG Solar",
    modelNumber: "LG400N2W-A5",
    serialNumber: "LG-400-7712",
    quantity: 16,
    installedDate: "2023-09-22",
    warrantyStartDate: "2023-09-22",
    warrantyEndDate: "2026-09-22",
    supplier: "LG Solar Closeout",
    status: "under_warranty_review",
    photos: [{ id: "photo-eq-002", label: "Affected tile roof panel string", capturedAt: "2025-08-05", category: "service" }],
    warrantyDocumentId: "doc-005",
  },
  {
    id: "eq-006",
    systemId: "sys-002",
    systemName: "Harbor View 6.4 kW PV",
    siteId: "site-002",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    equipmentType: "battery",
    brand: "Tesla",
    modelNumber: "Powerwall 2",
    serialNumber: "TPW2-938201",
    quantity: 1,
    installedDate: "2023-09-22",
    warrantyStartDate: "2023-09-22",
    warrantyEndDate: "2033-09-22",
    supplier: "Tesla Energy",
    status: "active",
    photos: [],
  },
  {
    id: "eq-007",
    systemId: "sys-002",
    systemName: "Harbor View 6.4 kW PV",
    siteId: "site-002",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    equipmentType: "inverter",
    brand: "SolarEdge",
    modelNumber: "SE7600H",
    serialNumber: "SE-7600-5521",
    quantity: 1,
    installedDate: "2023-09-22",
    warrantyStartDate: "2023-09-22",
    warrantyEndDate: "2036-09-22",
    supplier: "SolarEdge",
    status: "active",
    photos: [],
  },
  {
    id: "eq-008",
    systemId: "sys-003",
    systemName: "Innovation Way 48 kW Rooftop",
    siteId: "site-003",
    customerId: "cust-002",
    customerName: "Priya Nair",
    equipmentType: "solar_panel",
    brand: "First Solar",
    modelNumber: "Series 6 Plus",
    serialNumber: "FS6-COM-11802",
    quantity: 120,
    installedDate: "2023-02-15",
    warrantyStartDate: "2023-02-15",
    warrantyEndDate: "2048-02-15",
    supplier: "First Solar Commercial",
    status: "active",
    photos: [],
  },
  {
    id: "eq-009",
    systemId: "sys-003",
    systemName: "Innovation Way 48 kW Rooftop",
    siteId: "site-003",
    customerId: "cust-002",
    customerName: "Priya Nair",
    equipmentType: "inverter",
    brand: "SMA",
    modelNumber: "STP 50-US-41",
    serialNumber: "SMA-CORE1-4038",
    quantity: 1,
    installedDate: "2023-02-15",
    warrantyStartDate: "2023-02-15",
    warrantyEndDate: "2033-02-15",
    supplier: "SMA America",
    status: "active",
    photos: [],
  },
  {
    id: "eq-010",
    systemId: "sys-003",
    systemName: "Innovation Way 48 kW Rooftop",
    siteId: "site-003",
    customerId: "cust-002",
    customerName: "Priya Nair",
    equipmentType: "combiner_box",
    brand: "Shoals",
    modelNumber: "1500V Combiner",
    serialNumber: "SH-CB-8831",
    quantity: 2,
    installedDate: "2023-02-15",
    warrantyStartDate: "2023-02-15",
    warrantyEndDate: "2028-02-15",
    supplier: "Shoals Technologies",
    status: "active",
    photos: [],
  },
];

const MOCK_INSTALLATIONS: InstallationProject[] = [
  {
    id: "install-001",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    siteId: "site-001",
    siteName: "Delgado Residence",
    installationDate: "2022-04-10",
    projectStatus: "handover_completed",
    assignedInstallationTeam: "Blue Crew",
    installedEquipmentIds: ["eq-001", "eq-002", "eq-003", "eq-004"],
    preInstallationPhotos: preInstallPhotos,
    postInstallationPhotos: postInstallPhotos,
    handoverChecklist: [
      { label: "System commissioned", completed: true },
      { label: "Monitoring app connected", completed: true },
      { label: "Customer operations walkthrough", completed: true },
      { label: "Warranty packet uploaded", completed: true },
    ],
    customerSignOff: { signed: true, signedBy: "Marcus Delgado", signedAt: "2022-04-10" },
    documentIds: ["doc-001", "doc-002", "doc-003"],
    notes: "Customer requested annual maintenance reminders and prefers SMS for technician arrival updates.",
  },
  {
    id: "install-002",
    customerId: "cust-001",
    customerName: "Marcus Delgado",
    siteId: "site-002",
    siteName: "Harbor View Vacation Home",
    installationDate: "2023-09-22",
    projectStatus: "commissioned",
    assignedInstallationTeam: "Coastal Crew",
    installedEquipmentIds: ["eq-005", "eq-006", "eq-007"],
    preInstallationPhotos: [{ id: "photo-pre-003", label: "Tile roof before array install", capturedAt: "2023-09-20", category: "pre_install" }],
    postInstallationPhotos: [{ id: "photo-post-003", label: "Battery wall after commissioning", capturedAt: "2023-09-25", category: "post_install" }],
    handoverChecklist: [
      { label: "System commissioned", completed: true },
      { label: "Battery backup test", completed: true },
      { label: "Customer operations walkthrough", completed: false },
      { label: "Final handover packet", completed: false },
    ],
    customerSignOff: { signed: false },
    documentIds: ["doc-005"],
    notes: "Remote homeowner sign-off is pending because the property manager attended the commissioning visit.",
  },
  {
    id: "install-003",
    customerId: "cust-002",
    customerName: "Priya Nair",
    siteId: "site-003",
    siteName: "Innovation Way HQ",
    installationDate: "2023-02-15",
    projectStatus: "handover_completed",
    assignedInstallationTeam: "Commercial Team A",
    installedEquipmentIds: ["eq-008", "eq-009", "eq-010"],
    preInstallationPhotos: [{ id: "photo-pre-004", label: "Commercial roof staging area", capturedAt: "2023-02-10", category: "pre_install" }],
    postInstallationPhotos: [{ id: "photo-post-004", label: "Completed commercial rooftop array", capturedAt: "2023-02-15", category: "post_install" }],
    handoverChecklist: [
      { label: "System commissioned", completed: true },
      { label: "Facilities training completed", completed: true },
      { label: "Utility PTO packet uploaded", completed: true },
      { label: "Monitoring dashboard shared", completed: true },
    ],
    customerSignOff: { signed: true, signedBy: "Priya Nair", signedAt: "2023-02-16" },
    documentIds: ["doc-006"],
    notes: "Facilities team needs quarterly production summaries attached to the account record.",
  },
];

export const assetsService = {
  async getAssetFoundation(): Promise<AssetFoundationData> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      sites: MOCK_SITES,
      solarSystems: MOCK_SOLAR_SYSTEMS,
      equipment: MOCK_EQUIPMENT,
      installations: MOCK_INSTALLATIONS,
      documents: MOCK_DOCUMENTS,
    };
  },

  async getSites(): Promise<Site[]> {
    const data = await this.getAssetFoundation();
    return data.sites;
  },

  async getSolarSystems(): Promise<SolarSystem[]> {
    const data = await this.getAssetFoundation();
    return data.solarSystems;
  },

  async getEquipment(): Promise<Equipment[]> {
    const data = await this.getAssetFoundation();
    return data.equipment;
  },

  async getInstallations(): Promise<InstallationProject[]> {
    const data = await this.getAssetFoundation();
    return data.installations;
  },
};
