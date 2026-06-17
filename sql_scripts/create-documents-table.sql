-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vehicle', 'attachment')),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  attachment_id UUID REFERENCES attachments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle_id ON documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_attachment_id ON documents(attachment_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Enable RLS (Row Level Security)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view documents from their organization" ON documents
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert documents to their organization" ON documents
  FOR INSERT WITH CHECK (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update documents from their organization" ON documents
  FOR UPDATE USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete documents from their organization" ON documents
  FOR DELETE USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

-- Create a function to get documents with related information
CREATE OR REPLACE FUNCTION get_documents_with_details()
RETURNS TABLE (
  id UUID,
  org_id UUID,
  title TEXT,
  type TEXT,
  vehicle_id UUID,
  attachment_id UUID,
  file_url TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ,
  vehicle_plate_number TEXT,
  attachment_name TEXT,
  uploaded_by_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.org_id,
    d.title,
    d.type,
    d.vehicle_id,
    d.attachment_id,
    d.file_url,
    d.uploaded_by,
    d.created_at,
    v.plate_number as vehicle_plate_number,
    a.name as attachment_name,
    u.full_name as uploaded_by_email
  FROM documents d
  LEFT JOIN vehicles v ON d.vehicle_id = v.id
  LEFT JOIN attachments a ON d.attachment_id = a.id
  LEFT JOIN users u ON d.uploaded_by = u.id
  WHERE d.org_id = auth.jwt() ->> 'org_id'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 