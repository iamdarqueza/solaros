# Routes System Setup Guide

This guide will help you set up the Routes system with Mapbox integration for location selection and distance calculation.

## Prerequisites

1. **Database Setup**: Ensure you have run the routes table creation script:
   ```sql
   -- Run create-routes-table.sql in your Supabase SQL Editor
   ```

2. **Mapbox Account**: You need a Mapbox account to use the mapping features.

## Mapbox Setup

### 1. Create a Mapbox Account
- Go to [mapbox.com](https://www.mapbox.com/)
- Sign up for a free account
- Navigate to your Account page

### 2. Get Your Access Token
- In your Mapbox account, go to the "Access tokens" section
- Copy your default public token, or create a new one
- The token should start with `pk.`

### 3. Configure Environment Variables
Add the following to your `.env.local` file:

```bash
# Mapbox Configuration (Required for Routes functionality)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
```

**Important**: 
- Make sure the token starts with `pk.` (public token)
- Never commit your actual token to version control
- The `NEXT_PUBLIC_` prefix is required for Next.js client-side access

## Features

### Add Route Modal
The Add Route modal provides:

1. **Route Name**: Text input for naming your route
2. **Origin Location**: 
   - Search field with autocomplete suggestions
   - Click on map to pin location
   - Reverse geocoding to get place names
3. **Destination Location**:
   - Same functionality as origin
   - Different colored marker (red vs green)
4. **Automatic Distance Calculation**:
   - Uses Mapbox Directions API
   - Shows estimated distance in kilometers
   - Shows estimated duration in minutes
   - Draws route line on map

### Map Features
- Interactive map with navigation controls
- Location search with United States focus (`country=us`)
- Visual markers for origin (green) and destination (red)
- Route visualization with blue line
- Automatic map bounds adjustment to show both points

### Data Storage
Routes are stored with:
- Route name
- Origin coordinates (lat/lng)
- Destination coordinates (lat/lng)
- Estimated distance (km)
- Estimated duration (minutes)
- Organization association
- Timestamps

## Usage

1. **Add Route**: Click "Add Route" button in the Routes table
2. **Enter Route Name**: Provide a descriptive name
3. **Set Origin**: 
   - Type in search field for suggestions, OR
   - Click the origin input field, then click on map
4. **Set Destination**:
   - Type in search field for suggestions, OR
   - Click the destination input field, then click on map
5. **Review**: Check the calculated distance and duration
6. **Save**: Click "Create Route" to save

## Troubleshooting

### "Configuration Required" Error
- Ensure `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in `.env.local`
- Restart your development server after adding the token
- Verify the token is valid and starts with `pk.`

### Map Not Loading
- Check browser console for errors
- Verify your Mapbox token has the required permissions
- Ensure you're not exceeding Mapbox usage limits

### Location Search Not Working
- Check if you have internet connectivity
- Verify the Mapbox token has geocoding permissions
- The search is limited to United States (`country=us`) by default

### Distance Calculation Failing
- Ensure both origin and destination are set
- Check if the locations are accessible by road
- Verify your token has Directions API permissions

## API Limits

Mapbox free tier includes:
- 50,000 map loads per month
- 100,000 geocoding requests per month
- 100,000 directions requests per month

Monitor your usage in the Mapbox account dashboard.

## Security Notes

- Use public tokens (`pk.`) for client-side access
- Never expose secret tokens (`sk.`) in client-side code
- Consider implementing rate limiting for production use
- Restrict token permissions to only what's needed

## Next Steps

After setting up routes, you can:
1. View routes on map (feature coming soon)
2. Edit existing routes (feature coming soon)
3. Assign routes to vehicles
4. Track route progress in real-time

## Database Setup

### 1. Create Routes Table

Run the SQL script to create the routes table with all necessary constraints and indexes:

```sql
-- Execute the create-routes-table.sql file
```

This will create:
- `routes` table with all required columns
- Proper indexes for performance
- RLS (Row Level Security) policies
- Triggers for automatic timestamp updates
- Database function for enhanced route queries

### 2. Verify Table Creation

After running the SQL script, verify the table was created correctly:

```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'routes';

-- Check table structure
\d routes;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE tablename = 'routes';
```

## Features

### Route Management
- **Create Routes**: Define origin, destination, and waypoints
- **Distance & Duration**: Automatic calculation of estimated travel metrics
- **Search & Filter**: Find routes by name
- **Real-time Updates**: Live updates when routes are modified

### Geographic Features
- **PostGIS Integration**: Uses GEOGRAPHY(Point, 4326) for precise location storage
- **Coordinate Extraction**: Automatic lat/lng extraction from PostGIS data
- **Spatial Indexing**: Optimized queries for location-based operations

### User Interface
- **Responsive Table**: Clean, modern interface with expandable rows
- **Action Dropdowns**: View on map, edit, and delete operations
- **Toast Notifications**: Success/error feedback for all operations
- **Loading States**: Proper loading indicators for better UX

## Data Structure

### Route Fields
- `id`: Unique identifier (UUID)
- `org_id`: Organization reference
- `name`: Human-readable route name
- `origin_location`: Starting point (PostGIS Geography)
- `destination_location`: Ending point (PostGIS Geography)
- `waypoints`: Optional intermediate points (JSONB)
- `estimated_distance_km`: Calculated distance
- `estimated_duration_minutes`: Estimated travel time
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

### Waypoints Format
Waypoints are stored as JSONB with the following structure:
```json
[
  {
    "lat": 40.7128,
    "lng": -74.0060,
    "name": "Checkpoint 1",
    "address": "123 Main St, New York, NY"
  }
]
```

## API Integration

The routes service provides methods for:
- `getRoutes(orgId)`: Fetch all routes for organization
- `getRoute(routeId)`: Get single route details
- `createRoute(orgId, routeData)`: Create new route
- `updateRoute(routeId, updateData)`: Update existing route
- `deleteRoute(routeId)`: Delete route
- `calculateRoute(origin, destination, waypoints)`: Calculate distance/duration
- `subscribeToRouteUpdates(orgId, callback)`: Real-time updates

## Future Enhancements

### Planned Features
- **Map Integration**: Visual route display with interactive maps
- **Route Optimization**: Automatic route optimization algorithms
- **External Routing**: Integration with Google Maps, Mapbox, or similar services
- **Route Templates**: Reusable route templates for common patterns
- **Historical Data**: Route usage analytics and performance metrics
- **Mobile Support**: Mobile app integration for drivers
- **Route Types**: Route categorization will be handled through route assignments

### External Service Integration
The system is prepared for integration with routing services:
- Google Maps Directions API
- Mapbox Directions API
- OpenRouteService
- GraphHopper

## Troubleshooting

### Common Issues

1. **PostGIS Extension Missing**
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. **RLS Policies Not Working**
   - Verify user has proper org_id in users table
   - Check RLS is enabled on routes table

3. **Geographic Queries Failing**
   - Ensure PostGIS extension is installed
   - Verify SRID 4326 is supported

4. **Function Not Found**
   - Run the complete SQL script to create all functions
   - Check function permissions

### Performance Tips
- Use spatial indexes for location queries
- Limit waypoints to reasonable numbers (< 50)
- Consider pagination for large route lists
- Cache calculated distances when possible

## Security

### Row Level Security
- Routes are isolated by organization
- Users can only access routes from their organization
- All CRUD operations respect RLS policies

### Data Validation
- Geographic coordinates are validated
- Required fields are enforced at database level

## Support

For issues or questions about the routes system:
1. Check the troubleshooting section above
2. Verify database setup is complete
3. Check browser console for JavaScript errors
4. Review server logs for API errors 