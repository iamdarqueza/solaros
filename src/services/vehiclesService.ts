import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/supabase';

// Utility function to safely transform geography data
function transformLocation(location: unknown): { latitude: number; longitude: number } | null {
  if (!location) return null;
  
  // Handle string format like "POINT(-74.0060 40.7128)"
  if (typeof location === 'string') {
    const pointMatch = location.match(/POINT\(([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\)/);
    if (pointMatch) {
      const longitude = parseFloat(pointMatch[1]);
      const latitude = parseFloat(pointMatch[2]);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
    return null;
  }
  
  // Handle array format [lng, lat] (GeoJSON style)
  if (Array.isArray(location) && location.length >= 2) {
    const [lng, lat] = location;
    if (typeof lng === 'number' && typeof lat === 'number') {
      return { latitude: lat, longitude: lng };
    }
  }
  
  // Handle object format { latitude, longitude } or { lat, lng }
  if (typeof location === 'object' && location !== null) {
    const locObj = location as Record<string, unknown>;
    if ('latitude' in locObj && 'longitude' in locObj && 
        typeof locObj.latitude === 'number' && typeof locObj.longitude === 'number') {
      return { latitude: locObj.latitude, longitude: locObj.longitude };
    }
    if ('lat' in locObj && 'lng' in locObj && 
        typeof locObj.lat === 'number' && typeof locObj.lng === 'number') {
      return { latitude: locObj.lat, longitude: locObj.lng };
    }
  }
  
  return null;
}

// Extended Vehicle interface for the UI
export interface VehicleWithDetails {
  id: string;
  org_id: string;
  name: string;
  plate_number: string;
  vehicle_type: 'logistics_freight' | 'electric_autonomous' | 'utility_support' | 'simulated_truck';
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  assigned_branch?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  av_enabled?: boolean;
  is_electric?: boolean;
  battery_capacity?: number;
  mileage?: number;
  fuel_level?: number;
  driver_name?: string;
  driver_phone?: string;
  current_route?: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  created_at: string;
  updated_at: string;
  last_tracking?: VehicleTracking;
  current_route_info?: Route;
}

export interface VehicleTracking {
  id: string;
  vehicle_id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  speed?: number;
  heading?: number;
  timestamp: string;
  created_at: string;
}

export interface Route {
  id: string;
  org_id: string;
  vehicle_id: string;
  name: string;
  start: {
    latitude: number;
    longitude: number;
  };
  end: {
    latitude: number;
    longitude: number;
  };
  waypoints?: Record<string, unknown>;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleData {
  plate_number: string;
  vehicle_type: 'logistics_freight' | 'electric_autonomous' | 'utility_support' | 'simulated_truck';
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  assigned_branch?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  av_enabled?: boolean;
  is_electric?: boolean;
  battery_capacity?: number;
  mileage?: number;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
}

class VehiclesService {
  // Get all vehicles for the current organization
  async getVehicles(orgId: string): Promise<VehicleWithDetails[]> {
    try {
      // Try to use the coordinate extraction function first
      const { data: vehicles, error } = await supabase.rpc('get_vehicles_with_coordinates', {
        organization_id: orgId
      });

      if (error) {
        console.warn('Could not use coordinate extraction function, falling back to regular query:', error);
        
        // Fallback to regular query
        const { data: fallbackVehicles, error: fallbackError } = await supabase
          .from('vehicles')
          .select(`
            *,
            vehicle_tracking:vehicle_tracking(*)
          `)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        
        // Try an alternative approach - use a direct SQL query to get POINT text
        console.log('Trying alternative SQL approach for coordinate extraction...');
        
        const { data: vehiclesWithCoords, error: coordError } = await supabase
          .from('vehicles')
          .select(`
            *,
            vehicle_tracking:vehicle_tracking(*)
          `)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });
          
        if (coordError) {
          console.error('Alternative query failed:', coordError);
        } else {
          console.log('Alternative query succeeded, processing vehicles...');
          
          // Process each vehicle to extract coordinates using PostGIS functions
          for (const vehicle of vehiclesWithCoords || []) {
            if (vehicle.location) {
              try {
                // Try to get the POINT text using a separate query
                const { data: pointData, error: pointError } = await supabase
                  .rpc('st_astext', { geom: vehicle.location });
                  
                if (!pointError && pointData) {
                  console.log(`POINT text for ${vehicle.plate_number}:`, pointData);
                  vehicle.location_text = pointData;
                }
              } catch (e) {
                console.log('Could not extract POINT text for', vehicle.plate_number, e);
              }
            }
          }
        }
        
        // Transform the fallback data
        const transformedVehicles: VehicleWithDetails[] = fallbackVehicles?.map((vehicle: Record<string, unknown>) => {

          const transformedLocation = transformLocation(vehicle.location);
          
          return {
            id: vehicle.id as string,
            org_id: vehicle.org_id as string,
            name: vehicle.plate_number as string,
            plate_number: vehicle.plate_number as string,
            vehicle_type: vehicle.vehicle_type as 'logistics_freight' | 'electric_autonomous' | 'utility_support' | 'simulated_truck',
            status: vehicle.status as 'active' | 'idle' | 'maintenance' | 'offline',
            assigned_branch: vehicle.assigned_branch as string,
            make: vehicle.make as string,
            model: vehicle.model as string,
            year: vehicle.year as number,
            vin: vehicle.vin as string,
            av_enabled: vehicle.av_enabled as boolean,
            is_electric: vehicle.is_electric as boolean,
            battery_capacity: vehicle.battery_capacity as number,
            mileage: vehicle.mileage as number,
            fuel_level: vehicle.fuel_level as number | undefined,
            driver_name: vehicle.driver_name as string | undefined,
            driver_phone: vehicle.driver_phone as string | undefined,
            current_route: (vehicle.current_route as string) || undefined,
            location: transformedLocation,
            created_at: vehicle.created_at as string,
            updated_at: vehicle.updated_at as string,
            last_tracking: (vehicle.vehicle_tracking as unknown[])?.[0] as VehicleTracking || undefined
          };
        }) || [];

        return transformedVehicles;
      }

      // Transform the RPC function result (which includes extracted coordinates)
      const transformedVehicles: VehicleWithDetails[] = vehicles?.map((vehicle: Record<string, unknown>) => {
        const location = vehicle.location_lat && vehicle.location_lng ? {
          latitude: vehicle.location_lat as number,
          longitude: vehicle.location_lng as number
        } : null;
        
        return {
          id: vehicle.id as string,
          org_id: vehicle.org_id as string,
          name: vehicle.plate_number as string, // Just use plate number
          plate_number: vehicle.plate_number as string,
          vehicle_type: vehicle.vehicle_type as 'logistics_freight' | 'electric_autonomous' | 'utility_support' | 'simulated_truck',
          status: vehicle.status as 'active' | 'idle' | 'maintenance' | 'offline',
          assigned_branch: vehicle.assigned_branch as string,
          make: vehicle.make as string,
          model: vehicle.model as string,
          year: vehicle.year as number,
          vin: vehicle.vin as string,
          av_enabled: vehicle.av_enabled as boolean,
          is_electric: vehicle.is_electric as boolean,
          battery_capacity: vehicle.battery_capacity as number,
          mileage: vehicle.mileage as number,
          fuel_level: vehicle.fuel_level as number | undefined,
          driver_name: vehicle.driver_name as string | undefined,
          driver_phone: vehicle.driver_phone as string | undefined,
          current_route: (vehicle.current_route as string) || undefined,
          location: location,
          created_at: vehicle.created_at as string,
          updated_at: vehicle.updated_at as string,
          last_tracking: (vehicle.vehicle_tracking as unknown[])?.[0] as VehicleTracking || undefined
        };
      }) || [];

      return transformedVehicles;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  // Get a single vehicle by ID
  async getVehicle(vehicleId: string): Promise<VehicleWithDetails | null> {
    try {
      // Try to use the coordinate extraction function first
      const { data: vehicles, error } = await supabase.rpc('get_vehicle_with_coordinates', {
        vehicle_id: vehicleId
      });

      if (error || !vehicles || vehicles.length === 0) {
        console.warn('Could not use single vehicle coordinate extraction, falling back:', error);
        
        // Fallback to regular query
        const { data: vehicle, error: fallbackError } = await supabase
          .from('vehicles')
          .select(`
            *,
            vehicle_tracking:vehicle_tracking(*),
            routes:routes(*)
          `)
          .eq('id', vehicleId)
          .single();

        if (fallbackError) throw fallbackError;
        if (!vehicle) return null;

        const transformedVehicle: VehicleWithDetails = {
          id: vehicle.id,
          org_id: vehicle.org_id,
          name: vehicle.plate_number,
          plate_number: vehicle.plate_number,
          vehicle_type: vehicle.vehicle_type,
          status: vehicle.status,
          assigned_branch: vehicle.assigned_branch,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin,
          mileage: vehicle.mileage,
          fuel_level: vehicle.fuel_level as number | undefined,
          driver_name: vehicle.driver_name as string | undefined,
          driver_phone: vehicle.driver_phone as string | undefined,
          current_route: vehicle.current_route,
          location: transformLocation(vehicle.location), // This will return null for WKB data
          created_at: vehicle.created_at,
          updated_at: vehicle.updated_at,
          last_tracking: vehicle.vehicle_tracking?.[0] || undefined,
          current_route_info: vehicle.routes?.find((r: Route) => r.status === 'active') || null
        };

        return transformedVehicle;
      }

      const vehicle = vehicles[0];

      const transformedVehicle: VehicleWithDetails = {
        id: vehicle.id,
        org_id: vehicle.org_id,
        name: vehicle.plate_number, // Just use plate number
        plate_number: vehicle.plate_number,
        vehicle_type: vehicle.vehicle_type,
        status: vehicle.status,
        assigned_branch: vehicle.assigned_branch,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        mileage: vehicle.mileage,
        fuel_level: vehicle.fuel_level as number | undefined,
        driver_name: vehicle.driver_name as string | undefined,
        driver_phone: vehicle.driver_phone as string | undefined,
        current_route: vehicle.current_route,
        location: vehicle.location_lat && vehicle.location_lng ? {
          latitude: vehicle.location_lat,
          longitude: vehicle.location_lng
        } : null,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        last_tracking: vehicle.vehicle_tracking?.[0] || undefined,
        current_route_info: undefined // RPC doesn't include route data
      };

      return transformedVehicle;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  // Create new vehicle
  async createVehicle(orgId: string, vehicleData: CreateVehicleData): Promise<VehicleWithDetails> {
    try {
      console.log('Creating vehicle with data:', { orgId, vehicleData });
      
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert([
          {
            org_id: orgId,
            plate_number: vehicleData.plate_number,
            vehicle_type: vehicleData.vehicle_type,
            status: vehicleData.status,
            assigned_branch: vehicleData.assigned_branch || null,
            make: vehicleData.make || null,
            model: vehicleData.model || null,
            year: vehicleData.year || null,
            vin: (vehicleData.vin && vehicleData.vin.trim() !== '') ? vehicleData.vin : null,
            av_enabled: vehicleData.av_enabled || false,
            is_electric: vehicleData.is_electric || false,
            battery_capacity: vehicleData.battery_capacity || null,
            mileage: vehicleData.mileage || null,
            location: vehicleData.location 
              ? `POINT(${vehicleData.location.longitude} ${vehicleData.location.latitude})`
              : null
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating vehicle:', error);
        
        // Check for unique constraint violation
        if (error.code === '23505' && error.message.includes('plate_number')) {
          throw new Error('A vehicle with this plate number already exists');
        }
        
        throw new Error(error.message);
      }

      if (!vehicle) {
        throw new Error('Vehicle creation failed - no data returned');
      }

      console.log('Vehicle created successfully:', vehicle);

      // Transform to our UI interface
      const transformedVehicle: VehicleWithDetails = {
        id: vehicle.id,
        org_id: vehicle.org_id,
        name: vehicle.plate_number, // Just use plate number as fallback
        plate_number: vehicle.plate_number,
        vehicle_type: vehicle.vehicle_type,
        status: vehicle.status,
        assigned_branch: vehicle.assigned_branch,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        av_enabled: vehicle.av_enabled,
        is_electric: vehicle.is_electric,
        battery_capacity: vehicle.battery_capacity,
        mileage: vehicle.mileage,
        fuel_level: vehicle.fuel_level as number | undefined,
        driver_name: vehicle.driver_name as string | undefined,
        driver_phone: vehicle.driver_phone as string | undefined,
        current_route: vehicle.current_route,
        location: vehicle.location,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        last_tracking: undefined
      };

      return transformedVehicle;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // Update vehicle
  async updateVehicle(vehicleId: string, updates: Partial<CreateVehicleData>): Promise<VehicleWithDetails> {
    try {
      console.log('Updating vehicle:', vehicleId, 'with updates:', updates);
      
      const updateData = {
        ...(updates.status && { status: updates.status }),
        ...(updates.assigned_branch !== undefined && { assigned_branch: updates.assigned_branch || null }),
        ...(updates.make !== undefined && { make: updates.make || null }),
        ...(updates.model !== undefined && { model: updates.model || null }),
        ...(updates.year !== undefined && { year: updates.year || null }),
        ...(updates.vin !== undefined && { vin: (updates.vin && updates.vin.trim() !== '') ? updates.vin : null }),
        ...(updates.av_enabled !== undefined && { av_enabled: updates.av_enabled }),
        ...(updates.is_electric !== undefined && { is_electric: updates.is_electric }),
        ...(updates.battery_capacity !== undefined && { battery_capacity: updates.battery_capacity || null }),
        ...(updates.mileage !== undefined && { mileage: updates.mileage || null }),
        ...(updates.location !== undefined && { 
          location: updates.location 
            ? `POINT(${updates.location.longitude} ${updates.location.latitude})`
            : null 
        }),
        updated_at: new Date().toISOString()
      };

      console.log('Update data being sent to database:', updateData);

      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating vehicle:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to update vehicle: ${error.message}`);
      }

      if (!vehicle) {
        throw new Error('Vehicle update failed - no data returned');
      }

      // Transform to our UI interface
      const transformedVehicle: VehicleWithDetails = {
        id: vehicle.id,
        org_id: vehicle.org_id,
        name: vehicle.plate_number, // Just use plate number
        plate_number: vehicle.plate_number,
        vehicle_type: vehicle.vehicle_type,
        status: vehicle.status,
        assigned_branch: vehicle.assigned_branch,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        av_enabled: vehicle.av_enabled,
        is_electric: vehicle.is_electric,
        battery_capacity: vehicle.battery_capacity,
        mileage: vehicle.mileage,
        fuel_level: vehicle.fuel_level as number | undefined,
        driver_name: vehicle.driver_name as string | undefined,
        driver_phone: vehicle.driver_phone as string | undefined,
        current_route: vehicle.current_route,
        location: vehicle.location,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        last_tracking: undefined
      };

      return transformedVehicle;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Delete vehicle
  async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  // Get vehicle tracking history
  async getVehicleTracking(vehicleId: string, limit: number = 100): Promise<VehicleTracking[]> {
    try {
      const { data: tracking, error } = await supabase
        .from('vehicle_tracking')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return tracking || [];
    } catch (error) {
      console.error('Error fetching vehicle tracking:', error);
      throw error;
    }
  }

  // Add vehicle tracking point
  async addTrackingPoint(vehicleId: string, location: { latitude: number; longitude: number }, speed?: number, heading?: number): Promise<VehicleTracking> {
    try {
      const { data: tracking, error } = await supabase
        .from('vehicle_tracking')
        .insert([
          {
            vehicle_id: vehicleId,
            location,
            speed,
            heading,
            timestamp: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

            // Update the vehicle's timestamp (location updates handled manually in database)
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);
        
      if (updateError) {
        console.warn('Warning: Could not update vehicle timestamp:', updateError);
        // Don't throw error here as tracking was successful
      }

      return tracking;
    } catch (error) {
      console.error('Error adding tracking point:', error);
      throw error;
    }
  }



  // Get routes for a vehicle
  async getVehicleRoutes(vehicleId: string): Promise<Route[]> {
    try {
      const { data: routes, error } = await supabase
        .from('routes')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return routes || [];
    } catch (error) {
      console.error('Error fetching vehicle routes:', error);
      throw error;
    }
  }

  // Get unique assigned branches for autocomplete
  async getUniqueBranches(orgId: string): Promise<string[]> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('assigned_branch')
        .eq('org_id', orgId)
        .not('assigned_branch', 'is', null);

      if (error) throw error;

      // Extract unique branches and filter out null/empty values
      const uniqueBranches = [...new Set(
        vehicles
          .map(v => v.assigned_branch)
          .filter(branch => branch && branch.trim() !== '')
      )];

      return uniqueBranches.sort(); // Sort alphabetically
    } catch (error) {
      console.error('Error fetching unique branches:', error);
      return [];
    }
  }

  // Get unique makes for autocomplete
  async getUniqueMakes(orgId: string): Promise<string[]> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('make')
        .eq('org_id', orgId)
        .not('make', 'is', null);

      if (error) throw error;

      // Extract unique makes and filter out null/empty values
      const uniqueMakes = [...new Set(
        vehicles
          .map(v => v.make)
          .filter(make => make && make.trim() !== '')
      )];

      return uniqueMakes.sort(); // Sort alphabetically
    } catch (error) {
      console.error('Error fetching unique makes:', error);
      return [];
    }
  }

  // Get unique models for autocomplete
  async getUniqueModels(orgId: string): Promise<string[]> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('model')
        .eq('org_id', orgId)
        .not('model', 'is', null);

      if (error) throw error;

      // Extract unique models and filter out null/empty values
      const uniqueModels = [...new Set(
        vehicles
          .map(v => v.model)
          .filter(model => model && model.trim() !== '')
      )];

      return uniqueModels.sort(); // Sort alphabetically
    } catch (error) {
      console.error('Error fetching unique models:', error);
      return [];
    }
  }

  // Real-time subscription for vehicle updates
  subscribeToVehicleUpdates(orgId: string, callback: (vehicles: VehicleWithDetails[]) => void) {
    const subscription = supabase
      .channel('vehicles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
          filter: `org_id=eq.${orgId}`
        },
        () => {
          // Refetch vehicles when changes occur
          this.getVehicles(orgId).then(callback);
        }
      )
      .subscribe();

    return subscription;
  }
}

export const vehiclesService = new VehiclesService(); 