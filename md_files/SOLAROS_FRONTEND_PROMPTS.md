# SolarOS Frontend Prompt Pack

Use this file when asking Sonnet/Claude/Cursor/Windsurf to review or implement frontend-only tasks.

For every run, paste:

```text
BASE CONTEXT
+
ONE TASK PROMPT
```

Do not paste everything at once.

## Recommended Frontend Run Order

```text
1. Base Context + Task 6
2. Base Context + Task 9
3. Base Context + Task 10
4. Base Context + Task 8
5. Base Context + Task 7
6. Base Context + Task 5
7. Base Context + Task 11
8. Base Context + Task 12
9. Base Context + Task 15
10. Base Context + Task 16
11. Base Context + Task 4
12. Base Context + Task 13
13. Base Context + Task 14
14. Base Context + Task 3
15. Base Context + Task 17
16. Base Context + Task 18
17. Base Context + Task 19
```

Start with Task 6, 9, and 10 because they clarify:
- What is being managed?
- What field work needs to be done?
- Where do customer issues come from?

---

# BASE CONTEXT - Frontend

You are reviewing and improving the frontend only.

This is a Next.js / React / TypeScript SaaS app called SolarOS.

SolarOS is a solar after-sales, warranty, maintenance, and field service management platform for solar companies.

Do not implement backend, database, API, authentication backend, SQL, migrations, or real server logic yet.

Use mock data, local TypeScript types, reusable components, and frontend-only state where needed.

The product definition is:

SolarOS helps solar companies manage everything that happens after a solar system is installed: customer records, sites, solar equipment, warranties, maintenance schedules, support tickets, technician work orders, documents, and service history. Customers get a self-service portal, while technicians get a mobile-friendly job portal.

The main product flow is:

Customer
→ Site / Property
→ Solar Installation
→ Solar System / Equipment
→ Warranties + Documents + Maintenance Plan
→ Support Ticket or Scheduled Maintenance
→ Work Order
→ Technician Visit
→ Service Report + Photos + Customer Update
→ Service History

Important product rules:

1. Support Ticket = customer issue, question, request, or communication.
2. Maintenance = planned or recurring service schedule.
3. Work Order = actual field job assigned to a technician.
4. A support ticket can create or link to a work order.
5. A maintenance visit can create or link to a work order.
6. A warranty claim can create or link to a work order.
7. Work orders are not warranty-only. They are all field service jobs.
8. Documents should be linkable to customer, site, system, equipment, warranty, ticket, and work order.
9. Technician portal should show everything as “Jobs” from the technician’s point of view.
10. Customer portal should be simple and easy for non-technical homeowners or business customers.

Use the existing project structure, components, routing, styling, and naming patterns as much as possible. Do not rewrite the whole app. Improve only what is necessary.

After implementing each task, provide:
- Files changed
- Components added or modified
- Mock data/types added or modified
- UI behavior added
- Remaining frontend TODOs

---

# TASK 1 - Review Overall Product Flow

Review the current frontend and make sure the app clearly supports this SolarOS flow:

Customer
→ Site / Property
→ Solar Installation
→ Solar System / Equipment
→ Warranties + Documents + Maintenance Plan
→ Support Ticket or Scheduled Maintenance
→ Work Order
→ Technician Visit
→ Service Report + Photos + Customer Update
→ Service History

Frontend-only implementation requirements:

- Review current pages and navigation.
- Make sure page titles, descriptions, cards, tabs, empty states, and CTA buttons reflect this flow.
- Add clear labels explaining how records are connected.
- Add frontend mock data where needed to show the relationship between customers, sites, systems, warranties, maintenance, tickets, and work orders.
- Do not implement backend logic.
- Do not create database tables.
- Do not add API calls.

Goal:
The app should be easier to understand as a solar after-sales platform, not a generic CRM.

---

# TASK 2 - Clarify Support Tickets vs Maintenance vs Work Orders

Review the frontend and improve the wording, UI, and page structure so these concepts are clear:

Support Ticket:
A customer issue, request, question, or communication thread.

Maintenance:
A planned or recurring service schedule.

Work Order:
The actual field job assigned to a technician.

Frontend-only changes:

- Update page descriptions, empty states, buttons, and labels.
- Make Support page communication-focused.
- Make Maintenance page schedule-focused.
- Make Work Orders page field-job-focused.
- Add mock links showing that a ticket can create a work order.
- Add mock links showing that a maintenance visit can create a work order.
- Add mock links showing that a warranty claim can create a work order.
- Remove or change any wording that makes work orders look warranty-only.

Goal:
Users should immediately understand the difference between support, maintenance, and work orders.

---

# TASK 3 - Improve Sidebar and Navigation

Review and improve the sidebar/navigation for SolarOS.

Recommended navigation:

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

Frontend-only requirements:

- Use the current navigation structure if nested navigation is already supported.
- If nested navigation is not supported, create the closest clean version.
- Make labels clear and solar-specific.
- Add icons if the existing design system supports icons.
- Do not break existing routes.
- Keep route names clean and consistent.
- Add placeholder/empty pages only where needed.

Goal:
The sidebar should explain the product clearly even before the user clicks anything.

---

# TASK 4 - Improve Dashboard

Review and improve the Dashboard page.

The dashboard should give solar company owners and operations managers a clear overview.

Add or improve these sections:

Operations:
- Open work orders
- Scheduled work orders today
- Overdue maintenance
- Technician assignments

Customer Support:
- Open tickets
- Tickets waiting for customer
- Urgent tickets
- Average response time, if available from mock data

Warranty Risk:
- Warranties expiring in 30/60/90 days
- Active warranty claims
- Equipment under warranty
- Equipment out of warranty

System Records:
- Total customers
- Total sites
- Total solar systems
- Recently installed systems

Also include:
- Upcoming maintenance calendar
- Open support tickets list
- Active technician assignments
- Recently installed systems
- Warranty expiration alerts
- Recent customer activity

Frontend-only requirements:

- Use mock data.
- Add date filters if easy using frontend state: Today, This Week, This Month.
- Use existing cards, tables, badges, and layout components.
- Keep the dashboard clean and not too crowded.
- Do not implement real analytics backend.

Goal:
The dashboard should show what needs attention today.

---

# TASK 5 - Improve Customers Module

Review and improve the Customers page and Customer Profile page.

Customer list should show:
- Name
- Email
- Phone
- Location/site count
- Installed system count
- Open tickets
- Upcoming maintenance
- Warranty status
- Portal status

Customer profile should have these tabs:
- Overview
- Sites
- Solar Systems
- Warranties
- Maintenance
- Support Tickets
- Work Orders
- Documents
- Notes
- Activity Timeline

Customer overview should show:
- Customer name
- Contact person
- Email
- Phone
- Billing address
- Sites/properties
- Total installed capacity
- Open tickets
- Upcoming maintenance
- Active warranties
- Recent activity

Activity timeline examples:
- Support ticket created
- Maintenance completed
- Warranty uploaded
- Work order completed
- Solar system installed

Frontend-only requirements:

- Use mock data and frontend types.
- Improve layout and tabs.
- Add meaningful empty states.
- Show connected records clearly.
- Do not build backend CRUD yet unless local mock forms already exist.

Goal:
Customer profile should become the central record for everything related to that customer.

---

# TASK 6 - Implement or Improve Sites, Solar Systems, Equipment, and Installations

The Installations area is currently blank or unclear. Improve it by separating these frontend concepts:

A. Site
A physical property or location.

Site fields:
- Site name
- Customer
- Address
- Building type
- Property type
- Roof type
- Roof condition
- Access notes
- Safety notes
- Contact person on site
- Photos
- Related solar systems
- Related documents
- Related maintenance visits
- Related work orders

B. Solar System
The installed solar setup at a site.

Solar system fields:
- System name
- Customer
- Site
- Installation date
- System size/kW
- System type: grid-tied, hybrid, off-grid
- Panel count
- Inverter
- Battery
- Installer/team
- Status: active, inactive, under maintenance
- Related equipment
- Related warranties
- Related documents
- Service history

C. Equipment
The installed asset list.

Equipment types:
- Solar panel
- Inverter
- Battery
- Mounting system
- Combiner box
- Breaker
- Optimizer
- Monitoring device

Equipment fields:
- Equipment type
- Brand
- Model number
- Serial number
- Quantity
- Installed date
- Warranty start date
- Warranty end date
- Supplier
- Status
- Photos
- Manual/document
- Warranty document

D. Installation
The installation project or handover record.

Installation fields:
- Customer
- Site
- Installation date
- Project status
- Assigned installation team
- Installed equipment
- Pre-installation photos
- Post-installation photos
- Handover checklist
- Customer sign-off
- Documents
- Notes

Installation statuses:
- Planned
- Scheduled
- In Progress
- Installed
- Commissioned
- Handover Completed
- Cancelled

Frontend-only requirements:

- Create list/detail UI for Sites, Solar Systems, Equipment, and Installations if possible.
- Use mock data.
- Add tabs or sub-navigation if the app supports it.
- Add clear empty states if a page has no data.
- Do not implement database or API.

Goal:
This area should become the asset foundation of SolarOS.

---

# TASK 7 - Improve Warranty Management

Review and improve the Warranty Management module.

Warranty should link to:
- Customer
- Site
- Solar system
- Equipment
- Manufacturer
- Supplier
- Installation

Warranty types:
- Manufacturer Warranty
- Labor Warranty
- Installation Warranty
- Performance Warranty
- Battery Warranty
- Inverter Warranty
- Panel Warranty

Warranty features:
- Active warranties
- Expiring soon
- Claims
- Warranty detail page
- Expiring warranty alerts
- Warranty document display
- Coverage notes
- Exclusions
- Contact details for supplier/manufacturer
- Proof of purchase
- Installation certificate

Warranty claim statuses:
- Draft
- Submitted
- Under Review
- Approved
- Rejected
- Replacement Scheduled
- Completed

Frontend-only requirements:

- Use mock warranty and warranty claim data.
- Add badges for active, expiring soon, expired, claim open, and claim completed.
- Add detail drawer/page if the pattern exists.
- Add “Create Work Order” button or mock action for warranty claims.
- Do not create backend claim workflow.

Goal:
Warranty Management should clearly solve the warranty tracking pain point.

---

# TASK 8 - Improve Maintenance Module

Review and improve the Maintenance module.

Separate:

A. Maintenance Plan
The recurring rule.

Fields:
- Customer
- Site
- Solar system
- Service type
- Frequency
- Start date
- Next due date
- Assigned team
- Checklist template
- Status

Examples:
- Panel cleaning every 6 months
- Annual inverter inspection
- Quarterly commercial system inspection

B. Maintenance Visit
The actual scheduled visit.

Fields:
- Scheduled date
- Time
- Technician
- Status
- Checklist
- Photos
- Notes
- Completion report

Maintenance statuses:
- Scheduled
- Due Soon
- Overdue
- In Progress
- Completed
- Cancelled

Frontend-only requirements:

- Keep existing calendar and list view if already implemented.
- Add or improve Maintenance Plans view.
- Add or improve Maintenance Visits view.
- Show when a maintenance visit is linked to a work order.
- Add mock “Create Work Order” action.
- Do not create backend scheduling logic.

Goal:
Maintenance should show recurring plans and actual scheduled visits separately.

---

# TASK 9 - Improve Work Orders Module

Review and improve Work Orders.

Work Orders are the main field service job module.

A Work Order can come from:
- Support ticket
- Maintenance schedule
- Warranty claim
- Manual job
- Customer request
- Internal inspection

Work order types:
- Cleaning
- Inspection
- Repair
- Replacement
- Warranty Service
- Maintenance
- Installation Follow-up
- Emergency Visit

Work order fields:
- Work order number
- Customer
- Site
- Solar system
- Related ticket
- Related warranty claim
- Related maintenance visit
- Job type
- Priority
- Assigned technician
- Scheduled date/time
- Checklist
- Parts needed
- Photos before
- Photos after
- Technician notes
- Customer signature
- Completion report

Statuses:
- New
- Scheduled
- Assigned
- In Progress
- Completed
- Cancelled
- Requires Follow-up

Frontend-only requirements:

- Use mock data.
- Add filters for active, scheduled, completed, urgent, and unassigned.
- Make it clear where each work order came from.
- Add detail view/drawer if current UI supports it.
- Do not make work orders warranty-only.

Goal:
Work Orders should become the operational bridge between office staff and technicians.

---

# TASK 10 - Improve Support Module

Review and improve the Support module.

Support should work like a simplified ServiceNow-style ticketing module.

Support ticket fields:
- Ticket number
- Customer
- Site
- Solar system
- Issue type
- Priority
- Description
- Conversation
- Internal notes
- Attachments
- Assigned support person
- Status
- Related work order
- Related warranty
- Related maintenance visit

Issue types:
- Low Production
- Inverter Error
- Battery Issue
- Panel Damage
- Cleaning Request
- Warranty Request
- Billing Question
- Document Request
- Maintenance Request
- Other

Statuses:
- Open
- In Progress
- Waiting Customer
- Waiting Technician
- Resolved
- Closed

Frontend-only requirements:

- Improve ticket list and ticket detail UI.
- Add conversation section.
- Add internal notes section.
- Add attachment display.
- Add mock “Create Work Order” or “Link Work Order” action.
- Show customer/site/system context in the ticket detail.
- Do not implement backend messaging.

Goal:
Support should be the central customer communication and issue tracking area.

---

# TASK 11 - Implement Technicians Module

The Technicians page is currently blank. Implement or improve it.

Technician list should show:
- Name
- Email
- Phone
- Role
- Status
- Skills
- Certifications
- Assigned jobs
- Completed jobs
- Availability

Technician profile tabs:
- Overview
- Schedule
- Assigned Work Orders
- Completed Jobs
- Skills
- Certifications
- Documents
- Performance

Team view examples:
- Cleaning Team
- Installation Team
- Repair Team
- Electrical Team
- Inspection Team

Assignment view should show:
- Today’s assigned jobs
- Upcoming jobs
- Overdue jobs
- Unassigned work orders

Frontend-only requirements:

- Use mock technician data.
- Add team cards or list.
- Add availability badges.
- Add assignment table.
- Link technicians to mock work orders.
- Do not implement real dispatch backend.

Goal:
Technicians module should solve assignment visibility and team management.

---

# TASK 12 - Implement Documents Module

The Documents page is currently blank. Implement or improve it.

Documents should be a central file library connected to:
- Customers
- Sites
- Solar systems
- Equipment
- Warranties
- Support tickets
- Work orders

Document types:
- Warranty Document
- Installation Certificate
- Invoice
- Quotation
- Manual
- Product Datasheet
- Service Report
- Maintenance Report
- Inspection Report
- Before/After Photos
- Customer Sign-off
- Permit
- Contract
- Supplier Document

Document fields:
- Document name
- Type
- Linked customer
- Linked site
- Linked solar system
- Linked equipment
- Linked warranty
- Uploaded by
- Upload date
- Expiry date, if applicable
- Visibility: internal only or customer visible

Frontend-only requirements:

- Use mock document data.
- Add filters by document type and visibility.
- Add badges for Internal Only and Customer Visible.
- Add linked record display.
- Add useful empty states.
- Do not implement real file upload backend.

Goal:
Documents should become a central library, not just a blank page.

---

# TASK 13 - Implement Reports Module

The Reports page is currently blank. Implement simple operational reports only.

Do not build advanced analytics.

Suggested report sections:

Warranty Reports:
- Warranties expiring soon
- Expired warranties
- Active warranty claims
- Equipment with most claims

Maintenance Reports:
- Upcoming maintenance
- Overdue maintenance
- Completed maintenance
- Maintenance completion rate

Work Order Reports:
- Open work orders
- Completed work orders
- Average completion time
- Jobs by technician
- Jobs by type

Support Reports:
- Open tickets
- Tickets by priority
- Average response time
- Average resolution time
- Tickets by issue type

Customer Reports:
- Customers with overdue maintenance
- Customers with open issues
- Customers with expiring warranties

Technician Reports:
- Jobs completed
- Hours worked
- Overdue assignments
- Average job completion time

Frontend-only requirements:

- Use mock metrics.
- Use cards, tables, and simple charts only if chart components already exist.
- Add filters if easy: this week, this month, this quarter.
- Keep reports operational and actionable.
- Do not implement backend analytics.

Goal:
Reports should answer: what is overdue, expiring, unresolved, assigned, and completed?

---

# TASK 14 - Implement Settings Module

The Settings page is currently blank. Implement or improve it as frontend-only.

Settings should include these sections:

Company Settings:
- Company name
- Logo placeholder
- Address
- Contact details
- Timezone
- Currency
- Country

Users and Roles:
- Add user button
- Invite team member button
- Role list
- Role permissions preview

Roles:
- Owner
- Admin
- Manager
- Support Agent
- Technician
- Customer

Service Types:
- Cleaning
- Repair
- Inspection
- Maintenance
- Warranty Service
- Emergency Visit

Work Order Settings:
- Statuses
- Priorities
- Checklist templates
- Job categories

Maintenance Settings:
- Default maintenance intervals
- Reminder schedule
- Maintenance checklist templates

Warranty Settings:
- Warranty alert timing
- Warranty types
- Default reminders

Notification Settings:
- Email templates
- SMS templates
- Customer reminders
- Technician notifications
- Internal alerts

Customer Portal Settings:
- Portal branding
- What customers can see
- What customers can request

Billing Settings:
- Add placeholder only. Do not implement real billing.

Frontend-only requirements:
- Use mock settings data.
- Use tabs or grouped cards.
- Do not implement real save to backend.
- Frontend-only save behavior can update local state or show a mock success toast if the app already has toast support.

Goal:
Settings should make the app feel configurable for different solar companies.

---

# TASK 15 - Improve Technician Portal

Review and improve the Technician Portal.

Simplify the portal structure to:

- Today
- Jobs
- Completed
- Reports
- Profile

Today should show:
- Scheduled jobs today
- Priority jobs
- Customer address
- Start time
- Job type
- Status

Jobs should show:
- All assigned work orders
- Filters: New, Scheduled, In Progress, Completed

Job Detail should allow technician to view:
- Customer
- Address
- Solar system details
- Issue/job description
- Checklist
- Photos section
- Notes section
- Parts used section
- Completion report section

Job Detail should include mock actions:
- Start Job
- Upload Before Photos
- Upload After Photos
- Add Notes
- Mark Parts Used
- Submit Report
- Mark Complete

Completed should show:
- Completed jobs
- Hours worked
- Completion status

Reports should show:
- Submitted completion reports

Important:
From the technician’s point of view, maintenance tasks and work jobs should not be separate. Everything should appear as a Job. Behind the scenes, the job may come from maintenance, support, or warranty.

Frontend-only requirements:
- Use mock technician job data.
- Use mobile-first layout.
- Do not implement real upload backend.
- Mock upload UI only.
- Do not implement GPS or tracking yet.

Goal:
Technician Portal should feel like a simple mobile-friendly field service app.

---

# TASK 16 - Improve Customer Portal

Review and improve the Customer Portal.

Recommended customer portal structure:

- Overview
- My Solar Systems
- Warranties
- Maintenance
- Support
- Documents
- Service History
- Account

Overview should show:
- Installed systems
- Next maintenance date
- Open support tickets
- Active warranties
- Recent service activity

My Solar Systems should show each system with:
- Site address
- System size
- Installation date
- Panel details
- Inverter details
- Battery details
- Status

Warranties should show:
- Active warranties
- Expiring soon
- Expired warranties
- Warranty documents

Maintenance should allow customer to:
- View upcoming maintenance
- Request maintenance
- View completed maintenance reports

Support should allow customer to:
- Create support ticket mock form
- Add photos mock UI
- Track ticket status
- Reply to conversation mock UI

Documents should show:
- Warranty documents
- Manuals
- Installation certificate
- Service reports
- Maintenance reports

Service History should show:
- Timeline of support tickets, work orders, maintenance visits, warranty updates, and completed service reports

Frontend-only requirements:
- Use mock customer portal data.
- Keep language simple and non-technical.
- Do not show internal-only documents.
- Do not implement real login, API, or backend.
- Add empty states for no support tickets, no upcoming maintenance, or no documents.

Goal:
Customer Portal should help solar customers track their system, warranty, maintenance, documents, and support requests easily.

---

# TASK 17 - Apply Product Corrections Across the Frontend

Review the whole frontend and apply these product corrections:

Correction 1:
Work Orders should not be warranty-focused. Work Orders are all field service jobs assigned to technicians.

Correction 2:
Installations should become more asset-focused. Separate Site, Solar System, Equipment, and Installation Project/Handover in the UI.

Correction 3:
In the Technician Portal, maintenance tasks and work jobs should not be separate from the technician’s perspective. Everything should be displayed as a Job.

Correction 4:
Documents should be linked everywhere:
- Customer
- Site
- Solar system
- Equipment
- Warranty
- Support ticket
- Work order

Correction 5:
Reports should be operational first. Focus on:
- Overdue work
- Expiring warranties
- Unresolved tickets
- Technician assignments
- Customers needing attention

Frontend-only requirements:
- Update labels, descriptions, empty states, mock data, and UI relationships.
- Do not implement backend changes.
- Do not add marketplace, procurement, supplier network, monitoring, AI, or sales CRM.

Goal:
The whole app should feel like one coherent SolarOS MVP.

---

# TASK 18 - MVP Priority Cleanup

Review the frontend and improve the app based on this priority order:

Priority 1:
Complete Sites & Systems / Installations because everything depends on customer, site, installed system, equipment, and warranties.

Priority 2:
Make Support Tickets and Work Orders connect properly. A ticket should be able to create or link to a work order. A work order should be able to show its related ticket.

Priority 3:
Complete Technician module for technician assignment and job completion visibility.

Priority 4:
Complete Documents module with linked documents and customer/internal visibility.

Priority 5:
Complete Reports with basic operational reports.

Priority 6:
Complete Settings for users, roles, service types, work order settings, warranty settings, notification settings, and customer portal settings.

Frontend-only requirements:
- Do not implement everything deeply if the codebase is not ready.
- Focus on making the UI complete, understandable, and consistent.
- Add realistic mock data.
- Add empty states where needed.
- Add TODO comments only where helpful.

Goal:
Make the MVP feel complete enough for demo and user validation.

---

# TASK 19 - Final Frontend Review and Demo Readiness

Do a final frontend review of SolarOS for demo readiness.

Check that the app clearly communicates this product definition:

SolarOS helps solar companies manage everything that happens after a solar system is installed: customer records, sites, solar equipment, warranties, maintenance schedules, support tickets, technician work orders, documents, and service history. Customers get a self-service portal, while technicians get a mobile-friendly job portal.

Review these areas:
- Sidebar clarity
- Dashboard usefulness
- Customers module
- Sites & Systems module
- Warranty Management
- Maintenance
- Work Orders
- Support
- Technicians
- Documents
- Reports
- Settings
- Technician Portal
- Customer Portal
- Empty states
- Page descriptions
- Mock data consistency
- Badge/status consistency
- Mobile responsiveness where relevant

Do not build:
- Marketplace
- Supplier procurement
- Inverter API monitoring
- AI
- Advanced analytics
- Full sales CRM
- Quotation builder
- Backend database
- Backend APIs

Frontend-only requirements:
- Fix confusing labels.
- Improve page descriptions.
- Make mock data consistent across pages.
- Make linked records look connected.
- Add missing empty states.
- Improve demo quality.

After review, provide:
- What was improved
- What files changed
- Remaining frontend gaps
- Recommended next frontend task
- Backend/database requirements discovered but not implemented

Goal:
SolarOS should be ready for a frontend MVP demo.
