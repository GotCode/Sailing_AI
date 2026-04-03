// Automated Route Planning Service for Lagoon 440
// Generates optimal sailing routes considering weather, wind patterns, and sailing preferences

import {
  GPSCoordinates,
  Route,
  Waypoint,
  RoutePlanningConfig,
  SailingMode,
  WindForecast,
  RouteCorridorWeather,
  StormHandlingConfig
} from '../types/sailing';
import {
  calculateDistance,
  calculateBearing,
  recommendSailConfiguration,
  assessPreventer,
  evaluateStormTactic
} from '../utils/sailingCalculations';
import { getReefingRecommendation } from '../data/lagoon440Polar';
import { getWindyService } from './windyService';
import { formatCoordsDM } from '../utils/coordinateParser';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORM_HANDLING_CONFIG_STORAGE = 'storm_handling_config';

const DEFAULT_STORM_CONFIG: StormHandlingConfig = {
  hasParachuteSeaAnchor: false,
  hasJordanSeriesDrogue: false,
  autopilotReliable: true,
  defaultSeaRoomNm: 50,
};

async function loadStormConfig(): Promise<StormHandlingConfig> {
  try {
    const stored = await AsyncStorage.getItem(STORM_HANDLING_CONFIG_STORAGE);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('Failed to load storm config, using defaults');
  }
  return DEFAULT_STORM_CONFIG;
}

/**
 * Calculate sunrise and sunset times for a given location and date
 * Using astronomical calculations for accuracy
 */
function calculateSunriseSunset(coordinates: GPSCoordinates, date: Date): { sunrise: Date; sunset: Date } {
  const lat = coordinates.latitude * Math.PI / 180; // Convert to radians
  const lng = coordinates.longitude * Math.PI / 180;

  // Calculate day of year
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);

  // Solar declination approximation
  const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180) * Math.PI / 180;

  // Equation of time approximation (simplified)
  const equationOfTime = 4 * (0.000075 + 0.001868 * Math.cos(2 * Math.PI * dayOfYear / 365) - 0.032077 * Math.sin(2 * Math.PI * dayOfYear / 365) - 0.014615 * Math.cos(4 * Math.PI * dayOfYear / 365) - 0.040849 * Math.sin(4 * Math.PI * dayOfYear / 365));

  // Solar hour angle
  const hourAngle = Math.acos((Math.sin(-0.83 * Math.PI / 180) - Math.sin(lat) * Math.sin(declination)) / (Math.cos(lat) * Math.cos(declination)));

  // Calculate sunrise and sunset times in UTC hours
  const sunriseHour = 12 - (hourAngle * 180 / Math.PI) / 15 + equationOfTime / 60 - lng * 180 / (Math.PI * 15);
  const sunsetHour = 12 + (hourAngle * 180 / Math.PI) / 15 + equationOfTime / 60 - lng * 180 / (Math.PI * 15);

  // Create Date objects using UTC since the calculation yields UTC times
  const sunrise = new Date(date);
  sunrise.setUTCHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0);

  const sunset = new Date(date);
  sunset.setUTCHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0);

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
 * Post-process waypoints to ensure daylight arrival at the destination.
 * Uses the endpoint's local solar time (sunrise/sunset at destination coordinates).
 * Strategy:
 *   1. All waypoints use maximum speed (wind conditions may deteriorate near end).
 *   2. If destination arrival is outside daylight, only throttle waypoints within 10nm of endpoint.
 *   3. If throttling to >= 2 knots is sufficient, slow those legs down to arrive at sunrise + 1hr.
 *   4. If throttling isn't enough (need to wait too long), inject a Heave-To waypoint
 *      at ~10nm from destination. The boat waits there until sailing the last 10nm
 *      at full speed would arrive at sunrise + 1hr.
 */
function adjustForDaylightArrival(
  waypoints: Waypoint[],
  startPoint: GPSCoordinates,
  destination: GPSCoordinates,
  departureTime: Date,
  averageSpeed: number
): Waypoint[] {
  if (waypoints.length < 2) return waypoints;

  const destWP = waypoints[waypoints.length - 1];
  if (!destWP.estimatedArrival) return waypoints;

  // Check daylight at destination using destination's coordinates (local solar time)
  const arrivalTime = new Date(destWP.estimatedArrival);
  const { sunrise, sunset } = calculateSunriseSunset(destination, arrivalTime);

  if (isDaylight(arrivalTime, destination)) return waypoints; // Already arriving in daylight

  // Determine the next available daylight arrival window
  let targetArrival: Date;
  if (arrivalTime.getTime() > sunset.getTime()) {
    // Arriving after sunset → target next day's sunrise + 1hr buffer
    const nextDay = new Date(arrivalTime);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const { sunrise: nextSunrise } = calculateSunriseSunset(destination, nextDay);
    targetArrival = new Date(nextSunrise.getTime() + 3600000);
  } else {
    // Arriving before sunrise → target this day's sunrise + 1hr buffer
    targetArrival = new Date(sunrise.getTime() + 3600000);
  }

  const delayHours = (targetArrival.getTime() - arrivalTime.getTime()) / 3600000;
  if (delayHours <= 0) return waypoints;

  const totalDist = destWP.distanceFromStart || 0;
  const throttleZone = Math.min(10, totalDist * 0.9); // 10nm, but max 90% of route
  const zoneStartDist = totalDist - throttleZone;

  // Find the last waypoint AT or BEFORE the throttle zone boundary
  let zoneEntryIdx = 0;
  for (let i = waypoints.length - 2; i >= 0; i--) {
    if ((waypoints[i].distanceFromStart || 0) <= zoneStartDist) {
      zoneEntryIdx = i;
      break;
    }
  }

  // Distance from zone entry waypoint to destination
  const entryDist = waypoints[zoneEntryIdx].distanceFromStart || 0;
  const distFromEntry = totalDist - entryDist;
  const timeAtFullSpeed = distFromEntry / averageSpeed;
  const neededTime = timeAtFullSpeed + delayHours;
  const throttledSpd = distFromEntry / neededTime;

  const MIN_THROTTLE_SPEED = 2; // knots — below this, heave-to is more practical

  if (throttledSpd >= MIN_THROTTLE_SPEED) {
    // === THROTTLE APPROACH ===
    // Slow down legs within 10nm of endpoint to delay arrival into daylight
    const modified = waypoints.map(wp => ({ ...wp }));
    let cumTime = modified[zoneEntryIdx].elapsedTime || 0;

    for (let i = zoneEntryIdx + 1; i < modified.length; i++) {
      const newLegTime = (modified[i].legDistance || 0) / throttledSpd;
      modified[i].legTime = newLegTime;
      modified[i].sog = throttledSpd;
      modified[i].isThrottled = true;
      modified[i].throttledSpeed = throttledSpd;
      cumTime += newLegTime;
      modified[i].elapsedTime = cumTime;
      modified[i].estimatedArrival = new Date(departureTime.getTime() + cumTime * 3600000);
    }

    console.log(`Daylight throttle: slowed last ${distFromEntry.toFixed(1)}nm from ${averageSpeed} to ${throttledSpd.toFixed(1)} kts (delay ${delayHours.toFixed(1)}h)`);
    return modified;
  } else {
    // === HEAVE-TO APPROACH ===
    // Inject a Heave-To waypoint at ~10nm from destination; boat waits for daylight there
    const modified = waypoints.map(wp => ({ ...wp }));

    // Heave-to coordinates at zone boundary
    const htFraction = totalDist > 0 ? Math.max(0.01, zoneStartDist / totalDist) : 0;
    const htCoords = intermediatePoint(startPoint, destination, htFraction);

    // Leg from zone entry to heave-to
    const htLegDist = zoneStartDist - entryDist;
    const htLegTime = htLegDist > 0 ? htLegDist / averageSpeed : 0;
    const htElapsed = (modified[zoneEntryIdx].elapsedTime || 0) + htLegTime;
    const htArrival = new Date(departureTime.getTime() + htElapsed * 3600000);

    // Time to sail the remaining throttle zone at full speed
    const sailRemaining = throttleZone / averageSpeed;

    // Depart heave-to so that sailing the remaining distance arrives at targetArrival
    const htDepartTime = new Date(targetArrival.getTime() - sailRemaining * 3600000);
    const waitHours = Math.max(0, (htDepartTime.getTime() - htArrival.getTime()) / 3600000);

    const htBearing = calculateBearing(modified[zoneEntryIdx].coordinates, htCoords);

    const heaveToWP: Waypoint = {
      id: 'waypoint-heave-to',
      name: '⚓ Heave-To (Wait for Daylight)',
      latitude: htCoords.latitude,
      longitude: htCoords.longitude,
      coordinates: htCoords,
      order: 0,
      arrived: false,
      estimatedArrival: htArrival,
      sailConfiguration: 'Heave-To',
      useEngine: false,
      elapsedTime: htElapsed,
      legTime: htLegTime,
      distanceFromStart: zoneStartDist,
      legDistance: htLegDist,
      cog: htBearing,
      sog: 0,
      isHeaveTo: true,
      heaveToWaitHours: waitHours,
    };

    // Rebuild waypoints: before zone + heave-to + in-zone waypoints + destination
    const before = modified.slice(0, zoneEntryIdx + 1);
    const inZone = modified.slice(zoneEntryIdx + 1, modified.length - 1);
    const dest = modified[modified.length - 1];

    // Shift in-zone waypoints' timing by the wait period
    for (const wp of inZone) {
      const origElapsed = wp.elapsedTime || 0;
      wp.elapsedTime = origElapsed + waitHours;
      wp.estimatedArrival = new Date(departureTime.getTime() + wp.elapsedTime * 3600000);
    }

    // Destination arrives exactly at target
    dest.elapsedTime = htElapsed + waitHours + sailRemaining;
    dest.estimatedArrival = new Date(targetArrival);
    dest.legTime = inZone.length > 0
      ? (dest.distanceFromStart || 0) - (inZone[inZone.length - 1].distanceFromStart || 0)
      : throttleZone;
    dest.legTime = dest.legTime / averageSpeed;

    const result = [...before, heaveToWP, ...inZone, dest];

    // Reassign order and IDs
    for (let i = 0; i < result.length; i++) {
      result[i].order = i + 1;
      result[i].id = `waypoint-${i + 1}`;
    }
    result[0].name = 'Start';
    result[result.length - 1].name = 'Destination';

    console.log(`Daylight heave-to: waiting ${waitHours.toFixed(1)}h at ${zoneStartDist.toFixed(1)}nm from start, then sailing ${throttleZone.toFixed(1)}nm to destination`);
    return result;
  }
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
  let departureTime = config.startDate || new Date();
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
    let sailDescription = '';

    if (nearestWeather) {
      // Calculate true wind angle relative to course
      const windDirection = nearestWeather.windDirection;
      const trueWindAngle = Math.abs(windDirection - legBearing);

      if (nearestWeather.windSpeed < windThreshold) {
        useEngine = true;
        sailConfig = undefined; // Engine mode
      } else if (avoidStorms && nearestWeather.windSpeed > 40) {
        // Storm avoidance - would need more complex routing here
        const rec = recommendSailConfiguration(
          nearestWeather.windSpeed,
          trueWindAngle,
          SailingMode.COMFORT
        );
        sailConfig = rec.configuration;
        sailDescription = rec.description;
      } else {
        const rec = recommendSailConfiguration(
          nearestWeather.windSpeed,
          trueWindAngle,
          sailingMode
        );
        sailConfig = rec.configuration;
        sailDescription = rec.description;
      }
    }

    // Determine sail configuration string with reefing info
    let sailConfigString = 'Engine';
    if (!useEngine && sailConfig) {
      const sails = [];
      if (sailConfig.mainSail) {
        if (sailConfig.reefLevel && sailConfig.reefLevel > 0) {
          const reefLabels = ['', 'R1', 'R2', 'R3'];
          sails.push(`Main(${reefLabels[sailConfig.reefLevel]})`);
        } else {
          sails.push('Main');
        }
      }
      if (sailConfig.jib) {
        if (sailConfig.headsailReef && sailConfig.headsailReef > 0) {
          const reefLabels = ['', 'R1', 'R2', 'Storm'];
          sails.push(`Jib(${reefLabels[sailConfig.headsailReef]})`);
        } else {
          sails.push('Jib');
        }
      }
      if (sailConfig.asymmetrical) sails.push('Asym');
      if (sailConfig.spinnaker) sails.push('Spin');
      if (sailConfig.codeZero) sails.push('Code0');
      if (sailConfig.stormJib) sails.push('StormJib');
      sailConfigString = sails.length > 0 ? sails.join('+') : 'Main+Jib';

      // Append reefing advice if wind requires reefing
      if (nearestWeather && nearestWeather.windSpeed >= 15) {
        const { reefingAdvice } = getReefingRecommendation(nearestWeather.windSpeed);
        sailConfigString += ` [${reefingAdvice}]`;
      }
    }

    // Assess whether a preventer should be rigged for this leg
    let usePreventer = false;
    let preventerReason = '';
    if (!useEngine && nearestWeather) {
      const trueWindAngle = Math.abs(nearestWeather.windDirection - legBearing);
      const twa = trueWindAngle > 180 ? 360 - trueWindAngle : trueWindAngle;
      const preventerCheck = assessPreventer(
        twa,
        nearestWeather.windSpeed,
        nearestWeather.waveHeight,
        sailDescription
      );
      usePreventer = preventerCheck.usePreventer;
      preventerReason = preventerCheck.reason;
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
      usePreventer,
      preventerReason,
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
      // Storm handling will be evaluated in post-processing
    };

    waypoints.push(waypoint);
  }

  // Post-process: adjust for daylight arrival at destination
  // Uses endpoint's local solar time. Only throttles within 10nm of endpoint.
  // Injects Heave-To waypoint if throttling alone is insufficient.
  let finalWaypoints = waypoints;
  if (ensureDaytimeArrival) {
    finalWaypoints = adjustForDaylightArrival(
      waypoints,
      startPoint,
      destination,
      departureTime,
      averageSpeed
    );
  }

  // Post-process: evaluate storm handling tactic for each waypoint
  const stormEquipment = await loadStormConfig();
  for (const wp of finalWaypoints) {
    if (wp.weatherForecast && wp.weatherForecast.windSpeed >= 25) {
      wp.stormHandling = evaluateStormTactic(
        wp.weatherForecast.windSpeed,
        wp.weatherForecast.waveHeight,
        0, // wavePeriod unknown from forecast data
        stormEquipment.defaultSeaRoomNm,
        stormEquipment
      );
    }
  }

  // Validate daylight arrival for all waypoints
  for (let i = 0; i < finalWaypoints.length; i++) {
    const wp = finalWaypoints[i];
    if (wp.estimatedArrival) {
      const validation = validateDaylightArrival(wp, wp.coordinates);
      if (!validation.isValid) {
        console.warn(`Waypoint ${wp.name}: ${validation.message}`);
      }
    }
  }

  // Calculate total distance and estimated travel time for route name
  const routeTotalDistance = finalWaypoints.reduce((sum, wp) => sum + (wp.legDistance || 0), 0) || totalDistance;
  let routeTimeLabel = '';
  if (finalWaypoints.length >= 2 && finalWaypoints[0].estimatedArrival && finalWaypoints[finalWaypoints.length - 1].estimatedArrival) {
    const totalHoursRaw = (finalWaypoints[finalWaypoints.length - 1].estimatedArrival!.getTime() - finalWaypoints[0].estimatedArrival!.getTime()) / (1000 * 60 * 60);
    const days = Math.floor(totalHoursRaw / 24);
    const hours = Math.round(totalHoursRaw % 24);
    routeTimeLabel = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  }

  const startLabel = formatCoordsDM(startPoint.latitude, startPoint.longitude);
  const endLabel = formatCoordsDM(destination.latitude, destination.longitude);

  const route: Route = {
    id: `route-${Date.now()}`,
    name: `From ${startLabel} TO ${endLabel} - ${finalWaypoints.length} waypoints, ${routeTotalDistance.toFixed(1)} nm${routeTimeLabel ? `, ${routeTimeLabel}` : ''}`,
    waypoints: finalWaypoints,
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

/**
 * Re-plan route in response to a storm detected by weather monitoring.
 * Compares new route ETA to the original; if deviation > 24 hours,
 * returns `requiresConfirmation: true` so the UI can prompt the user.
 *
 * The re-plan uses the same config but forces the sailing mode
 * the user configured (comfort / speed / mixed), which affects
 * sail configuration recommendations and speed calculations.
 */
export async function replanRouteForStorm(
  originalRoute: Route,
  config: RoutePlanningConfig,
  stormWaypoints: Waypoint[]
): Promise<{
  newRoute: Route;
  deviationHours: number;
  requiresConfirmation: boolean;
  stormAlertSummary: string;
}> {
  // Build a summary of storm conditions encountered
  const stormSummary = stormWaypoints
    .filter(wp => wp.stormHandling && wp.stormHandling.severity !== 'normal')
    .map(wp => `${wp.name}: ${wp.stormHandling!.label} (${wp.weatherForecast?.windSpeed.toFixed(0) || '?'} kts, ${wp.weatherForecast?.waveHeight.toFixed(1) || '?'}m waves) — ${wp.stormHandling!.reason}`)
    .join('\n');

  // Re-plan with fresh weather data and the configured sailing mode
  const newRoute = await planRoute(config);

  // Calculate time deviation
  const origEnd = originalRoute.waypoints[originalRoute.waypoints.length - 1];
  const newEnd = newRoute.waypoints[newRoute.waypoints.length - 1];
  const origETA = origEnd.estimatedArrival ? new Date(origEnd.estimatedArrival).getTime() : 0;
  const newETA = newEnd.estimatedArrival ? new Date(newEnd.estimatedArrival).getTime() : 0;
  const deviationHours = Math.abs(newETA - origETA) / 3600000;

  return {
    newRoute,
    deviationHours,
    requiresConfirmation: deviationHours > 24,
    stormAlertSummary: stormSummary || 'Storm conditions detected along route.',
  };
}

// Singleton instance
let routePlanningServiceInstance: typeof routePlanningService | null = null;

export const routePlanningService = {
  planRoute,
  fetchRouteCorridorWeather,
  validateDaylightArrival,
  replanRouteForStorm,
};

export function getRoutePlanningService() {
  if (!routePlanningServiceInstance) {
    routePlanningServiceInstance = routePlanningService;
  }
  return routePlanningServiceInstance;
}
