-- Update dispatch_assignments table to add time tracking and performance metrics
-- This script adds new columns for comprehensive time and performance tracking

-- Add new columns to dispatch_assignments table
ALTER TABLE dispatch_assignments 
ADD COLUMN IF NOT EXISTS planned_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS planned_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delay_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS duration_expected_minutes INTEGER,
ADD COLUMN IF NOT EXISTS duration_actual_minutes INTEGER;

-- Add indexes for the new time-related columns for better query performance
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_planned_start_time ON dispatch_assignments(planned_start_time);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_planned_end_time ON dispatch_assignments(planned_end_time);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_actual_start_time ON dispatch_assignments(actual_start_time);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_actual_end_time ON dispatch_assignments(actual_end_time);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_on_time ON dispatch_assignments(on_time);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_delay_minutes ON dispatch_assignments(delay_minutes);

-- Function to automatically calculate time-related metrics
CREATE OR REPLACE FUNCTION calculate_dispatch_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate duration_actual_minutes when both start and end times are set
    IF NEW.actual_start_time IS NOT NULL AND NEW.actual_end_time IS NOT NULL THEN
        NEW.duration_actual_minutes = EXTRACT(EPOCH FROM (NEW.actual_end_time - NEW.actual_start_time)) / 60;
    END IF;

    -- Calculate duration_expected_minutes when both planned start and end times are set
    IF NEW.planned_start_time IS NOT NULL AND NEW.planned_end_time IS NOT NULL THEN
        NEW.duration_expected_minutes = EXTRACT(EPOCH FROM (NEW.planned_end_time - NEW.planned_start_time)) / 60;
    END IF;

    -- Calculate delay_minutes and on_time status when actual_start_time is set
    IF NEW.actual_start_time IS NOT NULL AND NEW.planned_start_time IS NOT NULL THEN
        NEW.delay_minutes = GREATEST(0, EXTRACT(EPOCH FROM (NEW.actual_start_time - NEW.planned_start_time)) / 60);
        NEW.on_time = (NEW.actual_start_time <= NEW.planned_start_time + INTERVAL '5 minutes'); -- 5-minute grace period
    END IF;

    -- Auto-update status based on time tracking
    IF NEW.actual_start_time IS NOT NULL AND NEW.actual_end_time IS NULL AND NEW.status = 'scheduled' THEN
        NEW.status = 'in progress';
    ELSIF NEW.actual_end_time IS NOT NULL AND NEW.status IN ('scheduled', 'in progress') THEN
        NEW.status = 'completed';
    ELSIF NEW.delay_minutes > 15 AND NEW.status = 'scheduled' THEN
        NEW.status = 'delayed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate metrics
DROP TRIGGER IF EXISTS trigger_calculate_dispatch_metrics ON dispatch_assignments;
CREATE TRIGGER trigger_calculate_dispatch_metrics
    BEFORE INSERT OR UPDATE ON dispatch_assignments
    FOR EACH ROW EXECUTE FUNCTION calculate_dispatch_metrics();

-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS get_dispatch_assignments_with_details(UUID);

-- Update the get_dispatch_assignments_with_details function to include new fields
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
    planned_start_time TIMESTAMPTZ,
    planned_end_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    delay_minutes INTEGER,
    on_time BOOLEAN,
    duration_expected_minutes INTEGER,
    duration_actual_minutes INTEGER,
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
        da.planned_start_time,
        da.planned_end_time,
        da.actual_start_time,
        da.actual_end_time,
        da.delay_minutes,
        da.on_time,
        da.duration_expected_minutes,
        da.duration_actual_minutes,
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
        da.planned_start_time ASC NULLS LAST,
        da.created_at DESC;
END;
$$;

-- Enhanced dispatch statistics function with performance metrics
CREATE OR REPLACE FUNCTION get_dispatch_statistics_with_performance(
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
    normal_count BIGINT,
    on_time_count BIGINT,
    late_count BIGINT,
    on_time_percentage DECIMAL(5,2),
    avg_delay_minutes DECIMAL(10,2),
    avg_duration_expected DECIMAL(10,2),
    avg_duration_actual DECIMAL(10,2),
    performance_efficiency DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_completed BIGINT;
    total_on_time BIGINT;
    total_late BIGINT;
BEGIN
    -- Get basic counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'scheduled'),
        COUNT(*) FILTER (WHERE status = 'in progress'),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'delayed'),
        COUNT(*) FILTER (WHERE status = 'cancelled'),
        COUNT(*) FILTER (WHERE priority = 'urgent'),
        COUNT(*) FILTER (WHERE priority = 'high'),
        COUNT(*) FILTER (WHERE priority = 'normal'),
        COUNT(*) FILTER (WHERE on_time = true),
        COUNT(*) FILTER (WHERE on_time = false)
    INTO 
        total_dispatches,
        scheduled_count,
        in_progress_count,
        completed_count,
        delayed_count,
        cancelled_count,
        urgent_count,
        high_count,
        normal_count,
        on_time_count,
        late_count
    FROM dispatch_assignments
    WHERE org_id = org_uuid
        AND (start_date IS NULL OR DATE(created_at) >= start_date)
        AND (end_date IS NULL OR DATE(created_at) <= end_date);

    -- Calculate performance metrics
    SELECT 
        CASE 
            WHEN (on_time_count + late_count) > 0 
            THEN ROUND((on_time_count::DECIMAL / (on_time_count + late_count)) * 100, 2)
            ELSE NULL 
        END,
        ROUND(AVG(delay_minutes), 2),
        ROUND(AVG(duration_expected_minutes), 2),
        ROUND(AVG(duration_actual_minutes), 2),
        CASE 
            WHEN AVG(duration_expected_minutes) > 0 AND AVG(duration_actual_minutes) > 0
            THEN ROUND((AVG(duration_expected_minutes) / AVG(duration_actual_minutes)) * 100, 2)
            ELSE NULL 
        END
    INTO 
        on_time_percentage,
        avg_delay_minutes,
        avg_duration_expected,
        avg_duration_actual,
        performance_efficiency
    FROM dispatch_assignments
    WHERE org_id = org_uuid
        AND (start_date IS NULL OR DATE(created_at) >= start_date)
        AND (end_date IS NULL OR DATE(created_at) <= end_date)
        AND status = 'completed';

    RETURN QUERY
    SELECT 
        total_dispatches,
        scheduled_count,
        in_progress_count,
        completed_count,
        delayed_count,
        cancelled_count,
        urgent_count,
        high_count,
        normal_count,
        on_time_count,
        late_count,
        COALESCE(on_time_percentage, 0.00),
        COALESCE(avg_delay_minutes, 0.00),
        COALESCE(avg_duration_expected, 0.00),
        COALESCE(avg_duration_actual, 0.00),
        COALESCE(performance_efficiency, 0.00);
END;
$$;

-- Function to start a dispatch (set actual_start_time)
CREATE OR REPLACE FUNCTION start_dispatch(dispatch_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE dispatch_assignments 
    SET 
        actual_start_time = NOW(),
        status = 'in progress'
    WHERE id = dispatch_id 
        AND status = 'scheduled'
        AND org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        );
    
    RETURN FOUND;
END;
$$;

-- Function to complete a dispatch (set actual_end_time)
CREATE OR REPLACE FUNCTION complete_dispatch(dispatch_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE dispatch_assignments 
    SET 
        actual_end_time = NOW(),
        status = 'completed'
    WHERE id = dispatch_id 
        AND status IN ('in progress', 'scheduled')
        AND org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        );
    
    RETURN FOUND;
END;
$$;

-- Function to update planned times for a dispatch
CREATE OR REPLACE FUNCTION update_dispatch_planned_times(
    dispatch_id UUID,
    new_planned_start TIMESTAMPTZ,
    new_planned_end TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE dispatch_assignments 
    SET 
        planned_start_time = new_planned_start,
        planned_end_time = new_planned_end
    WHERE id = dispatch_id 
        AND org_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        );
    
    RETURN FOUND;
END;
$$;

-- Add comments for the new columns
COMMENT ON COLUMN dispatch_assignments.planned_start_time IS 'Scheduled start time for the dispatch';
COMMENT ON COLUMN dispatch_assignments.planned_end_time IS 'Scheduled completion time for the dispatch';
COMMENT ON COLUMN dispatch_assignments.actual_start_time IS 'Actual time when dispatch was started';
COMMENT ON COLUMN dispatch_assignments.actual_end_time IS 'Actual time when dispatch was completed';
COMMENT ON COLUMN dispatch_assignments.delay_minutes IS 'Minutes delayed from planned start time';
COMMENT ON COLUMN dispatch_assignments.on_time IS 'Whether the dispatch started on time (within 5-minute grace period)';
COMMENT ON COLUMN dispatch_assignments.duration_expected_minutes IS 'Expected duration in minutes (planned_end - planned_start)';
COMMENT ON COLUMN dispatch_assignments.duration_actual_minutes IS 'Actual duration in minutes (actual_end - actual_start)';

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION get_dispatch_assignments_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dispatch_statistics_with_performance(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION start_dispatch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_dispatch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_dispatch_planned_times(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated; 