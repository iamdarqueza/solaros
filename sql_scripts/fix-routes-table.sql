-- Fix routes table by dropping and recreating with proper structure
-- This script handles the case where the table already exists without the name column

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_routes_with_details(UUID);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_routes_updated_at ON routes;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_routes_updated_at();

-- Drop existing table if it exists (be careful - this will delete data!)
DROP TABLE IF EXISTS routes;

-- Create routes table with correct structure
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    origin_location GEOGRAPHY(Point, 4326) NOT NULL,
    destination_location GEOGRAPHY(Point, 4326) NOT NULL,
    waypoints JSONB,
    estimated_distance_km FLOAT,
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_routes_org_id ON routes(org_id);
CREATE INDEX idx_routes_created_at ON routes(created_at);
CREATE INDEX idx_routes_name ON routes(name);

-- Create spatial indexes for geography columns
CREATE INDEX idx_routes_origin_location ON routes USING GIST(origin_location);
CREATE INDEX idx_routes_destination_location ON routes USING GIST(destination_location);

-- Enable RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view routes from their organization" ON routes
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert routes for their organization" ON routes
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update routes from their organization" ON routes
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete routes from their organization" ON routes
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_routes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_routes_updated_at();

-- Create function to get routes with additional details
CREATE OR REPLACE FUNCTION get_routes_with_details(org_uuid UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    name TEXT,
    origin_location GEOGRAPHY(Point, 4326),
    destination_location GEOGRAPHY(Point, 4326),
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    waypoints JSONB,
    estimated_distance_km FLOAT,
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.org_id,
        r.name,
        r.origin_location,
        r.destination_location,
        ST_Y(r.origin_location::geometry) as origin_lat,
        ST_X(r.origin_location::geometry) as origin_lng,
        ST_Y(r.destination_location::geometry) as destination_lat,
        ST_X(r.destination_location::geometry) as destination_lng,
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