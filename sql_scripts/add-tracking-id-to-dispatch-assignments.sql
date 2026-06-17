-- Add tracking_id column to dispatch_assignments table
-- This will be a unique 8-digit numeric code for each dispatch

-- Step 1: Add the tracking_id column
ALTER TABLE dispatch_assignments 
ADD COLUMN tracking_id VARCHAR(8) UNIQUE;

-- Step 2: Create a function to generate unique 8-digit tracking IDs
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS VARCHAR(8) AS $$
DECLARE
    new_tracking_id VARCHAR(8);
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        -- Generate random 8-digit number (10000000 to 99999999)
        new_tracking_id := LPAD(FLOOR(RANDOM() * 90000000 + 10000000)::TEXT, 8, '0');
        
        -- Check if this tracking_id already exists
        IF NOT EXISTS (SELECT 1 FROM dispatch_assignments WHERE tracking_id = new_tracking_id) THEN
            RETURN new_tracking_id;
        END IF;
        
        -- Prevent infinite loop
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique tracking_id after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update existing records with unique tracking IDs
UPDATE dispatch_assignments 
SET tracking_id = generate_tracking_id() 
WHERE tracking_id IS NULL;

-- Step 4: Make tracking_id NOT NULL after populating existing records
ALTER TABLE dispatch_assignments 
ALTER COLUMN tracking_id SET NOT NULL;

-- Step 5: Create a trigger to automatically generate tracking_id for new records
CREATE OR REPLACE FUNCTION set_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_id IS NULL THEN
        NEW.tracking_id := generate_tracking_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_tracking_id ON dispatch_assignments;
CREATE TRIGGER trigger_set_tracking_id
    BEFORE INSERT ON dispatch_assignments
    FOR EACH ROW
    EXECUTE FUNCTION set_tracking_id();

-- Step 6: Update the RPC function to include tracking_id (if it exists)
DROP FUNCTION IF EXISTS get_dispatch_assignments_with_details(UUID);

CREATE OR REPLACE FUNCTION get_dispatch_assignments_with_details(org_uuid UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    title TEXT,
    tracking_id VARCHAR(8),
    vehicle_id UUID,
    driver_id UUID,
    attachment_id UUID,
    route_type TEXT,
    status TEXT,
    route_id UUID,
    instructions TEXT,
    priority TEXT,
    planned_start_time TIMESTAMPTZ,
    planned_end_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    delay_minutes INTEGER,
    on_time BOOLEAN,
    duration_expected_minutes INTEGER,
    duration_actual_minutes INTEGER,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    vehicle_name TEXT,
    vehicle_plate TEXT,
    driver_name TEXT,
    driver_email TEXT,
    attachment_name TEXT,
    route_name TEXT,
    route_origin TEXT,
    route_destination TEXT,
    route_distance DECIMAL,
    created_by_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id,
        da.org_id,
        da.title,
        da.tracking_id,
        da.vehicle_id,
        da.driver_id,
        da.attachment_id,
        da.route_type,
        da.status,
        da.route_id,
        da.instructions,
        da.priority,
        da.planned_start_time,
        da.planned_end_time,
        da.actual_start_time,
        da.actual_end_time,
        da.delay_minutes,
        da.on_time,
        da.duration_expected_minutes,
        da.duration_actual_minutes,
        da.created_by,
        da.created_at,
        da.updated_at,
        CONCAT(v.make, ' ', v.model) as vehicle_name,
        v.plate_number as vehicle_plate,
        u.full_name as driver_name,
        u.email as driver_email,
        a.name as attachment_name,
        r.name as route_name,
        r.origin_location_name as route_origin,
        r.destination_location_name as route_destination,
        r.estimated_distance_km as route_distance,
        creator.full_name as created_by_name
    FROM dispatch_assignments da
    LEFT JOIN vehicles v ON da.vehicle_id = v.id
    LEFT JOIN users u ON da.driver_id = u.id
    LEFT JOIN attachments a ON da.attachment_id = a.id
    LEFT JOIN routes r ON da.route_id = r.id
    LEFT JOIN users creator ON da.created_by = creator.id
    WHERE da.org_id = org_uuid
    ORDER BY da.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add index for better performance on tracking_id lookups
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_tracking_id ON dispatch_assignments(tracking_id);

-- Verification: Display sample tracking IDs
SELECT id, title, tracking_id, created_at 
FROM dispatch_assignments 
ORDER BY created_at DESC 
LIMIT 5; 