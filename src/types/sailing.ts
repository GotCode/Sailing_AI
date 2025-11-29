// Types for Lagoon 440 Sailing Application

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export interface SailingData {
  gpsCoordinates: GPSCoordinates;
  heading: number; // degrees (0-360)
  windSpeed: number; // knots
  trueWindAngle: number; // degrees (0-360)
  boatHeading: number; // degrees (0-360)
  boatSpeed?: number; // knots
  timestamp: Date;
}

export interface TideData {
  speed: number; // knots
  direction: number; // degrees (0-360)
}

export interface WindForecast {
  timestamp: Date;
  windSpeed: number; // knots
  windDirection: number; // degrees
  direction: number; // degrees (alias for windDirection for compatibility)
  gustSpeed: number; // knots
  waveHeight: number; // meters
}

export interface SailConfiguration {
  mainSail: boolean;
  jib: boolean;
  asymmetrical: boolean;
  spinnaker: boolean;
  codeZero: boolean;
  stormJib: boolean;
}

export interface SailRecommendation {
  configuration: SailConfiguration;
  expectedSpeed: number; // knots
  description: string;
  confidence: number; // 0-100
}

export enum SailingMode {
  SPEED = 'speed',
  COMFORT = 'comfort',
  MIXED = 'mixed'
}

export interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  coordinates: GPSCoordinates;
  order: number;
  arrived?: boolean;
  arrivalTime?: Date;
  sailConfiguration?: string;
  useEngine?: boolean;
  estimatedArrival?: Date;
  weatherForecast?: WindForecast;
  elapsedTime?: number; // Cumulative elapsed time in hours from departure
  legTime?: number; // Time for this leg only in hours
  distanceFromStart?: number; // Cumulative distance in nautical miles
  legDistance?: number; // Distance for this leg only in nautical miles
  cog?: number; // Course over ground in degrees
  sog?: number; // Speed over ground in knots
  currentSpeed?: number; // Current speed in knots
  currentDirection?: number; // Current direction in degrees
}

export interface Route {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date; // Planned departure date
}

export interface NavigationRecommendation {
  currentWaypoint: Waypoint;
  nextWaypoint: Waypoint;
  distance: number; // nautical miles
  bearing: number; // degrees
  sailConfiguration: SailConfiguration;
  recommendedHeading: number; // degrees
  estimatedTimeToArrival: number; // minutes
  windForecast: WindForecast;
}

export interface RouteCorridorWeather {
  startPoint: GPSCoordinates;
  endPoint: GPSCoordinates;
  weatherPoints: Array<{
    coordinates: GPSCoordinates;
    forecast: WindForecast;
    distance: number; // nm from start
  }>;
  averageWindSpeed: number;
  maxWindSpeed: number;
  averageWaveHeight: number;
  maxWaveHeight: number;
}

export interface RoutePlanningConfig {
  startPoint: GPSCoordinates;
  destination: GPSCoordinates;
  sailingMode: SailingMode;
  windThreshold: number; // knots - use engine below this
  avoidStorms: boolean;
  ensureDaytimeArrival: boolean;
  maxDailyDistance: number; // nautical miles
  preferredWaypointInterval: number; // nautical miles
}
