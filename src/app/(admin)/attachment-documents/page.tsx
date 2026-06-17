"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { documentsService, DocumentData } from '@/services/documentsService';
import AddAttachmentDocumentModal from '@/components/documents/AddAttachmentDocumentModal';

export default function AttachmentDocumentsPage() {
  const { organization } = useAuth();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load documents
  const loadDocuments = async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      const attachmentDocs = await documentsService.getAttachmentDocuments(organization.id);
      setDocuments(attachmentDocs);
    } catch (error) {
      console.error('Error loading attachment documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [organization?.id]);

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.attachment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploaded_by_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDocument = async () => {
    // Reload documents after successful upload
    await loadDocuments();
  };

  const handleViewDocument = (doc: DocumentData) => {
    window.open(doc.file_url, '_blank');
  };

  const handleDeleteDocument = async (doc: DocumentData) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }

    try {
      await documentsService.deleteDocument(doc.id);
      await loadDocuments(); // Reload the list
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Attachment Documents
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage documents for your equipment and attachments
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
            onClick={() => setIsAddModalOpen(true)}
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

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
            {searchTerm ? 'No documents found' : 'No attachment documents yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {searchTerm 
              ? `No documents match "${searchTerm}". Try a different search term.`
              : 'Start by uploading documents for your equipment and attachments such as manuals, warranties, and maintenance records.'
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
                  Attachment
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
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                    <div className="flex items-center">
                      <span className="mr-3 text-2xl">
                        {getFileIcon(doc.file_url)}
                      </span>
                      <div>
                        <div className="font-medium">{doc.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                    {doc.attachment_name || (
                      <span className="text-gray-500 dark:text-gray-400 italic">
                        All attachments
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                    {doc.uploaded_by_email || 'Unknown'}
                  </td>
                  <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(doc.created_at)}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-2"
                        title="Delete Document"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
      <AddAttachmentDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDocument}
      />
    </div>
  );
} 