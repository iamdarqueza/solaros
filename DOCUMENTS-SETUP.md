# Documents System Setup Guide

The documents system requires database tables and storage bucket setup. Follow these steps to resolve current errors:

## 1. Create Database Tables

Run the SQL script to create the documents table and function:

```bash
# Execute the SQL file in your Supabase dashboard
psql -h your-supabase-host -U postgres -d postgres -f create-documents-table.sql
```

Or copy and paste the contents of `create-documents-table.sql` into your Supabase SQL Editor.

## 2. Create Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** > **Buckets**
2. Click **Create Bucket**
3. Name: `documents`
4. Set as **Public bucket**: `true` (for easy file access)
5. Click **Create bucket**

## 3. Set Storage Policies

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Storage** > **Policies** in your Supabase dashboard
2. Select the **documents** bucket
3. Click **Add Policy** for each policy below:

#### Policy 1: Upload Documents
- **Policy Name**: `Users can upload documents to their org folder`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'documents' AND
(storage.foldername(name))[1] IN (
  SELECT org_id::text FROM users WHERE id = auth.uid()
)
```

#### Policy 2: View Documents
- **Policy Name**: `Users can view documents from their org`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'documents' AND
(storage.foldername(name))[1] IN (
  SELECT org_id::text FROM users WHERE id = auth.uid()
)
```

#### Policy 3: Delete Documents
- **Policy Name**: `Users can delete documents from their org`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **Policy Definition**:
```sql
bucket_id = 'documents' AND
(storage.foldername(name))[1] IN (
  SELECT org_id::text FROM users WHERE id = auth.uid()
)
```


### Option B: Using SQL Editor (Alternative)

If you prefer SQL, run these commands in the **SQL Editor** (not Storage section):

```sql
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for uploading documents
CREATE POLICY "Users can upload documents to their org folder" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Policy for viewing documents
CREATE POLICY "Users can view documents from their org" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Policy for deleting documents
CREATE POLICY "Users can delete documents from their org" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM users WHERE id = auth.uid()
    )
  );
```

### Quick Setup (Simplified)

If the above policies are too complex, you can start with a simpler approach:

1. Go to **Storage** > **Policies**
2. Select the **documents** bucket
3. Add a single policy:
   - **Policy Name**: `Allow authenticated users full access`
   - **Allowed Operation**: `All`
   - **Target Roles**: `authenticated`
   - **Policy Definition**: `bucket_id = 'documents'`

⚠️ **Note**: The simplified approach allows all authenticated users to access all documents. Use the detailed policies above for proper multi-tenant security.

## 4. Test the System

After setup:

1. Navigate to `/vehicle-documents`
2. Click "Add Document"
3. Upload a test file
4. Verify it appears in the documents table

## Troubleshooting

### Error: "Documents table not found"
- Run the SQL script from step 1
- Verify the table exists in your Supabase dashboard

### Error: "Documents storage bucket not found"
- Create the storage bucket from step 2
- Verify bucket name is exactly "documents"

### Error: "Database function not available"
- The system will use fallback method automatically
- For full functionality, ensure the SQL script ran successfully

### Error: "Permission denied"
- Check RLS policies are set correctly
- Verify user authentication is working
- Ensure user has valid org_id in users table

## File Structure

Documents will be stored as:
```
documents/
  └── {org_id}/
      └── documents/
          ├── Document_Title_ABC123_2024-01-15T10-30-00.pdf
          ├── Insurance_XYZ789_2024-01-15T10-35-00.pdf
          └── Manual_SN12345_2024-01-15T10-40-00.pdf
```

## Security Notes

- Files are organized by organization ID
- RLS policies ensure users only access their org's documents
- File names include timestamps to prevent conflicts
- Storage policies restrict access to authenticated users only 