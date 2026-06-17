'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { vehiclesService, VehicleWithDetails } from '@/services/vehiclesService';
import { useAuth } from '@/context/AuthContext';
import VehicleDetailView from './VehicleDetailView';

interface VehicleDetailWrapperProps {
  vehicleId: string;
}

// Transform VehicleWithDetails to the format expected by VehicleDetailView
const transformVehicleForDetailView = (vehicle: VehicleWithDetails) => {
  // Status display mapping
  const statusMap: Record<string, "Active" | "Idle" | "Maintenance" | "Offline"> = {
    'idle': 'Idle',
    'active': 'Active',
    'maintenance': 'Maintenance',
    'offline': 'Offline'
  };

  return {
    id: vehicle.id,
    name: vehicle.name,
    type: vehicle.vehicle_type.charAt(0).toUpperCase() + vehicle.vehicle_type.slice(1),
    status: statusMap[vehicle.status] || 'Offline',
    location: vehicle.location && 
      typeof vehicle.location.latitude === 'number' && 
      typeof vehicle.location.longitude === 'number'
      ? `${vehicle.location.latitude.toFixed(4)}, ${vehicle.location.longitude.toFixed(4)}`
      : 'No location',
    lastUpdate: new Date(vehicle.updated_at).toLocaleString(),
    coordinates: vehicle.location && 
      typeof vehicle.location.latitude === 'number' && 
      typeof vehicle.location.longitude === 'number' ? {
      lat: vehicle.location.latitude,
      lng: vehicle.location.longitude
    } : {
      lat: 0,
      lng: 0
    },
    details: {
      make: vehicle.make || 'Unknown',
      model: vehicle.model || 'Unknown',
      year: vehicle.year || new Date().getFullYear(),
      vin: vehicle.vin || 'N/A',
      licensePlate: vehicle.plate_number,
      mileage: vehicle.mileage || 0,
      fuelLevel: vehicle.fuel_level || 0,
      driver: vehicle.driver_name || 'Unassigned',
      phone: vehicle.driver_phone || 'N/A',
      route: vehicle.current_route || 'No active route',
      assignedBranch: vehicle.assigned_branch || 'Not Assigned',
      avEnabled: vehicle.av_enabled || false,
      isElectric: vehicle.is_electric || false,
      batteryCapacity: vehicle.battery_capacity || undefined
    }
  };
};

export default function VehicleDetailWrapper({ vehicleId }: VehicleDetailWrapperProps) {
  const { organization } = useAuth();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!organization?.id) return;

      try {
        setLoading(true);
        setError(null);
        const vehicleData = await vehiclesService.getVehicle(vehicleId);
        
        if (!vehicleData) {
          setError('Vehicle not found');
          return;
        }

        // Check if vehicle belongs to current organization
        if (vehicleData.org_id !== organization.id) {
          setError('Vehicle not found');
          return;
        }

        setVehicle(vehicleData);
      } catch (err) {
        console.error('Error loading vehicle:', err);
        setError('Failed to load vehicle data');
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [vehicleId, organization?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-400">Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    notFound();
  }

  const transformedVehicle = transformVehicleForDetailView(vehicle);

  return <VehicleDetailView vehicle={transformedVehicle} />;
} 