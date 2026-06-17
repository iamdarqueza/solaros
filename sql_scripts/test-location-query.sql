-- Test query to check location data in your vehicles table
-- Run this in your Supabase SQL Editor to see what location data exists

-- First, check raw location data
SELECT 
  plate_number,
  location,
  ST_AsText(location) as location_text,
  ST_X(location::geometry) as longitude,
  ST_Y(location::geometry) as latitude
FROM vehicles 
WHERE location IS NOT NULL;

-- Test the RPC function (replace with your actual org_id)
-- SELECT * FROM get_vehicles_with_coordinates('your-org-id-here');

-- Check if the functions exist
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_vehicles_with_coordinates', 'get_vehicle_with_coordinates'); 