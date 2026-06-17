import { supabase } from '@/lib/supabase';

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

// Attachment interface with all fields
export interface AttachmentWithDetails {
  id: string;
  org_id: string;
  name: string;
  type: string;
  make: string;
  model: string;
  serial_number: string;
  assigned_vehicle_id?: string;
  assigned_vehicle_name?: string;
  status: 'available' | 'in_use' | 'under_maintenance' | 'lost' | 'offline';
  last_known_location: {
    latitude: number;
    longitude: number;
  } | null;
  beacon_id?: string;
  last_attached_to?: string;
  last_attached_vehicle_name?: string;
  maintenance_interval_hrs?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAttachmentData {
  name: string;
  type: string;
  make: string;
  model: string;
  serial_number: string;
  assigned_vehicle_id?: string;
  status?: 'available' | 'in_use' | 'under_maintenance' | 'lost' | 'offline';
  last_known_location?: {
    latitude: number;
    longitude: number;
  } | null;
  beacon_id?: string;
  maintenance_interval_hrs?: number;
  notes?: string;
}

class AttachmentsService {
  // Get all attachments for the current organization
  async getAttachments(orgId: string): Promise<AttachmentWithDetails[]> {
    try {
      // Try to use the RPC function first
      const { data: attachments, error } = await supabase.rpc('get_attachments_with_vehicle_details', {
        organization_id: orgId
      });

      if (error) {
        console.warn('Could not use RPC function, falling back to regular query:', error);
        
        // Fallback to regular query with beacon_id fallback
        const { data: fallbackAttachments, error: fallbackError } = await supabase
          .from('attachments')
          .select(`
            *,
            assigned_vehicle:vehicles!assigned_vehicle_id(plate_number),
            last_attached_vehicle:vehicles!last_attached_to(plate_number)
          `)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        
        // Transform the fallback data with beacon_id fallback
        const transformedAttachments: AttachmentWithDetails[] = fallbackAttachments?.map((attachment: Record<string, unknown>) => {
          const transformedLocation = transformLocation(attachment.last_known_location);
          
          return {
            id: attachment.id as string,
            org_id: attachment.org_id as string,
            name: attachment.name as string,
            type: attachment.type as string,
            make: attachment.make as string,
            model: attachment.model as string,
            serial_number: attachment.serial_number as string,
            assigned_vehicle_id: attachment.assigned_vehicle_id as string | undefined,
            assigned_vehicle_name: (attachment.assigned_vehicle as Record<string, unknown>)?.plate_number as string,
            status: attachment.status as 'available' | 'in_use' | 'under_maintenance' | 'lost' | 'offline',
            last_known_location: transformedLocation,
            beacon_id: (attachment.beacon_id || attachment.tag_id || '') as string, // Fallback to tag_id or empty string
            last_attached_to: attachment.last_attached_to as string,
            last_attached_vehicle_name: (attachment.last_attached_vehicle as Record<string, unknown>)?.plate_number as string,
            maintenance_interval_hrs: attachment.maintenance_interval_hrs as number,
            notes: attachment.notes as string,
            created_at: attachment.created_at as string,
            updated_at: attachment.updated_at as string,
          };
        }) || [];

        return transformedAttachments;
      }

      // Transform the RPC function result
      const transformedAttachments: AttachmentWithDetails[] = attachments?.map((attachment: Record<string, unknown>) => {
        const location = attachment.last_known_location_lat && attachment.last_known_location_lng ? {
          latitude: attachment.last_known_location_lat as number,
          longitude: attachment.last_known_location_lng as number
        } : null;
        
        return {
          id: attachment.id as string,
          org_id: attachment.org_id as string,
          name: attachment.name as string,
          type: attachment.type as string,
          make: attachment.make as string,
          model: attachment.model as string,
          serial_number: attachment.serial_number as string,
          assigned_vehicle_id: attachment.assigned_vehicle_id as string | undefined,
          assigned_vehicle_name: attachment.assigned_vehicle_name as string,
          status: attachment.status as 'available' | 'in_use' | 'under_maintenance' | 'lost' | 'offline',
          last_known_location: location,
          beacon_id: (attachment.beacon_id || '') as string, // Handle null beacon_id
          last_attached_to: attachment.last_attached_to as string,
          last_attached_vehicle_name: attachment.last_attached_vehicle_name as string,
          maintenance_interval_hrs: attachment.maintenance_interval_hrs as number,
          notes: attachment.notes as string,
          created_at: attachment.created_at as string,
          updated_at: attachment.updated_at as string,
        };
      }) || [];

      return transformedAttachments;
    } catch (error) {
      console.error('Error fetching attachments:', error);
      throw error;
    }
  }

  // Get single attachment by ID
  async getAttachment(attachmentId: string): Promise<AttachmentWithDetails | null> {
    try {
      // Try to use the RPC function first
      const { data: attachments, error } = await supabase.rpc('get_attachment_with_vehicle_details', {
        attachment_id: attachmentId
      });

      if (error) {
        console.warn('Could not use RPC function, falling back to regular query:', error);
        
        // Fallback to regular query
        const { data: attachment, error: fallbackError } = await supabase
          .from('attachments')
          .select(`
            *,
            assigned_vehicle:vehicles!assigned_vehicle_id(plate_number),
            last_attached_vehicle:vehicles!last_attached_to(plate_number)
          `)
          .eq('id', attachmentId)
          .single();

        if (fallbackError) throw fallbackError;
        if (!attachment) return null;

        const transformedLocation = transformLocation(attachment.last_known_location);
        
        return {
          id: attachment.id as string,
          org_id: attachment.org_id as string,
          name: attachment.name as string,
          type: attachment.type as string,
          make: attachment.make as string,
          model: attachment.model as string,
          serial_number: attachment.serial_number as string,
          assigned_vehicle_id: attachment.assigned_vehicle_id as string | undefined,
          assigned_vehicle_name: (attachment.assigned_vehicle as Record<string, unknown>)?.plate_number as string,
          status: attachment.status as 'available' | 'in_use' | 'under_maintenance' | 'lost' | 'offline',
          last_known_location: transformedLocation,
          beacon_id: (attachment.beacon_id || attachment.tag_id || '') as string, // Fallback to tag_id or empty string
          last_attached_to: attachment.last_attached_to as string,
          last_attached_vehicle_name: (attachment.last_attached_vehicle as Record<string, unknown>)?.plate_number as string,
          maintenance_interval_hrs: attachment.maintenance_interval_hrs as number,
          notes: attachment.notes as string,
          created_at: attachment.created_at as string,
          updated_at: attachment.updated_at as string,
        };
      }

      if (!attachments || attachments.length === 0) return null;
      
      const attachment = attachments[0];
      const location = attachment.last_known_location_lat && attachment.last_known_location_lng ? {
        latitude: attachment.last_known_location_lat as number,
        longitude: attachment.last_known_location_lng as number
      } : null;

      const transformedAttachment: AttachmentWithDetails = {
        id: attachment.id as string,
        org_id: attachment.org_id as string,
        name: attachment.name as string,
        type: attachment.type as string,
        make: attachment.make as string,
        model: attachment.model as string,
        serial_number: attachment.serial_number as string,
        assigned_vehicle_id: attachment.assigned_vehicle_id as string | undefined,
        assigned_vehicle_name: attachment.assigned_vehicle_name as string,
        status: attachment.status as 'available' | 'in_use' | 'under_maintenance' | 'lost' | 'offline',
        last_known_location: location,
        beacon_id: (attachment.beacon_id || '') as string, // Handle null beacon_id
        last_attached_to: attachment.last_attached_to as string,
        last_attached_vehicle_name: attachment.last_attached_vehicle_name as string,
        maintenance_interval_hrs: attachment.maintenance_interval_hrs as number,
        notes: attachment.notes as string,
        created_at: attachment.created_at as string,
        updated_at: attachment.updated_at as string,
      };

      return transformedAttachment;
    } catch (error) {
      console.error('Error fetching attachment:', error);
      throw error;
    }
  }

  // Create new attachment
  async createAttachment(orgId: string, attachmentData: CreateAttachmentData): Promise<AttachmentWithDetails> {
    try {
      // Prepare data for insertion
      const insertData: Record<string, unknown> = {
        org_id: orgId,
        name: attachmentData.name,
        type: attachmentData.type,
        make: attachmentData.make,
        model: attachmentData.model,
        serial_number: attachmentData.serial_number,
        assigned_vehicle_id: attachmentData.assigned_vehicle_id,
        status: attachmentData.status || 'available',
        beacon_id: attachmentData.beacon_id,
        maintenance_interval_hrs: attachmentData.maintenance_interval_hrs,
        notes: attachmentData.notes,
      };

      // Handle location data
      if (attachmentData.last_known_location) {
        insertData.last_known_location = `POINT(${attachmentData.last_known_location.longitude} ${attachmentData.last_known_location.latitude})`;
      }

      const { data: attachment, error } = await supabase
        .from('attachments')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Fetch the created attachment with vehicle details
      const createdAttachment = await this.getAttachment(attachment.id as string);
      if (!createdAttachment) {
        throw new Error('Failed to fetch created attachment');
      }

      return createdAttachment;
    } catch (error) {
      console.error('Error creating attachment:', error);
      throw error;
    }
  }

  // Update attachment
  async updateAttachment(attachmentId: string, updates: Partial<CreateAttachmentData>): Promise<AttachmentWithDetails> {
    try {
      // Prepare update data
      const updateData: Record<string, unknown> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.make !== undefined) updateData.make = updates.make;
      if (updates.model !== undefined) updateData.model = updates.model;
      if (updates.serial_number !== undefined) updateData.serial_number = updates.serial_number;
      if (updates.assigned_vehicle_id !== undefined) updateData.assigned_vehicle_id = updates.assigned_vehicle_id;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.beacon_id !== undefined && updates.beacon_id) updateData.beacon_id = updates.beacon_id; // Only update if beacon_id exists
      if (updates.maintenance_interval_hrs !== undefined) updateData.maintenance_interval_hrs = updates.maintenance_interval_hrs;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      // Handle location data
      if (updates.last_known_location !== undefined) {
        if (updates.last_known_location) {
          updateData.last_known_location = `POINT(${updates.last_known_location.longitude} ${updates.last_known_location.latitude})`;
        } else {
          updateData.last_known_location = null;
        }
      }

      const { error } = await supabase
        .from('attachments')
        .update(updateData)
        .eq('id', attachmentId);

      if (error) throw error;

      // Fetch the updated attachment with vehicle details
      const updatedAttachment = await this.getAttachment(attachmentId);
      if (!updatedAttachment) {
        throw new Error('Failed to fetch updated attachment');
      }

      return updatedAttachment;
    } catch (error) {
      console.error('Error updating attachment:', error);
      throw error;
    }
  }

  // Delete attachment
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  }

  // Get unique types from attachments
  async getUniqueTypes(orgId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('type')
        .eq('org_id', orgId);

      if (error) throw error;

      const types = [...new Set(data?.map(item => item.type).filter(Boolean))] as string[];
      return types.sort();
    } catch (error) {
      console.error('Error fetching unique types:', error);
      return [];
    }
  }

  // Get unique makes from attachments
  async getUniqueMakes(orgId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('make')
        .eq('org_id', orgId);

      if (error) throw error;

      const makes = [...new Set(data?.map(item => item.make).filter(Boolean))] as string[];
      return makes.sort();
    } catch (error) {
      console.error('Error fetching unique makes:', error);
      return [];
    }
  }

  // Get unique models from attachments
  async getUniqueModels(orgId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('model')
        .eq('org_id', orgId);

      if (error) throw error;

      const models = [...new Set(data?.map(item => item.model).filter(Boolean))] as string[];
      return models.sort();
    } catch (error) {
      console.error('Error fetching unique models:', error);
      return [];
    }
  }

  // Attach equipment to vehicle
  async attachToVehicle(attachmentId: string, vehicleId: string): Promise<AttachmentWithDetails> {
    try {
      const updateData: Record<string, unknown> = {
        assigned_vehicle_id: vehicleId,
        status: 'in_use',
        last_attached_to: vehicleId,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('attachments')
        .update(updateData)
        .eq('id', attachmentId);

      if (error) throw error;

      // Fetch the updated attachment with vehicle details
      const updatedAttachment = await this.getAttachment(attachmentId);
      if (!updatedAttachment) {
        throw new Error('Failed to fetch updated attachment');
      }

      return updatedAttachment;
    } catch (error) {
      console.error('Error attaching equipment to vehicle:', error);
      throw error;
    }
  }

  // Detach equipment from vehicle
  async detachFromVehicle(attachmentId: string): Promise<AttachmentWithDetails> {
    try {
      const updateData: Record<string, unknown> = {
        assigned_vehicle_id: null,
        status: 'available',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('attachments')
        .update(updateData)
        .eq('id', attachmentId);

      if (error) throw error;

      // Fetch the updated attachment with vehicle details
      const updatedAttachment = await this.getAttachment(attachmentId);
      if (!updatedAttachment) {
        throw new Error('Failed to fetch updated attachment');
      }

      return updatedAttachment;
    } catch (error) {
      console.error('Error detaching equipment from vehicle:', error);
      throw error;
    }
  }

  // Subscribe to attachment updates
  subscribeToAttachmentUpdates(orgId: string, callback: (attachments: AttachmentWithDetails[]) => void) {
    const subscription = supabase
      .channel('attachments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attachments',
          filter: `org_id=eq.${orgId}`,
        },
        async () => {
          // Fetch updated attachments
          try {
            const attachments = await this.getAttachments(orgId);
            callback(attachments);
          } catch (error) {
            console.error('Error fetching updated attachments:', error);
          }
        }
      )
      .subscribe();

    return subscription;
  }
}

export const attachmentsService = new AttachmentsService(); 