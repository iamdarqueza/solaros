-- Update vehicles table to include all required fields for fleet management
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS make VARCHAR(100),
ADD COLUMN IF NOT EXISTS model VARCHAR(100),
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS vin VARCHAR(17),
ADD COLUMN IF NOT EXISTS mileage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuel_level INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_route VARCHAR(255);

-- Update the vehicle_tracking table to ensure proper indexing
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_vehicle_id ON vehicle_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_timestamp ON vehicle_tracking(timestamp);

-- Update the routes table structure
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_id ON routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);

-- Sample data for testing (optional - remove if you don't want sample data)
INSERT INTO vehicles (
  org_id, 
  name, 
  plate_number, 
  vehicle_type, 
  status, 
  location, 
  make, 
  model, 
  year, 
  vin, 
  mileage, 
  fuel_level, 
  driver_name, 
  driver_phone,
  created_at,
  updated_at
) VALUES 
(
  (SELECT id FROM organizations LIMIT 1), -- Use first organization
  'Fleet Truck Alpha',
  'FLT-001',
  'truck',
  'idle',
  '{"latitude": 40.7128, "longitude": -74.0060}',
  'Ford',
  'Transit 350',
  2022,
  '1FTBW2CM8NKA12345',
  45670,
  75,
  'John Smith',
  '+1 (555) 123-4567',
  NOW(),
  NOW()
),
(
  (SELECT id FROM organizations LIMIT 1),
  'Cargo Van Beta',
  'FLT-002',
  'van',
  'en_route',
  '{"latitude": 40.6782, "longitude": -73.9442}',
  'Mercedes',
  'Sprinter 2500',
  2021,
  'WD3PE8CC5M5123456',
  32450,
  60,
  'Sarah Johnson',
  '+1 (555) 987-6543',
  NOW(),
  NOW()
),
(
  (SELECT id FROM organizations LIMIT 1),
  'Delivery Car Gamma',
  'FLT-003',
  'car',
  'maintenance',
  '{"latitude": 40.7282, "longitude": -73.7949}',
  'Toyota',
  'Prius',
  2023,
  'JTDKAMFU1N3123456',
  12340,
  90,
  'Mike Wilson',
  '+1 (555) 456-7890',
  NOW(),
  NOW()
)
ON CONFLICT (plate_number) DO NOTHING; 