-- Migration script to remove is_active field and add 'offline' status option
-- Run this script after running create-attachments-table-fixed.sql

-- First drop the functions that need to be updated
DROP FUNCTION IF EXISTS get_attachments_with_vehicle_details(uuid);
DROP FUNCTION IF EXISTS get_attachment_with_vehicle_details(uuid);

-- Drop the is_active column if it exists
ALTER TABLE attachments DROP COLUMN IF EXISTS is_active;

-- Drop the old status constraint
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_status_check;

-- Add the new status constraint with offline option
ALTER TABLE attachments ADD CONSTRAINT attachments_status_check 
  CHECK (status IN ('available', 'in_use', 'under_maintenance', 'lost', 'offline'));

-- Drop the index on is_active since the column no longer exists
DROP INDEX IF EXISTS idx_attachments_is_active;

-- Recreate the RPC functions without the is_active field
CREATE OR REPLACE FUNCTION get_attachments_with_vehicle_details(organization_id UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    name TEXT,
    type TEXT,
    make TEXT,
    model TEXT,
    serial_number TEXT,
    assigned_vehicle_id UUID,
    assigned_vehicle_name TEXT,
    status TEXT,
    last_known_location_lat NUMERIC,
    last_known_location_lng NUMERIC,
    beacon_id TEXT,
    last_attached_to UUID,
    last_attached_vehicle_name TEXT,
    maintenance_interval_hrs INTEGER,
    notes TEXT,
    documents TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.org_id,
        a.name::TEXT,
        a.type::TEXT,
        a.make::TEXT,
        a.model::TEXT,
        a.serial_number::TEXT,
        a.assigned_vehicle_id,
        COALESCE(av.plate_number, '')::TEXT AS assigned_vehicle_name,
        a.status::TEXT,
        CASE 
            WHEN a.last_known_location IS NOT NULL 
            THEN ST_Y(a.last_known_location::geometry)
            ELSE NULL 
        END AS last_known_location_lat,
        CASE 
            WHEN a.last_known_location IS NOT NULL 
            THEN ST_X(a.last_known_location::geometry)
            ELSE NULL 
        END AS last_known_location_lng,
        COALESCE(a.beacon_id, '')::TEXT,
        a.last_attached_to,
        COALESCE(lv.plate_number, '')::TEXT AS last_attached_vehicle_name,
        a.maintenance_interval_hrs,
        COALESCE(a.notes, '')::TEXT,
        COALESCE(a.documents, '')::TEXT,
        a.created_at,
        a.updated_at
    FROM attachments a
    LEFT JOIN vehicles av ON a.assigned_vehicle_id = av.id
    LEFT JOIN vehicles lv ON a.last_attached_to = lv.id
    WHERE a.org_id = organization_id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get single attachment with vehicle details
CREATE OR REPLACE FUNCTION get_attachment_with_vehicle_details(attachment_id UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    name TEXT,
    type TEXT,
    make TEXT,
    model TEXT,
    serial_number TEXT,
    assigned_vehicle_id UUID,
    assigned_vehicle_name TEXT,
    status TEXT,
    last_known_location_lat NUMERIC,
    last_known_location_lng NUMERIC,
    beacon_id TEXT,
    last_attached_to UUID,
    last_attached_vehicle_name TEXT,
    maintenance_interval_hrs INTEGER,
    notes TEXT,
    documents TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.org_id,
        a.name::TEXT,
        a.type::TEXT,
        a.make::TEXT,
        a.model::TEXT,
        a.serial_number::TEXT,
        a.assigned_vehicle_id,
        COALESCE(av.plate_number, '')::TEXT AS assigned_vehicle_name,
        a.status::TEXT,
        CASE 
            WHEN a.last_known_location IS NOT NULL 
            THEN ST_Y(a.last_known_location::geometry)
            ELSE NULL 
        END AS last_known_location_lat,
        CASE 
            WHEN a.last_known_location IS NOT NULL 
            THEN ST_X(a.last_known_location::geometry)
            ELSE NULL 
        END AS last_known_location_lng,
        COALESCE(a.beacon_id, '')::TEXT,
        a.last_attached_to,
        COALESCE(lv.plate_number, '')::TEXT AS last_attached_vehicle_name,
        a.maintenance_interval_hrs,
        COALESCE(a.notes, '')::TEXT,
        COALESCE(a.documents, '')::TEXT,
        a.created_at,
        a.updated_at
    FROM attachments a
    LEFT JOIN vehicles av ON a.assigned_vehicle_id = av.id
    LEFT JOIN vehicles lv ON a.last_attached_to = lv.id
    WHERE a.id = attachment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully removed is_active field and added offline status option!';
    RAISE NOTICE 'Database schema has been updated.';
END $$; 