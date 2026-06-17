-- Fixed coordinate extraction function with proper data types
-- Run this in your Supabase SQL Editor

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_vehicles_with_coordinates(UUID);
DROP FUNCTION IF EXISTS get_vehicle_with_coordinates(UUID);

-- Create a simple function that returns coordinates without strict typing
CREATE OR REPLACE FUNCTION get_vehicles_with_coordinates(organization_id UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  plate_number TEXT,
  vehicle_type TEXT,
  status TEXT,
  assigned_branch TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  av_enabled BOOLEAN,
  is_electric BOOLEAN,
  battery_capacity NUMERIC,
  mileage NUMERIC,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.org_id,
    v.plate_number::TEXT,
    v.vehicle_type::TEXT,
    v.status::TEXT,
    COALESCE(v.assigned_branch::TEXT, NULL),
    COALESCE(v.make::TEXT, NULL),
    COALESCE(v.model::TEXT, NULL),
    v.year,
    COALESCE(v.vin::TEXT, NULL),
    COALESCE(v.av_enabled, FALSE),
    COALESCE(v.is_electric, FALSE),
    v.battery_capacity,
    v.mileage,
    CASE 
      WHEN v.location IS NOT NULL THEN ST_Y(v.location::geometry)
      ELSE NULL
    END::DOUBLE PRECISION as location_lat,
    CASE 
      WHEN v.location IS NOT NULL THEN ST_X(v.location::geometry)
      ELSE NULL
    END::DOUBLE PRECISION as location_lng,
    v.created_at,
    v.updated_at
  FROM vehicles v
  WHERE v.org_id = organization_id
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create single vehicle function
CREATE OR REPLACE FUNCTION get_vehicle_with_coordinates(vehicle_id UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  plate_number TEXT,
  vehicle_type TEXT,
  status TEXT,
  assigned_branch TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  av_enabled BOOLEAN,
  is_electric BOOLEAN,
  battery_capacity NUMERIC,
  mileage NUMERIC,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.org_id,
    v.plate_number::TEXT,
    v.vehicle_type::TEXT,
    v.status::TEXT,
    COALESCE(v.assigned_branch::TEXT, NULL),
    COALESCE(v.make::TEXT, NULL),
    COALESCE(v.model::TEXT, NULL),
    v.year,
    COALESCE(v.vin::TEXT, NULL),
    COALESCE(v.av_enabled, FALSE),
    COALESCE(v.is_electric, FALSE),
    v.battery_capacity,
    v.mileage,
    CASE 
      WHEN v.location IS NOT NULL THEN ST_Y(v.location::geometry)
      ELSE NULL
    END::DOUBLE PRECISION as location_lat,
    CASE 
      WHEN v.location IS NOT NULL THEN ST_X(v.location::geometry)
      ELSE NULL
    END::DOUBLE PRECISION as location_lng,
    v.created_at,
    v.updated_at
  FROM vehicles v
  WHERE v.id = vehicle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 