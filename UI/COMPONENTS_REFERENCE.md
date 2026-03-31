# Components & Features Reference
## Complete Component Documentation

---

## Table of Contents
1. [UI Components](#ui-components)
2. [Service Functions](#service-functions)
3. [Utility Functions](#utility-functions)
4. [Type Definitions](#type-definitions)

---

## UI Components

### Core Components (src/components/)

---

#### **PolarChart**
**File:** `PolarChart.tsx`

**Purpose:** Interactive polar diagram visualization for sail performance analysis

**Props:**
```typescript
{
  polar: PolarDiagram;           // Polar diagram data object
  windSpeed: number;              // Current wind speed (knots)
  currentTWA: number;             // True Wind Angle (0-360°)
  currentSpeed: number;           // Calculated boat speed
}
```

**Features:**
- ✓ SVG-based diagram rendering
- ✓ Real-time position marker
- ✓ Speed contour visualization
- ✓ Wind direction indicators
- ✓ Interactive tooltips

**Data Used:**
- Lagoon 440 polar performance table
- Wind conditions
- True wind angle
- Boat heading

---

#### **SailConfigDisplay**
**File:** `SailConfigDisplay.tsx`

**Purpose:** Display recommended sail configuration with details

**Props:**
```typescript
{
  configuration: {                    // Sail setup object
    mainSail?: boolean;
    jib?: boolean;
    asymmetrical?: boolean;
    spinnaker?: boolean;
    codeZero?: boolean;
    stormJib?: boolean;
  };
  expectedSpeed: number;              // Expected boat speed (knots)
  description: string;                // Configuration description
}
```

**Features:**
- ✓ Visual sail diagram
- ✓ Configuration display
- ✓ Performance metrics
- ✓ Trim recommendations

**Display Format:**
- Sail type (e.g., "Main + Jib")
- Expected speed range
- Wind range suitability
- Reefing instructions

---

#### **RouteMapView**
**File:** `RouteMapView.tsx`

**Purpose:** Interactive 2D visualization of sailing route

**Props:**
```typescript
{
  waypoints: Waypoint[];              // Route waypoints
  routeName: string;                  // Route identifier
  currentWaypointIndex?: number;       // Active waypoint
  simulatedPosition?: GPSCoordinates;  // Current position
  stormLocations?: Array<{            // Weather hazards
    lat: number;
    lon: number;
    type: 'storm' | 'squall';
  }>;
  trackingRunning?: boolean;           // Real GPS tracking active
  simulationRunning?: boolean;         // Simulation mode active
  simulationCompleted?: boolean;       // Simulation finished
  simulationHour?: number;             // Current simulation hour
  windDirection?: number;              // Wind direction (°)
  windSpeed?: number;                  // Wind speed (knots)
  onStartTracking?: () => void;       // Callback
  onStopTracking?: () => void;        // Callback
  onStartSimulation?: () => void;     // Callback
  onStopSimulation?: () => void;      // Callback
}
```

**Features:**
- ✓ Relative coordinate system
- ✓ Dashed waypoint lines
- ✓ Storm/squall markers
- ✓ Current position tracking
- ✓ Zoom controls (0.5-4x)
- ✓ Pan controls
- ✓ Real vs. simulation mode toggle
- ✓ Grid overlay option

**Display Elements:**
- Waypoint circles with labels
- Connecting path lines
- Current position (blue dot)
- Storm locations (red X)
- Grid background
- Distance scale
- Wind direction indicator

---

#### **SailingRose**
**File:** `SailingRose.tsx`

**Purpose:** Compass rose display showing cardinal and intercardinal directions

**Props:**
```typescript
{
  currentHeading?: number;            // Current boat heading (°)
  windDirection?: number;             // Wind direction (°)
  size?: number;                      // Rose diameter (pixels)
  showCompass?: boolean;              // Display compass points
  showWind?: boolean;                 // Highlight wind direction
}
```

**Features:**
- ✓ 360° heading display
- ✓ Cardinal directions (N, S, E, W)
- ✓ Intercardinal directions (NE, SE, SW, NW)
- ✓ Heading needle
- ✓ Wind indicator
- ✓ Degree markings (0-360°)

**Visual Indicators:**
- Cardinal points in bold
- 10° increment marks
- Red needle for heading
- Blue ray for wind direction

---

#### **ErrorPanel**
**File:** `ErrorPanel.tsx`

**Purpose:** Display error messages with dismiss capability

**Props:**
```typescript
{
  error: string | null;              // Error message text
  onDismiss: () => void;             // Callback when dismissed
}
```

**Features:**
- ✓ Floating error notification
- ✓ Auto-dismiss button
- ✓ Fade in/out animation
- ✓ Red error styling

**Styling:**
- Red background (#FF6B6B or #F44336)
- White text
- Bottom position
- Semi-transparent overlay

---

## Service Functions

### Service: windyService
**File:** `services/windyService.ts`

**Purpose:** Fetch real-time weather from Windy.com API

#### **getWindyService()**
```typescript
function getWindyService(): WindyService
// Returns: Singleton instance of WindyService
```

#### **initializeWindyService(apiKey)**
```typescript
function initializeWindyService(apiKey: string): WindyService
// Initializes service with API key
// Parameters:
//   - apiKey: Windy.com API key
// Returns: WindyService instance
```

#### **getCurrentConditions(coordinates)**
```typescript
async getCurrentConditions(
  coords: GPSCoordinates
): Promise<WindResponse>
// Fetches current weather at location
// Returns: {
//   error?: string,
//   forecast?: WindForecast {
//     windSpeed: number,
//     windDirection: number,
//     gustSpeed: number,
//     waveHeight: number
//   }
// }
```

---

### Service: routePlanningService
**File:** `services/routePlanningService.ts`

**Purpose:** Generate optimized routes with waypoints

#### **planRoute(start, destination, config)**
```typescript
async planRoute(
  start: GPSCoordinates,
  destination: GPSCoordinates,
  config: RoutePlanningConfig
): Promise<Route>
// Generates optimal route
// Parameters:
//   - start: Departure coordinates
//   - destination: Arrival coordinates
//   - config: Planning parameters
// Returns: Route with waypoints
```

#### **validateDaylightArrival(waypoint, position)**
```typescript
function validateDaylightArrival(
  waypoint: Waypoint,
  position: GPSCoordinates
): {
  isValid: boolean,
  message: string
}
// Checks if arrival is during daylight
// Returns: Validation result
```

#### **fetchRouteCorridorWeather(route, startDate)**
```typescript
async fetchRouteCorridorWeather(
  route: Route,
  startDate: Date
): Promise<RouteCorridorWeather>
// Fetches weather along route corridor
// Returns: Weather data at each waypoint
```

---

### Service: simulationService
**File:** `services/simulationService.ts`

**Purpose:** Simulate route execution with environmental conditions

#### **startSimulation(route)**
```typescript
function startSimulation(route: Route): void
// Starts route simulation
```

#### **advanceSimulation(hours)**
```typescript
function advanceSimulation(hours: number): {
  hour: number,
  weather: SimulatedWeather,
  alerts: StormAlert[]
}
// Advances simulation by specified hours
// Returns: Updated simulation state
```

#### **stopSimulation()**
```typescript
function stopSimulation(): void
// Stops running simulation
```

#### **getSimulationState()**
```typescript
function getSimulationState(): SimulationState
// Gets current simulation state
// Returns: {
//   running: boolean,
//   hour: number,
//   weather: SimulatedWeather,
//   position: GPSCoordinates,
//   alerts: StormAlert[]
// }
```

---

### Service: weatherMonitoringService
**File:** `services/weatherMonitoringService.ts`

**Purpose:** Continuous weather monitoring and alerts

#### **getWeatherMonitoringService()**
```typescript
function getWeatherMonitoringService(): WeatherMonitoringService
// Returns: Singleton monitoring service
```

#### **startMonitoring(route, config)**
```typescript
async startMonitoring(
  route: Route,
  config: MonitoringConfig
): Promise<void>
// Starts monitoring active route
// Checks weather on configured interval
```

#### **stopMonitoring()**
```typescript
function stopMonitoring(): void
// Stops monitoring
```

#### **getAlerts()**
```typescript
function getAlerts(): WeatherAlert[]
// Returns: Array of active alerts
// Each alert includes:
// {
//   id: string,
//   type: 'storm' | 'wind' | 'waves',
//   severity: 'low' | 'medium' | 'high',
//   location: Waypoint,
//   message: string,
//   timestamp: Date
// }
```

---

### Service: navigationService
**File:** `services/navigationService.ts`

**Purpose:** Calculate navigation metrics and guidance

#### **getNavigationService()**
```typescript
function getNavigationService(): NavigationService
// Returns: Singleton navigation service
```

#### **updateNavigation(sailingData)**
```typescript
function updateNavigation(data: SailingData): void
// Updates navigation state with current data
```

#### **getNavigationRecommendation(sailingData, windForecast, mode, tideData)**
```typescript
function getNavigationRecommendation(
  sailing: SailingData,
  wind: WindForecast,
  mode: SailingMode,
  tide: TideData
): NavigationRecommendation
// Returns: {
//   nextWaypoint: Waypoint,
//   distance: number,
//   bearing: number,
//   recommendedHeading: number,
//   estimatedTimeToArrival: number
// }
```

#### **getRoute()**
```typescript
function getRoute(): Route | null
// Returns: Currently active route
```

---

### Service: googleMapsService
**File:** `services/googleMapsService.ts`

**Purpose:** Google Maps integration and URL generation

#### **getGoogleMapsService()**
```typescript
function getGoogleMapsService(): GoogleMapsService
// Returns: Singleton Maps service
```

#### **generateMapUrl(center, markers, polylines)**
```typescript
function generateMapUrl(
  center: GPSCoordinates,
  markers?: MapMarker[],
  polylines?: MapPolyline[]
): string
// Generates Google Maps URL for location
// Returns: URL string to open in browser
```

#### **generateDirectionsUrl(origin, destination)**
```typescript
function generateDirectionsUrl(
  origin: GPSCoordinates,
  destination: GPSCoordinates
): string
// Generates navigation directions URL
// Returns: URL for Google Maps directions
```

#### **calculateDistance(from, to)**
```typescript
function calculateDistance(
  from: GPSCoordinates,
  to: GPSCoordinates
): number
// Calculates distance in nautical miles
// Returns: Distance (nm)
```

#### **calculateBearing(from, to)**
```typescript
function calculateBearing(
  from: GPSCoordinates,
  to: GPSCoordinates
): number
// Calculates bearing between points
// Returns: Bearing in degrees (0-360)
```

---

## Utility Functions

### sailingCalculations.ts
**Purpose:** Sailing-specific calculations

```typescript
// Recommend optimal sail configuration
function recommendSailConfiguration(
  windSpeed: number,
  trueWindAngle: number,
  mode: SailingMode
): {
  configuration: SailConfig,
  expectedSpeed: number,
  description: string
}

// Calculate true wind from apparent wind
function calculateTrueWind(
  apparentWindSpeed: number,
  apparentWindAngle: number,
  boatSpeed: number,
  boatHeading: number
): { speed: number, angle: number }

// Calculate apparent wind from true wind
function calculateApparentWind(
  trueWindSpeed: number,
  trueWindAngle: number,
  boatSpeed: number,
  boatHeading: number
): { speed: number, angle: number }
```

---

### coordinateParser.ts
**Purpose:** Parse and format coordinates

```typescript
// Parse various coordinate formats
async function parseLocationInput(input: string): Promise<GPSCoordinates | null>
// Accepts: 
//   - Decimal: "25.7617, -80.1918"
//   - DMS: "25°45.7'N, 80°11.5'W"
//   - Location name: "Miami" (geocoded)

// Format coordinates to DDM (Degrees Decimal Minutes)
function formatToDDM(coords: GPSCoordinates): string
// Returns: "25°45.7'N, 80°11.5'W"

// Get format help examples
function getCoordinateFormatExamples(): {
  decimal: string,
  dms: string,
  description: string
}
```

---

### validation.ts
**Purpose:** Input validation functions

```typescript
function validateWindSpeed(speed: number): { valid: boolean, error?: string }
function validateTWA(angle: number): { valid: boolean, error?: string }
function validateBoatSpeed(speed: number): { valid: boolean, error?: string }
function validateHeading(heading: number): { valid: boolean, error?: string }
function validateLatitude(lat: number): { valid: boolean, error?: string }
function validateLongitude(lon: number): { valid: boolean, error?: string }
function validateTideSpeed(speed: number): { valid: boolean, error?: string }

// Sanitize numeric input
function sanitizeNumericInput(input: string): string
// Removes invalid characters, returns clean numeric string
```

---

### gpxHandler.ts
**Purpose:** GPX file import/export

```typescript
// Parse GPX file content
async function parseGPX(content: string): Promise<{
  error?: string,
  waypoints: Waypoint[]
}>

// Generate route in specified format
function generateRoute(route: Route, format: RouteFormat): string
// Formats: 'GPX' | 'KML' | 'KMZ' | 'CSV'

// Get file extension for format
function getRouteFileExtension(format: RouteFormat): string
// Returns: '.gpx', '.kml', '.kmz', '.csv'

// Get MIME type for format
function getRouteMimeType(format: RouteFormat): string
// Returns: 'application/gpx+xml', etc.
```

---

### responsiveDesign.ts
**Purpose:** Responsive design utilities

```typescript
// Get device type from dimensions
function getDeviceType(width: number, height: number): DeviceType
// Returns: 'mobile' | 'tablet' | 'desktop'

// Hook for responsive dimensions
function useResponsiveDimensions(): DimensionInfo
// Returns: {
//   width: number,
//   height: number,
//   deviceType: DeviceType,
//   orientation: Orientation,
//   isMobile: boolean,
//   isTablet: boolean,
//   isDesktop: boolean,
//   isPortrait: boolean,
//   isLandscape: boolean
// }

// Select value by device type
function selectByDevice<T>(values: ResponsiveValues<T>, deviceType: DeviceType): T
```

---

## Type Definitions

### Sailing Types (types/sailing.ts)

```typescript
enum SailingMode {
  COMFORT = 'comfort',      // Stable, safe sailing
  SPEED = 'speed',          // Maximum performance
  MIXED = 'mixed'           // Balanced approach
}

interface GPSCoordinates {
  latitude: number;         // -90 to 90
  longitude: number;        // -180 to 180
}

interface SailingData {
  gpsCoordinates: GPSCoordinates;
  heading: number;          // 0-360°
  windSpeed: number;        // knots
  trueWindAngle: number;    // 0-360°
  boatHeading: number;      // 0-360°
  boatSpeed: number;        // knots
  timestamp: Date;
}

interface TideData {
  speed: number;            // knots
  direction: number;        // 0-360°
}

interface WindForecast {
  windSpeed: number;        // knots
  windDirection: number;    // 0-360°
  gustSpeed: number;        // knots
  waveHeight: number;       // meters
}

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  coordinates: GPSCoordinates;
  order: number;
  arrived: boolean;
  sailConfiguration?: string;
  useEngine?: boolean;
  weatherForecast?: WindForecast;
  estimatedArrival?: Date;
  elapsedTime?: number;  // hours
  legTime?: number;      // hours
  distanceFromStart?: number;  // nm
  legDistance?: number;  // nm
  cog?: number;         // Course Over Ground
  sog?: number;         // Speed Over Ground
  currentSpeed?: number;
  currentDirection?: number;
}

interface Route {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
}

interface RouteCorridorWeather {
  fetchTime: Date;
  bytesFetched: number;
  windAlongCorridor: WindForecast[];
  tideAlongCorridor: TideData[];
  stormLocations: Array<{ lat: number; lon: number }>;
}
```

### Polar Types (types/polar.ts)

```typescript
interface PolarDiagram {
  boatType: string;         // 'Lagoon 440'
  description: string;
  windSpeeds: number[];     // 5, 8, 10, 12, 15, 18, 20 kts
  trueWindAngles: number[]; // 0-180°
  boatSpeeds: number[][];   // speed[windIndex][angleIndex]
}
```

---

## Key Enums & Constants

### SailingMode
```typescript
COMFORT - Safe, stable sailing (red sails, conservative)
SPEED   - Maximum performance (all sails, aggressive)
MIXED   - Balanced mode (standard configuration)
```

### DeviceType
```typescript
MOBILE  - Width < 600px
TABLET  - Width 600-900px
DESKTOP - Width ≥ 900px
```

### RouteFormat
```typescript
'GPX'   - GPS Exchange Format (default, most compatible)
'KML'   - Keyhole Markup Language (Google Earth)
'KMZ'   - Compressed KML (smaller files)
'CSV'   - Comma Separated Values (spreadsheets)
```

---

**Document Version:** 1.0  
**Last Updated:** March 31, 2026  
**Status:** Complete Reference
