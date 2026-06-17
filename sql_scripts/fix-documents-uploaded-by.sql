-- Fix documents uploaded_by to show full_name from users table
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS get_documents_with_details(UUID);
DROP FUNCTION IF EXISTS get_documents_with_details();

-- Recreate the function to use full_name from users table
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
  WHERE d.org_id = (auth.jwt() ->> 'org_id')::uuid
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 