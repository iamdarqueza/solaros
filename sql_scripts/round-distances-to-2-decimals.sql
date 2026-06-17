-- Round all distance and mileage values to 2 decimal places for consistency

-- Round route distances to 2 decimal places
UPDATE routes 
SET estimated_distance_km = ROUND(estimated_distance_km::numeric, 2)
WHERE estimated_distance_km IS NOT NULL;

-- Round vehicle mileage to 2 decimal places
UPDATE vehicles 
SET mileage = ROUND(mileage::numeric, 2)
WHERE mileage IS NOT NULL;

-- Verify the changes
SELECT 
    'Routes' as table_name,
    COUNT(*) as total_records,
    COUNT(estimated_distance_km) as records_with_distance,
    AVG(estimated_distance_km) as avg_distance_miles
FROM routes
WHERE estimated_distance_km IS NOT NULL

UNION ALL

SELECT 
    'Vehicles' as table_name,
    COUNT(*) as total_records,
    COUNT(mileage) as records_with_mileage,
    AVG(mileage) as avg_mileage_miles
FROM vehicles
WHERE mileage IS NOT NULL; 