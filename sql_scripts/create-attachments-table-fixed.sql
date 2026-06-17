-- Drop existing functions if they exist (to handle return type changes)
DROP FUNCTION IF EXISTS get_attachments_with_vehicle_details(uuid);
DROP FUNCTION IF EXISTS get_attachment_with_vehicle_details(uuid);

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
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'under_maintenance', 'lost', 'offline')),
    last_known_location GEOGRAPHY(POINT, 4326),
    beacon_id VARCHAR(255),
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
CREATE INDEX IF NOT EXISTS idx_attachments_serial_number ON attachments(serial_number);

-- Create unique constraint for serial number within organization
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_serial_per_org'
    ) THEN
        ALTER TABLE attachments ADD CONSTRAINT unique_serial_per_org UNIQUE (org_id, serial_number);
    END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attachments_updated_at ON attachments;
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

DROP TRIGGER IF EXISTS trigger_update_last_attached_to ON attachments;
CREATE TRIGGER trigger_update_last_attached_to
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_last_attached_to();

-- Enable Row Level Security
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view attachments from their organization" ON attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their organization" ON attachments;
DROP POLICY IF EXISTS "Users can update attachments from their organization" ON attachments;
DROP POLICY IF EXISTS "Users can delete attachments from their organization" ON attachments;

-- Create RLS policies - First, let's try with the most common user_organizations structure
-- Option 1: If your user_organizations table has user_id and organization_id columns
DO $$ 
BEGIN
    -- Check if user_organizations table exists and has the expected columns
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_organizations'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_organizations' AND column_name = 'user_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_organizations' AND column_name = 'organization_id'
    ) THEN
        -- Use user_organizations table structure
        EXECUTE 'CREATE POLICY "Users can view attachments from their organization" ON attachments
            FOR SELECT USING (
                org_id IN (
                    SELECT organization_id FROM user_organizations 
                    WHERE user_id = auth.uid()
                )
            )';
        
        EXECUTE 'CREATE POLICY "Users can insert attachments for their organization" ON attachments
            FOR INSERT WITH CHECK (
                org_id IN (
                    SELECT organization_id FROM user_organizations 
                    WHERE user_id = auth.uid()
                )
            )';
        
        EXECUTE 'CREATE POLICY "Users can update attachments from their organization" ON attachments
            FOR UPDATE USING (
                org_id IN (
                    SELECT organization_id FROM user_organizations 
                    WHERE user_id = auth.uid()
                )
            )';
        
        EXECUTE 'CREATE POLICY "Users can delete attachments from their organization" ON attachments
            FOR DELETE USING (
                org_id IN (
                    SELECT organization_id FROM user_organizations 
                    WHERE user_id = auth.uid()
                )
            )';
    
    -- Option 2: If you have a profiles table with organization_id
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'organization_id'
    ) THEN
        -- Use profiles table structure
        EXECUTE 'CREATE POLICY "Users can view attachments from their organization" ON attachments
            FOR SELECT USING (
                org_id = (
                    SELECT organization_id FROM profiles 
                    WHERE id = auth.uid()
                )
            )';
        
        EXECUTE 'CREATE POLICY "Users can insert attachments for their organization" ON attachments
            FOR INSERT WITH CHECK (
                org_id = (
                    SELECT organization_id FROM profiles 
                    WHERE id = auth.uid()
                )
            )';
        
        EXECUTE 'CREATE POLICY "Users can update attachments from their organization" ON attachments
            FOR UPDATE USING (
                org_id = (
                    SELECT organization_id FROM profiles 
                    WHERE id = auth.uid()
                )
            )';
        
        EXECUTE 'CREATE POLICY "Users can delete attachments from their organization" ON attachments
            FOR DELETE USING (
                org_id = (
                    SELECT organization_id FROM profiles 
                    WHERE id = auth.uid()
                )
            )';
    
    -- Option 3: If you have auth.users with raw_user_meta_data containing organization_id
    ELSE
        -- Fallback to using auth.users metadata or create simple policies for testing
        EXECUTE 'CREATE POLICY "Users can view attachments from their organization" ON attachments
            FOR SELECT USING (true)'; -- Temporarily allow all for testing
        
        EXECUTE 'CREATE POLICY "Users can insert attachments for their organization" ON attachments
            FOR INSERT WITH CHECK (true)'; -- Temporarily allow all for testing
        
        EXECUTE 'CREATE POLICY "Users can update attachments from their organization" ON attachments
            FOR UPDATE USING (true)'; -- Temporarily allow all for testing
        
        EXECUTE 'CREATE POLICY "Users can delete attachments from their organization" ON attachments
            FOR DELETE USING (true)'; -- Temporarily allow all for testing
        
        -- Log a notice about the fallback policies
        RAISE NOTICE 'Created fallback RLS policies. Please update them based on your user-organization relationship structure.';
    END IF;
END $$;

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
    status TEXT,
    last_known_location_lat NUMERIC,
    last_known_location_lng NUMERIC,
    beacon_id TEXT,
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
        a.name::TEXT,
        a.type::TEXT,
        a.make::TEXT,
        a.model::TEXT,
        a.serial_number::TEXT,
        a.assigned_vehicle_id,
        COALESCE(av.plate_number, '')::TEXT AS assigned_vehicle_name,
        a.status::TEXT,
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
        COALESCE(a.beacon_id, '')::TEXT,
        a.last_attached_to,
        COALESCE(lv.plate_number, '')::TEXT AS last_attached_vehicle_name,
        a.maintenance_interval_hrs,
        COALESCE(a.notes, '')::TEXT,
        COALESCE(a.documents, '')::TEXT,
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
    status TEXT,
    last_known_location_lat NUMERIC,
    last_known_location_lng NUMERIC,
    beacon_id TEXT,
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
        a.name::TEXT,
        a.type::TEXT,
        a.make::TEXT,
        a.model::TEXT,
        a.serial_number::TEXT,
        a.assigned_vehicle_id,
        COALESCE(av.plate_number, '')::TEXT AS assigned_vehicle_name,
        a.status::TEXT,
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
        COALESCE(a.beacon_id, '')::TEXT,
        a.last_attached_to,
        COALESCE(lv.plate_number, '')::TEXT AS last_attached_vehicle_name,
        a.maintenance_interval_hrs,
        COALESCE(a.notes, '')::TEXT,
        COALESCE(a.documents, '')::TEXT,
        a.created_at,
        a.updated_at
    FROM attachments a
    LEFT JOIN vehicles av ON a.assigned_vehicle_id = av.id
    LEFT JOIN vehicles lv ON a.last_attached_to = lv.id
    WHERE a.id = attachment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Display information about the created policies
DO $$
BEGIN
    RAISE NOTICE 'Attachments table and functions created successfully!';
    RAISE NOTICE 'If you see fallback policies, please check your user-organization table structure and update the RLS policies accordingly.';
    RAISE NOTICE 'You can check your table structure with: SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN (''user_organizations'', ''profiles'') ORDER BY table_name, column_name;';
END $$; 