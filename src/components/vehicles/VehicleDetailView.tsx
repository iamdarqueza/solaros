"use client";
import React from "react";
import Link from "next/link";

interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  mileage: number;
  fuelLevel: number;
  driver: string;
  phone: string;
  route: string;
  assignedBranch: string;
  avEnabled: boolean;
  isElectric: boolean;
  batteryCapacity?: number;
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  status: "Active" | "Idle" | "Maintenance" | "Offline";
  location: string;
  lastUpdate: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  details: VehicleDetails;
}

interface VehicleDetailViewProps {
  vehicle: Vehicle;
}

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

const getFuelLevelColor = (level: number) => {
  if (level > 60) return "text-green-600 dark:text-green-400";
  if (level > 30) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

export default function VehicleDetailView({ vehicle }: VehicleDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vehicles"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Vehicles
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(vehicle.status)}`}>
            {vehicle.status}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {vehicle.lastUpdate}
          </span>
        </div>
      </div>

      {/* Vehicle Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Overview */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              {vehicle.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle ID</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{vehicle.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{vehicle.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">License Plate</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{vehicle.details.licensePlate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Make & Model</p>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {vehicle.details.make} {vehicle.details.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Year</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{vehicle.details.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Branch</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{vehicle.details.assignedBranch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">VIN</p>
                <p className="font-medium text-gray-800 dark:text-white/90 text-xs break-all">{vehicle.details.vin}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mileage</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {vehicle.details.mileage ? `${vehicle.details.mileage.toFixed(2)} miles` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle Features</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {vehicle.details.avEnabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      Autonomous
                    </span>
                  )}
                  {vehicle.details.isElectric && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Electric
                    </span>
                  )}
                  {!vehicle.details.avEnabled && !vehicle.details.isElectric && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Standard</span>
                  )}
                </div>
              </div>
              {vehicle.details.isElectric && vehicle.details.batteryCapacity && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Battery Capacity</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{vehicle.details.batteryCapacity} kWh</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fuel Level</p>
                <p className={`font-semibold ${getFuelLevelColor(vehicle.details.fuelLevel)}`}>
                  {vehicle.details.fuelLevel}%
                </p>
              </div>
            </div>
          </div>

          {vehicle.details.isElectric && vehicle.details.batteryCapacity && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Battery</p>
                  <p className="font-semibold text-gray-800 dark:text-white/90">
                    {vehicle.details.batteryCapacity} kWh
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Branch</p>
                <p className="font-semibold text-gray-800 dark:text-white/90">
                  {vehicle.details.assignedBranch}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map and Driver Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Live Location
            </h3>
            <div className="relative h-80 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-800 dark:text-white/90 mb-2">
                    {vehicle.name}
                  </p>
                  {vehicle.coordinates && 
                   typeof vehicle.coordinates.lat === 'number' && 
                   typeof vehicle.coordinates.lng === 'number' ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {vehicle.coordinates.lat.toFixed(4)}, {vehicle.coordinates.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Location not available
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {vehicle.location}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current Route: {vehicle.details.route}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Driver Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {vehicle.details.driver}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Driver</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {vehicle.details.phone}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {vehicle.details.route}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Route</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}