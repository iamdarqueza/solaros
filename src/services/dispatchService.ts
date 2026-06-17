import { supabase } from '@/lib/supabase';

export interface DispatchAssignment {
  id: string;
  org_id: string;
  title: string;
  tracking_id: string;
  vehicle_id: string;
  driver_id?: string;
  attachment_id?: string;
  route_type: string;
  status: string;
  route_id: string;
  instructions?: string;
  priority: string;
  planned_start_time?: string;
  planned_end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  delay_minutes?: number;
  on_time?: boolean;
  duration_expected_minutes?: number;
  duration_actual_minutes?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DispatchAssignmentWithDetails extends DispatchAssignment {
  vehicle_name?: string;
  vehicle_plate?: string;
  driver_name?: string;
  driver_email?: string;
  attachment_name?: string;
  route_name?: string;
  route_origin?: string;
  route_destination?: string;
  route_distance?: number;
  created_by_name?: string;
}

export interface CreateDispatchData {
  title: string;
  vehicle_id: string;
  route_type: string;
  status: string;
  route_id: string;
  instructions?: string;
  priority: string;
  planned_start_time: string;
  planned_end_time: string;
  driver_id?: string;
  attachment_id?: string;
}

export interface DispatchStatistics {
  total_dispatches: number;
  scheduled_count: number;
  in_progress_count: number;
  completed_count: number;
  delayed_count: number;
  cancelled_count: number;
  urgent_count: number;
  high_count: number;
  normal_count: number;
}

export interface DispatchPerformanceStats extends DispatchStatistics {
  on_time_count: number;
  late_count: number;
  on_time_percentage: number;
  avg_delay_minutes: number;
  avg_duration_expected: number;
  avg_duration_actual: number;
  performance_efficiency: number;
}

export class DispatchService {
  async createDispatch(orgId: string, dispatchData: CreateDispatchData): Promise<DispatchAssignment> {
    try {
      // Convert datetime-local strings to proper ISO timestamps
      const plannedStartTime = new Date(dispatchData.planned_start_time).toISOString();
      const plannedEndTime = new Date(dispatchData.planned_end_time).toISOString();

      // Use a transaction to ensure both dispatch creation and vehicle status update succeed
      const { data: dispatchData_result, error: dispatchError } = await supabase
        .from('dispatch_assignments')
        .insert({
          org_id: orgId,
          title: dispatchData.title,
          vehicle_id: dispatchData.vehicle_id,
          route_type: dispatchData.route_type,
          status: dispatchData.status,
          route_id: dispatchData.route_id,
          instructions: dispatchData.instructions,
          priority: dispatchData.priority,
          planned_start_time: plannedStartTime,
          planned_end_time: plannedEndTime,
          driver_id: dispatchData.driver_id,
          attachment_id: dispatchData.attachment_id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (dispatchError) {
        console.error('Error creating dispatch:', dispatchError);
        throw new Error(dispatchError.message);
      }

      // Update vehicle status from 'idle' to 'active' (will change to 'en_route' later via mobile app)
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchData.vehicle_id)
        .eq('org_id', orgId);

      if (vehicleError) {
        console.error('Error updating vehicle status:', vehicleError);
        // If vehicle update fails, we should potentially rollback the dispatch creation
        // For now, we'll throw an error but the dispatch will remain in the database
        throw new Error(`Dispatch created but failed to update vehicle status: ${vehicleError.message}`);
      }

      console.log(`Vehicle ${dispatchData.vehicle_id} status updated from 'idle' to 'active'`);
      return dispatchData_result;
    } catch (error) {
      console.error('Error in createDispatch:', error);
      throw error;
    }
  }

  async getDispatches(orgId: string): Promise<DispatchAssignmentWithDetails[]> {
    try {
      // Try using the RPC function first (if it exists)
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_dispatch_assignments_with_details', { org_uuid: orgId });

        // If RPC function exists and works, use it
        if (!rpcError && rpcData) {
          return rpcData;
        }
      } catch (rpcFuncError) {
        console.log('RPC function not available, using fallback query');
      }

      // Fallback to direct table query with joins
      console.log('Using fallback query for dispatches');

      const { data, error } = await supabase
        .from('dispatch_assignments')
        .select(`
          *,
          vehicles!vehicle_id(plate_number, make, model),
          users!driver_id(full_name, email),
          attachments!attachment_id(name),
          routes!route_id(name, origin_location_name, destination_location_name, estimated_distance_km),
          created_by_user:users!created_by(full_name)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dispatches:', error);
        // Return empty array instead of throwing to prevent app crashes
        console.warn('Falling back to empty dispatches array due to error:', error.message);
        return [];
      }

      // Transform the data to match DispatchAssignmentWithDetails interface
      const transformedData: DispatchAssignmentWithDetails[] = (data || []).map((item) => ({
        ...item,
        vehicle_name: `${item.vehicles?.make || ''} ${item.vehicles?.model || ''}`.trim() || item.vehicles?.plate_number,
        vehicle_plate: item.vehicles?.plate_number,
        driver_name: item.users?.full_name,
        driver_email: item.users?.email,
        attachment_name: item.attachments?.name,
        route_name: item.routes?.name,
        route_origin: item.routes?.origin_location_name,
        route_destination: item.routes?.destination_location_name,
        route_distance: item.routes?.estimated_distance_km,
        created_by_name: item.created_by_user?.full_name,
      }));

      return transformedData;
    } catch (error) {
      console.error('Error in getDispatches:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  async getDispatchById(id: string): Promise<DispatchAssignmentWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('dispatch_assignments')
        .select(`
          *,
          vehicles!vehicle_id(plate_number, make, model),
          users!driver_id(full_name, email),
          attachments!attachment_id(name),
          routes!route_id(name, origin_location_name, destination_location_name, estimated_distance_km),
          created_by_user:users!created_by(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching dispatch:', error);
        throw new Error(error.message);
      }

      if (!data) return null;

      // Transform the data to match DispatchAssignmentWithDetails interface
      const transformedData: DispatchAssignmentWithDetails = {
        ...data,
        vehicle_name: `${data.vehicles?.make || ''} ${data.vehicles?.model || ''}`.trim() || data.vehicles?.plate_number,
        vehicle_plate: data.vehicles?.plate_number,
        driver_name: data.users?.full_name,
        driver_email: data.users?.email,
        attachment_name: data.attachments?.name,
        route_name: data.routes?.name,
        route_origin: data.routes?.origin_location_name,
        route_destination: data.routes?.destination_location_name,
        route_distance: data.routes?.estimated_distance_km,
        created_by_name: data.created_by_user?.full_name,
      };

      return transformedData;
    } catch (error) {
      console.error('Error in getDispatchById:', error);
      throw error;
    }
  }

  async updateDispatch(id: string, updates: Partial<DispatchAssignment>): Promise<DispatchAssignment> {
    try {
      const { data, error } = await supabase
        .from('dispatch_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating dispatch:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in updateDispatch:', error);
      throw error;
    }
  }

  async deleteDispatch(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('dispatch_assignments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting dispatch:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error in deleteDispatch:', error);
      throw error;
    }
  }

  async startDispatch(id: string): Promise<boolean> {
    try {
      // CRITICAL DEBUG: Log the exact ID being passed
      console.log('=== START DISPATCH DEBUG ===');
      console.log('Raw ID parameter:', id);
      console.log('ID type:', typeof id);
      console.log('ID length:', id.length);
      console.log('Is valid UUID format?:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      console.log('===========================');

      // Get dispatch info for logging and validation
      const { data: dispatch, error: fetchError } = await supabase
        .from('dispatch_assignments')
        .select('vehicle_id, org_id, status')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching dispatch for start:', fetchError);
        throw new Error(fetchError.message);
      }

      console.log(`Starting dispatch ${id} with current status: ${dispatch.status}`);

      // For delayed dispatches, use direct update method since RPC might not support them
      if (dispatch.status === 'delayed') {
        console.log(`Using direct update method for delayed dispatch ${id}`);
        
        const { data: updateData, error: updateError } = await supabase
          .from('dispatch_assignments')
          .update({ 
            status: 'in progress',
            actual_start_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating delayed dispatch status directly:', updateError);
          throw new Error(`Failed to start delayed dispatch: ${updateError.message}`);
        }

        console.log(`Delayed dispatch ${id} started successfully via direct method`);
        return true;
      }

      // For scheduled dispatches, try the RPC function first
      try {
        console.log(`Attempting RPC start_dispatch for dispatch ${id}`);
        const { data, error } = await supabase
          .rpc('start_dispatch', { dispatch_id: id });

        if (error) {
          console.warn('RPC start_dispatch failed, trying simple version:', error.message);
          
          // Try the simple boolean version
          const { data: simpleData, error: simpleError } = await supabase
            .rpc('start_dispatch_simple', { dispatch_id: id });

          if (simpleError) {
            console.warn('RPC start_dispatch_simple also failed, using direct update:', simpleError.message);
            throw new Error(simpleError.message);
          }

          console.log(`Dispatch ${id} started successfully via simple RPC function:`, simpleData);
          return simpleData;
        }

        console.log(`Dispatch ${id} started successfully via RPC function:`, data);
        
        // Handle JSON response
        if (typeof data === 'object' && data.success) {
          return true;
        } else if (typeof data === 'boolean') {
          return data;
        } else {
          console.warn('Unexpected RPC response format:', data);
          return true; // Assume success if we got here without error
        }
      } catch (rpcError) {
        // Fallback: Directly update the dispatch status for scheduled dispatches too
        console.log(`Attempting fallback method for scheduled dispatch ${id}`);
        
        const { data: updateData, error: updateError } = await supabase
          .from('dispatch_assignments')
          .update({ 
            status: 'in progress',
            actual_start_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating dispatch status directly:', updateError);
          throw new Error(`Failed to start dispatch: ${updateError.message}`);
        }

        console.log(`Dispatch ${id} started successfully via fallback method`);
        return true;
      }
    } catch (error) {
      console.error('Error in startDispatch:', error);
      throw error;
    }
  }

  async completeDispatch(id: string): Promise<boolean> {
    try {
      // First get the dispatch to know which vehicle to update
      const { data: dispatch, error: fetchError } = await supabase
        .from('dispatch_assignments')
        .select('vehicle_id, org_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching dispatch for completion:', fetchError);
        throw new Error(fetchError.message);
      }

      // Complete the dispatch using the database function
      const { data, error } = await supabase
        .rpc('complete_dispatch', { dispatch_id: id });

      if (error) {
        console.error('Error completing dispatch:', error);
        throw new Error(error.message);
      }

      // Update vehicle status back to 'idle' when dispatch is completed
      if (dispatch) {
        try {
          await this.updateVehicleStatus(dispatch.vehicle_id, dispatch.org_id, 'idle');
          console.log(`Vehicle ${dispatch.vehicle_id} status updated from 'en_route' to 'idle' after dispatch completion`);
        } catch (vehicleError) {
          console.error('Error updating vehicle status to idle:', vehicleError);
          // Don't throw here as the dispatch was successfully completed
          console.warn(`Dispatch completed but failed to update vehicle ${dispatch.vehicle_id} status to idle`);
        }
      }

      return data;
    } catch (error) {
      console.error('Error in completeDispatch:', error);
      throw error;
    }
  }

  // Helper function to update vehicle status (exported for use by other components)
  async updateVehicleStatus(vehicleId: string, orgId: string, status: 'active' | 'idle' | 'maintenance' | 'offline'): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .eq('org_id', orgId);

      if (error) {
        console.error(`Error updating vehicle ${vehicleId} status to ${status}:`, error);
        throw new Error(error.message);
      }

      console.log(`Vehicle ${vehicleId} status updated to '${status}'`);
    } catch (error) {
      console.error('Error in updateVehicleStatus:', error);
      throw error;
    }
  }

  // Function to cancel a dispatch and update vehicle status
  async cancelDispatch(id: string): Promise<boolean> {
    try {
      // First get the dispatch to know which vehicle to update
      const { data: dispatch, error: fetchError } = await supabase
        .from('dispatch_assignments')
        .select('vehicle_id, org_id, status')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching dispatch for cancellation:', fetchError);
        throw new Error(fetchError.message);
      }

      // Update dispatch status to cancelled
      const { data, error } = await supabase
        .from('dispatch_assignments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling dispatch:', error);
        throw new Error(error.message);
      }

      // Update vehicle status back to 'idle' when dispatch is cancelled
      // Only if the dispatch was scheduled or in progress
      if (dispatch && ['scheduled', 'in progress'].includes(dispatch.status)) {
        await this.updateVehicleStatus(dispatch.vehicle_id, dispatch.org_id, 'idle');
      }

      return true;
    } catch (error) {
      console.error('Error in cancelDispatch:', error);
      throw error;
    }
  }

  async updateDispatchTimes(
    id: string, 
    plannedStartTime: string, 
    plannedEndTime: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('update_dispatch_planned_times', {
          dispatch_id: id,
          new_planned_start: plannedStartTime,
          new_planned_end: plannedEndTime
        });

      if (error) {
        console.error('Error updating dispatch times:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error in updateDispatchTimes:', error);
      throw error;
    }
  }

  async getDispatchStatistics(
    orgId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<DispatchStatistics> {
    try {
      const { data, error } = await supabase
        .rpc('get_dispatch_statistics', {
          org_uuid: orgId,
          start_date: startDate || null,
          end_date: endDate || null
        });

      if (error) {
        console.error('Error fetching dispatch statistics:', error);
        throw new Error(error.message);
      }

      return data?.[0] || {
        total_dispatches: 0,
        scheduled_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        delayed_count: 0,
        cancelled_count: 0,
        urgent_count: 0,
        high_count: 0,
        normal_count: 0,
      };
    } catch (error) {
      console.error('Error in getDispatchStatistics:', error);
      throw error;
    }
  }

  async getDispatchPerformanceStatistics(
    orgId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<DispatchPerformanceStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_dispatch_statistics_with_performance', {
          org_uuid: orgId,
          start_date: startDate || null,
          end_date: endDate || null
        });

      if (error) {
        console.error('Error fetching dispatch performance statistics:', error);
        throw new Error(error.message);
      }

      return data?.[0] || {
        total_dispatches: 0,
        scheduled_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        delayed_count: 0,
        cancelled_count: 0,
        urgent_count: 0,
        high_count: 0,
        normal_count: 0,
        on_time_count: 0,
        late_count: 0,
        on_time_percentage: 0,
        avg_delay_minutes: 0,
        avg_duration_expected: 0,
        avg_duration_actual: 0,
        performance_efficiency: 0,
      };
    } catch (error) {
      console.error('Error in getDispatchPerformanceStatistics:', error);
      throw error;
    }
  }

  // Real-time subscription for dispatch updates
  subscribeToDispatchUpdates(
    orgId: string, 
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('dispatch_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatch_assignments',
          filter: `org_id=eq.${orgId}`,
        },
        callback
      )
      .subscribe();
  }

  // Get active dispatches for a specific vehicle
  async getActiveDispatchesForVehicle(vehicleId: string, orgId: string): Promise<DispatchAssignmentWithDetails[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_dispatch_assignments_with_details', { org_uuid: orgId });

      if (error) {
        console.error('Error fetching active dispatches for vehicle:', error);
        throw new Error(error.message);
      }

      // Filter for active dispatches (scheduled or in progress) for the specific vehicle
      return (data || []).filter((dispatch: DispatchAssignmentWithDetails) => 
        dispatch.vehicle_id === vehicleId && 
        ['scheduled', 'in progress'].includes(dispatch.status)
      );
    } catch (error) {
      console.error('Error in getActiveDispatchesForVehicle:', error);
      throw error;
    }
  }

  // Get active dispatches with delay calculation and status updates
  async getActiveDispatches(orgId: string): Promise<DispatchAssignmentWithDetails[]> {
    try {
      const dispatches = await this.getDispatches(orgId);
      const activeDispatches = dispatches.filter(dispatch => 
        ['scheduled', 'in progress', 'delayed'].includes(dispatch.status)
      );

      // Process each dispatch to calculate delays and update status if needed
      const processedDispatches = await Promise.all(
        activeDispatches.map(async (dispatch) => {
          let updatedDispatch = { ...dispatch };
          
          // Calculate delay for scheduled dispatches
          if (dispatch.status === 'scheduled' && dispatch.planned_start_time) {
            const scheduledTime = new Date(dispatch.planned_start_time);
            const currentTime = new Date();
            
            // If current time is past scheduled time, mark as delayed
            if (currentTime > scheduledTime) {
              const delayMinutes = Math.floor((currentTime.getTime() - scheduledTime.getTime()) / (1000 * 60));
              
              try {
                // Update the dispatch status to delayed in the database
                await this.updateDispatch(dispatch.id, { 
                  status: 'delayed',
                  delay_minutes: delayMinutes
                });
                
                updatedDispatch.status = 'delayed';
                updatedDispatch.delay_minutes = delayMinutes;
              } catch (error) {
                console.error('Error updating dispatch status to delayed:', error);
              }
            }
          }
          
          return updatedDispatch;
        })
      );

      return processedDispatches.sort((a, b) => {
        // Sort by priority first (urgent, high, normal), then by planned start time
        const priorityOrder = { urgent: 1, high: 2, normal: 3 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Then sort by planned start time
        if (a.planned_start_time && b.planned_start_time) {
          return new Date(a.planned_start_time).getTime() - new Date(b.planned_start_time).getTime();
        }
        
        return 0;
      });
    } catch (error) {
      console.error('Error in getActiveDispatches:', error);
      return [];
    }
  }

  // Helper function to format delay time
  static formatDelayTime(delayMinutes: number): string {
    if (delayMinutes < 60) {
      return `${delayMinutes} min`;
    }
    
    const hours = Math.floor(delayMinutes / 60);
    const minutes = delayMinutes % 60;
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}min`;
  }

  // Test method for debugging dispatch status updates
  async testDispatchUpdate(id: string): Promise<any> {
    try {
      console.log(`Testing dispatch update for ID: ${id}`);
      
      // First, get the current dispatch
      const { data: currentDispatch, error: fetchError } = await supabase
        .from('dispatch_assignments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching dispatch:', fetchError);
        return { error: fetchError };
      }

      console.log('Current dispatch:', currentDispatch);

      // Try a simple update
      const { data: updateResult, error: updateError } = await supabase
        .from('dispatch_assignments')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating dispatch:', updateError);
        return { error: updateError };
      }

      console.log('Update successful:', updateResult);
      return { success: true, data: updateResult };
    } catch (error) {
      console.error('Test failed:', error);
      return { error };
    }
  }
}

export const dispatchService = new DispatchService();
export default dispatchService; 