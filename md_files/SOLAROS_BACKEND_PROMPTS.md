# SolarOS Backend Prompt Pack

Use this file after the frontend MVP has enough structure and after the Supabase schema is created.

For every Sonnet run, paste:

```text
BASE CONTEXT
+
ONE STEP PROMPT
```

Do not paste everything at once.

## Recommended Backend Run Sequence

```text
1. Base Context + Step 1
2. Base Context + Step 2
3. Base Context + Step 3
4. Base Context + Step 7
5. Base Context + Step 6
6. Base Context + Step 5
7. Base Context + Step 4
8. Base Context + Step 8
9. Base Context + Step 9
10. Base Context + Step 10
11. Base Context + Step 11
12. Base Context + Step 12
13. Base Context + Step 13
```

Work Orders are intentionally earlier because they connect support, maintenance, warranties, and technician flow.

---

# BASE CONTEXT - SolarOS Backend Implementation

You are a senior full-stack engineer experienced with Next.js, TypeScript, Supabase, PostgreSQL, Row Level Security, multi-tenant SaaS architecture, and clean backend implementation.

I am building SolarOS.

SolarOS is a solar after-sales, warranty, maintenance, and field service management platform for solar companies.

The frontend already exists. The Supabase/Postgres database schema has already been created.

Your task is to connect the existing frontend to the backend using:

- Next.js
- TypeScript
- Supabase
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Row Level Security
- Next.js Server Actions
- Next.js Route Handlers only where needed

Do not rewrite the whole app. Use the existing project structure, routing, components, forms, styling, and naming patterns as much as possible.

This is backend integration only. Do not redesign the UI unless a small frontend adjustment is needed to connect the backend.

The main SolarOS product flow is:

Customer
→ Site / Property
→ Installation Project
→ Solar System
→ Equipment Assets
→ Warranties + Documents + Maintenance Plan
→ Support Ticket or Scheduled Maintenance
→ Work Order
→ Technician Visit
→ Service Report + Photos + Customer Update
→ Service History

Important product rules:

1. Support Ticket = customer issue, question, request, or communication thread.
2. Maintenance = planned or recurring service schedule.
3. Work Order = actual field job assigned to a technician.
4. A support ticket can create or link to a work order.
5. A maintenance visit can create or link to a work order.
6. A warranty claim can create or link to a work order.
7. Work orders are not warranty-only. They are all field service jobs.
8. Documents can be linked to customers, sites, solar systems, equipment, warranties, support tickets, work orders, maintenance visits, and installation projects.
9. Customer records can exist before the customer creates a portal account.
10. Customer portal access should only happen after invite acceptance.
11. Customer portal users must not see internal-only documents or internal ticket notes.
12. Every business-owned table must respect organization_id for multi-tenancy.
13. Users from Organization A must never access Organization B data.

Use server actions for mutations where possible.

Use route handlers only when needed for:
- File uploads
- Invite acceptance
- Webhook-style flows
- API-style routes needed later

Do not implement these yet:
- Marketplace
- Supplier procurement
- Inverter API monitoring
- AI
- Advanced analytics
- Payment/billing
- Mobile API

After completing the task, provide:
- Files changed
- Server actions added
- Data functions added
- Pages/forms connected
- Security/RLS assumptions
- Remaining TODOs
- Recommended next backend step

---

# STEP 1 - Supabase Client Setup + Organization Context

Implement the backend foundation.

Tasks:

1. Review the current Supabase setup.
2. Create or fix these files if needed:
   - lib/supabase/client.ts
   - lib/supabase/server.ts
   - lib/supabase/admin.ts only if absolutely necessary
3. Make sure the browser client only uses:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Make sure the service role key is never exposed to the browser.
5. Add server helpers:
   - getCurrentUserProfile()
   - getUserOrganizations()
   - getCurrentOrganization()
   - requireOrganizationMember(organizationId)
6. Implement a simple active organization strategy using the existing app pattern.
   - If the app has organization switching, use it.
   - If not, use the first active organization for the current user.
7. Make all organization-owned backend functions require organization_id.
8. Add clear error handling for:
   - Not authenticated
   - No organization found
   - Not a member of organization

Goal:
Prepare a clean Supabase + organization context foundation before connecting modules.

Do not connect all pages yet. Focus only on Supabase clients, auth helpers, organization helpers, and server-safe structure.

---

# STEP 2 - Customers + Customer Contacts Backend

Connect the Customers module to Supabase.

Tables involved:
- customers
- customer_contacts
- customer_portal_access only for portal status display for now
- sites
- solar_systems
- warranties
- maintenance_visits
- support_tickets
- work_orders
- documents
- service_history

Tasks:

1. Create data functions for customers:
   - getCustomers(organizationId)
   - getCustomerById(customerId)
   - createCustomer(input)
   - updateCustomer(customerId, input)
   - getCustomerContacts(customerId)
   - createCustomerContact(input)
   - updateCustomerContact(contactId, input)
2. Create server actions:
   - createCustomerAction
   - updateCustomerAction
   - createCustomerContactAction
   - updateCustomerContactAction
3. Connect the customer list page to real Supabase data.
4. Connect the customer detail/profile page to real Supabase data.
5. Show related customer data:
   - Sites
   - Solar systems
   - Warranties
   - Maintenance
   - Support tickets
   - Work orders
   - Documents
   - Service history
6. Keep customer portal account separate from customer record.
7. Display portal status:
   - not_invited
   - invite_sent
   - active
   - expired
   - revoked
8. Add user-friendly empty states where related records do not exist yet.

Goal:
Customer profile should become the central record where the solar company can see everything about the customer.

Do not implement the full invite flow yet. That will be done in a later step.

---

# STEP 3 - Sites, Installation Projects, Solar Systems, and Equipment Backend

Connect the asset foundation to Supabase.

Tables involved:
- sites
- installation_projects
- solar_systems
- equipment_assets
- customers
- warranties
- documents
- maintenance_visits
- work_orders

Tasks:

1. Create data functions for Sites:
   - getSites(organizationId)
   - getSiteById(siteId)
   - getSitesByCustomer(customerId)
   - createSite(input)
   - updateSite(siteId, input)

2. Create data functions for Installation Projects:
   - getInstallationProjects(organizationId)
   - getInstallationProjectById(projectId)
   - getInstallationProjectsByCustomer(customerId)
   - createInstallationProject(input)
   - updateInstallationProject(projectId, input)
   - updateInstallationStatus(projectId, status)

3. Create data functions for Solar Systems:
   - getSolarSystems(organizationId)
   - getSolarSystemById(systemId)
   - getSolarSystemsByCustomer(customerId)
   - getSolarSystemsBySite(siteId)
   - createSolarSystem(input)
   - updateSolarSystem(systemId, input)

4. Create data functions for Equipment:
   - getEquipmentAssets(organizationId)
   - getEquipmentAssetById(equipmentId)
   - getEquipmentBySolarSystem(systemId)
   - createEquipmentAsset(input)
   - updateEquipmentAsset(equipmentId, input)

5. Create server actions for create/update operations.
6. Connect existing frontend pages for:
   - Sites
   - Installation Projects
   - Solar Systems
   - Equipment
7. Make relationships clear:
   - Customer → Site
   - Site → Installation Project
   - Site → Solar System
   - Solar System → Equipment
8. Add detail pages or drawers using existing UI patterns.
9. Add empty states and create buttons where needed.

Goal:
Complete the asset foundation of SolarOS.

This step is very important because warranties, maintenance, support, and work orders depend on customer, site, solar system, and equipment records.

---

# STEP 4 - Warranties + Warranty Claims Backend

Connect Warranty Management to Supabase.

Tables involved:
- warranties
- warranty_claims
- customers
- sites
- solar_systems
- equipment_assets
- installation_projects
- documents
- work_orders

Tasks:

1. Create data functions:
   - getWarranties(organizationId)
   - getWarrantyById(warrantyId)
   - getWarrantiesByCustomer(customerId)
   - getWarrantiesByEquipment(equipmentId)
   - getActiveWarranties(organizationId)
   - getExpiringWarranties(organizationId, days)
   - createWarranty(input)
   - updateWarranty(warrantyId, input)

2. Create warranty claim data functions:
   - getWarrantyClaims(organizationId)
   - getWarrantyClaimById(claimId)
   - getWarrantyClaimsByWarranty(warrantyId)
   - createWarrantyClaim(input)
   - updateWarrantyClaimStatus(claimId, status)
   - linkWarrantyClaimToWorkOrder(claimId, workOrderId)

3. Create server actions for:
   - Create warranty
   - Update warranty
   - Create warranty claim
   - Update claim status
   - Link warranty claim to work order

4. Connect Warranty Management pages:
   - Active Warranties
   - Expiring Soon
   - Claims
   - Warranty detail

5. Make warranty links visible:
   - Customer
   - Site
   - Solar system
   - Equipment
   - Installation project
   - Documents
   - Related work order, if applicable

6. Add expiring warranty logic based on end_date.

Goal:
Warranty Management should solve the major pain point of warranty tracking.

---

# STEP 5 - Maintenance Plans + Maintenance Visits Backend

Connect Maintenance to Supabase.

Tables involved:
- maintenance_plans
- maintenance_visits
- customers
- sites
- solar_systems
- technicians
- checklist_templates
- service_types
- work_orders

Tasks:

1. Create data functions for Maintenance Plans:
   - getMaintenancePlans(organizationId)
   - getMaintenancePlanById(planId)
   - getMaintenancePlansByCustomer(customerId)
   - getMaintenancePlansBySolarSystem(systemId)
   - createMaintenancePlan(input)
   - updateMaintenancePlan(planId, input)

2. Create data functions for Maintenance Visits:
   - getMaintenanceVisits(organizationId)
   - getMaintenanceVisitById(visitId)
   - getMaintenanceVisitsByDateRange(organizationId, startDate, endDate)
   - getMaintenanceVisitsByCustomer(customerId)
   - createMaintenanceVisit(input)
   - updateMaintenanceVisit(visitId, input)
   - updateMaintenanceVisitStatus(visitId, status)
   - linkMaintenanceVisitToWorkOrder(visitId, workOrderId)

3. Create server actions for create/update/status/link operations.
4. Connect Maintenance pages:
   - Calendar
   - Maintenance Plans
   - Maintenance Visits
5. Keep this distinction clear:
   - Maintenance Plan = recurring rule
   - Maintenance Visit = actual scheduled visit
6. Add “Create Work Order” or “Link Work Order” backend action from a maintenance visit.
7. Show overdue and upcoming maintenance based on scheduled_start or next_due_date.

Goal:
Maintenance should handle both recurring maintenance setup and actual scheduled visits.

---

# STEP 6 - Support Tickets Backend

Connect Support to Supabase.

Tables involved:
- support_tickets
- support_ticket_messages
- customers
- sites
- solar_systems
- warranties
- maintenance_visits
- work_orders
- documents

Tasks:

1. Create data functions:
   - getSupportTickets(organizationId)
   - getSupportTicketById(ticketId)
   - getSupportTicketsByCustomer(customerId)
   - createSupportTicket(input)
   - updateSupportTicket(ticketId, input)
   - updateSupportTicketStatus(ticketId, status)
   - assignSupportTicket(ticketId, userId)
   - linkSupportTicketToWorkOrder(ticketId, workOrderId)

2. Create message data functions:
   - getSupportTicketMessages(ticketId)
   - createSupportTicketMessage(input)
   - getCustomerVisibleTicketMessages(ticketId)

3. Create server actions for:
   - Create ticket
   - Update ticket
   - Change status
   - Assign ticket
   - Add message
   - Add internal note
   - Link ticket to work order

4. Connect Support pages:
   - Ticket list
   - Ticket detail
   - Conversation
   - Internal notes
   - Attachments metadata if already supported
   - Status update
   - Assignment
   - Related customer/site/system

5. Make sure internal notes/messages are not customer-visible.

6. Add “Create Work Order” or “Link Work Order” action from ticket detail.

Goal:
Support should become the central customer communication and issue tracking module.

Support Ticket = customer issue/request/conversation.
Work Order = actual field job.

---

# STEP 7 - Work Orders Backend

Connect Work Orders to Supabase.

Tables involved:
- work_orders
- work_order_time_entries
- technicians
- customers
- sites
- solar_systems
- support_tickets
- warranty_claims
- maintenance_visits
- service_history
- activity_logs
- documents

Tasks:

1. Create data functions:
   - getWorkOrders(organizationId)
   - getWorkOrderById(workOrderId)
   - getWorkOrdersByCustomer(customerId)
   - getWorkOrdersByTechnician(technicianId)
   - getWorkOrdersByStatus(organizationId, status)
   - getScheduledWorkOrders(organizationId, dateRange)
   - createWorkOrder(input)
   - updateWorkOrder(workOrderId, input)
   - updateWorkOrderStatus(workOrderId, status)
   - assignTechnicianToWorkOrder(workOrderId, technicianId)
   - completeWorkOrder(workOrderId, completionInput)

2. Create time entry functions if needed:
   - createWorkOrderTimeEntry(input)
   - completeWorkOrderTimeEntry(timeEntryId)

3. Create server actions for:
   - Create work order
   - Update work order
   - Assign technician
   - Start work order
   - Complete work order
   - Mark requires follow-up
   - Link work order to ticket
   - Link work order to maintenance visit
   - Link work order to warranty claim

4. Connect Work Orders pages:
   - Active Jobs
   - Scheduled Jobs
   - Completed Jobs
   - Work order detail

5. Make source visible:
   - Manual
   - Support ticket
   - Maintenance visit
   - Warranty claim
   - Customer request
   - Internal inspection

6. When a work order is completed, create a service_history record.

Goal:
Work Orders should become the operational bridge between office staff and technicians.

Work Orders are all field service jobs, not warranty-only.

---

# STEP 8 - Technicians Backend

Connect Technicians module to Supabase.

Tables involved:
- technicians
- profiles
- work_orders
- work_order_time_entries
- documents

Tasks:

1. Create data functions:
   - getTechnicians(organizationId)
   - getTechnicianById(technicianId)
   - createTechnician(input)
   - updateTechnician(technicianId, input)
   - getTechnicianAssignedWorkOrders(technicianId)
   - getTechnicianCompletedWorkOrders(technicianId)
   - getTechnicianSchedule(technicianId, dateRange)

2. Create server actions:
   - Create technician
   - Update technician
   - Update technician status
   - Assign work order to technician
   - Unassign technician from work order

3. Connect Technicians pages:
   - Team
   - Assignments
   - Availability
   - Technician profile

4. Show:
   - Name
   - Email
   - Phone
   - Team
   - Skills
   - Certifications
   - Availability/status
   - Assigned jobs
   - Completed jobs
   - Upcoming schedule

Goal:
Technicians module should solve dispatching, assignment visibility, and technician profile management.

---

# STEP 9 - Documents + Supabase Storage Backend

Connect Documents to Supabase Storage and document metadata tables.

Tables involved:
- documents
- document_links
- customers
- sites
- solar_systems
- equipment_assets
- warranties
- support_tickets
- work_orders
- maintenance_visits
- installation_projects

Storage bucket:
- solaros-documents

Tasks:

1. Create document data functions:
   - getDocuments(organizationId)
   - getDocumentById(documentId)
   - getDocumentsByCustomer(customerId)
   - getDocumentsByLinkedEntity(entityType, entityId)
   - createDocumentMetadata(input)
   - updateDocumentMetadata(documentId, input)
   - linkDocumentToEntity(documentId, entityType, entityId)
   - unlinkDocumentFromEntity(documentId, entityType, entityId)

2. Implement file upload:
   - Use Supabase Storage.
   - Store files under organization-specific paths.
   - Example path:
     organizationId/customerId/documentId/fileName
   - Save metadata to documents table.
   - Save links to document_links table.

3. Create server actions or route handlers:
   - Upload document
   - Update document
   - Link document
   - Change visibility
   - Delete document metadata if appropriate

4. Connect Documents page:
   - Document list
   - Filters by type
   - Filters by visibility
   - Linked record display
   - Customer Visible / Internal Only badge

5. Enforce visibility:
   - Customer portal only sees visibility = customer_visible.
   - Internal documents must not appear in customer portal.

Goal:
Documents should become a linked file library across the whole SolarOS system.

---

# STEP 10 - Customer Portal Invite Flow + Customer Portal Backend

Implement the customer portal backend flow.

Tables involved:
- customer_portal_access
- customers
- customer_contacts
- sites
- solar_systems
- equipment_assets
- warranties
- maintenance_plans
- maintenance_visits
- support_tickets
- support_ticket_messages
- work_orders
- documents
- service_history

Important:
A customer record can exist before the customer creates an account.

Portal access should only be granted after invite acceptance.

Do not silently link records just because the email matches.

Tasks:

1. Create data functions:
   - createCustomerPortalInvite(customerId, contactId, email)
   - resendCustomerPortalInvite(accessId)
   - revokeCustomerPortalAccess(accessId)
   - acceptCustomerPortalInvite(token)
   - getCustomerPortalAccessForUser(userId)
   - getLinkedCustomerRecordsForPortalUser(userId)

2. Invite security:
   - Generate raw invite token.
   - Store only invite_token_hash in database.
   - Set expires_at.
   - Send or mock-send invite email.
   - Do not expose raw token except in generated invite URL.

3. Accept invite:
   - Validate token hash.
   - Check expiry.
   - Require authenticated user or allow signup flow depending on existing auth.
   - Link user_id to customer_portal_access.
   - Set status = active.
   - Set accepted_at.
   - Update customer/contact portal status if needed.

4. Connect Customer Portal:
   - Overview
   - My Solar Systems
   - Warranties
   - Maintenance
   - Support
   - Documents
   - Service History
   - Account

5. Customer portal permissions:
   - Show only linked customer records.
   - Show only customer-visible documents.
   - Show only non-internal ticket messages.
   - Allow customer to create support ticket.
   - Allow customer to request maintenance if existing UI supports it.
   - Allow customer to add customer-visible ticket message.

Goal:
Make customer onboarding smooth:
Solar company creates customer/system records first, then invites customer to activate portal access.

---

# STEP 11 - Technician Portal Backend

Connect Technician Portal to real work order data.

Tables involved:
- technicians
- profiles
- work_orders
- work_order_time_entries
- customers
- sites
- solar_systems
- documents
- service_history

Important:
From the technician’s point of view, everything should be shown as a Job.

The job may come from:
- Support ticket
- Maintenance visit
- Warranty claim
- Manual work order

Tasks:

1. Identify current authenticated user.
2. Find linked technician record using profile_id or email.
3. Create data functions:
   - getCurrentTechnician()
   - getTechnicianTodayJobs(technicianId)
   - getTechnicianAssignedJobs(technicianId)
   - getTechnicianCompletedJobs(technicianId)
   - getTechnicianJobById(workOrderId)
   - startTechnicianJob(workOrderId)
   - updateTechnicianJobChecklist(workOrderId, checklist)
   - addTechnicianNotes(workOrderId, notes)
   - addPartsUsed(workOrderId, parts)
   - submitCompletionReport(workOrderId, report)
   - completeTechnicianJob(workOrderId)

4. Connect Technician Portal pages:
   - Today
   - Jobs
   - Completed
   - Reports
   - Profile

5. Completing a technician job should:
   - Update work_order status to completed.
   - Set completed_at.
   - Save technician notes/completion report.
   - Create service_history record.
   - Optionally update linked maintenance visit/status.
   - Optionally update linked support ticket status if appropriate.

Goal:
Technician Portal should work as a mobile-friendly field service app backed by work_orders.

---

# STEP 12 - Dashboard + Reports Backend

Replace dashboard and report mock data with real Supabase queries where possible.

Tables involved:
- customers
- sites
- solar_systems
- equipment_assets
- warranties
- warranty_claims
- maintenance_visits
- support_tickets
- work_orders
- technicians
- service_history

Dashboard metrics:

Operations:
- Open work orders
- Scheduled work orders today
- Overdue maintenance
- Technician assignments

Customer Support:
- Open tickets
- Tickets waiting for customer
- Urgent tickets
- Average response time if available

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

Reports:

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
- Jobs by technician
- Jobs by type

Support Reports:
- Open tickets
- Tickets by priority
- Tickets by issue type

Customer Reports:
- Customers with overdue maintenance
- Customers with open issues
- Customers with expiring warranties

Tasks:

1. Create data functions:
   - getDashboardMetrics(organizationId)
   - getUpcomingMaintenance(organizationId)
   - getOpenSupportTickets(organizationId)
   - getActiveTechnicianAssignments(organizationId)
   - getRecentlyInstalledSystems(organizationId)
   - getWarrantyExpirationAlerts(organizationId)
   - getRecentCustomerActivity(organizationId)
   - getOperationalReports(organizationId)

2. Connect Dashboard page to real data.
3. Connect Reports page to real data.
4. Keep reports simple and operational.
5. Do not build advanced analytics.

Goal:
Dashboard and Reports should show what is overdue, expiring, unresolved, assigned, and completed.

---

# STEP 13 - Service History + Activity Logs

Implement service history and basic activity logging.

Tables involved:
- service_history
- activity_logs
- customers
- sites
- solar_systems
- work_orders
- support_tickets
- maintenance_visits
- warranties
- documents

Tasks:

1. Create data functions:
   - createServiceHistoryEvent(input)
   - getServiceHistoryByCustomer(customerId)
   - getServiceHistoryBySolarSystem(systemId)
   - getServiceHistoryForPortalUser(userId)
   - createActivityLog(input)
   - getActivityLogsByEntity(entityType, entityId)

2. Add service history creation when:
   - Work order is completed
   - Maintenance visit is completed
   - Support ticket is resolved
   - Warranty claim status changes
   - Customer-visible document is uploaded
   - Installation handover is completed

3. Add activity logs for important internal actions:
   - Customer created
   - Site created
   - Solar system created
   - Warranty created
   - Support ticket created
   - Work order created
   - Technician assigned
   - Work order status changed
   - Document uploaded

4. Connect service history to:
   - Customer profile
   - Solar system detail
   - Customer portal
   - Work order completion flow

5. Keep activity logs simple.
6. Do not overbuild audit logging yet.

Goal:
Service history should become the customer-visible timeline of what happened to their solar system.
Activity logs should become the internal operational trail.
