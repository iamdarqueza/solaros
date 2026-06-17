"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number } | null) => void;
  initialLocation?: { latitude: number; longitude: number } | null;
  className?: string;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  className = "h-64"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!accessToken) return;
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&limit=5&types=place,postcode,address,poi&country=US&proximity=-95.7129,37.0902`
      );
      
      if (response.ok) {
        const data = await response.json();
        const results: SearchResult[] = data.features.map((feature: any) => ({
          id: feature.id,
          place_name: feature.place_name,
          center: feature.center
        }));
        setSearchResults(results);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [accessToken]);

  // Handle search input changes with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = window.setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: SearchResult) => {
    const [lng, lat] = result.center;
    const newLocation = {
      latitude: lat,
      longitude: lng
    };

    // Update map center and zoom
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1000
      });
    }

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    if (map.current) {
      marker.current = new mapboxgl.Marker({
        color: '#3B82F6',
        draggable: true
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Handle marker drag
      marker.current.on('dragend', () => {
        if (marker.current) {
          const lngLat = marker.current.getLngLat();
          const draggedLocation = {
            latitude: lngLat.lat,
            longitude: lngLat.lng
          };
          setSelectedLocation(draggedLocation);
          onLocationSelect(draggedLocation);
        }
      });
    }

    setSelectedLocation(newLocation);
    onLocationSelect(newLocation);
    setSearchQuery(result.place_name);
    setShowResults(false);
  };

  useEffect(() => {
    if (!mapContainer.current || !accessToken) return;

    // Initialize map
    mapboxgl.accessToken = accessToken;

    const initialCenter = initialLocation 
      ? [initialLocation.longitude, initialLocation.latitude]
      : [-74.0060, 40.7128]; // Default to NYC

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter as [number, number],
      zoom: initialLocation ? 14 : 10,
    });

    // Add initial marker if location is provided
    if (initialLocation) {
      marker.current = new mapboxgl.Marker({
        color: '#3B82F6',
        draggable: true
      })
        .setLngLat([initialLocation.longitude, initialLocation.latitude])
        .addTo(map.current);

      // Handle marker drag
      marker.current.on('dragend', () => {
        if (marker.current) {
          const lngLat = marker.current.getLngLat();
          const newLocation = {
            latitude: lngLat.lat,
            longitude: lngLat.lng
          };
          setSelectedLocation(newLocation);
          onLocationSelect(newLocation);
        }
      });
    }

    // Add click handler to map
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      const newLocation = {
        latitude: lat,
        longitude: lng
      };

      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker({
        color: '#3B82F6',
        draggable: true
      })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Handle marker drag
      marker.current.on('dragend', () => {
        if (marker.current) {
          const lngLat = marker.current.getLngLat();
          const draggedLocation = {
            latitude: lngLat.lat,
            longitude: lngLat.lng
          };
          setSelectedLocation(draggedLocation);
          onLocationSelect(draggedLocation);
        }
      });

      setSelectedLocation(newLocation);
      onLocationSelect(newLocation);
    });

    // Cleanup
    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      if (map.current) {
        map.current.remove();
      }
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [initialLocation, onLocationSelect, accessToken]);

  const clearLocation = () => {
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    setSelectedLocation(null);
    onLocationSelect(null);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {initialLocation 
            ? "Search for a location, click on the map, or drag the marker" 
            : "Search for a location or click on the map to set location (optional)"
          }
        </p>
        {selectedLocation && (
          <button
            type="button"
            onClick={clearLocation}
            className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800 transition-colors"
          >
            Clear Location
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
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
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="h-10 w-full pl-10 pr-10 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
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
          {isSearching && (
            <div className="absolute inset-y-0 right-8 flex items-center">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSearchResultSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-start">
                  <svg
                    className="h-4 w-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0"
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
                  <span className="text-sm text-gray-900 dark:text-white">
                    {result.place_name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className={`${className} w-full rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden`}>
        {accessToken ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
              Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env.local file to enable the map.
            </p>
          </div>
        )}
      </div>
      
      {selectedLocation && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded flex items-center justify-between">
          <span>
            <strong>Location:</strong> {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            ✓ Location set
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 