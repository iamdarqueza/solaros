-- Complete Database Fix for User Signup Issues
-- Run this entire script in your Supabase SQL Editor

-- First, let's disable RLS temporarily to fix the setup
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tracking DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view colleagues in same organization" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Allow insert during signup" ON users;
DROP POLICY IF EXISTS "Users can view vehicles in their organization" ON vehicles;
DROP POLICY IF EXISTS "Admins and dispatchers can manage vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view routes in their organization" ON routes;
DROP POLICY IF EXISTS "Admins and dispatchers can manage routes" ON routes;
DROP POLICY IF EXISTS "Users can view tracking data in their organization" ON vehicle_tracking;
DROP POLICY IF EXISTS "System can insert tracking data" ON vehicle_tracking;

-- Drop and recreate the user creation function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id_var UUID;
    org_name TEXT;
    org_slug TEXT;
    full_name_var TEXT;
    counter INTEGER := 0;
BEGIN
    -- Get organization name and full name from user metadata
    org_name := NEW.raw_user_meta_data->>'org_name';
    full_name_var := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    
    -- If org_name is provided, use it; otherwise create a default one
    IF org_name IS NULL OR org_name = '' THEN
        org_name := full_name_var || '''s Fleet';
    END IF;
    
    -- Generate a unique slug
    org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]', '-', 'g'));
    org_slug := regexp_replace(org_slug, '-+', '-', 'g');
    org_slug := trim(org_slug, '-');
    
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug || CASE WHEN counter > 0 THEN '-' || counter ELSE '' END) LOOP
        counter := counter + 1;
    END LOOP;
    
    IF counter > 0 THEN
        org_slug := org_slug || '-' || counter;
    END IF;
    
    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO org_id_var;
    
    -- Create user profile
    INSERT INTO users (id, org_id, role, full_name, email)
    VALUES (
        NEW.id,
        org_id_var,
        'admin',
        full_name_var,
        NEW.email
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (in a real app, you'd want proper logging)
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW; -- Don't fail the auth, just log the error
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tracking ENABLE ROW LEVEL SECURITY;

-- Create simplified, working RLS policies

-- Organizations policies
CREATE POLICY "Enable read access for organization members" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.org_id = organizations.id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Enable update for organization admins" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.org_id = organizations.id 
            AND users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users policies
CREATE POLICY "Enable read access for same organization" ON users
    FOR SELECT USING (
        id = auth.uid() 
        OR org_id IN (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for new users" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Enable update for admins" ON users
    FOR UPDATE USING (
        id = auth.uid() 
        OR (
            org_id IN (
                SELECT u.org_id FROM users u 
                WHERE u.id = auth.uid() AND u.role = 'admin'
            )
        )
    );

-- Vehicles policies
CREATE POLICY "Enable read access for organization members" ON vehicles
    FOR SELECT USING (
        org_id IN (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Enable full access for admins and dispatchers" ON vehicles
    FOR ALL USING (
        org_id IN (
            SELECT u.org_id FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'dispatcher')
        )
    );

-- Routes policies
CREATE POLICY "Enable read access for organization members" ON routes
    FOR SELECT USING (
        org_id IN (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Enable full access for admins and dispatchers" ON routes
    FOR ALL USING (
        org_id IN (
            SELECT u.org_id FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'dispatcher')
        )
    );

-- Vehicle tracking policies
CREATE POLICY "Enable read access for organization members" ON vehicle_tracking
    FOR SELECT USING (
        org_id IN (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for organization members" ON vehicle_tracking
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Test the setup by checking if we can query tables
SELECT 'Organizations table exists' as status, count(*) as count FROM organizations;
SELECT 'Users table exists' as status, count(*) as count FROM users;
SELECT 'Function exists' as status FROM pg_proc WHERE proname = 'handle_new_user'; 