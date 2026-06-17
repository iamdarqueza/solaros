"use client";
import React, { useState, useEffect, useRef } from 'react';
import { routesService, CreateRouteData, Location } from '@/services/routesService';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatDuration } from '@/utils/timeUtils';

interface AddRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRouteData) => Promise<void>;
  isLoading: boolean;
}

interface LocationData {
  coordinates: [number, number]; // [lng, lat]
  placeName: string;
}

export default function AddRouteModal({ isOpen, onClose, onSubmit, isLoading }: AddRouteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [originLocation, setOriginLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  const [originSearch, setOriginSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeLocationInput, setActiveLocationInput] = useState<'origin' | 'destination' | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);

  // Mapbox access token - you'll need to set this in your environment variables
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current || !MAPBOX_TOKEN) return;

    // Dynamically import mapbox-gl to avoid SSR issues
    import('mapbox-gl').then((mapboxgl) => {
      if (mapRef.current) return; // Map already initialized

      mapboxgl.default.accessToken = MAPBOX_TOKEN;
      
      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-98.5795, 39.8283], // Center of United States as default
        zoom: 10
      });

      map.addControl(new mapboxgl.default.NavigationControl(), 'top-right');

      // Add click handler for map
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        if (activeLocationInput === 'origin') {
          setOriginFromCoordinates(lng, lat);
        } else if (activeLocationInput === 'destination') {
          setDestinationFromCoordinates(lng, lat);
        }
      });

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, MAPBOX_TOKEN, activeLocationInput]);

  // Set origin location from coordinates
  const setOriginFromCoordinates = async (lng: number, lat: number) => {
    try {
      const placeName = await reverseGeocode(lng, lat);
      const locationData = {
        coordinates: [lng, lat] as [number, number],
        placeName
      };
      
      setOriginLocation(locationData);
      setOriginSearch(placeName);
      addOrUpdateMarker('origin', lng, lat, placeName);
      calculateRoute();
    } catch (error) {
      console.error('Error setting origin location:', error);
    }
  };

  // Set destination location from coordinates
  const setDestinationFromCoordinates = async (lng: number, lat: number) => {
    try {
      const placeName = await reverseGeocode(lng, lat);
      const locationData = {
        coordinates: [lng, lat] as [number, number],
        placeName
      };
      
      setDestinationLocation(locationData);
      setDestinationSearch(placeName);
      addOrUpdateMarker('destination', lng, lat, placeName);
      calculateRoute();
    } catch (error) {
      console.error('Error setting destination location:', error);
    }
  };

  // Reverse geocoding to get place name from coordinates
  const reverseGeocode = async (lng: number, lat: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      return data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Add or update marker on map
  const addOrUpdateMarker = (type: 'origin' | 'destination', lng: number, lat: number, placeName: string) => {
    if (!mapRef.current) return;

    const markerRef = type === 'origin' ? originMarkerRef : destinationMarkerRef;
    const color = type === 'origin' ? '#10B981' : '#EF4444'; // Green for origin, red for destination

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Dynamically import mapbox-gl for marker creation
    import('mapbox-gl').then((mapboxgl) => {
      // Create new marker
      const marker = new mapboxgl.default.Marker({ color })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.default.Popup({ offset: 25 })
            .setHTML(`<div class="font-medium">${type === 'origin' ? 'Origin' : 'Destination'}</div><div class="text-sm text-gray-600">${placeName}</div>`)
        )
        .addTo(mapRef.current);

      markerRef.current = marker;

      // Fit map to show both markers if both exist
      if (originLocation && destinationLocation) {
        const bounds = new mapboxgl.default.LngLatBounds()
          .extend(originLocation.coordinates)
          .extend(destinationLocation.coordinates);
        
        mapRef.current.fitBounds(bounds, { padding: 50 });
      } else {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
      }
    });
  };

  // Search for locations using Mapbox Geocoding API
  const searchLocations = async (query: string, type: 'origin' | 'destination') => {
    if (!query.trim() || !MAPBOX_TOKEN) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=us`
      );
      const data = await response.json();
      
      if (type === 'origin') {
        setOriginSuggestions(data.features || []);
      } else {
        setDestinationSuggestions(data.features || []);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  // Handle location selection from suggestions
  const selectLocation = (feature: any, type: 'origin' | 'destination') => {
    const [lng, lat] = feature.center;
    const locationData = {
      coordinates: [lng, lat] as [number, number],
      placeName: feature.place_name
    };

    if (type === 'origin') {
      setOriginLocation(locationData);
      setOriginSearch(feature.place_name);
      setOriginSuggestions([]);
    } else {
      setDestinationLocation(locationData);
      setDestinationSearch(feature.place_name);
      setDestinationSuggestions([]);
    }

    addOrUpdateMarker(type, lng, lat, feature.place_name);
    calculateRoute();
  };

  // Calculate route distance and duration using Mapbox Directions API
  const calculateRoute = async () => {
    if (!originLocation || !destinationLocation || !MAPBOX_TOKEN) return;

    setIsCalculating(true);
    try {
      const [originLng, originLat] = originLocation.coordinates;
      const [destLng, destLat] = destinationLocation.coordinates;
      
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?access_token=${MAPBOX_TOKEN}&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = route.distance / 1000; // Convert meters to kilometers
        const distanceMiles = distanceKm * 0.621371; // Convert kilometers to miles
        const durationMin = route.duration / 60; // Convert seconds to minutes

        setEstimatedDistance(parseFloat(distanceMiles.toFixed(2)));
        setEstimatedDuration(Math.round(durationMin));

        // Draw route on map
        drawRouteOnMap(route.geometry);
      }
    } catch (error) {
      console.error('Route calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Draw route line on map
  const drawRouteOnMap = (geometry: any) => {
    if (!mapRef.current) return;

    // Remove existing route layer
    if (mapRef.current.getLayer('route')) {
      mapRef.current.removeLayer('route');
    }
    if (mapRef.current.getSource('route')) {
      mapRef.current.removeSource('route');
    }

    // Add route layer
    mapRef.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry
      }
    });

    mapRef.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3B82F6',
        'line-width': 4
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a route name');
      return;
    }
    
    if (!originLocation || !destinationLocation) {
      alert('Please select both origin and destination locations');
      return;
    }

    const routeData: CreateRouteData = {
      name: formData.name.trim(),
      origin_location: {
        lat: originLocation.coordinates[1],
        lng: originLocation.coordinates[0]
      },
      origin_location_name: originLocation.placeName,
      destination_location: {
        lat: destinationLocation.coordinates[1],
        lng: destinationLocation.coordinates[0]
      },
      destination_location_name: destinationLocation.placeName,
      estimated_distance_km: estimatedDistance || undefined,
      estimated_duration_minutes: estimatedDuration || undefined
    };

    try {
      await onSubmit(routeData);
      handleClose();
    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({ name: '' });
    setOriginLocation(null);
    setDestinationLocation(null);
    setOriginSearch('');
    setDestinationSearch('');
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setEstimatedDistance(null);
    setEstimatedDuration(null);
    setActiveLocationInput(null);
    
    // Clear markers
    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    
    onClose();
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (originSearch && !originLocation) {
        searchLocations(originSearch, 'origin');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [originSearch, originLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (destinationSearch && !destinationLocation) {
        searchLocations(destinationSearch, 'destination');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [destinationSearch, destinationLocation]);

  // Calculate route when both locations are set
  useEffect(() => {
    if (originLocation && destinationLocation) {
      calculateRoute();
    }
  }, [originLocation, destinationLocation]);

  if (!isOpen) return null;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Configuration Required</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Mapbox access token is required for the route functionality. Please add your Mapbox token to the environment variables:
          </p>
          <code className="block bg-gray-100 p-2 rounded text-sm mb-4">
            NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here
          </code>
          <button
            onClick={handleClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add New Route
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

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Form Fields */}
              <div className="space-y-6">
                {/* Route Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Route Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter route name"
                    required
                  />
                </div>

                {/* Origin Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Origin Location *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={originSearch}
                      onChange={(e) => {
                        setOriginSearch(e.target.value);
                        if (e.target.value !== originLocation?.placeName) {
                          setOriginLocation(null);
                        }
                      }}
                      onFocus={() => setActiveLocationInput('origin')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Search or click on map to select origin"
                    />
                    {originSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {originSuggestions.map((feature, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectLocation(feature, 'origin')}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{feature.text}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{feature.place_name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {originLocation && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                      ✓ Origin selected: {originLocation.placeName}
                    </div>
                  )}
                </div>

                {/* Destination Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destination Location *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={destinationSearch}
                      onChange={(e) => {
                        setDestinationSearch(e.target.value);
                        if (e.target.value !== destinationLocation?.placeName) {
                          setDestinationLocation(null);
                        }
                      }}
                      onFocus={() => setActiveLocationInput('destination')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Search or click on map to select destination"
                    />
                    {destinationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {destinationSuggestions.map((feature, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => selectLocation(feature, 'destination')}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{feature.text}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{feature.place_name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {destinationLocation && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                      ✓ Destination selected: {destinationLocation.placeName}
                    </div>
                  )}
                </div>

                {/* Estimated Distance */}
                {(estimatedDistance !== null || isCalculating) && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Route Information</h4>
                    {isCalculating ? (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating route...
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{estimatedDistance} miles</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{estimatedDuration ? formatDuration(estimatedDuration) : 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Map */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Map View
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Click "Origin" or "Destination" input field, then click on the map to set location
                  </div>
                  <div 
                    ref={mapContainerRef}
                    className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-600"
                    style={{ minHeight: '400px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
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
              disabled={isLoading || !originLocation || !destinationLocation || !formData.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Creating Route...' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 