-- Update distance unit from kilometers to miles
-- 1 kilometer = 0.621371 miles

-- First, convert existing data from km to miles
UPDATE routes 
SET estimated_distance_km = estimated_distance_km * 0.621371 
WHERE estimated_distance_km IS NOT NULL;

-- Rename the column to reflect miles (optional - we can keep the name for backward compatibility)
-- ALTER TABLE routes RENAME COLUMN estimated_distance_km TO estimated_distance_miles;

-- Drop and recreate the database function to reflect miles
DROP FUNCTION IF EXISTS get_routes_with_details(uuid);

CREATE OR REPLACE FUNCTION get_routes_with_details(org_uuid UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  name TEXT,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  origin_location_name TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  destination_location_name TEXT,
  waypoints JSONB,
  estimated_distance_km DOUBLE PRECISION, -- Note: This is now in miles but keeping column name for compatibility
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.org_id,
    r.name,
    ST_Y(r.origin_location::geometry) as origin_lat,
    ST_X(r.origin_location::geometry) as origin_lng,
    r.origin_location_name,
    ST_Y(r.destination_location::geometry) as destination_lat,
    ST_X(r.destination_location::geometry) as destination_lng,
    r.destination_location_name,
    r.waypoints,
    r.estimated_distance_km, -- This is now in miles
    r.estimated_duration_minutes,
    r.created_at,
    r.updated_at
  FROM routes r
  WHERE r.org_id = org_uuid
  ORDER BY r.created_at DESC;
END;
$$; 