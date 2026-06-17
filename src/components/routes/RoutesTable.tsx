"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { routesService, RouteData, CreateRouteData, UpdateRouteData } from '@/services/routesService';
import AddRouteModal from './AddRouteModal';
import EditRouteModal from './EditRouteModal';
import { formatDuration } from '@/utils/timeUtils';

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  created_at: string;
}

export default function RoutesTable() {
  const { organization } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [rawRoutes, setRawRoutes] = useState<RouteData[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Transform RouteData to Route interface for UI compatibility
  const transformRouteData = (route: RouteData): Route => {
    return {
      id: route.id,
      name: route.name,
      origin: route.origin_location_name || `${route.origin_lat?.toFixed(4) || 0}, ${route.origin_lng?.toFixed(4) || 0}`,
      destination: route.destination_location_name || `${route.destination_lat?.toFixed(4) || 0}, ${route.destination_lng?.toFixed(4) || 0}`,
      distance: route.estimated_distance_km ? `${parseFloat(route.estimated_distance_km.toFixed(2))} miles` : 'N/A',
      duration: route.estimated_duration_minutes ? formatDuration(route.estimated_duration_minutes) : 'N/A',
      created_at: new Date(route.created_at).toLocaleDateString(),
    };
  };

  // Load routes from service
  const loadRoutes = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const routesData = await routesService.getRoutes(organization.id);
      setRawRoutes(routesData);
      const transformedRoutes = routesData.map(transformRouteData);
      setRoutes(transformedRoutes);
      setFilteredRoutes(transformedRoutes);
    } catch (error) {
      console.error('Error loading routes:', error);
      setNotification({ type: 'error', message: 'Failed to load routes' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, [organization?.id]);

  // Filter routes based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRoutes(routes);
    } else {
      const filtered = routes.filter(route =>
        route.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRoutes(filtered);
    }
  }, [routes, searchTerm]);

  // Open route in Google Maps
  const handleViewOnMap = (routeId: string) => {
    const route = rawRoutes.find(r => r.id === routeId);
    if (!route || !route.origin_lat || !route.origin_lng || !route.destination_lat || !route.destination_lng) {
      alert('Route coordinates not available');
      return;
    }

    const origin = `${route.origin_lat},${route.origin_lng}`;
    const destination = `${route.destination_lat},${route.destination_lng}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
    
    window.open(googleMapsUrl, '_blank');
    setOpenDropdown(null);
  };

  // Handle edit route
  const handleEditRoute = (routeId: string) => {
    const route = rawRoutes.find(r => r.id === routeId);
    if (route) {
      setSelectedRoute(route);
      setShowEditModal(true);
      setOpenDropdown(null);
    }
  };

  const handleAddRoute = () => {
    setShowAddModal(true);
  };

  const handleAddRouteSubmit = async (routeData: CreateRouteData) => {
    if (!organization?.id) return;

    try {
      setIsSubmitting(true);
      await routesService.createRoute(organization.id, routeData);
      setNotification({ type: 'success', message: 'Route added successfully!' });
      setTimeout(() => setNotification(null), 3000);
      // Reload routes
      loadRoutes();
    } catch (error) {
      console.error('Error creating route:', error);
      setNotification({ type: 'error', message: 'Failed to add route' });
      setTimeout(() => setNotification(null), 3000);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRouteSubmit = async (routeData: UpdateRouteData) => {
    try {
      setIsSubmitting(true);
      await routesService.updateRoute(routeData);
      setNotification({ type: 'success', message: 'Route updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
      // Reload routes
      loadRoutes();
    } catch (error) {
      console.error('Error updating route:', error);
      setNotification({ type: 'error', message: 'Failed to update route' });
      setTimeout(() => setNotification(null), 3000);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route?')) {
      return;
    }

    try {
      setOpenDropdown(null);
      await routesService.deleteRoute(routeId);
      setNotification({ type: 'success', message: 'Route deleted successfully!' });
      setTimeout(() => setNotification(null), 3000);
      // Reload routes
      loadRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      setNotification({ type: 'error', message: 'Failed to delete route' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleDropdown = (routeId: string) => {
    setOpenDropdown(openDropdown === routeId ? null : routeId);
  };

  const toggleExpandedRow = (routeId: string) => {
    setExpandedRow(expandedRow === routeId ? null : routeId);
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
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setNotification(null)}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  notification.type === 'success'
                    ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
                    : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                }`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Routes
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your fleet routes and route plans
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
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-72 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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

          {/* Add Route Button */}
          <button
            onClick={handleAddRoute}
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
            Add Route
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredRoutes.length === 0 ? (
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No routes found' : 'No routes yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {searchTerm
              ? `No routes match "${searchTerm}". Try a different search term.`
              : 'Get started by creating your first route plan for deliveries, pickups, inspections, and more.'
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
      ) : (
        <div className="overflow-x-auto min-h-[50vh] max-h-[calc(100vh-200px)]">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-gray-dark z-10">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Route
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Distance
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Duration
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Created
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredRoutes.map((route) => (
                <React.Fragment key={route.id}>
                  <tr
                    className="group hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                    onClick={() => toggleExpandedRow(route.id)}
                  >
                    <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            expandedRow === route.id ? 'rotate-90' : ''
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
                        <div className="font-medium">{route.name}</div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                      {route.distance}
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                      {route.duration}
                    </td>
                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                      {route.created_at}
                    </td>
                    <td className="py-4 text-right">
                      <div className="relative" ref={openDropdown === route.id ? dropdownRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(route.id);
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
                        
                        {openDropdown === route.id && (
                          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewOnMap(route.id);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              <svg
                                className="mr-3 h-4 w-4"
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
                              View on Google Maps
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditRoute(route.id);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <svg
                                className="mr-3 h-4 w-4"
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
                              Edit Route
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoute(route.id);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <svg
                                className="mr-3 h-4 w-4"
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
                              Delete Route
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === route.id && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 bg-gray-50 dark:bg-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Route Details */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                              Route Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Origin:</span>
                                <span className="text-gray-900 dark:text-white text-right max-w-xs truncate">{route.origin}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Destination:</span>
                                <span className="text-gray-900 dark:text-white text-right max-w-xs truncate">{route.destination}</span>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                              Additional Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Distance:</span>
                                <span className="text-gray-900 dark:text-white">{route.distance}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                                <span className="text-gray-900 dark:text-white">{route.duration}</span>
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                Created: {route.created_at}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Route Modal */}
      <AddRouteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddRouteSubmit}
        isLoading={isSubmitting}
      />

      {/* Edit Route Modal */}
      <EditRouteModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRoute(null);
        }}
        onSubmit={handleEditRouteSubmit}
        isLoading={isSubmitting}
        route={selectedRoute}
      />
    </div>
  );
} 