-- Update vehicle mileage from kilometers to miles
-- 1 kilometer = 0.621371 miles

-- Only update if mileage seems to be in kilometers (typically higher values)
-- This is a conservative approach to avoid converting already converted data
UPDATE vehicles 
SET mileage = mileage * 0.621371 
WHERE mileage IS NOT NULL 
  AND mileage > 1000; -- Only convert values that seem like they might be in km

-- Add a comment to track the conversion
COMMENT ON COLUMN vehicles.mileage IS 'Vehicle mileage in miles'; 