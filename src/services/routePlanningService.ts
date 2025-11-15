// Automated Route Planning Service for Lagoon 440
// Generates optimal sailing routes considering weather, wind patterns, and sailing preferences

import {
  GPSCoordinates,
  Route,
  Waypoint,
  RoutePlanningConfig,
  SailingMode,
  WindForecast,
  RouteCorridorWeather
} from '../types/sailing';
import {
  calculateDistance,
  calculateBearing,
  recommendSailConfiguration
} from '../utils/sailingCalculations';
import { getWindyService } from './windyService';

/**
 * Calculate sunrise and sunset times for a given location and date
 */
function calculateSunriseSunset(coordinates: GPSCoordinates, date: Date): { sunrise: Date; sunset: Date } {
  // Simplified calculation - for production, use a library like suncalc
  const lat = coordinates.latitude;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);

  // Approximate sunrise and sunset hours (6 AM to 6 PM as baseline)
  const sunriseHour = 6;
  const sunsetHour = 18;

  const sunrise = new Date(date);
  sunrise.setHours(sunriseHour, 0, 0, 0);

  const sunset = new Date(date);
  sunset.setHours(sunsetHour, 0, 0, 0);

  return { sunrise, sunset };
}

/**
 * Check if a time is during daylight hours
 */
function isDaylight(time: Date, coordinates: GPSCoordinates): boolean {
  const { sunrise, sunset } = calculateSunriseSunset(coordinates, time);
  return time >= sunrise && time <= sunset;
}

/**
 * Calculate intermediate point along great circle route
 */
function intermediatePoint(
  start: GPSCoordinates,
  end: GPSCoordinates,
  fraction: number
): GPSCoordinates {
  const lat1 = (start.latitude * Math.PI) / 180;
  const lon1 = (start.longitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const lon2 = (end.longitude * Math.PI) / 180;

  const d = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  );

  const a = Math.sin((1 - fraction) * d) / Math.sin(d);
  const b = Math.sin(fraction * d) / Math.sin(d);

  const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
  const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return {
    latitude: (lat * 180) / Math.PI,
    longitude: (lon * 180) / Math.PI,
  };
}

/**
 * Fetch weather data for route corridor
 */
export async function fetchRouteCorridorWeather(
  start: GPSCoordinates,
  end: GPSCoordinates,
  intervalNm: number = 50
): Promise<RouteCorridorWeather> {
  const windyService = getWindyService();
  const totalDistance = calculateDistance(start, end);
  const numPoints = Math.ceil(totalDistance / intervalNm) + 1;

  const weatherPoints: Array<{
    coordinates: GPSCoordinates;
    forecast: WindForecast;
    distance: number;
  }> = [];

  let maxWindSpeed = 0;
  let totalWindSpeed = 0;
  let maxWaveHeight = 0;
  let totalWaveHeight = 0;

  for (let i = 0; i < numPoints; i++) {
    const fraction = i / (numPoints - 1);
    const coordinates = intermediatePoint(start, end, fraction);
    const distance = totalDistance * fraction;

    try {
      const result = await windyService.getCurrentConditions(coordinates);

      if (result.forecast && !result.error) {
        const forecast = result.forecast;
        weatherPoints.push({ coordinates, forecast, distance });

        maxWindSpeed = Math.max(maxWindSpeed, forecast.windSpeed);
        totalWindSpeed += forecast.windSpeed;
        maxWaveHeight = Math.max(maxWaveHeight, forecast.waveHeight);
        totalWaveHeight += forecast.waveHeight;
      }
    } catch (error) {
      console.error(`Failed to fetch weather for point ${i}:`, error);
    }
  }

  return {
    startPoint: start,
    endPoint: end,
    weatherPoints,
    averageWindSpeed: weatherPoints.length > 0 ? totalWindSpeed / weatherPoints.length : 0,
    maxWindSpeed,
    averageWaveHeight: weatherPoints.length > 0 ? totalWaveHeight / weatherPoints.length : 0,
    maxWaveHeight,
  };
}

/**
 * Generate optimized sailing route with waypoints
 */
export async function planRoute(config: RoutePlanningConfig): Promise<Route> {
  const {
    startPoint,
    destination,
    sailingMode,
    windThreshold,
    avoidStorms,
    ensureDaytimeArrival,
    maxDailyDistance,
    preferredWaypointInterval
  } = config;

  const totalDistance = calculateDistance(startPoint, destination);
  const bearing = calculateBearing(startPoint, destination);

  // Fetch weather data along the route
  const corridorWeather = await fetchRouteCorridorWeather(
    startPoint,
    destination,
    preferredWaypointInterval
  );

  // Generate waypoints
  const waypoints: Waypoint[] = [];
  const numWaypoints = Math.max(
    2,
    Math.ceil(totalDistance / preferredWaypointInterval) + 1
  );

  // Calculate average sailing speed (conservative estimate: 6 knots)
  const averageSpeed = 6;
  let cumulativeTime = 0; // in hours

  for (let i = 0; i < numWaypoints; i++) {
    const fraction = i / (numWaypoints - 1);
    const coordinates = intermediatePoint(startPoint, destination, fraction);
    const distanceFromStart = totalDistance * fraction;

    // Find nearest weather point
    let nearestWeather = corridorWeather.weatherPoints[0]?.forecast;
    let minDist = Infinity;
    for (const wp of corridorWeather.weatherPoints) {
      const dist = calculateDistance(coordinates, wp.coordinates);
      if (dist < minDist) {
        minDist = dist;
        nearestWeather = wp.forecast;
      }
    }

    // Calculate sailing speed for this leg
    let segmentDistance = 0;
    if (i > 0) {
      const prevCoords = waypoints[i - 1];
      segmentDistance = calculateDistance(
        { latitude: prevCoords.latitude, longitude: prevCoords.longitude },
        coordinates
      );
    }

    // Estimate time for this segment
    const segmentTime = segmentDistance / averageSpeed; // hours
    cumulativeTime += segmentTime;

    // Calculate estimated arrival time
    const estimatedArrival = new Date();
    estimatedArrival.setHours(estimatedArrival.getHours() + cumulativeTime);

    // Determine sail configuration based on weather
    let sailConfig;
    let useEngine = false;

    if (nearestWeather) {
      // Calculate true wind angle relative to course
      const windDirection = nearestWeather.windDirection;
      const trueWindAngle = Math.abs(windDirection - bearing);

      if (nearestWeather.windSpeed < windThreshold) {
        useEngine = true;
        sailConfig = undefined; // Engine mode
      } else if (avoidStorms && nearestWeather.windSpeed > 40) {
        // Storm avoidance - would need more complex routing here
        sailConfig = recommendSailConfiguration(
          nearestWeather.windSpeed,
          trueWindAngle,
          SailingMode.COMFORT
        ).configuration;
      } else {
        sailConfig = recommendSailConfiguration(
          nearestWeather.windSpeed,
          trueWindAngle,
          sailingMode
        ).configuration;
      }
    }

    const waypoint: Waypoint = {
      id: `waypoint-${i + 1}`,
      name: i === 0
        ? 'Start'
        : i === numWaypoints - 1
          ? 'Destination'
          : `Waypoint ${i}`,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      order: i + 1,
      arrived: false,
      estimatedArrival,
      sailConfiguration: sailConfig,
      useEngine,
      weatherForecast: nearestWeather,
    };

    waypoints.push(waypoint);
  }

  // Check daylight arrival for destination
  const lastWaypoint = waypoints[waypoints.length - 1];
  if (ensureDaytimeArrival && lastWaypoint.estimatedArrival) {
    if (!isDaylight(lastWaypoint.estimatedArrival, destination)) {
      // Adjust timing - add a holding waypoint or slow down
      console.warn('Destination arrival outside daylight hours. Consider adjusting departure time or adding overnight waypoint.');
    }
  }

  const route: Route = {
    id: `route-${Date.now()}`,
    name: `Route to ${destination.latitude.toFixed(2)}°, ${destination.longitude.toFixed(2)}°`,
    waypoints,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return route;
}

/**
 * Validate if waypoint arrival is during daylight
 */
export function validateDaylightArrival(
  waypoint: Waypoint,
  coordinates: GPSCoordinates
): { isValid: boolean; sunrise: Date; sunset: Date; message?: string } {
  if (!waypoint.estimatedArrival) {
    return {
      isValid: false,
      sunrise: new Date(),
      sunset: new Date(),
      message: 'No estimated arrival time set'
    };
  }

  const { sunrise, sunset } = calculateSunriseSunset(coordinates, waypoint.estimatedArrival);
  const isValid = isDaylight(waypoint.estimatedArrival, coordinates);

  return {
    isValid,
    sunrise,
    sunset,
    message: isValid
      ? undefined
      : `Arrival at ${waypoint.estimatedArrival.toLocaleTimeString()} is outside daylight hours (${sunrise.toLocaleTimeString()} - ${sunset.toLocaleTimeString()})`
  };
}

// Singleton instance
let routePlanningServiceInstance: typeof routePlanningService | null = null;

export const routePlanningService = {
  planRoute,
  fetchRouteCorridorWeather,
  validateDaylightArrival,
};

export function getRoutePlanningService() {
  if (!routePlanningServiceInstance) {
    routePlanningServiceInstance = routePlanningService;
  }
  return routePlanningServiceInstance;
}
