"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { documentsService, DocumentData } from '@/services/documentsService';
import { useAuth } from '@/context/AuthContext';

interface ViewDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'vehicle' | 'attachment';
  itemId: string;
  itemName: string;
  itemModel?: string; // For showing model-wide documents
}

export default function ViewDocumentsModal({
  isOpen,
  onClose,
  type,
  itemId,
  itemName,
  itemModel
}: ViewDocumentsModalProps) {
  const { organization } = useAuth();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load documents when modal opens
  useEffect(() => {
    if (!isOpen || !organization?.id) return;

    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError('');

        let allDocuments: DocumentData[] = [];
        
        if (type === 'vehicle') {
          allDocuments = await documentsService.getVehicleDocuments(organization.id);
        } else {
          allDocuments = await documentsService.getAttachmentDocuments(organization.id);
        }

        // Filter documents for this specific item and model-wide documents
        const specificDocuments = allDocuments.filter(doc => {
          if (type === 'vehicle') {
            return doc.vehicle_id === itemId || doc.vehicle_id === null; // null means all vehicles with same model
          } else {
            return doc.attachment_id === itemId || doc.attachment_id === null; // null means all attachments with same model
          }
        });

        setDocuments(specificDocuments);
      } catch (error) {
        console.error('Error loading documents:', error);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [isOpen, organization?.id, type, itemId]);

  const handleViewDocument = (doc: DocumentData) => {
    window.open(doc.file_url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const getDocumentScope = (doc: DocumentData) => {
    if (type === 'vehicle') {
      return doc.vehicle_id ? 'Specific Vehicle' : 'All Vehicles (Same Model)';
    } else {
      return doc.attachment_id ? 'Specific Equipment' : 'All Equipment (Same Model)';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="w-full max-w-4xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents for {itemName}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {type === 'vehicle' ? 'Vehicle' : 'Equipment'} documents including model-wide documents
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 text-gray-400 mb-4 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No documents found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No documents have been uploaded for this {type === 'vehicle' ? 'vehicle' : 'equipment'} yet.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Scope
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-3 text-2xl">
                            {getFileIcon(doc.file_url)}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {getDocumentScope(doc)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {doc.uploaded_by_email || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(doc.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Document"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
} 