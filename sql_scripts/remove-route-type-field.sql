-- Remove route_type column from routes table
ALTER TABLE routes DROP COLUMN IF EXISTS route_type;

-- Update the get_routes_with_details function to remove route_type
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
  estimated_distance_km DOUBLE PRECISION,
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
    r.estimated_distance_km,
    r.estimated_duration_minutes,
    r.created_at,
    r.updated_at
  FROM routes r
  WHERE r.org_id = org_uuid
  ORDER BY r.created_at DESC;
END;
$$; 