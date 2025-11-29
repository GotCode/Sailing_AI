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
 * Calculate required departure time to ensure daylight arrival
 */
function calculateDepartureForDaylightArrival(
  destination: GPSCoordinates,
  totalSailingTimeHours: number,
  preferredDeparture: Date
): { departureTime: Date; adjustedForDaylight: boolean; message?: string } {
  // Get sunset at destination for the estimated arrival day
  const estimatedArrival = new Date(preferredDeparture);
  estimatedArrival.setHours(estimatedArrival.getHours() + totalSailingTimeHours);

  const { sunrise, sunset } = calculateSunriseSunset(destination, estimatedArrival);

  // Check if arrival is during daylight
  if (isDaylight(estimatedArrival, destination)) {
    return {
      departureTime: preferredDeparture,
      adjustedForDaylight: false,
    };
  }

  // Calculate the target arrival time (midday to allow buffer)
  const targetArrival = new Date(estimatedArrival);

  // If arriving before sunrise, adjust to arrive at sunrise + 1 hour buffer
  if (estimatedArrival < sunrise) {
    const arrivalAfterSunrise = new Date(sunrise);
    arrivalAfterSunrise.setHours(arrivalAfterSunrise.getHours() + 1);
    const hoursToDelay = (arrivalAfterSunrise.getTime() - estimatedArrival.getTime()) / (1000 * 60 * 60);
    const adjustedDeparture = new Date(preferredDeparture);
    adjustedDeparture.setHours(adjustedDeparture.getHours() + hoursToDelay);
    return {
      departureTime: adjustedDeparture,
      adjustedForDaylight: true,
      message: `Departure delayed by ${hoursToDelay.toFixed(1)} hours to ensure arrival after sunrise`,
    };
  }

  // If arriving after sunset, adjust to arrive 1 hour before sunset
  if (estimatedArrival > sunset) {
    // Option 1: Leave earlier same day to arrive before sunset
    const arrivalBeforeSunset = new Date(sunset);
    arrivalBeforeSunset.setHours(arrivalBeforeSunset.getHours() - 1);
    const hoursToAdvance = (estimatedArrival.getTime() - arrivalBeforeSunset.getTime()) / (1000 * 60 * 60);
    const adjustedDeparture = new Date(preferredDeparture);
    adjustedDeparture.setHours(adjustedDeparture.getHours() - hoursToAdvance);

    // Check if adjusted departure is still reasonable (not before midnight)
    const departureHour = adjustedDeparture.getHours();
    if (departureHour >= 4) {
      // Depart earlier same day
      return {
        departureTime: adjustedDeparture,
        adjustedForDaylight: true,
        message: `Departure advanced by ${hoursToAdvance.toFixed(1)} hours to arrive before sunset`,
      };
    }

    // Option 2: Delay departure to next day for daylight arrival
    const nextDaySunrise = new Date(sunrise);
    nextDaySunrise.setDate(nextDaySunrise.getDate() + 1);
    nextDaySunrise.setHours(nextDaySunrise.getHours() + 1);
    const targetArrivalNextDay = nextDaySunrise;
    const delayHours = (targetArrivalNextDay.getTime() - estimatedArrival.getTime()) / (1000 * 60 * 60);
    const delayedDeparture = new Date(preferredDeparture);
    delayedDeparture.setHours(delayedDeparture.getHours() + delayHours);

    return {
      departureTime: delayedDeparture,
      adjustedForDaylight: true,
      message: `Departure delayed to next day for daylight arrival`,
    };
  }

  return {
    departureTime: preferredDeparture,
    adjustedForDaylight: false,
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

  // First pass: calculate total sailing time
  let totalSailingTime = totalDistance / averageSpeed;

  // Determine departure time
  let departureTime = new Date();
  let daylightAdjustment = { adjustedForDaylight: false, message: undefined as string | undefined };

  if (ensureDaytimeArrival) {
    const result = calculateDepartureForDaylightArrival(destination, totalSailingTime, departureTime);
    departureTime = result.departureTime;
    daylightAdjustment = { adjustedForDaylight: result.adjustedForDaylight, message: result.message };
    if (result.message) {
      console.log('Daylight arrival adjustment:', result.message);
    }
  }

  let cumulativeTime = 0; // in hours
  let cumulativeDistance = 0; // in nautical miles

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

    // Calculate leg distance and time
    let legDistance = 0;
    let legBearing = bearing;
    if (i > 0) {
      const prevCoords = waypoints[i - 1];
      legDistance = calculateDistance(
        { latitude: prevCoords.latitude, longitude: prevCoords.longitude },
        coordinates
      );
      legBearing = calculateBearing(
        { latitude: prevCoords.latitude, longitude: prevCoords.longitude },
        coordinates
      );
    }

    // Calculate leg time based on conditions
    const legSpeed = averageSpeed; // Could be adjusted based on weather
    const legTime = legDistance > 0 ? legDistance / legSpeed : 0;
    cumulativeTime += legTime;
    cumulativeDistance += legDistance;

    // Calculate estimated arrival time based on adjusted departure
    const estimatedArrival = new Date(departureTime);
    estimatedArrival.setTime(estimatedArrival.getTime() + cumulativeTime * 60 * 60 * 1000);

    // Determine sail configuration based on weather
    let sailConfig;
    let useEngine = false;

    if (nearestWeather) {
      // Calculate true wind angle relative to course
      const windDirection = nearestWeather.windDirection;
      const trueWindAngle = Math.abs(windDirection - legBearing);

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

    // Determine sail configuration string
    let sailConfigString = 'Engine';
    if (!useEngine && sailConfig) {
      const sails = [];
      if (sailConfig.mainSail) sails.push('Main');
      if (sailConfig.jib) sails.push('Jib');
      if (sailConfig.asymmetrical) sails.push('Asym');
      if (sailConfig.spinnaker) sails.push('Spin');
      if (sailConfig.codeZero) sails.push('Code0');
      if (sailConfig.stormJib) sails.push('Storm');
      sailConfigString = sails.length > 0 ? sails.join('+') : 'Main+Jib';
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
      coordinates: coordinates,
      order: i + 1,
      arrived: false,
      estimatedArrival,
      sailConfiguration: sailConfigString,
      useEngine,
      weatherForecast: nearestWeather ? {
        ...nearestWeather,
        direction: nearestWeather.windDirection,
      } : undefined,
      // New timing and distance fields
      elapsedTime: cumulativeTime,
      legTime: legTime,
      distanceFromStart: cumulativeDistance,
      legDistance: legDistance,
      cog: legBearing,
      sog: legSpeed,
    };

    waypoints.push(waypoint);
  }

  // Validate daylight arrival for all waypoints
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    if (wp.estimatedArrival) {
      const validation = validateDaylightArrival(wp, wp.coordinates);
      if (!validation.isValid) {
        console.warn(`Waypoint ${wp.name}: ${validation.message}`);
      }
    }
  }

  const route: Route = {
    id: `route-${Date.now()}`,
    name: `Route to ${destination.latitude.toFixed(2)}°, ${destination.longitude.toFixed(2)}°`,
    waypoints,
    createdAt: new Date(),
    updatedAt: new Date(),
    startDate: departureTime,
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
