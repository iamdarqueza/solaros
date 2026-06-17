# Attachments & Equipment System Setup Guide

## Overview
This guide will help you set up the complete attachments and equipment management system for your fleet management application.

## Database Setup

### 1. Run SQL Script
Execute the following SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of create-attachments-table.sql
```

This script will:
- Create the `attachments` table with all required fields
- Set up proper indexes for performance
- Create Row Level Security (RLS) policies
- Add database triggers for automatic updates
- Create RPC functions for enhanced queries

### 2. Database Schema
The attachments table includes:

**Required Fields (marked with *):**
- `id*` - Primary key (UUID)
- `org_id*` - Foreign key to organizations table
- `name*` - Equipment name
- `type*` - Equipment type (GPS Tracker, Camera, etc.)
- `make*` - Manufacturer
- `model*` - Model name
- `serial_number*` - Unique serial number per organization
- `is_active*` - Boolean (default: false)
- `status*` - Enum: available, in_use, under_maintenance, lost (default: available)
- `created_at*` - Timestamp
- `updated_at*` - Timestamp

**Optional Fields:**
- `assigned_vehicle_id` - Links to vehicles table
- `last_known_location` - PostGIS GEOGRAPHY point
- `tag_id` - BLE, QR, or other identifier
- `last_attached_to` - Tracks previous vehicle assignment
- `maintenance_interval_hrs` - Hours between maintenance
- `notes` - Additional notes
- `documents` - URL to documentation

## Features Implemented

### 1. Full CRUD Operations
- ✅ **Create**: Add new equipment with all fields
- ✅ **Read**: View all equipment with search and filtering
- ✅ **Update**: Edit existing equipment details
- ✅ **Delete**: Remove equipment from system

### 2. Advanced Features
- ✅ **Search**: Filter by equipment name or serial number
- ✅ **Vehicle Assignment**: Link equipment to specific vehicles
- ✅ **Location Tracking**: Set and update equipment locations with interactive map
- ✅ **Status Management**: Track equipment status (available, in use, etc.)
- ✅ **Real-time Updates**: Live synchronization across users
- ✅ **Expandable Rows**: Detailed view with location coordinates
- ✅ **Form Validation**: Required field validation and error handling

### 3. Smart Database Triggers
- **Auto-update timestamps**: `updated_at` field automatically updated
- **Status management**: When assigned to vehicle, status becomes "in_use"
- **History tracking**: `last_attached_to` tracks previous assignments

### 4. User Interface
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode Support**: Consistent with application theme
- **Interactive Maps**: Mapbox integration for location setting
- **Modern UI**: Consistent with existing vehicle management interface

## Navigation
The attachments page is accessible via:
- **Sidebar**: Assets → Attachments & Equipment
- **URL**: `/attachments`

## Components Created

### Service Layer
- `src/services/attachmentsService.ts` - Complete CRUD operations and data transformation

### UI Components
- `src/app/(admin)/attachments/page.tsx` - Main attachments page
- `src/components/attachments/AttachmentsTable.tsx` - Main table component
- `src/components/attachments/AddAttachmentModal.tsx` - Create new equipment
- `src/components/attachments/EditAttachmentModal.tsx` - Edit existing equipment

## Database Functions
The system includes optimized RPC functions:
- `get_attachments_with_vehicle_details()` - Fetch all attachments with vehicle info
- `get_attachment_with_vehicle_details()` - Fetch single attachment details

## Security
- **Row Level Security (RLS)**: Users can only access their organization's equipment
- **Proper Authentication**: Integrated with existing auth system
- **Data Validation**: Both client and server-side validation

## Testing the System

1. **Navigate** to the attachments page via sidebar
2. **Add Equipment** using the "Add Equipment" button
3. **Test Search** functionality with equipment names or serial numbers
4. **Assign to Vehicle** by selecting from dropdown
5. **Set Location** using the interactive map
6. **Edit Equipment** via the actions dropdown
7. **View Details** by clicking on table rows to expand

## Troubleshooting

### Common Issues:
1. **Database Connection**: Ensure Supabase credentials are correct
2. **Map Not Loading**: Check Mapbox access token in environment variables
3. **RLS Errors**: Verify user has proper organization membership

### Environment Variables Required:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## Future Enhancements
Potential improvements for the system:
- Equipment maintenance scheduling
- Photo uploads for equipment
- QR code generation for tags
- Equipment usage analytics
- Integration with IoT sensors
- Bulk import/export functionality

The attachments system is now fully functional and ready for production use! 