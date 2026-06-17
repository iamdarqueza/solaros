"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { vehiclesService } from '@/services/vehiclesService';
import { documentsService, CreateDocumentData } from '@/services/documentsService';
import { useAuth } from '@/context/AuthContext';

interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
}

interface AddVehicleDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function AddVehicleDocumentModal({
  isOpen,
  onClose,
  onSubmit
}: AddVehicleDocumentModalProps) {
  const { organization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleModels, setVehicleModels] = useState<string[]>([]);
  
  // Form state
  const [documentScope, setDocumentScope] = useState<'specific' | 'model'>('specific');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [plateNumberFilter, setPlateNumberFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load vehicles and extract models
  useEffect(() => {
    if (!organization?.id || !isOpen) return;
    
    const loadVehicles = async () => {
      try {
        const vehiclesData = await vehiclesService.getVehicles(organization.id);
        const formattedVehicles = vehiclesData.map(v => ({
          id: v.id,
          plate_number: v.plate_number,
          make: v.make || '',
          model: v.model || ''
        }));
        setVehicles(formattedVehicles);
        
        // Extract unique models
        const models = [...new Set(formattedVehicles.map(v => v.model).filter(Boolean))];
        setVehicleModels(models);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      }
    };

    loadVehicles();
  }, [organization?.id, isOpen]);

  // Filter vehicles by plate number
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate_number.toLowerCase().includes(plateNumberFilter.toLowerCase())
  );

  // Filter models
  const filteredModels = vehicleModels.filter(model =>
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
    if (documentScope === 'specific' && !selectedVehicleId) {
      setError('Please select a vehicle');
      return;
    }

    if (documentScope === 'model' && !selectedModel) {
      setError('Please select a vehicle model');
      return;
    }

    // Title will be auto-populated from filename if empty, so no validation needed

    try {
      setIsSubmitting(true);
      setError('');

      const documentData: CreateDocumentData = {
        title: title.trim(),
        type: 'vehicle',
        vehicle_id: documentScope === 'specific' ? selectedVehicleId : undefined,
        file: selectedFile
      };

      await documentsService.uploadDocument(organization.id, documentData);
      
      // Reset form
      setDocumentScope('specific');
      setSelectedVehicleId('');
      setSelectedModel('');
      setPlateNumberFilter('');
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
    setSelectedVehicleId('');
    setSelectedModel('');
    setPlateNumberFilter('');
    setModelFilter('');
    setSelectedFile(null);
    setTitle('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="w-full max-w-2xl">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Add Vehicle Document
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
                  value="specific"
                  checked={documentScope === 'specific'}
                  onChange={(e) => setDocumentScope(e.target.value as 'specific')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Specific vehicle only
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="model"
                  checked={documentScope === 'model'}
                  onChange={(e) => setDocumentScope(e.target.value as 'model')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  All vehicles with same model
                </span>
              </label>
            </div>
          </div>

          {/* Vehicle Selection */}
          {documentScope === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Vehicle (Plate Number)
              </label>
              <input
                type="text"
                placeholder="Search by plate number..."
                value={plateNumberFilter}
                onChange={(e) => setPlateNumberFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white mb-2"
              />
              {plateNumberFilter && (
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md dark:border-gray-600">
                  {filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => {
                        setSelectedVehicleId(vehicle.id);
                        setPlateNumberFilter(vehicle.plate_number);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedVehicleId === vehicle.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="font-medium">{vehicle.plate_number}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.make} {vehicle.model}
                      </div>
                    </button>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      No vehicles found
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
                Select Vehicle Model
              </label>
              <input
                type="text"
                placeholder="Search by model..."
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white mb-2"
              />
              {modelFilter && (
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md dark:border-gray-600">
                  {filteredModels.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model);
                        setModelFilter(model);
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
              placeholder="Enter document title (or leave empty to use filename)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              If left empty, the filename will be used as the title
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Document
            </label>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Maximum file size: 5MB
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <svg className="mx-auto h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag and drop a file here, or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        browse
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !selectedFile}
            >
              {isSubmitting ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 