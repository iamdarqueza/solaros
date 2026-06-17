-- Safer migration: Add name column to existing routes table if it doesn't exist
-- This preserves existing data

-- Check if the name column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routes' AND column_name = 'name'
    ) THEN
        ALTER TABLE routes ADD COLUMN name TEXT;
        
        -- Update existing records with a default name
        UPDATE routes SET name = 'Route ' || id::text WHERE name IS NULL;
        
        -- Make the column NOT NULL after updating existing records
        ALTER TABLE routes ALTER COLUMN name SET NOT NULL;
        
        -- Add index for the name column
        CREATE INDEX IF NOT EXISTS idx_routes_name ON routes(name);
    END IF;
END $$;

-- Add location name columns to routes table
ALTER TABLE routes 
ADD COLUMN origin_location_name TEXT,
ADD COLUMN destination_location_name TEXT;

-- Recreate the function to include the name column
DROP FUNCTION IF EXISTS get_routes_with_details(UUID);

CREATE OR REPLACE FUNCTION get_routes_with_details(org_uuid UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    name TEXT,
    route_type TEXT,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    origin_location_name TEXT,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    destination_location_name TEXT,
    waypoints JSONB,
    estimated_distance_km DOUBLE PRECISION,
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.org_id,
        r.name,
        r.route_type,
        ST_Y(r.origin_location::geometry) as origin_lat,
        ST_X(r.origin_location::geometry) as origin_lng,
        r.origin_location_name,
        ST_Y(r.destination_location::geometry) as destination_lat,
        ST_X(r.destination_location::geometry) as destination_lng,
        r.destination_location_name,
        r.waypoints,
        r.estimated_distance_km,
        r.estimated_duration_minutes,
        r.created_at,
        r.updated_at
    FROM routes r
    WHERE r.org_id = org_uuid
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 