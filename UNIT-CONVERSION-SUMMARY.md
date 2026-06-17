# Unit Conversion Summary: Kilometers to Miles

This document summarizes all the changes made to convert the fleet management system from using kilometers to miles for distance measurements.

## Database Changes

### 1. Routes Table Distance Conversion
- **File**: `update-distance-unit-to-miles.sql`
- **Changes**: 
  - Converted existing `estimated_distance_km` values from kilometers to miles (multiplied by 0.621371)
  - Updated the `get_routes_with_details()` function to reflect that the column now contains miles
  - Added comments to indicate the column now contains miles while keeping the original column name for backward compatibility

### 2. Vehicle Mileage Conversion
- **File**: `update-vehicle-mileage-to-miles.sql`
- **Changes**:
  - Converted existing vehicle mileage values from kilometers to miles for values > 1000 (conservative approach)
  - Added column comment to indicate mileage is stored in miles

### 3. Legacy Database Schema Update
- **File**: `update-legacy-database-to-miles.sql`
- **Changes**:
  - Handles migration from old database schema that used `distance_km` column
  - Converts and renames `distance_km` to `estimated_distance_km` 
  - Migrates old route table structure to current schema
  - Ensures all distance values are properly converted to miles

## Frontend/Service Changes

### 1. Routes Service (`src/services/routesService.ts`)
- **Changes**:
  - Added helper functions: `kmToMiles()` and `milesToKm()`
  - Updated `calculateRoute()` to return `distance_miles` instead of `distance_km`
  - Updated `calculateDistance()` function to use Earth's radius in miles (3959 instead of 6371)
  - Updated estimated speed from 50 km/h to 31 mph for route calculations
  - Added comments to clarify that `estimated_distance_km` fields now contain miles

### 2. Add Route Modal (`src/components/routes/AddRouteModal.tsx`)
- **Changes**:
  - Updated Mapbox API response conversion to convert from meters → kilometers → miles
  - Updated distance display from "km" to "miles" in the UI

### 3. Routes Table (`src/components/routes/RoutesTable.tsx`)
- **Changes**:
  - Updated distance display from "km" to "miles" in the table

### 4. Edit Route Modal (`src/components/routes/EditRouteModal.tsx`)
- **Changes**:
  - Updated Mapbox API response conversion to convert from meters → kilometers → miles
  - Distance display already showed "miles" in the UI

## Vehicle Mileage (Already in Miles)

The vehicle mileage system was already properly configured to use miles:
- Vehicle forms show "Mileage (miles)" labels
- All vehicle displays show values followed by "miles"
- No frontend changes needed for vehicle mileage

## Migration Strategy

1. **Database First**: Run the SQL migration scripts to convert existing data
2. **Service Layer**: Updated to handle mile conversions for external APIs (like Mapbox)
3. **Frontend**: Updated to display "miles" consistently throughout the UI

## API Integration Notes

- **Mapbox Directions API**: Returns distances in meters, now converted to miles via: meters → km → miles
- **Internal calculations**: Now use miles consistently
- **Database storage**: Values stored as miles but column names kept for backward compatibility

## Testing Recommendations

1. Verify route distance calculations show reasonable mile values
2. Test that new routes created through the UI store distances in miles
3. Confirm vehicle mileage displays and inputs work correctly
4. Check that existing data was properly converted (distances should be ~62% of original km values)

## File Changes Summary

### SQL Migration Files:
- `update-distance-unit-to-miles.sql` - Main route distance conversion
- `update-vehicle-mileage-to-miles.sql` - Vehicle mileage conversion  
- `update-legacy-database-to-miles.sql` - Legacy schema migration

### TypeScript/React Files:
- `src/services/routesService.ts` - Service layer updates
- `src/components/routes/AddRouteModal.tsx` - UI and API conversion
- `src/components/routes/RoutesTable.tsx` - Display updates
- `src/components/routes/EditRouteModal.tsx` - API conversion

### No Changes Needed:
- Vehicle components (already used miles)
- Attachment/equipment components (don't use distance)
- Authentication/user management 