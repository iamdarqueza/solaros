'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { vehiclesService, VehicleWithDetails } from '@/services/vehiclesService';
import { routesService, RouteData } from '@/services/routesService';
import { CreateDispatchData } from '@/services/dispatchService';
import { formatDuration } from '@/utils/timeUtils';

interface DispatchFormData {
  title: string;
  vehicle_id: string;
  route_type: string;
  status: string;
  route_id: string;
  instructions?: string;
  priority: string;
  planned_start_time: string;
  planned_end_time: string;
}

interface AddDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDispatchData) => Promise<void>;
  isLoading: boolean;
}

const routeTypeOptions = [
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Return', label: 'Return' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Service', label: 'Service' },
  { value: 'Inspection', label: 'Inspection' },
  { value: 'Recovery', label: 'Recovery' },
  { value: 'Demo', label: 'Demo' },
  { value: 'Deployment', label: 'Deployment' },
  { value: 'Collection', label: 'Collection' },
];

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
];

const priorityOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function AddDispatchModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: AddDispatchModalProps) {
  const { organization } = useAuth();
  
  // Helper function to get default datetime values
  const getDefaultStartTime = () => {
    const today = new Date();
    today.setHours(8, 0, 0, 0); // Set to 8:00 AM
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDefaultEndTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Add 1 day
    tomorrow.setHours(8, 0, 0, 0); // Set to 8:00 AM
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const [formData, setFormData] = useState<DispatchFormData>({
    title: '',
    vehicle_id: '',
    route_type: 'Delivery',
    status: 'scheduled',
    route_id: '',
    instructions: '',
    priority: 'normal',
    planned_start_time: getDefaultStartTime(),
    planned_end_time: getDefaultEndTime(),
  });

  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load vehicles and routes from Supabase
  useEffect(() => {
    if (isOpen && organization?.id) {
      loadVehiclesAndRoutes();
    }
  }, [isOpen, organization?.id]);

  const loadVehiclesAndRoutes = async () => {
    if (!organization?.id) return;
    
    setIsLoadingData(true);
    try {
      // Load vehicles with status 'idle'
      const allVehicles = await vehiclesService.getVehicles(organization.id);
      const idleVehicles = allVehicles.filter((vehicle: VehicleWithDetails) => vehicle.status === 'idle');
      setVehicles(idleVehicles);

      // Load all routes
      const allRoutes = await routesService.getRoutes(organization.id);
      setRoutes(allRoutes);
    } catch (error) {
      console.error('Error loading vehicles and routes:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRouteChange = (routeId: string) => {
    setFormData({ ...formData, route_id: routeId });
    const route = routes.find(r => r.id === routeId);
    setSelectedRoute(route || null);
    
    // Auto-calculate end time if start time is set and route has duration
    if (formData.planned_start_time && route?.estimated_duration_minutes) {
      const startTime = new Date(formData.planned_start_time);
      startTime.setMinutes(startTime.getMinutes() + route.estimated_duration_minutes);
      const endTime = startTime.toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, route_id: routeId, planned_end_time: endTime }));
    }
  };

  // Auto-calculate end time when start time changes
  const handleStartTimeChange = (startTime: string) => {
    setFormData(prev => ({ ...prev, planned_start_time: startTime }));
    
    if (startTime && selectedRoute?.estimated_duration_minutes) {
      const start = new Date(startTime);
      start.setMinutes(start.getMinutes() + selectedRoute.estimated_duration_minutes);
      const endTime = start.toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, planned_end_time: endTime }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.vehicle_id || !formData.route_id || !formData.planned_start_time || !formData.planned_end_time) {
      alert('Please fill in all required fields including dispatch title, scheduled departure and estimated arrival times');
      return;
    }

    // Validate that end time is after start time
    if (formData.planned_start_time && formData.planned_end_time) {
      const startTime = new Date(formData.planned_start_time);
      const endTime = new Date(formData.planned_end_time);
      
      if (endTime <= startTime) {
        alert('Estimated arrival time must be after the scheduled departure time');
        return;
      }
    }

    try {
      // Convert form data to CreateDispatchData format
      const dispatchData: CreateDispatchData = {
        title: formData.title,
        vehicle_id: formData.vehicle_id,
        route_type: formData.route_type,
        status: formData.status,
        route_id: formData.route_id,
        instructions: formData.instructions || undefined,
        priority: formData.priority,
        planned_start_time: formData.planned_start_time,
        planned_end_time: formData.planned_end_time,
      };

      await onSubmit(dispatchData);
      handleClose();
    } catch (error) {
      console.error('Error creating dispatch:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      vehicle_id: '',
      route_type: 'Delivery',
      status: 'scheduled',
      route_id: '',
      instructions: '',
      priority: 'normal',
      planned_start_time: getDefaultStartTime(),
      planned_end_time: getDefaultEndTime(),
    });
    setSelectedRoute(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Dispatch Assignment
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Dispatch Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dispatch Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter a descriptive title for this dispatch"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A clear, descriptive name to identify this dispatch assignment
              </p>
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vehicle *
              </label>
              {isLoadingData ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-500 dark:text-gray-400">Loading vehicles...</span>
                </div>
              ) : (
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={vehicles.length === 0}
                >
                  <option value="">
                    {vehicles.length === 0 ? 'No idle vehicles available' : 'Select a vehicle'}
                  </option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} - {vehicle.make} {vehicle.model} ({vehicle.status})
                    </option>
                  ))}
                </select>
              )}
              {!isLoadingData && vehicles.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  No vehicles with 'idle' status are currently available.
                </p>
              )}
            </div>

            {/* Route Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Route *
              </label>
              {isLoadingData ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-500 dark:text-gray-400">Loading routes...</span>
                </div>
              ) : (
                <select
                  value={formData.route_id}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={routes.length === 0}
                >
                  <option value="">
                    {routes.length === 0 ? 'No routes available' : 'Select a route'}
                  </option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              )}
              {!isLoadingData && routes.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  No routes are currently available. Please create a route first.
                </p>
              )}
            </div>

            {/* Auto-populated Route Details */}
            {selectedRoute && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-3">Route Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-400 font-medium">Origin:</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedRoute.origin_location_name || 'Location not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-400 font-medium">Destination:</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedRoute.destination_location_name || 'Location not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-400 font-medium">Distance:</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedRoute.estimated_distance_km 
                        ? `${selectedRoute.estimated_distance_km.toFixed(2)} miles`
                        : 'Not calculated'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-400 font-medium">Duration:</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedRoute.estimated_duration_minutes 
                        ? formatDuration(selectedRoute.estimated_duration_minutes)
                        : 'Not calculated'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Route Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Route Type *
                </label>
                <select
                  value={formData.route_type}
                  onChange={(e) => setFormData({ ...formData, route_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  {routeTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Planning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled Departure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scheduled Departure *
                </label>
                <input
                  type="datetime-local"
                  value={formData.planned_start_time}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white [color-scheme:dark]"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  When the vehicle should start this dispatch
                </p>
              </div>

              {/* Estimated Arrival */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Arrival *
                </label>
                <input
                  type="datetime-local"
                  value={formData.planned_end_time}
                  onChange={(e) => setFormData({ ...formData, planned_end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white [color-scheme:dark]"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedRoute?.estimated_duration_minutes && formData.planned_start_time
                    ? `Auto-calculated based on ${formatDuration(selectedRoute.estimated_duration_minutes)} route duration`
                    : 'Expected completion time for this dispatch'
                  }
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instructions (Optional)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter any special instructions for this dispatch..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title || !formData.vehicle_id || !formData.route_id || !formData.planned_start_time || !formData.planned_end_time || isLoadingData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Creating Dispatch...' : 'Create Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
