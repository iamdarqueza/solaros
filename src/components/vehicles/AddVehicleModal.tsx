'use client';

import React, { useState, useEffect } from 'react';
import { CreateVehicleData, vehiclesService } from '@/services/vehiclesService';
import { useAuth } from '@/context/AuthContext';
import AutocompleteInput from '@/components/form/input/AutocompleteInput';
import LocationPicker from '@/components/form/LocationPicker';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vehicleData: CreateVehicleData) => Promise<void>;
  isLoading?: boolean;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const { organization } = useAuth();
  const [formData, setFormData] = useState<CreateVehicleData>({
    plate_number: '',
    vehicle_type: 'logistics_freight',
    status: 'idle',
    assigned_branch: '',
    make: '',
    model: '',
    year: undefined,
    vin: '',
    av_enabled: false,
    is_electric: false,
    battery_capacity: undefined,
    mileage: undefined,
    location: null
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateVehicleData, string>>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [branchSuggestions, setBranchSuggestions] = useState<string[]>([]);
  const [makeSuggestions, setMakeSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (isOpen && organization?.id) {
      const fetchSuggestions = async () => {
        try {
          const [branches, makes, models] = await Promise.all([
            vehiclesService.getUniqueBranches(organization.id),
            vehiclesService.getUniqueMakes(organization.id),
            vehiclesService.getUniqueModels(organization.id)
          ]);
          setBranchSuggestions(branches);
          setMakeSuggestions(makes);
          setModelSuggestions(models);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      };
      fetchSuggestions();
    }
  }, [isOpen, organization?.id]);

  const handleInputChange = (field: keyof CreateVehicleData, value: string | number | boolean | undefined | { latitude: number; longitude: number } | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateVehicleData, string>> = {};

    if (!formData.plate_number.trim()) {
      newErrors.plate_number = 'Plate number is required';
    }

    // VIN validation - must be exactly 17 characters if provided
    if (formData.vin && formData.vin.trim() !== '') {
      if (formData.vin.length !== 17) {
        newErrors.vin = 'VIN must be exactly 17 characters';
      }
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
      setSubmitError(''); // Clear any previous errors
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        plate_number: '',
        vehicle_type: 'logistics_freight',
        status: 'idle',
        assigned_branch: '',
        make: '',
        model: '',
        year: undefined,
        vin: '',
        av_enabled: false,
        is_electric: false,
        battery_capacity: undefined,
        mileage: undefined,
        location: null
      });
      setErrors({});
      onClose();
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add vehicle. Please try again.';
      setSubmitError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset form and errors when closing
      setFormData({
        plate_number: '',
        vehicle_type: 'logistics_freight',
        status: 'idle',
        assigned_branch: '',
        make: '',
        model: '',
        year: undefined,
        vin: '',
        av_enabled: false,
        is_electric: false,
        battery_capacity: undefined,
        mileage: undefined,
        location: null
      });
      setErrors({});
      setSubmitError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add New Vehicle
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Error Alert */}
          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error creating vehicle
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {submitError}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plate Number *
            </label>
            <input
              type="text"
              value={formData.plate_number}
              onChange={(e) => handleInputChange('plate_number', e.target.value.toUpperCase())}
              placeholder="e.g., ABC-1234"
              disabled={isLoading}
              className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                errors.plate_number 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                  : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700'
              }`}
            />
            {errors.plate_number && (
              <p className="mt-1 text-xs text-red-500">{errors.plate_number}</p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle Type *
            </label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => handleInputChange('vehicle_type', e.target.value as CreateVehicleData['vehicle_type'])}
              disabled={isLoading}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="logistics_freight">Logistics & Freight</option>
              <option value="electric_autonomous">Electric & Autonomous</option>
              <option value="utility_support">Utility & Support</option>
              <option value="simulated_truck">Simulated Truck</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as CreateVehicleData['status'])}
              disabled={isLoading}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="idle">Idle</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Assigned Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assigned Branch
            </label>
            <AutocompleteInput
              id="assigned_branch"
              name="assigned_branch"
              value={formData.assigned_branch || ''}
              onChange={(value) => handleInputChange('assigned_branch', value)}
              placeholder="Enter assigned branch"
              suggestions={branchSuggestions}
            />
            {errors.assigned_branch && (
              <p className="mt-1 text-xs text-red-500">{errors.assigned_branch}</p>
            )}
          </div>

          {/* Make */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Make
            </label>
            <AutocompleteInput
              id="make"
              name="make"
              value={formData.make || ''}
              onChange={(value) => handleInputChange('make', value)}
              placeholder="e.g., Ford, Toyota, Mercedes"
              suggestions={makeSuggestions}
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model
            </label>
            <AutocompleteInput
              id="model"
              name="model"
              value={formData.model || ''}
              onChange={(value) => handleInputChange('model', value)}
              placeholder="e.g., F-150, Camry, Sprinter"
              suggestions={modelSuggestions}
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year
            </label>
            <input
              type="number"
              value={formData.year || ''}
              onChange={(e) => handleInputChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g., 2023"
              min="1900"
              max={new Date().getFullYear() + 2}
              disabled={isLoading}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
            />
          </div>

          {/* VIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              VIN
            </label>
            <input
              type="text"
              value={formData.vin || ''}
              onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
              placeholder="17-character VIN"
              maxLength={17}
              disabled={isLoading}
              className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                errors.vin 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' 
                  : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700'
              }`}
            />
            {errors.vin && (
              <p className="mt-1 text-xs text-red-500">{errors.vin}</p>
            )}
          </div>

          {/* Autonomous Vehicle */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.av_enabled || false}
                onChange={(e) => {
                  const isAV = e.target.checked;
                  handleInputChange('av_enabled', isAV);
                  // If enabling AV, automatically enable electric
                  if (isAV) {
                    handleInputChange('is_electric', true);
                  }
                }}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Autonomous Vehicle
              </span>
            </label>
          </div>

          {/* Is Electric/Hybrid */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_electric || false}
                onChange={(e) => {
                  const isElectric = e.target.checked;
                  handleInputChange('is_electric', isElectric);
                  // If disabling electric and AV is enabled, disable AV too
                  if (!isElectric && formData.av_enabled) {
                    handleInputChange('av_enabled', false);
                  }
                  // Clear battery capacity if not electric
                  if (!isElectric) {
                    handleInputChange('battery_capacity', undefined);
                  }
                }}
                disabled={isLoading || formData.av_enabled} // Disabled if AV is enabled
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Is Electric / Hybrid?
              </span>
            </label>
          </div>

          {/* Battery Capacity - Only show if electric */}
          {formData.is_electric && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Battery Capacity (kWh)
              </label>
              <input
                type="number"
                value={formData.battery_capacity || ''}
                onChange={(e) => handleInputChange('battery_capacity', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 75.5"
                min="0"
                step="0.1"
                disabled={isLoading}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
              />
            </div>
          )}

          {/* Mileage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mileage (miles)
            </label>
            <input
              type="number"
              value={formData.mileage || ''}
              onChange={(e) => handleInputChange('mileage', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 45000 miles"
              min="0"
              step="0.1"
              disabled={isLoading}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
            />
          </div>

          {/* Initial Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Location
            </label>
            <LocationPicker
              onLocationSelect={(location) => handleInputChange('location', location)}
              initialLocation={formData.location}
              className="h-48"
            />
          </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </div>
              ) : (
                'Add Vehicle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicleModal; 