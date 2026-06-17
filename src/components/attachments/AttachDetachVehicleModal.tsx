"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import VehicleAutocomplete from '@/components/form/input/VehicleAutocomplete';

interface AttachDetachVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (vehicleId: string | null) => Promise<void>;
  vehicles: Array<{id: string; plate_number: string}>;
  mode: 'attach' | 'detach';
  equipmentName: string;
  currentVehicle?: string;
  isSubmitting: boolean;
}

export default function AttachDetachVehicleModal({
  isOpen,
  onClose,
  onConfirm,
  vehicles,
  mode,
  equipmentName,
  currentVehicle,
  isSubmitting
}: AttachDetachVehicleModalProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedVehicleId('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'attach' && !selectedVehicleId.trim()) {
      setError('Please select a vehicle');
      return;
    }

    try {
      setError('');
      if (mode === 'attach') {
        await onConfirm(selectedVehicleId);
      } else {
        await onConfirm(null); // null means detach
      }
      onClose();
    } catch (error) {
      console.error(`Error ${mode}ing equipment:`, error);
      setError(`Failed to ${mode} equipment. Please try again.`);
    }
  };

  const getModalTitle = () => {
    if (mode === 'attach') {
      return (
        <>
          Attach &ldquo;{equipmentName}&rdquo; to Vehicle
        </>
      );
    } else {
      return (
        <>
          Detach &ldquo;{equipmentName}&rdquo; from Vehicle
        </>
      );
    }
  };

  const getConfirmButtonText = () => {
    if (isSubmitting) {
      return mode === 'attach' ? 'Attaching...' : 'Detaching...';
    }
    return mode === 'attach' ? 'Attach to Vehicle' : 'Detach from Vehicle';
  };

  const getConfirmButtonColor = () => {
    return mode === 'attach' 
      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="w-full max-w-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {getModalTitle()}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'attach' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Vehicle *
              </label>
              <VehicleAutocomplete
                id="vehicle_select"
                name="vehicle_select"
                value={selectedVehicleId}
                onChange={(value) => {
                  setSelectedVehicleId(value);
                  if (error) setError('');
                }}
                vehicles={vehicles}
                placeholder="Search and select vehicle..."
                className={error ? 'border-red-500' : ''}
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The equipment status will automatically be set to &ldquo;In Use&rdquo; when attached.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Confirm Detachment
                    </h3>
                    <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                      This will detach &ldquo;{equipmentName}&rdquo; from &ldquo;{currentVehicle}&rdquo; and set its status to &ldquo;Available&rdquo;.
                    </p>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonColor()}`}
              disabled={isSubmitting}
            >
              {getConfirmButtonText()}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 