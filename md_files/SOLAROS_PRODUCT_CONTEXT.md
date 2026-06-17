# SolarOS Product Context

## Product Definition

SolarOS helps solar companies manage everything that happens after a solar system is installed: customer records, sites, solar equipment, warranties, maintenance schedules, support tickets, technician work orders, documents, and service history.

Customers get a self-service portal, while technicians get a mobile-friendly job portal.

## Positioning

SolarOS is not a marketplace-first product and not a generic CRM. It starts as a **solar after-sales, warranty, maintenance, and field service management platform** for solar installers and solar service companies.

Future phases can expand into:
- Sales CRM
- Quotation/proposal builder
- Supplier network
- Procurement
- Solar equipment marketplace
- Inverter/API monitoring
- AI diagnostics
- Advanced analytics

Do not build those future modules during the MVP.

## Main Flow to Visualize

```text
Customer
  ↓
Site / Property
  ↓
Solar Installation
  ↓
Solar System / Equipment
  ↓
Warranties + Documents + Maintenance Plan
  ↓
Support Ticket or Scheduled Maintenance
  ↓
Work Order
  ↓
Technician Visit
  ↓
Service Report + Photos + Customer Update
  ↓
Service History
```

## Core Concept Definitions

### Customer Record

Created by the solar company. This can exist even before the customer creates a login account.

Contains:
- Customer name
- Email
- Phone
- Address
- Site/property
- Solar system
- Warranties
- Documents
- Maintenance history
- Support tickets
- Work orders
- Service history

### Customer Portal Account

Created only when the customer accepts an invite.

The solar company should be able to invite the customer after the solar record has value, usually after installation handover or when documents/warranties are uploaded.

### Support Ticket

A customer issue, question, request, or communication thread.

Examples:
- Inverter error
- Low production
- Cleaning request
- Warranty question
- Document request

Support is communication-heavy.

### Maintenance

A planned or recurring service schedule.

Examples:
- Panel cleaning every 6 months
- Annual inverter inspection
- Quarterly commercial inspection

Maintenance is schedule-heavy.

### Work Order

The actual field job assigned to a technician.

Examples:
- Clean panels
- Inspect inverter
- Replace inverter
- Repair wiring
- Perform scheduled maintenance

Work order is technician-heavy.

## Important Product Rules

1. Support Ticket = customer issue, question, request, or communication.
2. Maintenance = planned or recurring service schedule.
3. Work Order = actual field job assigned to a technician.
4. A support ticket can create or link to a work order.
5. A maintenance visit can create or link to a work order.
6. A warranty claim can create or link to a work order.
7. Work orders are not warranty-only. They are all field service jobs.
8. Documents should be linkable to customer, site, solar system, equipment, warranty, ticket, work order, maintenance visit, and installation project.
9. Technician portal should show everything as “Jobs” from the technician’s point of view.
10. Customer portal should be simple and easy for non-technical homeowners or business customers.
11. Customer records can exist before customer portal accounts.
12. Customer portal access should only happen after invite acceptance.
13. Do not silently link customer data just because an email matches. Require invite acceptance.
14. Every business-owned table must include organization_id for multi-tenancy.
15. Organization A must never access Organization B data.

## Recommended Sidebar Structure

```text
Dashboard

Customers

Sites & Systems
  - Sites
  - Solar Systems
  - Equipment
  - Installations

Warranty Management
  - Active Warranties
  - Expiring Soon
  - Claims

Maintenance
  - Calendar
  - Maintenance Plans
  - Maintenance Visits

Support
  - Tickets
  - Customer Requests

Work Orders
  - Active Jobs
  - Scheduled Jobs
  - Completed Jobs

Technicians
  - Team
  - Assignments
  - Availability

Documents

Reports

Customer Portal

Technician Portal

Settings
```

## Customer Invite Flow

```text
Solar company adds customer record
        ↓
Solar company adds site/property
        ↓
Solar company adds installation + equipment + warranties
        ↓
Solar company clicks “Invite Customer”
        ↓
Customer receives email/SMS invite
        ↓
Customer clicks magic link
        ↓
If no account: create account
If existing account: connect this solar record after acceptance
        ↓
Customer can view their portal
```

## Best Time to Invite Customer

Best moment:
- After installation handover

Also good:
- When warranty documents are uploaded
- When maintenance is scheduled
- When a support ticket/work order is created

## Portal Access Statuses

```text
not_invited
invite_sent
active
expired
revoked
```

## New Installation Flow

```text
Lead / Customer
  ↓
Site
  ↓
Installation Project
  ↓
Add equipment during installation
  ↓
Commission system
  ↓
Invite customer
```

## Existing Installation Flow

```text
Customer
  ↓
Site
  ↓
Solar System
  ↓
Warranties/Documents/Maintenance
  ↓
Invite customer
```

## MVP Priority

1. Sites & Systems / Installations
2. Support Tickets + Work Orders connection
3. Technician module
4. Documents module
5. Reports module
6. Settings module
7. Customer Portal
8. Technician Portal

## Long-Term Positioning

Start as:

> Solar after-sales, warranty, maintenance, and field service management.

Later evolve into:

> The operating system for solar companies.
