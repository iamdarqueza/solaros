"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { documentsService, CreateDocumentData } from '@/services/documentsService';
import { attachmentsService } from '@/services/attachmentsService';
import { useAuth } from '@/context/AuthContext';

interface Attachment {
  id: string;
  name: string;
  serial_number: string;
  type: string;
  make: string;
  model: string;
}

interface AddAttachmentDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function AddAttachmentDocumentModal({
  isOpen,
  onClose,
  onSubmit
}: AddAttachmentDocumentModalProps) {
  const { organization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentModels, setAttachmentModels] = useState<string[]>([]);
  
  // Form state
  const [documentScope, setDocumentScope] = useState<'specific' | 'model'>('specific');
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAttachmentDropdown, setShowAttachmentDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load attachments and extract models
  useEffect(() => {
    if (!organization?.id || !isOpen) return;
    
    const loadAttachments = async () => {
      try {
        const attachmentsData = await attachmentsService.getAttachments(organization.id);
        const formattedAttachments = attachmentsData.map(a => ({
          id: a.id,
          name: a.name,
          serial_number: a.serial_number,
          type: a.type || '',
          make: a.make || '',
          model: a.model || ''
        }));
        setAttachments(formattedAttachments);
        
        // Extract unique models
        const models = [...new Set(formattedAttachments.map(a => `${a.type} ${a.make} ${a.model}`.trim()).filter(Boolean))];
        setAttachmentModels(models);
      } catch (error) {
        console.error('Error loading attachments:', error);
      }
    };

    loadAttachments();
  }, [organization?.id, isOpen]);

  // Filter attachments by name or serial number
  const filteredAttachments = attachments.filter(attachment =>
    attachment.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
    attachment.serial_number.toLowerCase().includes(nameFilter.toLowerCase())
  );

  // Filter models
  const filteredModels = attachmentModels.filter(model =>
    model.toLowerCase().includes(modelFilter.toLowerCase())
  );

  const handleFileSelect = (file: File) => {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for title
    }
    setError('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization?.id || !selectedFile) return;

    // Validation
    if (documentScope === 'specific' && !selectedAttachmentId) {
      setError('Please select an attachment');
      return;
    }

    if (documentScope === 'model' && !selectedModel) {
      setError('Please select an attachment model');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const documentData: CreateDocumentData = {
        title: title.trim(),
        type: 'attachment',
        attachment_id: documentScope === 'specific' ? selectedAttachmentId : undefined,
        file: selectedFile
      };

      await documentsService.uploadDocument(organization.id, documentData);
      
      // Reset form
      setDocumentScope('specific');
      setSelectedAttachmentId('');
      setSelectedModel('');
      setNameFilter('');
      setModelFilter('');
      setSelectedFile(null);
      setTitle('');
      
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDocumentScope('specific');
    setSelectedAttachmentId('');
    setSelectedModel('');
    setNameFilter('');
    setModelFilter('');
    setSelectedFile(null);
    setTitle('');
    setError('');
    setShowAttachmentDropdown(false);
    setShowModelDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="w-full max-w-2xl">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Add Attachment Document
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Document applies to:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="documentScope"
                  value="specific"
                  checked={documentScope === 'specific'}
                  onChange={(e) => setDocumentScope(e.target.value as 'specific' | 'model')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  A specific attachment
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="documentScope"
                  value="model"
                  checked={documentScope === 'model'}
                  onChange={(e) => setDocumentScope(e.target.value as 'specific' | 'model')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  All attachments with the same model
                </span>
              </label>
            </div>
          </div>

          {/* Specific Attachment Selection */}
          {documentScope === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Attachment
              </label>
              <input
                type="text"
                placeholder="Search by name or serial number..."
                value={nameFilter}
                onChange={(e) => {
                  setNameFilter(e.target.value);
                  setShowAttachmentDropdown(true);
                  // Clear selection if user starts typing again
                  if (selectedAttachmentId && e.target.value !== nameFilter) {
                    setSelectedAttachmentId('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white mb-2"
              />
              {nameFilter && showAttachmentDropdown && (
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md dark:border-gray-600">
                  {filteredAttachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      type="button"
                      onClick={() => {
                        setSelectedAttachmentId(attachment.id);
                        setNameFilter(`${attachment.name} (${attachment.serial_number})`);
                        setShowAttachmentDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedAttachmentId === attachment.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="font-medium">{attachment.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {attachment.serial_number} • {attachment.type} {attachment.make} {attachment.model}
                      </div>
                    </button>
                  ))}
                  {filteredAttachments.length === 0 && (
                    <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      No attachments found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model Selection */}
          {documentScope === 'model' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Attachment Model
              </label>
              <input
                type="text"
                placeholder="Search by model..."
                value={modelFilter}
                onChange={(e) => {
                  setModelFilter(e.target.value);
                  setShowModelDropdown(true);
                  // Clear selection if user starts typing again
                  if (selectedModel && e.target.value !== modelFilter) {
                    setSelectedModel('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white mb-2"
              />
              {modelFilter && showModelDropdown && (
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md dark:border-gray-600">
                  {filteredModels.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model);
                        setModelFilter(model);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedModel === model ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                  {filteredModels.length === 0 && (
                    <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      No models found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title (optional - will use filename if empty)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to use the filename as the title
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Document
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Click to upload
                    </button>
                    {' '}or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG up to 5MB
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isSubmitting || (documentScope === 'specific' && !selectedAttachmentId) || (documentScope === 'model' && !selectedModel)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 