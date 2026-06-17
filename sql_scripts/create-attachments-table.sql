-- Create attachments table for fleet equipment management
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'under_maintenance', 'lost')),
    last_known_location GEOGRAPHY(POINT, 4326),
    tag_id VARCHAR(255),
    last_attached_to UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    maintenance_interval_hrs INTEGER,
    notes TEXT,
    documents TEXT, -- URL to document
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attachments_org_id ON attachments(org_id);
CREATE INDEX IF NOT EXISTS idx_attachments_assigned_vehicle_id ON attachments(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_attachments_status ON attachments(status);
CREATE INDEX IF NOT EXISTS idx_attachments_is_active ON attachments(is_active);
CREATE INDEX IF NOT EXISTS idx_attachments_serial_number ON attachments(serial_number);

-- Create unique constraint for serial number within organization
ALTER TABLE attachments ADD CONSTRAINT unique_serial_per_org UNIQUE (org_id, serial_number);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attachments_updated_at
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_attachments_updated_at();

-- Create trigger to update last_attached_to when assigned_vehicle_id changes
CREATE OR REPLACE FUNCTION update_last_attached_to()
RETURNS TRIGGER AS $$
BEGIN
    -- If assigned_vehicle_id is being set (not null) and it's different from the old value
    IF NEW.assigned_vehicle_id IS NOT NULL AND (OLD.assigned_vehicle_id IS NULL OR OLD.assigned_vehicle_id != NEW.assigned_vehicle_id) THEN
        NEW.last_attached_to = NEW.assigned_vehicle_id;
        NEW.status = 'in_use';
    END IF;
    
    -- If assigned_vehicle_id is being unset (set to null)
    IF NEW.assigned_vehicle_id IS NULL AND OLD.assigned_vehicle_id IS NOT NULL THEN
        NEW.status = 'available';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_attached_to
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_last_attached_to();

-- Enable Row Level Security
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view attachments from their organization" ON attachments
    FOR SELECT USING (
        org_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert attachments for their organization" ON attachments
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update attachments from their organization" ON attachments
    FOR UPDATE USING (
        org_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete attachments from their organization" ON attachments
    FOR DELETE USING (
        org_id IN (
            SELECT organization_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Create RPC function to get attachments with vehicle details
CREATE OR REPLACE FUNCTION get_attachments_with_vehicle_details(organization_id UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    name TEXT,
    type TEXT,
    make TEXT,
    model TEXT,
    serial_number TEXT,
    assigned_vehicle_id UUID,
    assigned_vehicle_name TEXT,
    is_active BOOLEAN,
    status TEXT,
    last_known_location_lat NUMERIC,
    last_known_location_lng NUMERIC,
    tag_id TEXT,
    last_attached_to UUID,
    last_attached_vehicle_name TEXT,
    maintenance_interval_hrs INTEGER,
    notes TEXT,
    documents TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.org_id,
        a.name,
        a.type,
        a.make,
        a.model,
        a.serial_number,
        a.assigned_vehicle_id,
        av.plate_number AS assigned_vehicle_name,
        a.is_active,
        a.status,
        CASE 
            WHEN a.last_known_location IS NOT NULL 
            THEN ST_Y(a.last_known_location::geometry)
            ELSE NULL 
        END AS last_known_location_lat,
        CASE 
            WHEN a.last_known_location IS NOT NULL 
            THEN ST_X(a.last_known_location::geometry)
            ELSE NULL 
        END AS last_known_location_lng,
        a.tag_id,
        a.last_attached_to,
        lv.plate_number AS last_attached_vehicle_name,
        a.maintenance_interval_hrs,
        a.notes,
        a.documents,
        a.created_at,
        a.updated_at
    FROM attachments a
    LEFT JOIN vehicles av ON a.assigned_vehicle_id = av.id
    LEFT JOIN vehicles lv ON a.last_attached_to = lv.id
    WHERE a.org_id = organization_id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get single attachment with vehicle details
CREATE OR REPLACE FUNCTION get_attachment_with_vehicle_details(attachment_id UUID)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    name TEXT,
    type TEXT,
    make TEXT,
    model TEXT,
    serial_number TEXT,
    assigned_vehicle_id UUID,
    assigned_vehicle_name TEXT,
    is_active BOOLEAN,
    status TEXT,
    last_known_location_lat NUMERIC,
    last_known_location_lng NUMERIC,
    tag_id TEXT,
    last_attached_to UUID,
    last_attached_vehicle_name TEXT,
    maintenance_interval_hrs INTEGER,
    notes TEXT,
    documents TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.org_id,
        a.name,
        a.type,
        a.make,
        a.model,
        a.serial_number,
        a.assigned_vehicle_id,
        av.plate_number AS assigned_vehicle_name,
        a.is_active,
        a.status,
        CASE 
            WHEN a.last_known_location IS NOT NULL 
            THEN ST_Y(a.last_known_location::geometry)
            ELSE NULL 
        END AS last_known_location_lat,
        CASE 
            WHEN a.last_known_location IS NOT NULL 
            THEN ST_X(a.last_known_location::geometry)
            ELSE NULL 
        END AS last_known_location_lng,
        a.tag_id,
        a.last_attached_to,
        lv.plate_number AS last_attached_vehicle_name,
        a.maintenance_interval_hrs,
        a.notes,
        a.documents,
        a.created_at,
        a.updated_at
    FROM attachments a
    LEFT JOIN vehicles av ON a.assigned_vehicle_id = av.id
    LEFT JOIN vehicles lv ON a.last_attached_to = lv.id
    WHERE a.id = attachment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 