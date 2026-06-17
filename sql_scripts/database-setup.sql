-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'dispatcher', 'viewer')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plate_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('truck', 'van', 'car', 'autonomous')),
    location GEOGRAPHY(POINT, 4326),
    status TEXT NOT NULL CHECK (status IN ('idle', 'en_route', 'maintenance', 'offline', 'error')),
    av_events JSONB DEFAULT '{}',
    driver_name TEXT,
    fuel_level INTEGER CHECK (fuel_level >= 0 AND fuel_level <= 100),
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    speed NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, plate_number)
);

-- Routes table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    route_name TEXT NOT NULL,
    start_location GEOGRAPHY(POINT, 4326) NOT NULL,
    end_location GEOGRAPHY(POINT, 4326) NOT NULL,
    waypoints JSONB DEFAULT '[]',
    distance_km NUMERIC(10,2),
    estimated_duration_minutes INTEGER,
    status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle tracking history table
CREATE TABLE vehicle_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    speed NUMERIC(5,2) DEFAULT 0,
    heading NUMERIC(5,2), -- Direction in degrees (0-360)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_vehicles_org_id ON vehicles(org_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(location);
CREATE INDEX idx_routes_org_id ON routes(org_id);
CREATE INDEX idx_routes_vehicle_id ON routes(vehicle_id);
CREATE INDEX idx_vehicle_tracking_org_id ON vehicle_tracking(org_id);
CREATE INDEX idx_vehicle_tracking_vehicle_id ON vehicle_tracking(vehicle_id);
CREATE INDEX idx_vehicle_tracking_timestamp ON vehicle_tracking(timestamp);
CREATE INDEX idx_vehicle_tracking_location ON vehicle_tracking USING GIST(location);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Organizations
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for Users
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage users in their organization" ON users
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for Vehicles
CREATE POLICY "Users can view vehicles in their organization" ON vehicles
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and dispatchers can manage vehicles" ON vehicles
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'dispatcher')
        )
    );

-- RLS Policies for Routes
CREATE POLICY "Users can view routes in their organization" ON routes
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and dispatchers can manage routes" ON routes
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'dispatcher')
        )
    );

-- RLS Policies for Vehicle Tracking
CREATE POLICY "Users can view tracking data in their organization" ON vehicle_tracking
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can insert tracking data" ON vehicle_tracking
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

-- Function to automatically create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id_var UUID;
    org_name TEXT;
    org_slug TEXT;
BEGIN
    -- Get organization name from user metadata
    org_name := NEW.raw_user_meta_data->>'org_name';
    
    -- If org_name is provided, create new organization
    IF org_name IS NOT NULL THEN
        -- Generate slug from org name
        org_slug := lower(replace(org_name, ' ', '-'));
        
        -- Create organization
        INSERT INTO organizations (name, slug)
        VALUES (org_name, org_slug)
        RETURNING id INTO org_id_var;
        
        -- Create user as admin of new organization
        INSERT INTO users (id, org_id, role, full_name, email)
        VALUES (
            NEW.id,
            org_id_var,
            'admin',
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.email
        );
    ELSE
        -- For Google OAuth users without org, create a default organization
        org_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Fleet';
        org_slug := lower(replace(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', '-')) || '-fleet';
        
        INSERT INTO organizations (name, slug)
        VALUES (org_name, org_slug)
        RETURNING id INTO org_id_var;
        
        INSERT INTO users (id, org_id, role, full_name, email)
        VALUES (
            NEW.id,
            org_id_var,
            'admin',
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.email
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO organizations (name, slug) VALUES 
--     ('Acme Logistics', 'acme-logistics'),
--     ('FastTrack Delivery', 'fasttrack-delivery');

-- INSERT INTO vehicles (org_id, plate_number, vehicle_type, location, status, driver_name, fuel_level) VALUES
--     ((SELECT id FROM organizations WHERE slug = 'acme-logistics'), 'ABC-123', 'truck', ST_GeogFromText('POINT(-74.0060 40.7128)'), 'active', 'John Smith', 75),
--     ((SELECT id FROM organizations WHERE slug = 'acme-logistics'), 'DEF-456', 'van', ST_GeogFromText('POINT(-73.9851 40.7589)'), 'idle', 'Jane Doe', 60); 