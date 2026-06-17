-- Add title column to dispatch_assignments table
ALTER TABLE dispatch_assignments 
ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '';

-- Add index for better search performance on titles
CREATE INDEX idx_dispatch_assignments_title ON dispatch_assignments(title);

-- Update the get_dispatch_assignments_with_details function to include title
DROP FUNCTION IF EXISTS get_dispatch_assignments_with_details(uuid);

CREATE OR REPLACE FUNCTION get_dispatch_assignments_with_details(org_uuid UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    title TEXT,
    vehicle_id UUID,
    vehicle_name TEXT,
    vehicle_plate TEXT,
    driver_id UUID,
    driver_name TEXT,
    driver_email TEXT,
    attachment_id UUID,
    attachment_name TEXT,
    route_type TEXT,
    status TEXT,
    route_id UUID,
    route_name TEXT,
    route_origin TEXT,
    route_destination TEXT,
    route_distance DOUBLE PRECISION,
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
    created_by_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id,
        da.org_id,
        da.title::TEXT,
        da.vehicle_id,
        v.name as vehicle_name,
        v.plate_number as vehicle_plate,
        da.driver_id,
        du.full_name as driver_name,
        du.email as driver_email,
        da.attachment_id,
        a.name as attachment_name,
        da.route_type,
        da.status,
        da.route_id,
        r.name as route_name,
        r.origin_location_name as route_origin,
        r.destination_location_name as route_destination,
        r.estimated_distance_km as route_distance,
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
        cu.full_name as created_by_name,
        da.created_at,
        da.updated_at
    FROM dispatch_assignments da
    LEFT JOIN vehicles v ON v.id = da.vehicle_id
    LEFT JOIN users du ON du.id = da.driver_id
    LEFT JOIN attachments a ON a.id = da.attachment_id
    LEFT JOIN routes r ON r.id = da.route_id
    LEFT JOIN users cu ON cu.id = da.created_by
    WHERE da.org_id = org_uuid
    ORDER BY 
        CASE da.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
        END,
        da.planned_start_time ASC NULLS LAST,
        da.created_at DESC;
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN dispatch_assignments.title IS 'Human-readable title/name for the dispatch assignment';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully added title column to dispatch_assignments table!';
    RAISE NOTICE 'Updated get_dispatch_assignments_with_details function to include title.';
END $$; 