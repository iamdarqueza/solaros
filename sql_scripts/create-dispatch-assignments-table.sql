-- Create dispatch_assignments table
CREATE TABLE dispatch_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    attachment_id UUID REFERENCES attachments(id) ON DELETE SET NULL,
    route_type TEXT NOT NULL CHECK (route_type IN ('Delivery', 'Pickup', 'Return', 'Transfer', 'Service', 'Inspection', 'Recovery', 'Demo', 'Deployment', 'Collection')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in progress', 'completed', 'delayed', 'cancelled')),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    instructions TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_dispatch_assignments_org_id ON dispatch_assignments(org_id);
CREATE INDEX idx_dispatch_assignments_vehicle_id ON dispatch_assignments(vehicle_id);
CREATE INDEX idx_dispatch_assignments_driver_id ON dispatch_assignments(driver_id);
CREATE INDEX idx_dispatch_assignments_route_id ON dispatch_assignments(route_id);
CREATE INDEX idx_dispatch_assignments_status ON dispatch_assignments(status);
CREATE INDEX idx_dispatch_assignments_priority ON dispatch_assignments(priority);
CREATE INDEX idx_dispatch_assignments_route_type ON dispatch_assignments(route_type);
CREATE INDEX idx_dispatch_assignments_created_by ON dispatch_assignments(created_by);
CREATE INDEX idx_dispatch_assignments_created_at ON dispatch_assignments(created_at);
CREATE INDEX idx_dispatch_assignments_updated_at ON dispatch_assignments(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE dispatch_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispatch_assignments
CREATE POLICY "Users can view dispatch assignments in their organization" ON dispatch_assignments
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and dispatchers can manage dispatch assignments" ON dispatch_assignments
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'dispatcher')
        )
    );

CREATE POLICY "Drivers can view their own assignments" ON dispatch_assignments
    FOR SELECT USING (
        driver_id = auth.uid()
        OR org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Drivers can update status of their own assignments" ON dispatch_assignments
    FOR UPDATE USING (
        driver_id = auth.uid()
    ) WITH CHECK (
        driver_id = auth.uid()
        AND status IN ('in progress', 'completed', 'delayed')
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dispatch_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_dispatch_assignments_updated_at
    BEFORE UPDATE ON dispatch_assignments
    FOR EACH ROW EXECUTE FUNCTION update_dispatch_assignments_updated_at();

-- Function to get dispatch assignments with details
CREATE OR REPLACE FUNCTION get_dispatch_assignments_with_details(org_uuid UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    vehicle_id UUID,
    vehicle_name TEXT,
    vehicle_plate TEXT,
    driver_id UUID,
    driver_name TEXT,
    driver_email TEXT,
    attachment_id UUID,
    attachment_name TEXT,
    route_type TEXT,
    status TEXT,
    route_id UUID,
    route_name TEXT,
    route_origin TEXT,
    route_destination TEXT,
    route_distance DOUBLE PRECISION,
    instructions TEXT,
    priority TEXT,
    created_by UUID,
    created_by_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id,
        da.org_id,
        da.vehicle_id,
        v.name as vehicle_name,
        v.plate_number as vehicle_plate,
        da.driver_id,
        du.full_name as driver_name,
        du.email as driver_email,
        da.attachment_id,
        a.name as attachment_name,
        da.route_type,
        da.status,
        da.route_id,
        r.name as route_name,
        r.origin_location_name as route_origin,
        r.destination_location_name as route_destination,
        r.estimated_distance_km as route_distance,
        da.instructions,
        da.priority,
        da.created_by,
        cu.full_name as created_by_name,
        da.created_at,
        da.updated_at
    FROM dispatch_assignments da
    LEFT JOIN vehicles v ON v.id = da.vehicle_id
    LEFT JOIN users du ON du.id = da.driver_id
    LEFT JOIN attachments a ON a.id = da.attachment_id
    LEFT JOIN routes r ON r.id = da.route_id
    LEFT JOIN users cu ON cu.id = da.created_by
    WHERE da.org_id = org_uuid
    ORDER BY 
        CASE da.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
        END,
        da.created_at DESC;
END;
$$;

-- Function to get dispatch statistics for summary
CREATE OR REPLACE FUNCTION get_dispatch_statistics(
    org_uuid UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_dispatches BIGINT,
    scheduled_count BIGINT,
    in_progress_count BIGINT,
    completed_count BIGINT,
    delayed_count BIGINT,
    cancelled_count BIGINT,
    urgent_count BIGINT,
    high_count BIGINT,
    normal_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_dispatches,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count,
        COUNT(*) FILTER (WHERE status = 'in progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'delayed') as delayed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
        COUNT(*) FILTER (WHERE priority = 'high') as high_count,
        COUNT(*) FILTER (WHERE priority = 'normal') as normal_count
    FROM dispatch_assignments
    WHERE org_id = org_uuid
        AND (start_date IS NULL OR DATE(created_at) >= start_date)
        AND (end_date IS NULL OR DATE(created_at) <= end_date);
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON dispatch_assignments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE dispatch_assignments IS 'Table storing dispatch assignments linking vehicles, drivers, routes and equipment';
COMMENT ON COLUMN dispatch_assignments.route_type IS 'Type of route operation: Delivery, Pickup, Return, Transfer, Service, Inspection, Recovery, Demo, Deployment, Collection';
COMMENT ON COLUMN dispatch_assignments.status IS 'Current status of the dispatch assignment';
COMMENT ON COLUMN dispatch_assignments.priority IS 'Priority level: normal, high, urgent';
COMMENT ON COLUMN dispatch_assignments.instructions IS 'Special instructions for the dispatch assignment';
COMMENT ON COLUMN dispatch_assignments.created_by IS 'User who created/assigned this dispatch';

-- Example queries for testing
/*
-- Create a sample dispatch assignment
INSERT INTO dispatch_assignments (
    org_id, 
    vehicle_id, 
    route_id, 
    route_type, 
    priority, 
    created_by,
    instructions
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000', -- org_id
    '456e7890-e89b-12d3-a456-426614174001', -- vehicle_id
    '789e0123-e89b-12d3-a456-426614174002', -- route_id
    'Delivery',
    'high',
    '012e3456-e89b-12d3-a456-426614174003', -- created_by
    'Handle with care - fragile items'
);

-- Get all dispatch assignments for an organization
SELECT * FROM get_dispatch_assignments_with_details('123e4567-e89b-12d3-a456-426614174000');

-- Get dispatch statistics
SELECT * FROM get_dispatch_statistics('123e4567-e89b-12d3-a456-426614174000');

-- Get today's statistics
SELECT * FROM get_dispatch_statistics(
    '123e4567-e89b-12d3-a456-426614174000',
    CURRENT_DATE,
    CURRENT_DATE
);
*/ 