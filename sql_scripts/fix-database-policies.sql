-- Fix for infinite recursion in RLS policies
-- This happens when policies reference the same table they're protecting

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view vehicles in their organization" ON vehicles;
DROP POLICY IF EXISTS "Admins and dispatchers can manage vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view routes in their organization" ON routes;
DROP POLICY IF EXISTS "Admins and dispatchers can manage routes" ON routes;
DROP POLICY IF EXISTS "Users can view tracking data in their organization" ON vehicle_tracking;
DROP POLICY IF EXISTS "System can insert tracking data" ON vehicle_tracking;

-- Fixed RLS Policies for Organizations
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        id = (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE USING (
        id = (
            SELECT u.org_id FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Fixed RLS Policies for Users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view colleagues in same organization" ON users
    FOR SELECT USING (
        org_id = (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        ) AND id != auth.uid()
    );

CREATE POLICY "Admins can manage users in their organization" ON users
    FOR ALL USING (
        org_id = (
            SELECT u.org_id FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Fixed RLS Policies for Vehicles
CREATE POLICY "Users can view vehicles in their organization" ON vehicles
    FOR SELECT USING (
        org_id = (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Admins and dispatchers can manage vehicles" ON vehicles
    FOR ALL USING (
        org_id = (
            SELECT u.org_id FROM users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'dispatcher')
        )
    );

-- Fixed RLS Policies for Routes
CREATE POLICY "Users can view routes in their organization" ON routes
    FOR SELECT USING (
        org_id = (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Admins and dispatchers can manage routes" ON routes
    FOR ALL USING (
        org_id = (
            SELECT u.org_id FROM users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'dispatcher')
        )
    );

-- Fixed RLS Policies for Vehicle Tracking
CREATE POLICY "Users can view tracking data in their organization" ON vehicle_tracking
    FOR SELECT USING (
        org_id = (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "System can insert tracking data" ON vehicle_tracking
    FOR INSERT WITH CHECK (
        org_id = (
            SELECT u.org_id FROM users u WHERE u.id = auth.uid()
        )
    );

-- Also need to allow users table to be inserted during signup
CREATE POLICY "Allow insert during signup" ON users
    FOR INSERT WITH CHECK (id = auth.uid()); 