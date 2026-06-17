-- Fix attachments table schema - Run this in Supabase SQL Editor
-- This will add beacon_id column and remove is_active column

-- First, check if the attachments table exists and show current structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attachments') THEN
        RAISE NOTICE 'Attachments table exists. Current columns:';
    ELSE
        RAISE NOTICE 'Attachments table does not exist!';
    END IF;
END $$;

-- Add beacon_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attachments' AND column_name = 'beacon_id'
    ) THEN
        ALTER TABLE attachments ADD COLUMN beacon_id VARCHAR(255);
        RAISE NOTICE 'Added beacon_id column to attachments table';
    ELSE
        RAISE NOTICE 'beacon_id column already exists';
    END IF;
END $$;

-- Remove is_active column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attachments' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE attachments DROP COLUMN is_active;
        RAISE NOTICE 'Removed is_active column from attachments table';
    ELSE
        RAISE NOTICE 'is_active column does not exist';
    END IF;
END $$;

-- Update status constraint to include 'offline' if needed
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'attachments_status_check'
    ) THEN
        ALTER TABLE attachments DROP CONSTRAINT attachments_status_check;
        RAISE NOTICE 'Dropped existing status constraint';
    END IF;
    
    -- Add new constraint with offline option
    ALTER TABLE attachments ADD CONSTRAINT attachments_status_check 
        CHECK (status IN ('available', 'in_use', 'under_maintenance', 'lost', 'offline'));
    RAISE NOTICE 'Added new status constraint with offline option';
END $$;

-- Drop and recreate RPC functions to handle the schema changes
DROP FUNCTION IF EXISTS get_attachments_with_vehicle_details(uuid);
DROP FUNCTION IF EXISTS get_attachment_with_vehicle_details(uuid);

-- Recreate RPC function to get attachments with vehicle details
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

-- Recreate RPC function to get single attachment with vehicle details
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

-- Final status check
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'The attachments table now has:';
    RAISE NOTICE '- beacon_id column (added if missing)';
    RAISE NOTICE '- is_active column (removed if existed)';
    RAISE NOTICE '- Updated status constraint with offline option';
    RAISE NOTICE '- Updated RPC functions';
END $$; 