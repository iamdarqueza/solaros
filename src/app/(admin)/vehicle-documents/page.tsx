"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { documentsService, DocumentData } from '@/services/documentsService';
import AddVehicleDocumentModal from '@/components/documents/AddVehicleDocumentModal';

export default function VehicleDocumentsPage() {
  const { organization } = useAuth();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load documents
  const loadDocuments = async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      const documentsData = await documentsService.getVehicleDocuments(organization.id);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [organization?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!organization?.id) return;

    const subscription = documentsService.subscribeToDocumentUpdates(
      organization.id,
      async () => {
        const documentsData = await documentsService.getVehicleDocuments(organization.id);
        setDocuments(documentsData);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [organization?.id]);

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.vehicle_plate_number && doc.vehicle_plate_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddDocument = () => {
    setShowAddModal(true);
  };

  const handleDocumentAdded = async () => {
    // Reload documents after successful upload
    await loadDocuments();
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await documentsService.deleteDocument(documentId);
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (url: string) => {
    // This is a placeholder - in a real app you might store file size or fetch it
    return 'N/A';
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Vehicle Documents
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage documents related to fleet vehicles
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-72 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          
          <button 
            onClick={handleAddDocument}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Document
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDocuments.length === 0 ? (
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
            {searchTerm ? 'No documents found' : 'No vehicle documents yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {searchTerm 
              ? `No documents match "${searchTerm}". Try a different search term.`
              : 'Start by uploading documents for your fleet vehicles such as registration papers, insurance documents, and inspection certificates.'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto min-h-[50vh] max-h-[calc(100vh-200px)]">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-gray-dark z-10">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Document
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Vehicle
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Uploaded By
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Upload Date
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-8 h-8 text-blue-500"
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
                      <div>
                        <div className="font-medium">{document.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {document.type === 'vehicle' ? 'Vehicle Document' : 'General Document'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                    {document.vehicle_plate_number || 'All vehicles'}
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                    {document.uploaded_by_email || 'Unknown'}
                  </td>
                  <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(document.created_at)}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-white/10"
                        title="View document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Document Modal */}
      <AddVehicleDocumentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleDocumentAdded}
      />
    </div>
  );
} 