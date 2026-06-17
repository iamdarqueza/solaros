-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_route_with_coordinates(UUID);

-- Create a simple function to get route with coordinates
CREATE OR REPLACE FUNCTION get_route_with_coordinates(route_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', r.id,
    'org_id', r.org_id,
    'name', r.name,
    'origin_lat', ST_Y(r.origin_location::geometry),
    'origin_lng', ST_X(r.origin_location::geometry),
    'destination_lat', ST_Y(r.destination_location::geometry),
    'destination_lng', ST_X(r.destination_location::geometry),
    'origin_location_name', r.origin_location_name,
    'destination_location_name', r.destination_location_name,
    'waypoints', r.waypoints,
    'estimated_distance_km', r.estimated_distance_km,
    'estimated_duration_minutes', r.estimated_duration_minutes,
    'created_at', r.created_at,
    'updated_at', r.updated_at
  ) INTO result
  FROM routes r
  WHERE r.id = route_uuid;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_route_with_coordinates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_route_with_coordinates(UUID) TO anon; 