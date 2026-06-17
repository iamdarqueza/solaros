-- Fix the start_dispatch function to work properly with Supabase RPC
-- The issue is with the return type structure and status values

DROP FUNCTION IF EXISTS start_dispatch(UUID);

CREATE OR REPLACE FUNCTION start_dispatch(dispatch_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    updated_rows INTEGER;
BEGIN
    -- Update the dispatch
    UPDATE dispatch_assignments 
    SET 
        actual_start_time = NOW(),
        status = 'in progress',
        updated_at = NOW()
    WHERE id = dispatch_id 
        AND status IN ('scheduled', 'delayed')
        AND org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        );
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    -- Return a JSON result
    IF updated_rows > 0 THEN
        result := json_build_object(
            'success', true,
            'message', 'Dispatch started successfully',
            'updated_rows', updated_rows
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', 'No dispatch found or already started',
            'updated_rows', 0
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION start_dispatch(UUID) TO authenticated;

-- Also create a simpler boolean version as backup
CREATE OR REPLACE FUNCTION start_dispatch_simple(dispatch_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE dispatch_assignments 
    SET 
        actual_start_time = NOW(),
        status = 'in progress',
        updated_at = NOW()
    WHERE id = dispatch_id 
        AND status IN ('scheduled', 'delayed')
        AND org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        );
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION start_dispatch_simple(UUID) TO authenticated; 