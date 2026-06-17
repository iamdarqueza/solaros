-- Update legacy database schema to use miles instead of kilometers
-- This aligns with the current routes table structure

-- Update the routes table if it uses the old schema
DO $$
BEGIN
    -- Check if distance_km column exists and rename/convert it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routes' AND column_name = 'distance_km'
    ) THEN
        -- Convert existing data from km to miles
        UPDATE routes 
        SET distance_km = distance_km * 0.621371 
        WHERE distance_km IS NOT NULL;
        
        -- Rename column to match current schema
        ALTER TABLE routes RENAME COLUMN distance_km TO estimated_distance_km;
        
        -- Add comment to indicate it's now in miles
        COMMENT ON COLUMN routes.estimated_distance_km IS 'Estimated distance in miles (converted from km)';
    END IF;
    
    -- Check if we need to add missing columns from current schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routes' AND column_name = 'origin_location'
    ) THEN
        -- Add missing columns to match current schema
        ALTER TABLE routes ADD COLUMN IF NOT EXISTS origin_location GEOGRAPHY(POINT, 4326);
        ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_location GEOGRAPHY(POINT, 4326);
        ALTER TABLE routes ADD COLUMN IF NOT EXISTS origin_location_name TEXT;
        ALTER TABLE routes ADD COLUMN IF NOT EXISTS destination_location_name TEXT;
        ALTER TABLE routes ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]';
        
        -- Migrate old data if possible
        UPDATE routes 
        SET origin_location = start_location,
            destination_location = end_location
        WHERE start_location IS NOT NULL AND end_location IS NOT NULL;
        
        -- Drop old columns after migration
        ALTER TABLE routes DROP COLUMN IF EXISTS start_location;
        ALTER TABLE routes DROP COLUMN IF EXISTS end_location;
        ALTER TABLE routes DROP COLUMN IF EXISTS route_name;
        ALTER TABLE routes DROP COLUMN IF EXISTS status;
        ALTER TABLE routes DROP COLUMN IF EXISTS vehicle_id;
    END IF;
    
    -- Ensure proper column names exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routes' AND column_name = 'name'
    ) THEN
        ALTER TABLE routes ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed Route';
    END IF;
    
END $$;

-- Update any vehicle mileage from km to miles if needed
-- This is a one-time conversion - only run if you're migrating from km to miles
-- Skip this section if you've already converted or if your data is already in miles

DO $$
BEGIN
    -- Check if we need to convert vehicle mileage
    -- Only convert if there are vehicles with high mileage values (likely in km)
    IF EXISTS (
        SELECT 1 FROM vehicles 
        WHERE mileage IS NOT NULL AND mileage > 10000
    ) THEN
        -- Convert high mileage values from km to miles
        UPDATE vehicles 
        SET mileage = mileage * 0.621371 
        WHERE mileage IS NOT NULL AND mileage > 1000;
        
        RAISE NOTICE 'Converted vehicle mileage from km to miles';
    ELSE
        RAISE NOTICE 'No vehicle mileage conversion needed - values appear to already be in miles';
    END IF;
END $$;

-- Add comment to track that mileage is in miles
COMMENT ON COLUMN vehicles.mileage IS 'Vehicle mileage in miles';

-- Update any remaining references to ensure consistency
-- Drop and recreate the routes function to handle the updated schema
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