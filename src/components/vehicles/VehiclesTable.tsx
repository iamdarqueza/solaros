"use client";
import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { vehiclesService, VehicleWithDetails, CreateVehicleData } from '@/services/vehiclesService';
import { useAuth } from '@/context/AuthContext';
import AddVehicleModal from './AddVehicleModal';
import EditVehicleModal from './EditVehicleModal';
import VehicleQRCodeModal from './VehicleQRCodeModal';
import ViewDocumentsModal from '../documents/ViewDocumentsModal';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  status: "Active" | "Idle" | "Maintenance" | "Offline";
  assigned_branch: string;
  lastUpdate: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
}

// Status display mapping
const statusDisplayMap: Record<string, string> = {
  'idle': 'Idle',
  'active': 'Active', 
  'maintenance': 'Maintenance',
  'offline': 'Offline'
};

const getStatusColor = (status: Vehicle["status"]) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "Idle":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "Maintenance":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "Offline":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

// Mapbox component for individual vehicle
const VehicleMapView: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!mapContainer.current ||
        !mapboxToken ||
        !vehicle.coordinates || 
        typeof vehicle.coordinates.lat !== 'number' || 
        typeof vehicle.coordinates.lng !== 'number') {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [vehicle.coordinates.lng, vehicle.coordinates.lat],
      zoom: 14,
      accessToken: mapboxToken
    });

    // Create custom marker
    const markerElement = document.createElement('div');
    markerElement.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg';
    markerElement.style.backgroundColor = (() => {
      switch (vehicle.status) {
        case "Active": return "#10b981";
        case "Idle": return "#f59e0b";
        case "Maintenance": return "#ef4444";
        case "Offline": return "#6b7280";
        default: return "#6b7280";
      }
    })();

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([vehicle.coordinates.lng, vehicle.coordinates.lat])
      .addTo(mapInstance);

    return () => {
      marker.remove();
      mapInstance.remove();
    };
  }, [vehicle, mapboxToken]);

  // If no coordinates, show message instead of map
  if (!vehicle.coordinates) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No location found for this vehicle
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Location will appear once the vehicle comes online
          </p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
          Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env.local file to enable the map.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-64">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: (() => {
                switch (vehicle.status) {
                  case "Active": return "#10b981";
                  case "Idle": return "#f59e0b";
                  case "Maintenance": return "#ef4444";
                  case "Offline": return "#6b7280";
                  default: return "#6b7280";
                }
              })() }}
            />
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {vehicle.name}
            </span>
          </div>
          
          {/* Vehicle Details */}
          {(vehicle.make || vehicle.model || vehicle.year) && (
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
              {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
            </div>
          )}
          
          {vehicle.mileage && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {vehicle.mileage.toFixed(2)} miles
            </span>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {vehicle.assigned_branch}
          </div>
          {vehicle.coordinates && 
           typeof vehicle.coordinates.lat === 'number' && 
           typeof vehicle.coordinates.lng === 'number' && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {vehicle.coordinates.lat.toFixed(4)}, {vehicle.coordinates.lng.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function VehiclesTable() {
  const { organization } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedVehicleForQR, setSelectedVehicleForQR] = useState<{ plateNumber: string; name: string } | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedVehicleForDocs, setSelectedVehicleForDocs] = useState<{ id: string; name: string; model?: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Transform VehicleWithDetails to Vehicle interface for UI compatibility
  const transformVehicleData = (vehicle: VehicleWithDetails): Vehicle => {
    // Map database status to UI status
    const statusMap: Record<VehicleWithDetails['status'], Vehicle['status']> = {
      'idle': 'Idle',
      'active': 'Active',
      'maintenance': 'Maintenance',
      'offline': 'Offline'
    };

    // Map vehicle types to display names
    const typeMap: Record<VehicleWithDetails['vehicle_type'], string> = {
      'logistics_freight': 'Logistics & Freight',
      'electric_autonomous': 'Electric & Autonomous',
      'utility_support': 'Utility & Support',
      'simulated_truck': 'Simulated Truck'
    };

    const coordinates = vehicle.location && 
      typeof vehicle.location.latitude === 'number' && 
      typeof vehicle.location.longitude === 'number' ? {
      lat: vehicle.location.latitude,
      lng: vehicle.location.longitude
    } : null;

    return {
      id: vehicle.id,
      name: vehicle.name,
      type: typeMap[vehicle.vehicle_type],
      status: statusMap[vehicle.status],
      assigned_branch: vehicle.assigned_branch || '-', //not assigned
      lastUpdate: vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleString() : 'Never',
      coordinates: coordinates,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage
    };
  };

  // Load vehicles from Supabase
  useEffect(() => {
    const loadVehicles = async () => {
      if (!organization?.id) return;
      
      try {
        setLoading(true);
        const vehiclesData = await vehiclesService.getVehicles(organization.id);
        const transformedVehicles = vehiclesData.map(transformVehicleData);
        setVehicles(transformedVehicles);
        setFilteredVehicles(transformedVehicles);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, [organization?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!organization?.id) return;

    const subscription = vehiclesService.subscribeToVehicleUpdates(
      organization.id,
      (updatedVehicles: VehicleWithDetails[]) => {
        const transformedVehicles = updatedVehicles.map(transformVehicleData);
        setVehicles(transformedVehicles);
        setFilteredVehicles(transformedVehicles);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [organization?.id]);

  // Filter vehicles based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle =>
        vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [vehicles, searchTerm]);

  const handleAddVehicle = () => {
    setShowAddModal(true);
  };

  const handleEditVehicle = async (vehicleId: string) => {
    try {
      const vehicleData = await vehiclesService.getVehicle(vehicleId);
      if (vehicleData) {
        setEditingVehicle(vehicleData);
        setShowEditModal(true);
        setOpenDropdown(null);
      }
    } catch (error) {
      console.error('Error fetching vehicle for edit:', error);
    }
  };

  const handleEditVehicleSubmit = async (vehicleData: Partial<CreateVehicleData>) => {
    if (!editingVehicle) return;

    try {
      setIsSubmitting(true);
      const updatedVehicle = await vehiclesService.updateVehicle(editingVehicle.id, vehicleData);
      const transformedVehicle = transformVehicleData(updatedVehicle);
      
      // Update the vehicle in the list
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === editingVehicle.id ? transformedVehicle : vehicle
      ));
      
      setEditingVehicle(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error; // Re-throw to show error in modal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVehicleSubmit = async (vehicleData: CreateVehicleData) => {
    if (!organization?.id) return;

    try {
      setIsSubmitting(true);
      const newVehicle = await vehiclesService.createVehicle(organization.id, vehicleData);
      const transformedVehicle = transformVehicleData(newVehicle);
      setVehicles(prev => [transformedVehicle, ...prev]);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error; // Re-throw to show error in modal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVehicle = async (vehicleId: string) => {
    try {
      await vehiclesService.deleteVehicle(vehicleId);
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error removing vehicle:', error);
    }
  };

  const handleShowQRCode = (vehicle: Vehicle) => {
    setSelectedVehicleForQR({
      plateNumber: vehicle.name,
      name: vehicle.name
    });
    setShowQRModal(true);
    setOpenDropdown(null);
  };

  const handleShowDocuments = (vehicle: Vehicle) => {
    setSelectedVehicleForDocs({
      id: vehicle.id,
      name: vehicle.name,
      model: vehicle.model
    });
    setShowDocumentsModal(true);
    setOpenDropdown(null);
  };

  const toggleDropdown = (vehicleId: string) => {
    setOpenDropdown(openDropdown === vehicleId ? null : vehicleId);
  };

  const toggleExpandedRow = (vehicleId: string) => {
    setExpandedRow(expandedRow === vehicleId ? null : vehicleId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Fleet Vehicles
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your fleet vehicles and their status
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
              placeholder="Search by plate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-64 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          
          {/* Add Vehicle Button */}
          <button
            onClick={handleAddVehicle}
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
            Add Vehicle
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[50vh] max-h-[calc(100vh-200px)]">
        <table className="w-full">
          <thead className="sticky top-0 bg-white dark:bg-gray-dark z-10">
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Vehicle
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Type
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Branch
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Last Update
              </th>
              <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredVehicles.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchTerm ? 'No vehicles found' : 'No vehicles yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                      {searchTerm 
                        ? `No vehicles match "${searchTerm}". Try a different search term.`
                        : 'Get started by adding your first vehicle to the fleet.'
                      }
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => (
                <React.Fragment key={vehicle.id}>
                  <tr 
                    className="group hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                    onClick={() => toggleExpandedRow(vehicle.id)}
                  >
                    <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            expandedRow === vehicle.id ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        {vehicle.name}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                      {vehicle.type}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                      {vehicle.assigned_branch}
                    </td>
                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                      {vehicle.lastUpdate}
                    </td>
                    <td className="py-4 text-right">
                      <div className="relative" ref={openDropdown === vehicle.id ? dropdownRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(vehicle.id);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {openDropdown === vehicle.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowQRCode(vehicle);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
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
                                  d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 14a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Show QR Code
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowDocuments(vehicle);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
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
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Documents
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditVehicle(vehicle.id);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit Vehicle
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveVehicle(vehicle.id);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove Vehicle
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === vehicle.id && (
                    <tr>
                      <td colSpan={6} className="px-0 py-0">
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                          <VehicleMapView vehicle={vehicle} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading vehicles...</p>
        </div>
      )}

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddVehicleSubmit}
        isLoading={isSubmitting}
      />

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingVehicle(null);
        }}
        onSubmit={handleEditVehicleSubmit}
        vehicle={editingVehicle}
        isLoading={isSubmitting}
      />

      {/* QR Code Modal */}
      {selectedVehicleForQR && (
        <VehicleQRCodeModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedVehicleForQR(null);
          }}
          plateNumber={selectedVehicleForQR.plateNumber}
          vehicleName={selectedVehicleForQR.name}
        />
      )}

      {/* Documents Modal */}
      {selectedVehicleForDocs && (
        <ViewDocumentsModal
          isOpen={showDocumentsModal}
          onClose={() => {
            setShowDocumentsModal(false);
            setSelectedVehicleForDocs(null);
          }}
          type="vehicle"
          itemId={selectedVehicleForDocs.id}
          itemName={selectedVehicleForDocs.name}
          itemModel={selectedVehicleForDocs.model}
        />
      )}
    </div>
  );
} 