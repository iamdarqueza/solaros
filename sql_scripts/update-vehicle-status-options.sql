-- Update vehicles table status column constraint
-- Remove old constraint and add new one with updated status options

-- First, drop the existing check constraint if it exists
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;

-- Add new constraint with updated status options
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('active', 'idle', 'maintenance', 'offline'));

-- Update any existing 'en_route' status to 'active' since en_route is being removed
UPDATE vehicles 
SET status = 'active', updated_at = NOW()
WHERE status = 'en_route';

-- Update any existing 'error' status to 'offline' since error is being removed  
UPDATE vehicles 
SET status = 'offline', updated_at = NOW()
WHERE status = 'error';

-- Add index on status column for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Add comment for documentation
COMMENT ON COLUMN vehicles.status IS 'Vehicle operational status: active (assigned to dispatch), idle (available), maintenance (under repair), offline (not operational)';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated vehicles status column constraint!';
    RAISE NOTICE 'Valid status options are now: active, idle, maintenance, offline';
    RAISE NOTICE 'Updated existing en_route records to active';
    RAISE NOTICE 'Updated existing error records to offline';
END $$; 