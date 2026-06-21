-- =========================================================
-- SolarOS MVP Database Schema
-- Supabase / PostgreSQL
-- =========================================================

create extension if not exists pgcrypto;

-- ENUMS

do $$ begin
  create type public.member_role as enum ('owner','admin','manager','support_agent','technician');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.portal_status as enum ('not_invited','invite_sent','active','expired','revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.site_property_type as enum ('residential','commercial','industrial','school','warehouse','farm','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.solar_system_type as enum ('grid_tied','hybrid','off_grid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.system_status as enum ('active','inactive','under_maintenance','decommissioned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.installation_status as enum ('planned','scheduled','in_progress','installed','commissioned','handover_completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.equipment_type as enum ('solar_panel','inverter','battery','mounting_system','combiner_box','breaker','optimizer','monitoring_device','ev_charger','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.warranty_type as enum ('manufacturer','labor','installation','performance','battery','inverter','panel','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.warranty_status as enum ('active','expiring_soon','expired','void','claim_open');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.warranty_claim_status as enum ('draft','submitted','under_review','approved','rejected','replacement_scheduled','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.maintenance_status as enum ('scheduled','due_soon','overdue','in_progress','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('open','in_progress','waiting_customer','waiting_technician','resolved','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_priority as enum ('low','medium','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_issue_type as enum ('low_production','inverter_error','battery_issue','panel_damage','cleaning_request','warranty_request','billing_question','document_request','maintenance_request','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.work_order_status as enum ('new','scheduled','assigned','in_progress','completed','cancelled','requires_follow_up');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.work_order_type as enum ('cleaning','inspection','repair','replacement','warranty_service','maintenance','installation_follow_up','emergency_visit','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_visibility as enum ('internal_only','customer_visible');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_type as enum ('warranty_document','installation_certificate','invoice','quotation','manual','product_datasheet','service_report','maintenance_report','inspection_report','before_after_photos','customer_sign_off','permit','contract','supplier_document','other');
exception when duplicate_object then null; end $$;

-- UPDATED_AT TRIGGER

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- CORE AUTH / ORGANIZATION TABLES

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  website text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text,
  timezone text default 'Asia/Manila',
  currency text default 'PHP',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'manager',
  is_active boolean not null default true,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  default_warranty_alert_days int[] not null default array[90, 60, 30],
  default_maintenance_reminder_days int[] not null default array[14, 7, 1],
  customer_portal_enabled boolean not null default true,
  technician_portal_enabled boolean not null default true,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_organization_settings_updated_at on public.organization_settings;
create trigger set_organization_settings_updated_at
before update on public.organization_settings
for each row execute function public.set_updated_at();

-- HELPER FUNCTIONS FOR RLS

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.is_active = true
  );
$$;

create or replace function public.has_customer_access(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.customer_portal_access cpa
    where cpa.customer_id = p_customer_id
      and cpa.user_id = auth.uid()
      and cpa.status = 'active'
  );
$$;

-- SETTINGS / SERVICE CONFIGURATION

create table if not exists public.service_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_service_types_updated_at on public.service_types;
create trigger set_service_types_updated_at
before update on public.service_types
for each row execute function public.set_updated_at();

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  template_type text not null default 'work_order',
  items jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_checklist_templates_updated_at on public.checklist_templates;
create trigger set_checklist_templates_updated_at
before update on public.checklist_templates
for each row execute function public.set_updated_at();

-- CUSTOMERS / CUSTOMER PORTAL

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_code text,
  name text not null,
  customer_type text not null default 'residential',
  primary_email text,
  primary_phone text,
  billing_address text,
  notes text,
  portal_status public.portal_status not null default 'not_invited',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, customer_code)
);

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text,
  is_primary boolean not null default false,
  portal_status public.portal_status not null default 'not_invited',
  portal_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_customer_contacts_updated_at on public.customer_contacts;
create trigger set_customer_contacts_updated_at
before update on public.customer_contacts
for each row execute function public.set_updated_at();

create table if not exists public.customer_portal_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  contact_id uuid references public.customer_contacts(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  status public.portal_status not null default 'invite_sent',
  invite_token_hash text,
  invited_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, customer_id, email)
);

drop trigger if exists set_customer_portal_access_updated_at on public.customer_portal_access;
create trigger set_customer_portal_access_updated_at
before update on public.customer_portal_access
for each row execute function public.set_updated_at();
-- where i end start at line 299--
-- SITES / INSTALLATIONS / SOLAR SYSTEMS / EQUIPMENT

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_name text not null,
  address text not null,
  city text,
  state text,
  postal_code text,
  country text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  property_type public.site_property_type not null default 'residential',
  building_type text,
  roof_type text,
  roof_condition text,
  access_notes text,
  safety_notes text,
  contact_person_name text,
  contact_person_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_sites_updated_at on public.sites;
create trigger set_sites_updated_at
before update on public.sites
for each row execute function public.set_updated_at();

create table if not exists public.installation_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  project_name text not null,
  status public.installation_status not null default 'planned',
  scheduled_date date,
  installation_date date,
  commissioned_date date,
  handover_completed_at timestamptz,
  assigned_team text,
  pre_installation_notes text,
  post_installation_notes text,
  handover_checklist jsonb not null default '[]',
  customer_signoff_name text,
  customer_signoff_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_installation_projects_updated_at on public.installation_projects;
create trigger set_installation_projects_updated_at
before update on public.installation_projects
for each row execute function public.set_updated_at();

create table if not exists public.solar_systems (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  installation_project_id uuid references public.installation_projects(id) on delete set null,
  system_name text not null,
  system_type public.solar_system_type not null default 'grid_tied',
  status public.system_status not null default 'active',
  system_size_kw numeric(10, 2),
  panel_count int,
  inverter_count int,
  battery_count int,
  installation_date date,
  monitoring_provider text,
  monitoring_reference text,
  installer_team text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_solar_systems_updated_at on public.solar_systems;
create trigger set_solar_systems_updated_at
before update on public.solar_systems
for each row execute function public.set_updated_at();

create table if not exists public.equipment_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  solar_system_id uuid references public.solar_systems(id) on delete cascade,
  installation_project_id uuid references public.installation_projects(id) on delete set null,
  equipment_type public.equipment_type not null,
  name text not null,
  brand text,
  model_number text,
  serial_number text,
  quantity int not null default 1,
  installed_date date,
  supplier_name text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_equipment_assets_updated_at on public.equipment_assets;
create trigger set_equipment_assets_updated_at
before update on public.equipment_assets
for each row execute function public.set_updated_at();

-- WARRANTIES

create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  solar_system_id uuid references public.solar_systems(id) on delete set null,
  equipment_id uuid references public.equipment_assets(id) on delete set null,
  installation_project_id uuid references public.installation_projects(id) on delete set null,
  warranty_type public.warranty_type not null,
  status public.warranty_status not null default 'active',
  product_name text not null,
  manufacturer text,
  supplier_name text,
  model_number text,
  serial_number text,
  coverage text,
  exclusions text,
  start_date date not null,
  end_date date not null,
  supplier_contact_name text,
  supplier_contact_email text,
  supplier_contact_phone text,
  proof_of_purchase_document_id uuid,
  installation_certificate_document_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_warranties_updated_at on public.warranties;
create trigger set_warranties_updated_at
before update on public.warranties
for each row execute function public.set_updated_at();

create table if not exists public.warranty_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  warranty_id uuid not null references public.warranties(id) on delete cascade,
  related_work_order_id uuid,
  claim_number text,
  status public.warranty_claim_status not null default 'draft',
  issue_description text not null,
  submitted_at timestamptz,
  decision_notes text,
  resolution_notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_warranty_claims_updated_at on public.warranty_claims;
create trigger set_warranty_claims_updated_at
before update on public.warranty_claims
for each row execute function public.set_updated_at();

-- MAINTENANCE

create table if not exists public.maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  solar_system_id uuid references public.solar_systems(id) on delete cascade,
  plan_name text not null,
  service_type_id uuid references public.service_types(id) on delete set null,
  frequency text not null,
  start_date date not null,
  next_due_date date,
  assigned_team text,
  checklist_template_id uuid references public.checklist_templates(id) on delete set null,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_maintenance_plans_updated_at on public.maintenance_plans;
create trigger set_maintenance_plans_updated_at
before update on public.maintenance_plans
for each row execute function public.set_updated_at();

create table if not exists public.maintenance_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  maintenance_plan_id uuid references public.maintenance_plans(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  solar_system_id uuid references public.solar_systems(id) on delete set null,
  related_work_order_id uuid,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  status public.maintenance_status not null default 'scheduled',
  assigned_technician_id uuid,
  checklist jsonb not null default '[]',
  completion_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_maintenance_visits_updated_at on public.maintenance_visits;
create trigger set_maintenance_visits_updated_at
before update on public.maintenance_visits
for each row execute function public.set_updated_at();

-- TECHNICIANS

create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  role text default 'Technician',
  status text not null default 'available',
  team_name text,
  skills text[] not null default '{}',
  certifications text[] not null default '{}',
  hourly_rate numeric(10, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_technicians_updated_at on public.technicians;
create trigger set_technicians_updated_at
before update on public.technicians
for each row execute function public.set_updated_at();

-- SUPPORT TICKETS

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ticket_number text not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  solar_system_id uuid references public.solar_systems(id) on delete set null,
  related_work_order_id uuid,
  related_warranty_id uuid references public.warranties(id) on delete set null,
  related_maintenance_visit_id uuid references public.maintenance_visits(id) on delete set null,
  issue_type public.ticket_issue_type not null default 'other',
  priority public.ticket_priority not null default 'medium',
  status public.ticket_status not null default 'open',
  subject text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  customer_visible boolean not null default true,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, ticket_number)
);

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_user_id uuid references public.profiles(id) on delete set null,
  sender_name text,
  sender_type text not null default 'staff',
  message text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

-- WORK ORDERS

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  work_order_number text not null,
  source_type text not null default 'manual',
  source_id uuid,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  solar_system_id uuid references public.solar_systems(id) on delete set null,
  related_ticket_id uuid references public.support_tickets(id) on delete set null,
  related_warranty_claim_id uuid references public.warranty_claims(id) on delete set null,
  related_maintenance_visit_id uuid references public.maintenance_visits(id) on delete set null,
  work_order_type public.work_order_type not null default 'other',
  priority public.ticket_priority not null default 'medium',
  status public.work_order_status not null default 'new',
  title text not null,
  description text,
  assigned_technician_id uuid references public.technicians(id) on delete set null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  checklist jsonb not null default '[]',
  parts_needed jsonb not null default '[]',
  parts_used jsonb not null default '[]',
  technician_notes text,
  customer_signature_name text,
  customer_signature_at timestamptz,
  completion_report text,
  requires_follow_up boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, work_order_number)
);

drop trigger if exists set_work_orders_updated_at on public.work_orders;
create trigger set_work_orders_updated_at
before update on public.work_orders
for each row execute function public.set_updated_at();

alter table public.support_tickets
drop constraint if exists support_tickets_related_work_order_id_fkey;

alter table public.support_tickets
add constraint support_tickets_related_work_order_id_fkey
foreign key (related_work_order_id)
references public.work_orders(id)
on delete set null;

alter table public.maintenance_visits
drop constraint if exists maintenance_visits_related_work_order_id_fkey;

alter table public.maintenance_visits
add constraint maintenance_visits_related_work_order_id_fkey
foreign key (related_work_order_id)
references public.work_orders(id)
on delete set null;

alter table public.warranty_claims
drop constraint if exists warranty_claims_related_work_order_id_fkey;

alter table public.warranty_claims
add constraint warranty_claims_related_work_order_id_fkey
foreign key (related_work_order_id)
references public.work_orders(id)
on delete set null;

create table if not exists public.work_order_time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  technician_id uuid references public.technicians(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes int,
  notes text,
  created_at timestamptz not null default now()
);

-- DOCUMENTS

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  document_name text not null,
  document_type public.document_type not null default 'other',
  visibility public.document_visibility not null default 'internal_only',
  storage_bucket text default 'solaros-documents',
  storage_path text,
  file_url text,
  file_name text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  expiry_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create table if not exists public.document_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  linked_entity_type text not null,
  linked_entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (document_id, linked_entity_type, linked_entity_id)
);

insert into storage.buckets (id, name, public)
values ('solaros-documents', 'solaros-documents', false)
on conflict (id) do nothing;

-- SERVICE HISTORY / ACTIVITY LOGS

create table if not exists public.service_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  solar_system_id uuid references public.solar_systems(id) on delete set null,
  related_work_order_id uuid references public.work_orders(id) on delete set null,
  related_ticket_id uuid references public.support_tickets(id) on delete set null,
  related_maintenance_visit_id uuid references public.maintenance_visits(id) on delete set null,
  event_type text not null,
  title text not null,
  description text,
  event_date timestamptz not null default now(),
  customer_visible boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  description text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- INDEXES

create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);
create index if not exists idx_customers_org on public.customers(organization_id);
create index if not exists idx_customers_email on public.customers(primary_email);
create index if not exists idx_contacts_customer on public.customer_contacts(customer_id);
create index if not exists idx_portal_access_user on public.customer_portal_access(user_id);
create index if not exists idx_portal_access_email on public.customer_portal_access(email);
create index if not exists idx_sites_customer on public.sites(customer_id);
create index if not exists idx_installations_customer on public.installation_projects(customer_id);
create index if not exists idx_solar_systems_customer on public.solar_systems(customer_id);
create index if not exists idx_equipment_system on public.equipment_assets(solar_system_id);
create index if not exists idx_warranties_customer on public.warranties(customer_id);
create index if not exists idx_warranties_end_date on public.warranties(end_date);
create index if not exists idx_warranty_claims_warranty on public.warranty_claims(warranty_id);
create index if not exists idx_maintenance_plans_customer on public.maintenance_plans(customer_id);
create index if not exists idx_maintenance_visits_scheduled on public.maintenance_visits(scheduled_start);
create index if not exists idx_maintenance_visits_customer on public.maintenance_visits(customer_id);
create index if not exists idx_tickets_customer on public.support_tickets(customer_id);
create index if not exists idx_tickets_status on public.support_tickets(status);
create index if not exists idx_ticket_messages_ticket on public.support_ticket_messages(ticket_id);
create index if not exists idx_work_orders_customer on public.work_orders(customer_id);
create index if not exists idx_work_orders_status on public.work_orders(status);
create index if not exists idx_work_orders_technician on public.work_orders(assigned_technician_id);
create index if not exists idx_work_orders_scheduled on public.work_orders(scheduled_start);
create index if not exists idx_documents_customer on public.documents(customer_id);
create index if not exists idx_document_links_entity on public.document_links(linked_entity_type, linked_entity_id);
create index if not exists idx_service_history_customer on public.service_history(customer_id);
create index if not exists idx_activity_logs_entity on public.activity_logs(entity_type, entity_id);

-- ROW LEVEL SECURITY

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_settings enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Members can view organizations" on public.organizations;
create policy "Members can view organizations"
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

drop policy if exists "Authenticated users can create organizations" on public.organizations;
create policy "Authenticated users can create organizations"
on public.organizations
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Members can update organizations" on public.organizations;
create policy "Members can update organizations"
on public.organizations
for update
to authenticated
using (public.is_org_member(id))
with check (public.is_org_member(id));

drop policy if exists "Members can view organization members" on public.organization_members;
create policy "Members can view organization members"
on public.organization_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_org_member(organization_id)
);

drop policy if exists "Owners and admins can manage organization members" on public.organization_members;
create policy "Owners and admins can manage organization members"
on public.organization_members
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
      and om.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
      and om.is_active = true
  )
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'organization_settings',
    'service_types',
    'checklist_templates',
    'customers',
    'customer_contacts',
    'customer_portal_access',
    'sites',
    'installation_projects',
    'solar_systems',
    'equipment_assets',
    'warranties',
    'warranty_claims',
    'maintenance_plans',
    'maintenance_visits',
    'technicians',
    'support_tickets',
    'support_ticket_messages',
    'work_orders',
    'work_order_time_entries',
    'documents',
    'document_links',
    'service_history',
    'activity_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Org members can manage records" on public.%I', t);
    execute format(
      'create policy "Org members can manage records" on public.%I
       for all
       to authenticated
       using (public.is_org_member(organization_id))
       with check (public.is_org_member(organization_id))',
      t
    );
  end loop;
end $$;

-- CUSTOMER PORTAL READ POLICIES

drop policy if exists "Portal users can view linked customers" on public.customers;
create policy "Portal users can view linked customers"
on public.customers
for select
to authenticated
using (public.has_customer_access(id));

drop policy if exists "Portal users can view linked customer contacts" on public.customer_contacts;
create policy "Portal users can view linked customer contacts"
on public.customer_contacts
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view linked sites" on public.sites;
create policy "Portal users can view linked sites"
on public.sites
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view linked installations" on public.installation_projects;
create policy "Portal users can view linked installations"
on public.installation_projects
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view linked solar systems" on public.solar_systems;
create policy "Portal users can view linked solar systems"
on public.solar_systems
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view linked equipment" on public.equipment_assets;
create policy "Portal users can view linked equipment"
on public.equipment_assets
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view linked warranties" on public.warranties;
create policy "Portal users can view linked warranties"
on public.warranties
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view linked maintenance plans" on public.maintenance_plans;
create policy "Portal users can view linked maintenance plans"
on public.maintenance_plans
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view linked maintenance visits" on public.maintenance_visits;
create policy "Portal users can view linked maintenance visits"
on public.maintenance_visits
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view linked support tickets" on public.support_tickets;
create policy "Portal users can view linked support tickets"
on public.support_tickets
for select
to authenticated
using (
  customer_visible = true
  and public.has_customer_access(customer_id)
);

drop policy if exists "Portal users can view linked ticket messages" on public.support_ticket_messages;
create policy "Portal users can view linked ticket messages"
on public.support_ticket_messages
for select
to authenticated
using (
  is_internal = false
  and exists (
    select 1
    from public.support_tickets st
    where st.id = support_ticket_messages.ticket_id
      and st.customer_visible = true
      and public.has_customer_access(st.customer_id)
  )
);

drop policy if exists "Portal users can view linked work orders" on public.work_orders;
create policy "Portal users can view linked work orders"
on public.work_orders
for select
to authenticated
using (public.has_customer_access(customer_id));

drop policy if exists "Portal users can view customer visible documents" on public.documents;
create policy "Portal users can view customer visible documents"
on public.documents
for select
to authenticated
using (
  visibility = 'customer_visible'
  and customer_id is not null
  and public.has_customer_access(customer_id)
);

drop policy if exists "Portal users can view customer visible service history" on public.service_history;
create policy "Portal users can view customer visible service history"
on public.service_history
for select
to authenticated
using (
  customer_visible = true
  and public.has_customer_access(customer_id)
);

-- DEFAULT SERVICE TYPES SEED HELPER
-- Replace 'ORG_ID_HERE' with an actual organization id before running.

-- insert into public.service_types (organization_id, name, category, description)
-- values
-- ('ORG_ID_HERE', 'Cleaning', 'field_service', 'Solar panel cleaning service'),
-- ('ORG_ID_HERE', 'Repair', 'field_service', 'Solar system repair work'),
-- ('ORG_ID_HERE', 'Inspection', 'field_service', 'System inspection and diagnostics'),
-- ('ORG_ID_HERE', 'Maintenance', 'field_service', 'Scheduled preventive maintenance'),
-- ('ORG_ID_HERE', 'Warranty Service', 'field_service', 'Warranty-related service visit'),
-- ('ORG_ID_HERE', 'Emergency Visit', 'field_service', 'Urgent technician visit');
