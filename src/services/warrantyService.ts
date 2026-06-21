// warrantyService.ts
// Mock data layer for Warranty Management module.
// Replace mock functions with real Supabase queries when schema is ready.

export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired';
export type WarrantyType =
  | 'manufacturer'
  | 'labor'
  | 'installation'
  | 'performance'
  | 'battery'
  | 'inverter'
  | 'panel';
export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'replacement_scheduled'
  | 'completed';
export type ClaimPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WarrantyDocument {
  id: string;
  name: string;
  type: 'warranty_document' | 'proof_of_purchase' | 'installation_certificate' | 'claim_photo' | 'supplier_invoice';
  uploaded_at: string;
  url: string;
}

export interface WarrantyContact {
  name: string;
  company: string;
  email: string;
  phone: string;
}

export interface Warranty {
  id: string;
  customer_id: string;
  customer_name: string;
  installation_id: string;
  installation_name: string;
  site_id: string;
  site_name: string;
  site_address: string;
  solar_system_id: string;
  solar_system_name: string;
  equipment_id: string;
  equipment_name: string;
  product: string;
  manufacturer: string;
  supplier: string;
  serial_number: string;
  model_number: string;
  warranty_type: WarrantyType;
  coverage_details: string;
  coverage_notes: string;
  exclusions: string[];
  warranty_start: string;
  warranty_end: string;
  status: WarrantyStatus;
  days_remaining: number;
  claim_count: number;
  manufacturer_contact: WarrantyContact;
  supplier_contact: WarrantyContact;
  proof_of_purchase: WarrantyDocument;
  installation_certificate: WarrantyDocument;
  documents: WarrantyDocument[];
  notes?: string;
  created_at: string;
}

export interface WarrantyClaim {
  id: string;
  claim_number: string;
  warranty_id: string;
  customer_id: string;
  customer_name: string;
  product: string;
  manufacturer: string;
  issue_description: string;
  resolution_notes?: string;
  status: ClaimStatus;
  priority: ClaimPriority;
  linked_work_order_id?: string;
  next_action?: string;
  submitted_date: string;
  last_updated: string;
  resolved_date?: string;
  assigned_to?: string;
  estimated_cost?: number;
  actual_cost?: number;
}

export interface WarrantyStats {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
  expiring_30_days: number;
  expiring_90_days: number;
  total_claims: number;
  pending_claims: number;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function getDaysRemaining(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function computeStatus(endDate: string): WarrantyStatus {
  const days = getDaysRemaining(endDate);
  if (days < 0) return 'expired';
  if (days <= 90) return 'expiring_soon';
  return 'active';
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const today = new Date();
const futureDate = (months: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};
const pastDate = (months: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
};

const SUPPLIER_BY_MANUFACTURER: Record<string, string> = {
  SunPower: 'Greentech Renewables',
  'Enphase Energy': 'CED Greentech',
  'LG Electronics': 'BayWa r.e.',
  'SolarEdge Technologies': 'Sonepar Solar',
  'First Solar': 'Krannich Solar',
  'SMA Solar Technology': 'Rexel Energy Solutions',
  'SolarOps Installation Team': 'SolarOps',
  'Canadian Solar': 'Beacon Solar Supply',
  'Tesla Energy': 'Tesla Energy Direct',
  'Trina Solar': 'Soligent',
  Panasonic: 'Panasonic Direct',
  'Jinko Solar': 'Signature Solar Supply',
};

const WARRANTY_TYPE_LABELS: Record<WarrantyType, string> = {
  manufacturer: 'Manufacturer Warranty',
  labor: 'Labor Warranty',
  installation: 'Installation Warranty',
  performance: 'Performance Warranty',
  battery: 'Battery Warranty',
  inverter: 'Inverter Warranty',
  panel: 'Panel Warranty',
};

function getSupplier(manufacturer: string): string {
  return SUPPLIER_BY_MANUFACTURER[manufacturer] ?? 'SolarOps Preferred Supplier';
}

function getEquipmentId(product: string, installationId: string): string {
  const slug = product.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 18);
  return `eq-${installationId}-${slug}`;
}

function getWarrantyDocuments(warrantyId: string, product: string, startDate: string): WarrantyDocument[] {
  return [
    {
      id: `${warrantyId}-doc-warranty`,
      name: `${product} warranty certificate.pdf`,
      type: 'warranty_document',
      uploaded_at: startDate,
      url: `/files/warranties/${warrantyId}/certificate.pdf`,
    },
    {
      id: `${warrantyId}-doc-proof`,
      name: `${product} proof of purchase.pdf`,
      type: 'proof_of_purchase',
      uploaded_at: startDate,
      url: `/files/warranties/${warrantyId}/proof-of-purchase.pdf`,
    },
    {
      id: `${warrantyId}-doc-install`,
      name: `${product} installation certificate.pdf`,
      type: 'installation_certificate',
      uploaded_at: startDate,
      url: `/files/warranties/${warrantyId}/installation-certificate.pdf`,
    },
  ];
}

function hydrateWarranty(raw: Omit<Warranty, 'status' | 'days_remaining' | 'supplier' | 'installation_name' | 'site_id' | 'site_name' | 'solar_system_id' | 'solar_system_name' | 'equipment_id' | 'equipment_name' | 'coverage_notes' | 'exclusions' | 'manufacturer_contact' | 'supplier_contact' | 'proof_of_purchase' | 'installation_certificate' | 'documents'>): Warranty {
  const supplier = getSupplier(raw.manufacturer);
  const documents = getWarrantyDocuments(raw.id, raw.product, raw.created_at);
  const siteSuffix = raw.installation_id.split('-').pop()?.toUpperCase() ?? raw.installation_id.toUpperCase();

  return {
    ...raw,
    status: computeStatus(raw.warranty_end),
    days_remaining: getDaysRemaining(raw.warranty_end),
    supplier,
    installation_name: `Installation ${siteSuffix}`,
    site_id: raw.installation_id.replace('inst', 'site'),
    site_name: `${raw.customer_name} ${siteSuffix} Site`,
    solar_system_id: raw.installation_id.replace('inst', 'sys'),
    solar_system_name: `${raw.customer_name} Solar System ${siteSuffix}`,
    equipment_id: getEquipmentId(raw.product, raw.installation_id),
    equipment_name: raw.product,
    coverage_notes: `${WARRANTY_TYPE_LABELS[raw.warranty_type]} coverage is linked to ${raw.customer_name}, ${raw.site_address}, ${raw.installation_id}, and the registered equipment serial ${raw.serial_number}.`,
    exclusions:
      raw.warranty_type === 'labor' || raw.warranty_type === 'installation'
        ? ['Storm damage', 'Customer modifications', 'Unapproved roof work', 'Normal wear outside workmanship scope']
        : ['Cosmetic damage', 'Improper operation', 'Acts of nature unless manufacturer policy applies', 'Unapproved third-party repairs'],
    manufacturer_contact: {
      name: 'Warranty Support Desk',
      company: raw.manufacturer,
      email: `claims@${raw.manufacturer.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example`,
      phone: '(800) 555-0199',
    },
    supplier_contact: {
      name: 'Supplier Claims Team',
      company: supplier,
      email: `warranty@${supplier.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example`,
      phone: '(888) 555-0144',
    },
    proof_of_purchase: documents[1],
    installation_certificate: documents[2],
    documents,
  };
}

const RAW_WARRANTIES = [
  {
    id: 'war-001',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    installation_id: 'inst-001a',
    site_address: '4821 Sunset Ridge Dr, San Diego, CA 92103',
    product: 'SunPower X-Series Solar Panels',
    manufacturer: 'SunPower',
    serial_number: 'SP-X22-SN-4821001',
    model_number: 'SPR-X22-360',
    warranty_type: 'panel' as WarrantyType,
    coverage_details: 'Product & Performance — 25-year power output guarantee (92% year 1, 85% year 25)',
    warranty_start: pastDate(50),
    warranty_end: futureDate(250),
    claim_count: 0,
    notes: 'Full 25-year product and performance warranty.',
    created_at: pastDate(50),
  },
  {
    id: 'war-002',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    installation_id: 'inst-001a',
    site_address: '4821 Sunset Ridge Dr, San Diego, CA 92103',
    product: 'Enphase IQ8 Microinverters',
    manufacturer: 'Enphase Energy',
    serial_number: 'ENP-IQ8-SN-48210',
    model_number: 'IQ8-60-2-US',
    warranty_type: 'inverter' as WarrantyType,
    coverage_details: 'Product warranty — Covers manufacturing defects and premature failure',
    warranty_start: pastDate(50),
    warranty_end: futureDate(70),
    claim_count: 1,
    notes: 'One microinverter replaced under claim in 2025.',
    created_at: pastDate(50),
  },
  {
    id: 'war-003',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    installation_id: 'inst-001b',
    site_address: '200 Harbor View Ct, Coronado, CA 92118',
    product: 'LG NeON 2 Solar Panels',
    manufacturer: 'LG Electronics',
    serial_number: 'LG-N2-SN-200HV01',
    model_number: 'LG350N1K-V5',
    warranty_type: 'panel' as WarrantyType,
    coverage_details: 'Product warranty — 25-year performance, 12-year product',
    warranty_start: pastDate(32),
    warranty_end: futureDate(2),
    claim_count: 1,
    notes: 'Approaching end of product warranty period.',
    created_at: pastDate(32),
  },
  {
    id: 'war-004',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    installation_id: 'inst-001b',
    site_address: '200 Harbor View Ct, Coronado, CA 92118',
    product: 'SolarEdge HD-Wave Inverter',
    manufacturer: 'SolarEdge Technologies',
    serial_number: 'SE-HD-SN-200HV02',
    model_number: 'SE6000H-US000BNB4',
    warranty_type: 'inverter' as WarrantyType,
    coverage_details: 'Product warranty — Covers parts and labor for inverter failure',
    warranty_start: pastDate(32),
    warranty_end: futureDate(112),
    claim_count: 0,
    notes: undefined,
    created_at: pastDate(32),
  },
  {
    id: 'war-005',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    installation_id: 'inst-002a',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    product: 'First Solar Series 6 Modules',
    manufacturer: 'First Solar',
    serial_number: 'FS-S6-SN-1100IW001',
    model_number: 'FS-6430A',
    warranty_type: 'performance' as WarrantyType,
    coverage_details: 'Linear performance warranty — 30-year power output guarantee',
    warranty_start: pastDate(40),
    warranty_end: futureDate(320),
    claim_count: 0,
    notes: 'Commercial installation — best-in-class 30yr performance warranty.',
    created_at: pastDate(40),
  },
  {
    id: 'war-006',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    installation_id: 'inst-002a',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    product: 'SMA Sunny Tripower Inverters',
    manufacturer: 'SMA Solar Technology',
    serial_number: 'SMA-STP-SN-1100IW002',
    model_number: 'STP25000TL-US-10',
    warranty_type: 'inverter' as WarrantyType,
    coverage_details: 'Extended product warranty — 10-year coverage on all inverter components',
    warranty_start: pastDate(40),
    warranty_end: futureDate(80),
    claim_count: 0,
    notes: undefined,
    created_at: pastDate(40),
  },
  {
    id: 'war-007',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    installation_id: 'inst-002a',
    site_address: '1100 Innovation Way, San Jose, CA 95110',
    product: 'Installation Labor & Workmanship',
    manufacturer: 'SolarOps Installation Team',
    serial_number: 'LAB-2023-002A',
    model_number: 'N/A',
    warranty_type: 'labor' as WarrantyType,
    coverage_details: 'Labor warranty — Covers installation defects, roof penetration leaks, and wiring faults',
    warranty_start: pastDate(40),
    warranty_end: futureDate(-2),
    claim_count: 0,
    notes: 'Standard 10-year labor warranty.',
    created_at: pastDate(40),
  },
  {
    id: 'war-008',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    installation_id: 'inst-003a',
    site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
    product: 'Canadian Solar HiKu Panels',
    manufacturer: 'Canadian Solar',
    serial_number: 'CS-HK-SN-7832DP001',
    model_number: 'CS3W-400MS',
    warranty_type: 'panel' as WarrantyType,
    coverage_details: 'Product warranty — 12 years product, 25 years linear performance',
    warranty_start: pastDate(58),
    warranty_end: futureDate(82),
    claim_count: 0,
    notes: undefined,
    created_at: pastDate(58),
  },
  {
    id: 'war-009',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    installation_id: 'inst-003a',
    site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
    product: 'Enphase IQ7+ Microinverters',
    manufacturer: 'Enphase Energy',
    serial_number: 'ENP-IQ7-SN-7832DP',
    model_number: 'IQ7PLUS-72-2-US',
    warranty_type: 'inverter' as WarrantyType,
    coverage_details: 'Product warranty — 25-year limited warranty',
    warranty_start: pastDate(58),
    warranty_end: futureDate(242),
    claim_count: 0,
    notes: undefined,
    created_at: pastDate(58),
  },
  {
    id: 'war-010',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    installation_id: 'inst-003a',
    site_address: '7832 Desert Palm Ave, Scottsdale, AZ 85251',
    product: 'Roof & Penetration Labor',
    manufacturer: 'SolarOps Installation Team',
    serial_number: 'LAB-2021-003A',
    model_number: 'N/A',
    warranty_type: 'installation' as WarrantyType,
    coverage_details: 'Workmanship warranty — 5-year coverage on roofing penetrations and mounting hardware',
    warranty_start: pastDate(58),
    warranty_end: futureDate(-58),
    claim_count: 2,
    notes: 'Warranty expired. 2 resolved claims on record.',
    created_at: pastDate(58),
  },
  {
    id: 'war-011',
    customer_id: 'cust-004',
    customer_name: 'Amara Osei',
    installation_id: 'inst-004a',
    site_address: '2200 Commerce Blvd, Las Vegas, NV 89101',
    product: 'Tesla Powerwall+ Battery',
    manufacturer: 'Tesla Energy',
    serial_number: 'TSLA-PW-SN-2200CB001',
    model_number: 'Powerwall+',
    warranty_type: 'battery' as WarrantyType,
    coverage_details: 'Comprehensive warranty — 10 years unlimited cycle coverage, 70% capacity guarantee',
    warranty_start: pastDate(24),
    warranty_end: futureDate(96),
    claim_count: 0,
    notes: 'Battery storage warranty with unlimited energy throughput.',
    created_at: pastDate(24),
  },
  {
    id: 'war-012',
    customer_id: 'cust-004',
    customer_name: 'Amara Osei',
    installation_id: 'inst-004a',
    site_address: '2200 Commerce Blvd, Las Vegas, NV 89101',
    product: 'Trina Vertex S+ Solar Panels',
    manufacturer: 'Trina Solar',
    serial_number: 'TRI-VS-SN-2200CB001',
    model_number: 'TSM-DE09R.05W',
    warranty_type: 'performance' as WarrantyType,
    coverage_details: 'Linear performance warranty — 25 years, minimum 87.4% output at year 25',
    warranty_start: pastDate(24),
    warranty_end: futureDate(276),
    claim_count: 0,
    notes: undefined,
    created_at: pastDate(24),
  },
  {
    id: 'war-013',
    customer_id: 'cust-007',
    customer_name: 'Fatima Al-Hassan',
    installation_id: 'inst-007a',
    site_address: '88 Ocean Drive, Miami, FL 33139',
    product: 'Panasonic EverVolt Solar Panels',
    manufacturer: 'Panasonic',
    serial_number: 'PAN-EV-SN-88OD001',
    model_number: 'EVPVT330SA',
    warranty_type: 'panel' as WarrantyType,
    coverage_details: 'Product & performance warranty — 25 years at 92% guaranteed output',
    warranty_start: pastDate(30),
    warranty_end: futureDate(270),
    claim_count: 0,
    notes: undefined,
    created_at: pastDate(30),
  },
  {
    id: 'war-014',
    customer_id: 'cust-007',
    customer_name: 'Fatima Al-Hassan',
    installation_id: 'inst-007a',
    site_address: '88 Ocean Drive, Miami, FL 33139',
    product: 'Installation Labor & Workmanship',
    manufacturer: 'SolarOps Installation Team',
    serial_number: 'LAB-2023-007A',
    model_number: 'N/A',
    warranty_type: 'installation' as WarrantyType,
    coverage_details: 'Workmanship warranty — 10 years covering all installation defects',
    warranty_start: pastDate(30),
    warranty_end: futureDate(90),
    claim_count: 0,
    notes: undefined,
    created_at: pastDate(30),
  },
  {
    id: 'war-015',
    customer_id: 'cust-008',
    customer_name: 'Roberto Morales',
    installation_id: 'inst-008a',
    site_address: '14200 Valley Ranch Rd, Fresno, CA 93706',
    product: 'Jinko Solar Tiger Neo Panels',
    manufacturer: 'Jinko Solar',
    serial_number: 'JKO-TN-SN-14200VR001',
    model_number: 'JKM420N-54HL4-V',
    warranty_type: 'performance' as WarrantyType,
    coverage_details: 'Linear performance warranty — 30 years, 87.4% at year 30',
    warranty_start: pastDate(84),
    warranty_end: futureDate(276),
    claim_count: 0,
    notes: undefined,
    created_at: pastDate(84),
  },
];

// Hydrate computed fields and linked warranty context
const MOCK_WARRANTIES: Warranty[] = RAW_WARRANTIES.map((w) => hydrateWarranty(w));

const MOCK_CLAIMS: WarrantyClaim[] = [
  {
    id: 'clm-001',
    claim_number: 'CLM-2025-0001',
    warranty_id: 'war-002',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    product: 'Enphase IQ8 Microinverters',
    manufacturer: 'Enphase Energy',
    issue_description: 'Three microinverters on the south-facing array dropped to near-zero output. Monitoring dashboard shows units offline.',
    resolution_notes: 'Field technician confirmed 3 faulty units. Manufacturer shipped replacements. All units replaced and production restored to 98%.',
    status: 'completed',
    priority: 'high',
    linked_work_order_id: 'wo-1007',
    next_action: 'Closed after manufacturer replacement and production verification.',
    submitted_date: pastDate(5),
    last_updated: pastDate(2),
    resolved_date: pastDate(2),
    assigned_to: 'Sarah Johnson',
    estimated_cost: 0,
    actual_cost: 0,
  },
  {
    id: 'clm-002',
    claim_number: 'CLM-2025-0002',
    warranty_id: 'war-003',
    customer_id: 'cust-001',
    customer_name: 'Marcus Delgado',
    product: 'LG NeON 2 Solar Panels',
    manufacturer: 'LG Electronics',
    issue_description: 'Panel output degradation exceeding manufacturer specification. Output at 78% after 3 years, below the 85% guaranteed minimum.',
    resolution_notes: undefined,
    status: 'under_review',
    priority: 'medium',
    linked_work_order_id: 'wo-1042',
    next_action: 'Awaiting manufacturer degradation review before replacement scheduling.',
    submitted_date: pastDate(10),
    last_updated: pastDate(1),
    resolved_date: undefined,
    assigned_to: 'Carlos Rivera',
    estimated_cost: 0,
    actual_cost: undefined,
  },
  {
    id: 'clm-003',
    claim_number: 'CLM-2025-0003',
    warranty_id: 'war-010',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    product: 'Roof & Penetration Labor',
    manufacturer: 'SolarOps Installation Team',
    issue_description: 'Minor water intrusion detected around a roof mounting bracket during the monsoon season. Small stain visible on ceiling.',
    resolution_notes: 'Roof penetration resealed with approved sealant. Interior ceiling dried and repaired. Warranty coverage applied.',
    status: 'completed',
    priority: 'high',
    linked_work_order_id: 'wo-0944',
    next_action: 'Closed after roof penetration reseal.',
    submitted_date: pastDate(18),
    last_updated: pastDate(12),
    resolved_date: pastDate(12),
    assigned_to: 'Mike Torres',
    estimated_cost: 350,
    actual_cost: 280,
  },
  {
    id: 'clm-004',
    claim_number: 'CLM-2024-0041',
    warranty_id: 'war-010',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    product: 'Roof & Penetration Labor',
    manufacturer: 'SolarOps Installation Team',
    issue_description: 'Mounting rail creaking sounds during high winds. Possible loose fastener.',
    resolution_notes: 'All fasteners inspected and torqued to spec. Anti-corrosion compound reapplied. No structural issues found.',
    status: 'completed',
    priority: 'low',
    linked_work_order_id: 'wo-0821',
    next_action: 'Closed after inspection found no structural issue.',
    submitted_date: pastDate(36),
    last_updated: pastDate(34),
    resolved_date: pastDate(34),
    assigned_to: 'Mike Torres',
    estimated_cost: 150,
    actual_cost: 90,
  },
  {
    id: 'clm-005',
    claim_number: 'CLM-2026-0005',
    warranty_id: 'war-006',
    customer_id: 'cust-002',
    customer_name: 'Priya Nair',
    product: 'SMA Sunny Tripower Inverters',
    manufacturer: 'SMA Solar Technology',
    issue_description: 'Grid fault error codes appearing intermittently. System going into safe mode during peak afternoon hours.',
    resolution_notes: undefined,
    status: 'submitted',
    priority: 'critical',
    linked_work_order_id: undefined,
    next_action: 'Create a field work order to inspect intermittent inverter faults.',
    submitted_date: pastDate(1),
    last_updated: pastDate(0),
    resolved_date: undefined,
    assigned_to: undefined,
    estimated_cost: 0,
    actual_cost: undefined,
  },
  {
    id: 'clm-006',
    claim_number: 'CLM-2026-0006',
    warranty_id: 'war-008',
    customer_id: 'cust-003',
    customer_name: 'James Thornton',
    product: 'Canadian Solar HiKu Panels',
    manufacturer: 'Canadian Solar',
    issue_description: 'Two panels show visible micro-cracking visible under EL imaging during annual inspection.',
    resolution_notes: undefined,
    status: 'approved',
    priority: 'medium',
    linked_work_order_id: undefined,
    next_action: 'Schedule replacement visit and create a linked work order.',
    submitted_date: pastDate(7),
    last_updated: pastDate(3),
    resolved_date: undefined,
    assigned_to: 'Sarah Johnson',
    estimated_cost: 0,
    actual_cost: undefined,
  },
];

// ── Service Functions ──────────────────────────────────────────────────────────

export const warrantyService = {
  async getAllWarranties(): Promise<Warranty[]> {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_WARRANTIES;
  },

  async getWarranty(id: string): Promise<Warranty | null> {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_WARRANTIES.find((w) => w.id === id) ?? null;
  },

  async getActiveWarranties(): Promise<Warranty[]> {
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_WARRANTIES.filter((w) => w.status === 'active');
  },

  async getExpiringSoonWarranties(): Promise<Warranty[]> {
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_WARRANTIES.filter((w) => w.status === 'expiring_soon').sort(
      (a, b) => a.days_remaining - b.days_remaining
    );
  },

  async getAllClaims(): Promise<WarrantyClaim[]> {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_CLAIMS;
  },

  async getClaim(id: string): Promise<WarrantyClaim | null> {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_CLAIMS.find((c) => c.id === id) ?? null;
  },

  async getClaimsForWarranty(warrantyId: string): Promise<WarrantyClaim[]> {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_CLAIMS.filter((c) => c.warranty_id === warrantyId);
  },

  async getStats(): Promise<WarrantyStats> {
    await new Promise((r) => setTimeout(r, 300));
    const warranties = MOCK_WARRANTIES;
    const claims = MOCK_CLAIMS;
    return {
      total: warranties.length,
      active: warranties.filter((w) => w.status === 'active').length,
      expiring_soon: warranties.filter((w) => w.status === 'expiring_soon').length,
      expired: warranties.filter((w) => w.status === 'expired').length,
      expiring_30_days: warranties.filter((w) => w.days_remaining >= 0 && w.days_remaining <= 30).length,
      expiring_90_days: warranties.filter((w) => w.days_remaining >= 0 && w.days_remaining <= 90).length,
      total_claims: claims.length,
      pending_claims: claims.filter((c) => c.status !== 'completed' && c.status !== 'rejected').length,
    };
  },

  async createClaim(data: Omit<WarrantyClaim, 'id' | 'claim_number' | 'submitted_date' | 'last_updated'>): Promise<WarrantyClaim> {
    await new Promise((r) => setTimeout(r, 500));
    const newClaim: WarrantyClaim = {
      ...data,
      id: `clm-${Date.now()}`,
      claim_number: `CLM-${new Date().getFullYear()}-${String(MOCK_CLAIMS.length + 1).padStart(4, '0')}`,
      submitted_date: new Date().toISOString().split('T')[0],
      last_updated: new Date().toISOString().split('T')[0],
    };
    MOCK_CLAIMS.push(newClaim);
    return newClaim;
  },
};
