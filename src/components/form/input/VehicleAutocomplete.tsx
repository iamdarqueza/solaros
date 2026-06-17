'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Vehicle {
  id: string;
  plate_number: string;
}

interface VehicleAutocompleteProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  vehicles: Vehicle[];
  className?: string;
  required?: boolean;
}

const VehicleAutocomplete: React.FC<VehicleAutocompleteProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = 'Search vehicles...',
  vehicles,
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchValue, setSearchValue] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected vehicle display text
  const selectedVehicle = vehicles.find(v => v.id === value);
  const displayValue = selectedVehicle ? selectedVehicle.plate_number : searchValue;

  // Filter vehicles based on search value
  useEffect(() => {
    if (searchValue.trim() === '') {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle =>
        vehicle.plate_number.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
    setHighlightedIndex(-1);
  }, [searchValue, vehicles]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    setIsOpen(true);
    
    // If the search doesn't match any vehicle exactly, clear the selection
    const exactMatch = vehicles.find(v => v.plate_number.toLowerCase() === newValue.toLowerCase());
    if (!exactMatch && !isSelecting) {
      onChange('');
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    // Set search value to current display value for editing
    if (selectedVehicle) {
      setSearchValue(selectedVehicle.plate_number);
    }
  };

  // Handle input blur (with delay to allow clicking on suggestions)
  const handleInputBlur = () => {
    // Only close if we're not in the middle of selecting
    setTimeout(() => {
      if (!isSelecting) {
        setIsOpen(false);
        // Reset search value to selected vehicle or empty
        if (selectedVehicle) {
          setSearchValue('');
        } else {
          setSearchValue('');
        }
      }
    }, 150);
  };

  // Handle vehicle selection
  const handleVehicleClick = (vehicle: Vehicle) => {
    setIsSelecting(true);
    onChange(vehicle.id);
    setSearchValue('');
    setIsOpen(false);
    
    // Reset selecting flag after a short delay
    setTimeout(() => {
      setIsSelecting(false);
      inputRef.current?.blur();
    }, 100);
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredVehicles.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleVehicleClick(filteredVehicles[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={isOpen ? searchValue : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400 ${className}`}
          autoComplete="off"
        />
        
        {/* Clear button */}
        {selectedVehicle && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {isOpen && filteredVehicles.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
          onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking on dropdown
        >
          <ul className="max-h-60 overflow-auto py-1">
            {filteredVehicles.map((vehicle, index) => (
              <li
                key={vehicle.id}
                className={`cursor-pointer px-4 py-2 text-sm ${
                  index === highlightedIndex
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                }`}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
                onClick={() => handleVehicleClick(vehicle)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <span>{vehicle.plate_number}</span>
                  {selectedVehicle?.id === vehicle.id && (
                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isOpen && filteredVehicles.length === 0 && searchValue.trim() !== '' && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
            No vehicles found
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleAutocomplete; 