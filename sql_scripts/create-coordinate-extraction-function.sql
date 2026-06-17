-- Create a function to extract coordinates from geography data
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_vehicles_with_coordinates(organization_id UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  plate_number VARCHAR,
  vehicle_type VARCHAR,
  status VARCHAR,
  assigned_branch VARCHAR,
  make VARCHAR,
  model VARCHAR,
  year INTEGER,
  vin VARCHAR,
  av_enabled BOOLEAN,
  is_electric BOOLEAN,
  battery_capacity DECIMAL,
  mileage DECIMAL,
  fuel_level DECIMAL,
  driver_name VARCHAR,
  driver_phone VARCHAR,
  current_route VARCHAR,
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
    v.plate_number,
    v.vehicle_type,
    v.status,
    v.assigned_branch,
    v.make,
    v.model,
    v.year,
    v.vin,
    v.av_enabled,
    v.is_electric,
    v.battery_capacity,
    v.mileage,
    v.fuel_level,
    v.driver_name,
    v.driver_phone,
    v.current_route,
    CASE 
      WHEN v.location IS NOT NULL THEN ST_Y(v.location::geometry)
      ELSE NULL
    END as location_lat,
    CASE 
      WHEN v.location IS NOT NULL THEN ST_X(v.location::geometry)
      ELSE NULL
    END as location_lng,
    v.created_at,
    v.updated_at
  FROM vehicles v
  WHERE v.org_id = organization_id
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler function to get a single vehicle with coordinates
CREATE OR REPLACE FUNCTION get_vehicle_with_coordinates(vehicle_id UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  plate_number VARCHAR,
  vehicle_type VARCHAR,
  status VARCHAR,
  assigned_branch VARCHAR,
  make VARCHAR,
  model VARCHAR,
  year INTEGER,
  vin VARCHAR,
  av_enabled BOOLEAN,
  is_electric BOOLEAN,
  battery_capacity DECIMAL,
  mileage DECIMAL,
  fuel_level DECIMAL,
  driver_name VARCHAR,
  driver_phone VARCHAR,
  current_route VARCHAR,
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
    v.plate_number,
    v.vehicle_type,
    v.status,
    v.assigned_branch,
    v.make,
    v.model,
    v.year,
    v.vin,
    v.av_enabled,
    v.is_electric,
    v.battery_capacity,
    v.mileage,
    v.fuel_level,
    v.driver_name,
    v.driver_phone,
    v.current_route,
    CASE 
      WHEN v.location IS NOT NULL THEN ST_Y(v.location::geometry)
      ELSE NULL
    END as location_lat,
    CASE 
      WHEN v.location IS NOT NULL THEN ST_X(v.location::geometry)
      ELSE NULL
    END as location_lng,
    v.created_at,
    v.updated_at
  FROM vehicles v
  WHERE v.id = vehicle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 