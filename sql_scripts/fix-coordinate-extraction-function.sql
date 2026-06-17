-- Fixed coordinate extraction function that only uses existing columns
-- Run this in your Supabase SQL Editor to replace the previous functions

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_vehicles_with_coordinates(UUID);
DROP FUNCTION IF EXISTS get_vehicle_with_coordinates(UUID);

-- Create updated function with only existing columns
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

-- Create updated single vehicle function
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