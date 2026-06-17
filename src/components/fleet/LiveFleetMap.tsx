"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { vehiclesService, VehicleWithDetails } from '@/services/vehiclesService';
import { dispatchService } from '@/services/dispatchService';
import { routesService, RouteData } from '@/services/routesService';
import { useAuth } from '@/context/AuthContext';
import { formatDuration } from '@/utils/timeUtils';

// Real vehicle data interface based on our Supabase schema
interface FleetVehicle {
  id: string;
  name: string;
  plate_number: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  type: 'logistics_freight' | 'electric_autonomous' | 'utility_support' | 'simulated_truck';
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuel_level?: number;
  battery_capacity?: number;
  av_enabled?: boolean;
  is_electric?: boolean;
  driver_name?: string;
  assigned_branch?: string;
  lastUpdate: string;
}

// Search result interfaces
interface DispatchSearchResult {
  id: string;
  tracking_id: string;
  title: string;
  route_id?: string;
  route_origin?: string;
  route_destination?: string;
  vehicle_plate?: string;
  status: string;
}

interface SearchState {
  query: string;
  isSearching: boolean;
  searchType: 'dispatch' | 'vehicle' | null;
  selectedDispatch: DispatchSearchResult | null;
  selectedVehicleFromSearch: FleetVehicle | null;
  routeGeometry: any | null;
  routeOriginCoords?: [number, number];
  routeDestinationCoords?: [number, number];
  routeDistance?: number; // Distance in miles
  routeDuration?: number; // Duration in minutes
}

const LiveFleetMap: React.FC = () => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const { organization } = useAuth();
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<FleetVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FleetVehicle['status'] | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [viewState, setViewState] = useState({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 4 // Wider view to show all vehicles
  });

  // Search state
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isSearching: false,
    searchType: null,
    selectedDispatch: null,
    selectedVehicleFromSearch: null,
    routeGeometry: null,
    routeOriginCoords: undefined,
    routeDestinationCoords: undefined,
    routeDistance: undefined,
    routeDuration: undefined
  });

  // Check Mapbox token on component mount
  useEffect(() => {
    if (!mapboxToken) {
      console.error('🚨 MAPBOX TOKEN MISSING: Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables');
      console.log('Without a valid Mapbox token, routes will show as straight lines instead of following roads');
    } else {
      console.log('✅ Mapbox token found, road routing should work properly');
    }
  }, [mapboxToken]);

  // Transform VehicleWithDetails to FleetVehicle interface
  const transformVehicleData = (vehicle: VehicleWithDetails): FleetVehicle | null => {
    // Only include vehicles with valid coordinates
    if (!vehicle.location || 
        typeof vehicle.location.latitude !== 'number' || 
        typeof vehicle.location.longitude !== 'number') {
      return null;
    }

    // Map database status to UI status
    const statusMap: Record<VehicleWithDetails['status'], FleetVehicle['status']> = {
      'idle': 'idle',
      'active': 'active',
      'maintenance': 'maintenance',
      'offline': 'offline'
    };

    return {
      id: vehicle.id,
      name: vehicle.plate_number,
      plate_number: vehicle.plate_number,
      latitude: vehicle.location.latitude,
      longitude: vehicle.location.longitude,
      status: statusMap[vehicle.status],
      type: vehicle.vehicle_type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuel_level: vehicle.fuel_level,
      battery_capacity: vehicle.battery_capacity,
      av_enabled: vehicle.av_enabled,
      is_electric: vehicle.is_electric,
      driver_name: vehicle.driver_name,
      assigned_branch: vehicle.assigned_branch,
      lastUpdate: vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleString() : 'Never'
    };
  };

  // Load vehicles from Supabase
  useEffect(() => {
    const loadVehicles = async () => {
      if (!organization?.id) {
        console.log('No organization ID, skipping vehicle load');
        return;
      }
      
      console.log('Loading vehicles for organization:', organization.id);
      
      try {
        setLoading(true);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('Vehicle loading timed out after 10 seconds');
          controller.abort();
        }, 10000);

        const vehiclesData = await vehiclesService.getVehicles(organization.id);
        clearTimeout(timeoutId);
        
        console.log('Vehicles loaded successfully:', vehiclesData.length);
        
        const transformedVehicles = vehiclesData
          .map(transformVehicleData)
          .filter((vehicle): vehicle is FleetVehicle => vehicle !== null);
        
        setVehicles(transformedVehicles);
        
        // If we have vehicles, center the map on the first one
        if (transformedVehicles.length > 0) {
          setViewState(prev => ({
            ...prev,
            longitude: transformedVehicles[0].longitude,
            latitude: transformedVehicles[0].latitude,
            zoom: 6
          }));
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
        
        // If it's an abort error (timeout), show specific message
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Vehicle loading was cancelled due to timeout');
        }
      } finally {
        setLoading(false);
        console.log('Vehicle loading completed');
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
        const transformedVehicles = updatedVehicles
          .map(transformVehicleData)
          .filter((vehicle): vehicle is FleetVehicle => vehicle !== null);
        setVehicles(transformedVehicles);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [organization?.id]);

  // Filter vehicles based on status and branch
  useEffect(() => {
    let filtered = vehicles;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }
    
    // Filter by branch
    if (branchFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.assigned_branch === branchFilter);
    }
    
    setFilteredVehicles(filtered);
  }, [vehicles, statusFilter, branchFilter]);

  // Debug route geometry changes
  useEffect(() => {
    console.log('Route state changed:', {
      hasGeometry: !!searchState.routeGeometry,
      hasOrigin: !!searchState.routeOriginCoords,
      hasDestination: !!searchState.routeDestinationCoords,
      selectedDispatch: !!searchState.selectedDispatch
    });
    
    if (searchState.routeGeometry) {
      console.log('✅ Route geometry is set:', searchState.routeGeometry);
    }
    if (searchState.routeOriginCoords && searchState.routeDestinationCoords) {
      console.log('✅ Route markers should be visible:', {
        origin: searchState.routeOriginCoords,
        destination: searchState.routeDestinationCoords
      });
    }
  }, [searchState.routeGeometry, searchState.routeOriginCoords, searchState.routeDestinationCoords, searchState.selectedDispatch]);

  // Get unique branches from vehicles
  const getUniqueBranches = (): string[] => {
    const branches = vehicles
      .map(vehicle => vehicle.assigned_branch)
      .filter((branch): branch is string => Boolean(branch))
      .filter((branch, index, array) => array.indexOf(branch) === index)
      .sort();
    return branches;
  };

  // Get marker color based on vehicle status
  const getMarkerColor = (status: FleetVehicle['status']) => {
    switch (status) {
      case 'active': return '#10B981'; // green
      case 'idle': return '#F59E0B'; // yellow
      case 'maintenance': return '#EF4444'; // red
      case 'offline': return '#6B7280'; // gray
      default: return '#6B7280';
    }
  };

  // Get vehicle icon based on type
  const getVehicleIcon = (type: FleetVehicle['type']) => {
    switch (type) {
      case 'logistics_freight': return '🚛';
      case 'electric_autonomous': return '🤖';
      case 'utility_support': return '🚐';
      case 'simulated_truck': return '🚗';
      default: return '🚛';
    }
  };

  const handleMarkerClick = useCallback((vehicle: FleetVehicle) => {
    setSelectedVehicle(vehicle);
    setViewState(prev => ({
      ...prev,
      longitude: vehicle.longitude,
      latitude: vehicle.latitude,
      zoom: 14
    }));
  }, []);

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim() || !organization?.id) return;

    setSearchState(prev => ({ ...prev, isSearching: true }));

    try {
      // Check if query looks like a tracking ID (starts with # or is numeric)
      const isTrackingId = query.startsWith('#') || /^\d+$/.test(query);
      const searchQuery = query.startsWith('#') ? query.substring(1) : query;

      if (isTrackingId) {
        // Search for dispatch by tracking ID
        const dispatches = await dispatchService.getDispatches(organization.id);
        const matchedDispatch = dispatches.find(d => 
          d.tracking_id === searchQuery || 
          d.tracking_id?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (matchedDispatch) {
          const dispatchResult: DispatchSearchResult = {
            id: matchedDispatch.id,
            tracking_id: matchedDispatch.tracking_id || '',
            title: matchedDispatch.title,
            route_id: matchedDispatch.route_id,
            route_origin: matchedDispatch.route_origin,
            route_destination: matchedDispatch.route_destination,
            vehicle_plate: matchedDispatch.vehicle_plate,
            status: matchedDispatch.status
          };

          await showDispatchRoute(dispatchResult);
          setSearchState(prev => ({
            ...prev,
            searchType: 'dispatch',
            selectedDispatch: dispatchResult,
            selectedVehicleFromSearch: null
          }));
        } else {
          alert('No dispatch found with that tracking ID');
        }
      } else {
        // Search for vehicle by plate number
        const matchedVehicle = vehicles.find(v => 
          v.plate_number.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (matchedVehicle) {
          setSelectedVehicle(matchedVehicle);
          setViewState(prev => ({
            ...prev,
            longitude: matchedVehicle.longitude,
            latitude: matchedVehicle.latitude,
            zoom: 14
          }));
          setSearchState(prev => ({
            ...prev,
            searchType: 'vehicle',
            selectedDispatch: null,
            selectedVehicleFromSearch: matchedVehicle,
            routeGeometry: null
          }));
        } else {
          alert('No vehicle found with that plate number');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error performing search');
    } finally {
      setSearchState(prev => ({ ...prev, isSearching: false }));
    }
  };

  // Show dispatch route on map
  const showDispatchRoute = async (dispatch: DispatchSearchResult) => {
    console.log('showDispatchRoute called with dispatch:', dispatch);
    
    try {
      // If we have a route_id, fetch the route details
      if (dispatch.route_id && organization?.id) {
        console.log('Fetching route data for route_id:', dispatch.route_id);
        const routeData = await routesService.getRoute(dispatch.route_id);
        console.log('Route data received:', routeData);
        
        if (routeData) {
          console.log('Route data structure:', {
            id: routeData.id,
            name: routeData.name,
            origin_lat: routeData.origin_lat,
            origin_lng: routeData.origin_lng,
            destination_lat: routeData.destination_lat,
            destination_lng: routeData.destination_lng,
            origin_location_name: routeData.origin_location_name,
            destination_location_name: routeData.destination_location_name
          });
          
          if (routeData.origin_lat && routeData.origin_lng && routeData.destination_lat && routeData.destination_lng) {
            const originCoords: [number, number] = [routeData.origin_lng, routeData.origin_lat];
            const destCoords: [number, number] = [routeData.destination_lng, routeData.destination_lat];
            
            console.log('✅ Using REAL route coordinates:', { originCoords, destCoords });
            
            // Store coordinates for markers
            setSearchState(prev => ({
              ...prev,
              routeOriginCoords: originCoords,
              routeDestinationCoords: destCoords
            }));
            
            // Get route geometry from Mapbox Directions API
            try {
              const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
              
              if (!mapboxToken) {
                console.error('❌ NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN not found in environment variables');
                throw new Error('Mapbox token not configured');
              }
              
              const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&overview=full&steps=true&access_token=${mapboxToken}`;
              console.log('Fetching REAL route geometry from Mapbox Directions API...');
              
              const response = await fetch(directionsUrl);
              console.log('Mapbox response status:', response.status);
              
              if (response.ok) {
                const data = await response.json();
                console.log('Mapbox response data:', data);
                
                if (data.routes && data.routes.length > 0) {
                  const route = data.routes[0];
                  
                  // Ensure we have valid geometry
                  if (route.geometry && route.geometry.coordinates && route.geometry.coordinates.length > 0) {
                    const routeGeometry = {
                      type: 'Feature',
                      properties: {
                        distance: route.distance,
                        duration: route.duration
                      },
                      geometry: route.geometry
                    };
                    console.log('✅ Setting REAL road-following route geometry:', routeGeometry);
                    
                    // Convert distance from meters to miles and duration from seconds to minutes
                    const distanceInMiles = route.distance * 0.000621371; // meters to miles
                    const durationInMinutes = route.duration / 60; // seconds to minutes
                    
                    setSearchState(prev => ({
                      ...prev,
                      routeGeometry,
                      routeDistance: Math.round(distanceInMiles * 10) / 10, // Round to 1 decimal place
                      routeDuration: Math.round(durationInMinutes)
                    }));
                  } else {
                    console.error('❌ Invalid geometry in route response');
                    throw new Error('Invalid route geometry');
                  }
                } else {
                  console.log('❌ No routes found in Mapbox response');
                  throw new Error('No routes found');
                }
              } else {
                const errorText = await response.text();
                console.error('❌ Mapbox API error:', response.status, errorText);
                throw new Error(`Mapbox API error: ${response.status}`);
              }
            } catch (routeError) {
              console.error('❌ Error fetching route geometry from Mapbox:', routeError);
              
              // Fallback: Create a simple straight line if Mapbox fails
              console.log('⚠️ Falling back to straight line route');
              const fallbackGeometry = {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [originCoords, destCoords]
                }
              };
              
              setSearchState(prev => ({
                ...prev,
                routeGeometry: fallbackGeometry,
                routeDistance: undefined,
                routeDuration: undefined
              }));
            }
            
            // Fit map to show the entire route with proper bounds
            const lngDiff = Math.abs(originCoords[0] - destCoords[0]);
            const latDiff = Math.abs(originCoords[1] - destCoords[1]);
            
            // Calculate center point
            const centerLng = (originCoords[0] + destCoords[0]) / 2;
            const centerLat = (originCoords[1] + destCoords[1]) / 2;
            
            // Calculate appropriate zoom level based on coordinate differences
            let zoom = 10; // Default zoom
            const maxDiff = Math.max(lngDiff, latDiff);
            
            if (maxDiff < 0.01) {
              zoom = 14; // Very close points
            } else if (maxDiff < 0.05) {
              zoom = 12; // Close points
            } else if (maxDiff < 0.1) {
              zoom = 10; // Medium distance
            } else if (maxDiff < 0.5) {
              zoom = 8; // Far points
            } else if (maxDiff < 1.0) {
              zoom = 6; // Very far points
            } else {
              zoom = 4; // Extremely far points
            }
            
            console.log('✅ REAL Route visualization:', {
              origin: originCoords,
              destination: destCoords,
              center: [centerLng, centerLat],
              zoom
            });
            
            setViewState(prev => ({
              ...prev,
              longitude: centerLng,
              latitude: centerLat,
              zoom
            }));
            
            return;
          } else {
            console.log('❌ Route data missing coordinates:', {
              origin_lat: routeData.origin_lat,
              origin_lng: routeData.origin_lng,
              destination_lat: routeData.destination_lat,
              destination_lng: routeData.destination_lng
            });
          }
        } else {
          console.log('❌ No route data returned from database');
        }
      } else {
        console.log('❌ No route_id or organization_id:', { route_id: dispatch.route_id, org_id: organization?.id });
      }
      
      // If we get here, we don't have valid route data
      console.log('❌ Cannot display route - no valid route coordinates found');
      alert('This dispatch does not have route coordinates. Please ensure the route has origin and destination coordinates set.');
      
      // Fallback: try to find the assigned vehicle if no route coordinates
      if (dispatch.vehicle_plate) {
        console.log('Falling back to vehicle location for:', dispatch.vehicle_plate);
        const vehicle = vehicles.find(v => v.plate_number === dispatch.vehicle_plate);
        if (vehicle) {
          console.log('Found vehicle:', vehicle);
          setViewState(prev => ({
            ...prev,
            longitude: vehicle.longitude,
            latitude: vehicle.latitude,
            zoom: 14
          }));
        } else {
          console.log('Vehicle not found');
        }
      }
    } catch (error) {
      console.error('Error showing dispatch route:', error);
      
      // Fallback to vehicle location
      if (dispatch.vehicle_plate) {
        const vehicle = vehicles.find(v => v.plate_number === dispatch.vehicle_plate);
        if (vehicle) {
          setViewState(prev => ({
            ...prev,
            longitude: vehicle.longitude,
            latitude: vehicle.latitude,
            zoom: 14
          }));
        }
      }
    }
  };

  // Clear search and return to overview
  const clearSearch = () => {
    setSearchState({
      query: '',
      isSearching: false,
      searchType: null,
      selectedDispatch: null,
      selectedVehicleFromSearch: null,
      routeGeometry: null,
      routeOriginCoords: undefined,
      routeDestinationCoords: undefined,
      routeDistance: undefined,
      routeDuration: undefined
    });
    setSelectedVehicle(null);
    
    // Reset view to show all vehicles
    if (vehicles.length > 0) {
      const avgLat = vehicles.reduce((sum, v) => sum + v.latitude, 0) / vehicles.length;
      const avgLng = vehicles.reduce((sum, v) => sum + v.longitude, 0) / vehicles.length;
      setViewState(prev => ({
        ...prev,
        longitude: avgLng,
        latitude: avgLat,
        zoom: 6
      }));
    }
  };

  return (
    <div className="w-full h-[600px] relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Search Interface - Always visible when not loading */}
      {!loading && vehicles.length > 0 && (
        <div className="absolute top-4 left-4 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 min-w-[300px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search tracking ID (#12345) or plate number..."
                value={searchState.query}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 15); // Limit to 15 characters
                  setSearchState(prev => ({ ...prev, query: value }));
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchState.query);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={searchState.isSearching}
                maxLength={15}
              />
              {searchState.isSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleSearch(searchState.query)}
              disabled={searchState.isSearching || !searchState.query.trim()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
            
            {(searchState.selectedDispatch || searchState.selectedVehicleFromSearch) && (
              <button
                onClick={clearSearch}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
          
          {/* Search Result Info */}
          {searchState.selectedDispatch && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  Dispatch #{searchState.selectedDispatch.tracking_id}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  searchState.selectedDispatch.status === 'active' || searchState.selectedDispatch.status === 'in_progress'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : searchState.selectedDispatch.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {searchState.selectedDispatch.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {searchState.selectedDispatch.title}
              </p>
              {searchState.selectedDispatch.route_origin && searchState.selectedDispatch.route_destination && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>From: {searchState.selectedDispatch.route_origin}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>To: {searchState.selectedDispatch.route_destination}</span>
                  </div>
                </div>
              )}
              {searchState.selectedDispatch.vehicle_plate && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Vehicle: {searchState.selectedDispatch.vehicle_plate}
                </div>
              )}
              {/* Distance and Duration Information */}
              {(searchState.routeDistance || searchState.routeDuration) && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-4">
                    {searchState.routeDistance && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>{searchState.routeDistance} miles</span>
                      </div>
                    )}
                    {searchState.routeDuration && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDuration(searchState.routeDuration)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {searchState.selectedVehicleFromSearch && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                Vehicle Found: {searchState.selectedVehicleFromSearch.plate_number}
              </h4>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div>Status: <span className="capitalize">{searchState.selectedVehicleFromSearch.status}</span></div>
                {searchState.selectedVehicleFromSearch.driver_name && (
                  <div>Driver: {searchState.selectedVehicleFromSearch.driver_name}</div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Use # for tracking IDs or enter plate numbers directly
          </div>
        </div>
      )}

      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading fleet data...</p>
          </div>
        </div>
      ) : !mapboxToken ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Map unavailable
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env.local file.
            </p>
          </div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No vehicles with location data
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Vehicles will appear on the map once they have location data.
            </p>
          </div>
        </div>
      ) : (
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={mapboxToken}
          style={{width: '100%', height: '100%'}}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          attributionControl={false}
        >
          {/* Route Layer for Dispatch Routes */}
          {searchState.routeGeometry ? (
            <Source id="route" type="geojson" data={searchState.routeGeometry}>
              <Layer
                id="route-layer"
                type="line"
                paint={{
                  'line-color': '#3B82F6',
                  'line-width': 4,
                  'line-opacity': 0.8
                }}
              />
            </Source>
          ) : null}

          {/* Origin Marker for Route */}
          {searchState.routeOriginCoords && (
            <Marker
              longitude={searchState.routeOriginCoords[0]}
              latitude={searchState.routeOriginCoords[1]}
            >
              <div className="cursor-pointer">
                <div
                  style={{
                    backgroundColor: '#10B981', // Green for origin
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    fontSize: '14px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  A
                </div>
              </div>
            </Marker>
          )}

          {/* Destination Marker for Route */}
          {searchState.routeDestinationCoords && (
            <Marker
              longitude={searchState.routeDestinationCoords[0]}
              latitude={searchState.routeDestinationCoords[1]}
            >
              <div className="cursor-pointer">
                <div
                  style={{
                    backgroundColor: '#EF4444', // Red for destination
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    fontSize: '14px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  B
                </div>
              </div>
            </Marker>
          )}

          {/* Vehicle Markers */}
          {(searchState.selectedDispatch && searchState.selectedDispatch.vehicle_plate
            ? // If showing dispatch route, only show the assigned vehicle
              filteredVehicles.filter(vehicle => vehicle.plate_number === searchState.selectedDispatch!.vehicle_plate)
            : // Otherwise show all filtered vehicles
              filteredVehicles
          ).map((vehicle) => (
            <Marker
              key={vehicle.id}
              longitude={vehicle.longitude}
              latitude={vehicle.latitude}
            >
              <div 
                className={`cursor-pointer transform hover:scale-110 transition-transform duration-200 ${
                  searchState.selectedVehicleFromSearch?.id === vehicle.id ? 'ring-4 ring-blue-400' : ''
                } ${
                  searchState.selectedDispatch && searchState.selectedDispatch.vehicle_plate === vehicle.plate_number 
                    ? 'ring-4 ring-green-400' : ''
                }`}
                style={{ 
                  backgroundColor: getMarkerColor(vehicle.status),
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  fontSize: '18px'
                }}
                onClick={() => handleMarkerClick(vehicle)}
              >
                {getVehicleIcon(vehicle.type)}
              </div>
            </Marker>
          ))}

          {/* Vehicle Info Popup */}
          {selectedVehicle && (
            <Popup
              longitude={selectedVehicle.longitude}
              latitude={selectedVehicle.latitude}
              onClose={() => setSelectedVehicle(null)}
              closeButton={true}
              closeOnClick={false}
              className="vehicle-popup"
            >
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg max-w-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {selectedVehicle.name}
                  </h3>
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedVehicle.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : selectedVehicle.status === 'idle'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : selectedVehicle.status === 'maintenance'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {selectedVehicle.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Plate Number:</span>
                    <span className="font-medium">{selectedVehicle.plate_number}</span>
                  </div>
                  
                  {/* Vehicle Details */}
                  {(selectedVehicle.make || selectedVehicle.model || selectedVehicle.year) && (
                    <div className="flex justify-between">
                      <span>Vehicle:</span>
                      <span className="font-medium">
                        {[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">{selectedVehicle.type.replace('_', ' ')}</span>
                  </div>
                  
                  {selectedVehicle.mileage && (
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span>Mileage:</span>
                      <span className="font-medium">{selectedVehicle.mileage.toFixed(2)} miles</span>
                    </div>
                  )}
                  
                  {selectedVehicle.battery_capacity && selectedVehicle.is_electric && (
                    <div className="flex justify-between">
                      <span>Battery Capacity:</span>
                      <span className="font-medium">{selectedVehicle.battery_capacity} kWh</span>
                    </div>
                  )}
                  
                  {selectedVehicle.fuel_level && (
                    <div className="flex justify-between">
                      <span>Fuel Level:</span>
                      <span className="font-medium">{selectedVehicle.fuel_level}%</span>
                    </div>
                  )}
                  
                  {selectedVehicle.driver_name && (
                    <div className="flex justify-between">
                      <span>Driver:</span>
                      <span className="font-medium">{selectedVehicle.driver_name}</span>
                    </div>
                  )}
                  
                  {selectedVehicle.assigned_branch && (
                    <div className="flex justify-between">
                      <span>Branch:</span>
                      <span className="font-medium">{selectedVehicle.assigned_branch}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs">
                    <span>Last Update:</span>
                    <span>{selectedVehicle.lastUpdate}</span>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      )}

      {/* Fleet Status Panel - Only show when there are vehicles */}
      {!loading && vehicles.length > 0 && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[200px]">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Fleet Status {statusFilter !== 'all' && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                (Filtered: {statusFilter})
              </span>
            )}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600">Active:</span>
              <span className="font-medium">
                {statusFilter === 'all' ? vehicles.filter(v => v.status === 'active').length : filteredVehicles.filter(v => v.status === 'active').length}
                {statusFilter !== 'all' && statusFilter !== 'active' && (
                  <span className="text-gray-400 ml-1">/ {vehicles.filter(v => v.status === 'active').length}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">Idle:</span>
              <span className="font-medium">
                {statusFilter === 'all' ? vehicles.filter(v => v.status === 'idle').length : filteredVehicles.filter(v => v.status === 'idle').length}
                {statusFilter !== 'all' && statusFilter !== 'idle' && (
                  <span className="text-gray-400 ml-1">/ {vehicles.filter(v => v.status === 'idle').length}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Maintenance:</span>
              <span className="font-medium">
                {statusFilter === 'all' ? vehicles.filter(v => v.status === 'maintenance').length : filteredVehicles.filter(v => v.status === 'maintenance').length}
                {statusFilter !== 'all' && statusFilter !== 'maintenance' && (
                  <span className="text-gray-400 ml-1">/ {vehicles.filter(v => v.status === 'maintenance').length}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Offline:</span>
              <span className="font-medium">
                {statusFilter === 'all' ? vehicles.filter(v => v.status === 'offline').length : filteredVehicles.filter(v => v.status === 'offline').length}
                {statusFilter !== 'all' && statusFilter !== 'offline' && (
                  <span className="text-gray-400 ml-1">/ {vehicles.filter(v => v.status === 'offline').length}</span>
                )}
              </span>
            </div>
            <hr className="my-2 border-gray-200 dark:border-gray-600" />
            <div className="flex justify-between font-semibold">
              <span>
                {statusFilter === 'all' && branchFilter === 'all' ? 'Total Fleet:' : 'Showing:'}
              </span>
              <span>
                {filteredVehicles.length}
                {(statusFilter !== 'all' || branchFilter !== 'all') && (
                  <span className="text-gray-400 font-normal ml-1">/ {vehicles.length}</span>
                )}
              </span>
            </div>
          </div>
          
          {/* Filter Section */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Filters</h5>
            
            {/* Status Filter */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('idle')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    statusFilter === 'idle'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Idle
                </button>
                <button
                  onClick={() => setStatusFilter('maintenance')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    statusFilter === 'maintenance'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Maintenance
                </button>
                <button
                  onClick={() => setStatusFilter('offline')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    statusFilter === 'offline'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
            
            {/* Branch Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setBranchFilter('all')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    branchFilter === 'all'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                {getUniqueBranches().map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setBranchFilter(branch)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      branchFilter === branch
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Clear All Filters Button */}
            {(statusFilter !== 'all' || branchFilter !== 'all') && (
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setBranchFilter('all');
                  }}
                  className="w-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend - Only show when there are vehicles */}
      {!loading && vehicles.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Legend</h5>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Idle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Offline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFleetMap; 