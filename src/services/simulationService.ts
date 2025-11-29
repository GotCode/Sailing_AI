// Simulation Service for Weather Changes and Storm Events
// Simulates 12-hour intervals every 5 seconds for testing

import { Route, Waypoint, GPSCoordinates, WindForecast } from '../types/sailing';
import { getWeatherMonitoringService } from './weatherMonitoringService';

interface SimulationState {
  isRunning: boolean;
  currentHour: number;
  route: Route | null;
  onWeatherUpdate: ((weather: SimulatedWeather) => void) | null;
  onStormAlert: ((alert: StormAlert) => void) | null;
  onRouteDeviation: ((newRoute: Route) => void) | null;
  intervalId: NodeJS.Timeout | null;
}

export interface SimulatedWeather {
  hour: number;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  gustSpeed: number;
  hasStorm: boolean;
  stormLocation?: GPSCoordinates;
  stormRadius?: number; // nautical miles
  conditions: 'good' | 'moderate' | 'rough' | 'storm';
  // Squall support
  squalls?: Array<{
    location: GPSCoordinates;
    radius: number;
    windSpeed: number;
  }>;
  // Boat position simulation
  boatPosition?: GPSCoordinates;
  currentWaypointIndex?: number;
}

interface StormAlert {
  id: string;
  type: 'storm' | 'high_wind' | 'high_waves' | 'squall';
  severity: 'warning' | 'watch' | 'advisory';
  message: string;
  location: GPSCoordinates;
  timestamp: Date;
  affectedWaypoints: string[];
}

// Weather scenarios that progress over simulation time
const weatherScenarios: SimulatedWeather[] = [
  // Hour 0: Good conditions at start
  {
    hour: 0,
    windSpeed: 12,
    windDirection: 120,
    waveHeight: 1.2,
    gustSpeed: 15,
    hasStorm: false,
    conditions: 'good',
    squalls: [],
  },
  // Hour 12: Wind building, first squall appears
  {
    hour: 12,
    windSpeed: 18,
    windDirection: 135,
    waveHeight: 1.8,
    gustSpeed: 22,
    hasStorm: false,
    conditions: 'moderate',
    squalls: [
      {
        location: { latitude: 30.0, longitude: -67.0 },
        radius: 15,
        windSpeed: 28,
      },
    ],
  },
  // Hour 24: Storm developing, multiple squalls
  {
    hour: 24,
    windSpeed: 25,
    windDirection: 150,
    waveHeight: 2.5,
    gustSpeed: 32,
    hasStorm: true,
    stormLocation: { latitude: 28.5, longitude: -70.0 },
    stormRadius: 50,
    conditions: 'rough',
    squalls: [
      {
        location: { latitude: 29.5, longitude: -68.5 },
        radius: 12,
        windSpeed: 35,
      },
      {
        location: { latitude: 27.5, longitude: -69.0 },
        radius: 10,
        windSpeed: 30,
      },
    ],
  },
  // Hour 36: Storm at peak - requires rerouting
  {
    hour: 36,
    windSpeed: 35,
    windDirection: 160,
    waveHeight: 4.0,
    gustSpeed: 45,
    hasStorm: true,
    stormLocation: { latitude: 27.0, longitude: -72.0 },
    stormRadius: 75,
    conditions: 'storm',
    squalls: [
      {
        location: { latitude: 28.0, longitude: -70.5 },
        radius: 15,
        windSpeed: 40,
      },
      {
        location: { latitude: 26.0, longitude: -71.5 },
        radius: 12,
        windSpeed: 38,
      },
      {
        location: { latitude: 29.0, longitude: -73.0 },
        radius: 10,
        windSpeed: 32,
      },
    ],
  },
  // Hour 48: Storm moving, still affecting route
  {
    hour: 48,
    windSpeed: 30,
    windDirection: 170,
    waveHeight: 3.5,
    gustSpeed: 38,
    hasStorm: true,
    stormLocation: { latitude: 26.0, longitude: -74.0 },
    stormRadius: 60,
    conditions: 'storm',
    squalls: [
      {
        location: { latitude: 27.0, longitude: -73.0 },
        radius: 12,
        windSpeed: 35,
      },
    ],
  },
  // Hour 60: Storm clearing, residual squall
  {
    hour: 60,
    windSpeed: 20,
    windDirection: 140,
    waveHeight: 2.0,
    gustSpeed: 25,
    hasStorm: false,
    conditions: 'moderate',
    squalls: [
      {
        location: { latitude: 25.5, longitude: -75.5 },
        radius: 8,
        windSpeed: 26,
      },
    ],
  },
  // Hour 72: Good conditions return
  {
    hour: 72,
    windSpeed: 14,
    windDirection: 125,
    waveHeight: 1.5,
    gustSpeed: 18,
    hasStorm: false,
    conditions: 'good',
    squalls: [],
  },
];

const state: SimulationState = {
  isRunning: false,
  currentHour: 0,
  route: null,
  onWeatherUpdate: null,
  onStormAlert: null,
  onRouteDeviation: null,
  intervalId: null,
};

// Calculate distance between two coordinates in nautical miles
function calculateDistance(coord1: GPSCoordinates, coord2: GPSCoordinates): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Check if waypoint is affected by storm
function isWaypointAffectedByStorm(
  waypoint: Waypoint,
  stormLocation: GPSCoordinates,
  stormRadius: number
): boolean {
  const distance = calculateDistance(waypoint.coordinates, stormLocation);
  return distance <= stormRadius;
}

// Generate deviated route to avoid storm
function generateDeviatedRoute(route: Route, weather: SimulatedWeather): Route {
  if (!weather.hasStorm || !weather.stormLocation || !weather.stormRadius) {
    return route;
  }

  const newWaypoints: Waypoint[] = [];
  let deviationAdded = false;

  for (let i = 0; i < route.waypoints.length; i++) {
    const waypoint = route.waypoints[i];
    const isAffected = isWaypointAffectedByStorm(
      waypoint,
      weather.stormLocation,
      weather.stormRadius
    );

    if (isAffected && !deviationAdded) {
      // Add deviation waypoint to go around storm
      const stormLat = weather.stormLocation.latitude;
      const stormLon = weather.stormLocation.longitude;

      // Create deviation point (go east of storm)
      const deviationLat = stormLat + 1.5; // North of storm
      const deviationLon = stormLon + 2.0; // East of storm

      const deviationWaypoint: Waypoint = {
        id: `deviation-${Date.now()}`,
        name: 'Storm Avoidance',
        latitude: deviationLat,
        longitude: deviationLon,
        coordinates: { latitude: deviationLat, longitude: deviationLon },
        order: newWaypoints.length + 1,
        arrived: false,
        sailConfiguration: 'Main+Jib',
        useEngine: false,
        estimatedArrival: new Date(Date.now() + (i + 1) * 8 * 3600000), // 8 hours per leg
        weatherForecast: {
          timestamp: new Date(),
          windSpeed: 20,
          windDirection: weather.windDirection,
          direction: weather.windDirection,
          gustSpeed: 25,
          waveHeight: 2.0,
        },
      };

      newWaypoints.push(deviationWaypoint);
      deviationAdded = true;

      // Also add the original waypoint with updated order
      newWaypoints.push({
        ...waypoint,
        order: newWaypoints.length + 1,
        estimatedArrival: new Date(Date.now() + (i + 2) * 8 * 3600000),
      });
    } else {
      newWaypoints.push({
        ...waypoint,
        order: newWaypoints.length + 1,
      });
    }
  }

  return {
    ...route,
    name: `${route.name} (Storm Avoidance)`,
    waypoints: newWaypoints,
    updatedAt: new Date(),
  };
}

// Calculate boat position along route based on simulation progress
function calculateBoatPosition(route: Route | null, hour: number): { position: GPSCoordinates; waypointIndex: number } | null {
  if (!route || route.waypoints.length < 2) return null;

  // Assume average speed of ~6 knots, total voyage ~96 hours
  const totalVoyageHours = 96;
  const progress = Math.min(hour / totalVoyageHours, 1);

  // Calculate which leg we're on
  const totalLegs = route.waypoints.length - 1;
  const legProgress = progress * totalLegs;
  const currentLegIndex = Math.min(Math.floor(legProgress), totalLegs - 1);
  const legFraction = legProgress - currentLegIndex;

  const startWp = route.waypoints[currentLegIndex];
  const endWp = route.waypoints[currentLegIndex + 1];

  // Interpolate position
  const lat = startWp.latitude + legFraction * (endWp.latitude - startWp.latitude);
  const lon = startWp.longitude + legFraction * (endWp.longitude - startWp.longitude);

  return {
    position: { latitude: lat, longitude: lon },
    waypointIndex: currentLegIndex,
  };
}

// Get current weather based on simulation hour
function getCurrentWeather(hour: number): SimulatedWeather {
  // Find the two scenarios to interpolate between
  let prevScenario = weatherScenarios[0];
  let nextScenario = weatherScenarios[0];

  for (let i = 0; i < weatherScenarios.length - 1; i++) {
    if (hour >= weatherScenarios[i].hour && hour < weatherScenarios[i + 1].hour) {
      prevScenario = weatherScenarios[i];
      nextScenario = weatherScenarios[i + 1];
      break;
    }
    if (hour >= weatherScenarios[weatherScenarios.length - 1].hour) {
      prevScenario = weatherScenarios[weatherScenarios.length - 1];
      nextScenario = weatherScenarios[weatherScenarios.length - 1];
    }
  }

  // Simple linear interpolation
  const t = prevScenario === nextScenario
    ? 0
    : (hour - prevScenario.hour) / (nextScenario.hour - prevScenario.hour);

  // Determine conditions based on interpolated values
  const windSpeed = prevScenario.windSpeed + t * (nextScenario.windSpeed - prevScenario.windSpeed);
  let conditions: 'good' | 'moderate' | 'rough' | 'storm';
  if (windSpeed >= 30) conditions = 'storm';
  else if (windSpeed >= 22) conditions = 'rough';
  else if (windSpeed >= 15) conditions = 'moderate';
  else conditions = 'good';

  // Calculate boat position
  const boatInfo = calculateBoatPosition(state.route, hour);

  // Interpolate squall positions (they move slightly over time)
  const squalls = (t > 0.5 ? nextScenario.squalls : prevScenario.squalls) || [];
  const interpolatedSqualls = squalls.map(sq => ({
    ...sq,
    location: {
      latitude: sq.location.latitude + (Math.random() - 0.5) * 0.2, // Small random movement
      longitude: sq.location.longitude + (Math.random() - 0.5) * 0.2,
    },
  }));

  return {
    hour,
    windSpeed,
    windDirection: prevScenario.windDirection + t * (nextScenario.windDirection - prevScenario.windDirection),
    waveHeight: prevScenario.waveHeight + t * (nextScenario.waveHeight - prevScenario.waveHeight),
    gustSpeed: prevScenario.gustSpeed + t * (nextScenario.gustSpeed - prevScenario.gustSpeed),
    hasStorm: nextScenario.hasStorm && t > 0.5, // Storm appears halfway through transition
    stormLocation: nextScenario.stormLocation,
    stormRadius: nextScenario.stormRadius,
    conditions,
    squalls: interpolatedSqualls,
    boatPosition: boatInfo?.position,
    currentWaypointIndex: boatInfo?.waypointIndex,
  };
}

// Check for alerts based on weather
function checkForAlerts(weather: SimulatedWeather, route: Route | null): StormAlert[] {
  if (!route) return [];

  const alerts: StormAlert[] = [];

  // Check for squalls first (smaller, more localized)
  if (weather.squalls && weather.squalls.length > 0) {
    for (const squall of weather.squalls) {
      const squallAffectedWaypoints: string[] = [];
      for (const waypoint of route.waypoints) {
        if (isWaypointAffectedByStorm(waypoint, squall.location, squall.radius)) {
          squallAffectedWaypoints.push(waypoint.name);
        }
      }

      if (squallAffectedWaypoints.length > 0) {
        alerts.push({
          id: `squall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'squall',
          severity: squall.windSpeed > 35 ? 'warning' : 'advisory',
          message: `Squall detected! Localized winds to ${squall.windSpeed.toFixed(0)} kts. Near waypoints: ${squallAffectedWaypoints.join(', ')}. Prepare for sudden wind increase.`,
          location: squall.location,
          timestamp: new Date(),
          affectedWaypoints: squallAffectedWaypoints,
        });
      }
    }
  }

  // Check for main storm
  if (weather.hasStorm && weather.stormLocation && weather.stormRadius) {
    const affectedWaypoints: string[] = [];
    // Check which waypoints are affected
    for (const waypoint of route.waypoints) {
      if (isWaypointAffectedByStorm(waypoint, weather.stormLocation, weather.stormRadius)) {
        affectedWaypoints.push(waypoint.name);
      }
    }

    if (affectedWaypoints.length > 0) {
      alerts.push({
        id: `storm-${Date.now()}`,
        type: 'storm',
        severity: weather.windSpeed > 30 ? 'warning' : 'watch',
        message: `Storm system detected! Wind ${weather.windSpeed.toFixed(0)} kts, Waves ${weather.waveHeight.toFixed(1)}m. Affecting waypoints: ${affectedWaypoints.join(', ')}. Route deviation recommended.`,
        location: weather.stormLocation,
        timestamp: new Date(),
        affectedWaypoints,
      });
    }
  }

  // High wind alert (if no storm)
  if (weather.windSpeed > 25 && !weather.hasStorm && alerts.length === 0) {
    alerts.push({
      id: `wind-${Date.now()}`,
      type: 'high_wind',
      severity: weather.windSpeed > 35 ? 'warning' : 'advisory',
      message: `High winds detected: ${weather.windSpeed.toFixed(0)} kts with gusts to ${weather.gustSpeed.toFixed(0)} kts.`,
      location: route.waypoints[0].coordinates,
      timestamp: new Date(),
      affectedWaypoints: [],
    });
  }

  // High wave alert
  if (weather.waveHeight > 3.0) {
    alerts.push({
      id: `wave-${Date.now()}`,
      type: 'high_waves',
      severity: weather.waveHeight > 4.0 ? 'warning' : 'advisory',
      message: `Large waves detected: ${weather.waveHeight.toFixed(1)}m. Consider reducing sail area.`,
      location: route.waypoints[0].coordinates,
      timestamp: new Date(),
      affectedWaypoints: [],
    });
  }

  return alerts;
}

// Run one simulation tick
function simulationTick() {
  state.currentHour += 12; // Each tick is 12 hours

  const weather = getCurrentWeather(state.currentHour);

  // Notify weather update
  if (state.onWeatherUpdate) {
    state.onWeatherUpdate(weather);
  }

  // Check for alerts (now returns array)
  const alerts = checkForAlerts(weather, state.route);
  if (alerts.length > 0 && state.onStormAlert) {
    // Process each alert
    for (const alert of alerts) {
      state.onStormAlert(alert);

      // Also notify the weather monitoring service
      const monitoringService = getWeatherMonitoringService();
      monitoringService.addSimulatedAlert(alert);
    }
  }

  // Generate deviated route if storm affects waypoints
  if (weather.hasStorm && state.route && state.onRouteDeviation) {
    const deviatedRoute = generateDeviatedRoute(state.route, weather);
    if (deviatedRoute.waypoints.length !== state.route.waypoints.length) {
      state.onRouteDeviation(deviatedRoute);
    }
  }

  // Loop back after 72 hours
  if (state.currentHour >= 84) {
    state.currentHour = 0;
  }
}

export const simulationService = {
  start(
    route: Route,
    callbacks: {
      onWeatherUpdate: (weather: SimulatedWeather) => void;
      onStormAlert: (alert: StormAlert) => void;
      onRouteDeviation: (newRoute: Route) => void;
    }
  ) {
    if (state.isRunning) {
      this.stop();
    }

    state.isRunning = true;
    state.currentHour = 0;
    state.route = route;
    state.onWeatherUpdate = callbacks.onWeatherUpdate;
    state.onStormAlert = callbacks.onStormAlert;
    state.onRouteDeviation = callbacks.onRouteDeviation;

    // Initial weather update
    const initialWeather = getCurrentWeather(0);
    callbacks.onWeatherUpdate(initialWeather);

    // Start interval - 5 seconds = 12 hours
    state.intervalId = setInterval(simulationTick, 5000);

    console.log('Simulation started: 5 sec = 12 hours');
  },

  stop() {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.isRunning = false;
    state.onWeatherUpdate = null;
    state.onStormAlert = null;
    state.onRouteDeviation = null;
    console.log('Simulation stopped');
  },

  isRunning(): boolean {
    return state.isRunning;
  },

  getCurrentHour(): number {
    return state.currentHour;
  },

  getWeatherScenarios(): SimulatedWeather[] {
    return weatherScenarios;
  },
};

export type { SimulatedWeather, StormAlert };
