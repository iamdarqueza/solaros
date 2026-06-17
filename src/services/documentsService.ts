import { supabase } from '@/lib/supabase';

export interface DocumentData {
  id: string;
  org_id: string;
  title: string;
  type: 'vehicle' | 'attachment';
  vehicle_id?: string;
  attachment_id?: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
  vehicle_plate_number?: string;
  attachment_name?: string;
  uploaded_by_email?: string;
}

export interface CreateDocumentData {
  title: string;
  type: 'vehicle' | 'attachment';
  vehicle_id?: string;
  attachment_id?: string;
  file: File;
}

class DocumentsService {
  async getDocuments(orgId: string): Promise<DocumentData[]> {
    try {
      // Try using the database function first
      const { data, error } = await supabase.rpc('get_documents_with_details');

      if (error) {
        console.warn('Database function not available, using fallback method:', error);
        // Fallback to direct table query
        return await this.getDocumentsFallback(orgId);
      }

      return data || [];
    } catch (error) {
      console.warn('Error with RPC call, using fallback method:', error);
      // Fallback to direct table query
      return await this.getDocumentsFallback(orgId);
    }
  }

  async getDocumentsFallback(orgId: string): Promise<DocumentData[]> {
    try {
      // Direct query without the database function
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select(`
          id,
          org_id,
          title,
          type,
          vehicle_id,
          attachment_id,
          file_url,
          uploaded_by,
          created_at
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        throw docsError;
      }

      if (!documents || documents.length === 0) {
        return [];
      }

      // Get vehicle plate numbers for documents that have vehicle_id
      const vehicleIds = documents
        .filter(doc => doc.vehicle_id)
        .map(doc => doc.vehicle_id);

      let vehicles: any[] = [];
      if (vehicleIds.length > 0) {
        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('id, plate_number')
          .in('id', vehicleIds);
        vehicles = vehiclesData || [];
      }

      // Get attachment names for documents that have attachment_id
      const attachmentIds = documents
        .filter(doc => doc.attachment_id)
        .map(doc => doc.attachment_id);

      let attachments: any[] = [];
      if (attachmentIds.length > 0) {
        const { data: attachmentsData } = await supabase
          .from('attachments')
          .select('id, name')
          .in('id', attachmentIds);
        attachments = attachmentsData || [];
      }

      // Get user names for uploaded_by
      const userIds = [...new Set(documents.map(doc => doc.uploaded_by))];
      let users: any[] = [];
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds);
        users = usersData || [];
      }

      // Combine the data
      const documentsWithDetails: DocumentData[] = documents.map(doc => ({
        ...doc,
        vehicle_plate_number: vehicles.find(v => v.id === doc.vehicle_id)?.plate_number,
        attachment_name: attachments.find(a => a.id === doc.attachment_id)?.name,
        uploaded_by_email: users.find(u => u.id === doc.uploaded_by)?.full_name
      }));

      return documentsWithDetails;
    } catch (error) {
      console.error('Error in fallback method:', error);
      // Return empty array if even fallback fails
      return [];
    }
  }

  async getVehicleDocuments(orgId: string): Promise<DocumentData[]> {
    const documents = await this.getDocuments(orgId);
    return documents.filter(doc => doc.type === 'vehicle');
  }

  async getAttachmentDocuments(orgId: string): Promise<DocumentData[]> {
    const documents = await this.getDocuments(orgId);
    return documents.filter(doc => doc.type === 'attachment');
  }

  async uploadDocument(orgId: string, documentData: CreateDocumentData): Promise<DocumentData> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Use filename as title if no title provided
      const documentTitle = documentData.title.trim() || documentData.file.name.replace(/\.[^/.]+$/, "");

      // Generate filename based on type and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedTitle = documentTitle.replace(/[^a-zA-Z0-9-_]/g, '_'); // Sanitize title for filename
      let filename: string;
      
      if (documentData.type === 'vehicle' && documentData.vehicle_id) {
        // Get vehicle plate number for filename
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('plate_number')
          .eq('id', documentData.vehicle_id)
          .single();
        
        if (vehicleError) {
          console.error('Error fetching vehicle:', vehicleError);
          throw new Error('Failed to fetch vehicle information');
        }
        
        const plateNumber = vehicle?.plate_number || 'unknown';
        filename = `${sanitizedTitle}_${plateNumber}_${timestamp}.${documentData.file.name.split('.').pop()}`;
      } else if (documentData.type === 'attachment' && documentData.attachment_id) {
        // Get attachment serial number for filename
        const { data: attachment, error: attachmentError } = await supabase
          .from('attachments')
          .select('serial_number')
          .eq('id', documentData.attachment_id)
          .single();
        
        if (attachmentError) {
          console.error('Error fetching attachment:', attachmentError);
          throw new Error('Failed to fetch attachment information');
        }
        
        const serialNumber = attachment?.serial_number || 'unknown';
        filename = `${sanitizedTitle}_${serialNumber}_${timestamp}.${documentData.file.name.split('.').pop()}`;
      } else {
        filename = `${sanitizedTitle}_${timestamp}.${documentData.file.name.split('.').pop()}`;
      }

      // Upload file to Supabase Storage
      const filePath = `${orgId}/documents/${filename}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, documentData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        if (uploadError.message.includes('The resource was not found')) {
          throw new Error('Documents storage bucket not found. Please contact your administrator to set up document storage.');
        }
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert({
          org_id: orgId,
          title: documentTitle, // Use the processed title (either provided or filename)
          type: documentData.type,
          vehicle_id: documentData.vehicle_id || null,
          attachment_id: documentData.attachment_id || null,
          file_url: publicUrl,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        // Clean up uploaded file if database insert fails
        try {
          await supabase.storage.from('documents').remove([filePath]);
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded file:', cleanupError);
        }
        
        if (insertError.message.includes('relation "documents" does not exist')) {
          throw new Error('Documents table not found. Please contact your administrator to set up the documents system.');
        }
        throw new Error(`Failed to save document record: ${insertError.message}`);
      }

      // Get the document with details
      const documents = await this.getDocuments(orgId);
      const newDocument = documents.find(doc => doc.id === document.id);
      
      if (!newDocument) {
        throw new Error('Failed to retrieve created document');
      }

      return newDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Get document info first to delete file from storage
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_url, org_id')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Extract file path from URL for deletion
      const url = new URL(document.file_url);
      const filePath = url.pathname.split('/').slice(-3).join('/'); // Get org_id/documents/filename

      // Delete from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        throw deleteError;
      }

      // Delete file from storage
      await supabase.storage
        .from('documents')
        .remove([filePath]);

    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  subscribeToDocumentUpdates(orgId: string, callback: (documents: DocumentData[]) => void) {
    return supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `org_id=eq.${orgId}`
        },
        async () => {
          const documents = await this.getDocuments(orgId);
          callback(documents);
        }
      )
      .subscribe();
  }
}

export const documentsService = new DocumentsService(); 