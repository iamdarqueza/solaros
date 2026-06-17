"use client";
import React, { useState, useEffect } from 'react';
import { CreateAttachmentData, attachmentsService } from '@/services/attachmentsService';
import { Modal } from '@/components/ui/modal';
import LocationPicker from '@/components/form/LocationPicker';
import AutocompleteInput from '@/components/form/input/AutocompleteInput';
import VehicleAutocomplete from '@/components/form/input/VehicleAutocomplete';
import { useAuth } from '@/context/AuthContext';

interface AddAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAttachmentData) => Promise<void>;
  vehicles: Array<{id: string; plate_number: string}>;
  isSubmitting: boolean;
}

export default function AddAttachmentModal({
  isOpen,
  onClose,
  onSubmit,
  vehicles,
  isSubmitting
}: AddAttachmentModalProps) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<CreateAttachmentData>({
    name: '',
    type: '',
    make: '',
    model: '',
    serial_number: '',
    assigned_vehicle_id: '',
    status: 'available',
    last_known_location: null,
    beacon_id: '',
    maintenance_interval_hrs: undefined,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState({
    types: [] as string[],
    makes: [] as string[],
    models: [] as string[]
  });

  // Load suggestions when modal opens
  useEffect(() => {
    if (isOpen && userProfile?.org_id) {
      loadSuggestions();
    }
  }, [isOpen, userProfile?.org_id]);

  const loadSuggestions = async () => {
    if (!userProfile?.org_id) return;

    try {
      const [types, makes, models] = await Promise.all([
        attachmentsService.getUniqueTypes(userProfile.org_id),
        attachmentsService.getUniqueMakes(userProfile.org_id),
        attachmentsService.getUniqueModels(userProfile.org_id)
      ]);

      setSuggestions({ types, makes, models });
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Type is required';
    }

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.serial_number.trim()) {
      newErrors.serial_number = 'Serial number is required';
    }

    if (formData.maintenance_interval_hrs !== undefined && formData.maintenance_interval_hrs < 0) {
      newErrors.maintenance_interval_hrs = 'Maintenance interval must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Clean up the data before submitting
      const submitData: CreateAttachmentData = {
        ...formData,
        assigned_vehicle_id: formData.assigned_vehicle_id || undefined,
        beacon_id: formData.beacon_id || undefined,
        maintenance_interval_hrs: formData.maintenance_interval_hrs || undefined,
        notes: formData.notes || undefined
      };

      await onSubmit(submitData);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        type: '',
        make: '',
        model: '',
        serial_number: '',
        assigned_vehicle_id: '',
        status: 'available',
        last_known_location: null,
        beacon_id: '',
        maintenance_interval_hrs: undefined,
        notes: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating attachment:', error);
      setErrors({ submit: 'Failed to create equipment. Please try again.' });
    }
  };

  const handleInputChange = (field: keyof CreateAttachmentData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-update status when vehicle assignment changes
      if (field === 'assigned_vehicle_id') {
        if (value && value.trim() !== '') {
          // Vehicle assigned - set status to "in_use"
          newData.status = 'in_use';
        } else {
          // Vehicle unassigned - set status to "available" if it was "in_use"
          if (prev.status === 'in_use') {
            newData.status = 'available';
          }
        }
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="w-[75vw] max-w-4xl">
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Add Equipment
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Equipment Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Equipment Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter equipment name"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type *
              </label>
              <AutocompleteInput
                id="type"
                name="type"
                value={formData.type}
                onChange={(value) => handleInputChange('type', value)}
                suggestions={suggestions.types}
                placeholder="e.g., GPS Tracker, Camera, Sensor"
                required
                className={errors.type ? 'border-red-500' : ''}
              />
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            {/* Make */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Make *
              </label>
              <AutocompleteInput
                id="make"
                name="make"
                value={formData.make}
                onChange={(value) => handleInputChange('make', value)}
                suggestions={suggestions.makes}
                placeholder="Enter manufacturer"
                required
                className={errors.make ? 'border-red-500' : ''}
              />
              {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make}</p>}
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model *
              </label>
              <AutocompleteInput
                id="model"
                name="model"
                value={formData.model}
                onChange={(value) => handleInputChange('model', value)}
                suggestions={suggestions.models}
                placeholder="Enter model"
                required
                className={errors.model ? 'border-red-500' : ''}
              />
              {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Serial Number *
              </label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => handleInputChange('serial_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                  errors.serial_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter serial number"
                required
              />
              {errors.serial_number && <p className="mt-1 text-sm text-red-600">{errors.serial_number}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as CreateAttachmentData['status'])}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                  formData.assigned_vehicle_id && formData.assigned_vehicle_id.trim() !== '' 
                    ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-75' 
                    : ''
                }`}
                disabled={!!(formData.assigned_vehicle_id && formData.assigned_vehicle_id.trim() !== '')}
                required
              >
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="lost">Lost</option>
                <option value="offline">Offline</option>
              </select>
              {formData.assigned_vehicle_id && formData.assigned_vehicle_id.trim() !== '' && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Status is automatically set to "In Use" when assigned to a vehicle
                </p>
              )}
            </div>

            {/* Assign to Vehicle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign to Vehicle
              </label>
              <VehicleAutocomplete
                id="assigned_vehicle"
                name="assigned_vehicle"
                value={formData.assigned_vehicle_id || ''}
                onChange={(value) => handleInputChange('assigned_vehicle_id', value)}
                vehicles={vehicles}
                placeholder="Search and select vehicle..."
              />
            </div>

            {/* Beacon ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Beacon ID
              </label>
              <input
                type="text"
                value={formData.beacon_id || ''}
                onChange={(e) => handleInputChange('beacon_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="BLE, beacon, or IoT device identifier"
              />
            </div>

            {/* Maintenance Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maintenance Interval (hours)
              </label>
              <input
                type="number"
                value={formData.maintenance_interval_hrs?.toString() || ''}
                onChange={(e) => handleInputChange('maintenance_interval_hrs', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 ${
                  errors.maintenance_interval_hrs ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Hours between maintenance"
                min="0"
              />
              {errors.maintenance_interval_hrs && <p className="mt-1 text-sm text-red-600">{errors.maintenance_interval_hrs}</p>}
            </div>
          </div>

          {/* Location Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Location (Optional)
            </label>
            <LocationPicker
              onLocationSelect={(location) => handleInputChange('last_known_location', location)}
              initialLocation={formData.last_known_location}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Click on the map to set the equipment's initial location
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              placeholder="Additional notes about this equipment"
              rows={3}
            />
          </div>

          {errors.submit && (
            <div className="text-red-600 text-sm">{errors.submit}</div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 