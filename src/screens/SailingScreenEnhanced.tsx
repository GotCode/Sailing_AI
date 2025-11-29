// Enhanced Sailing Screen with Route Planning, Weather Fetch, and Professional UI
// This is the redesigned version with all requested features

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  SailingMode,
  GPSCoordinates,
  RouteCorridorWeather,
  RoutePlanningConfig,
  Waypoint,
  Route,
} from '../types/sailing';
import { recommendSailConfiguration } from '../utils/sailingCalculations';
import { getWindyService } from '../services/windyService';
import { planRoute, fetchRouteCorridorWeather } from '../services/routePlanningService';
import SailConfigDisplay from '../components/SailConfigDisplay';
import ErrorPanel from '../components/ErrorPanel';
import SailingRose from '../components/SailingRose';
import RouteMapView from '../components/RouteMapView';
import { useAuth } from '../contexts/AuthContext';
import { simulationService, SimulatedWeather, StormAlert } from '../services/simulationService';
import { getWeatherMonitoringService } from '../services/weatherMonitoringService';
import {
  validateWindSpeed,
  validateTWA,
  validateLatitude,
  validateLongitude,
  sanitizeNumericInput,
} from '../utils/validation';
import { parseLocationInput, getCoordinateFormatExamples } from '../utils/coordinateParser';

const SailingScreenEnhanced: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  // ===== Route Planning Inputs (now single field for lat,lon or location name) =====
  const [startPoint, setStartPoint] = useState<GPSCoordinates>({ latitude: 0, longitude: 0 });
  const [destination, setDestination] = useState<GPSCoordinates>({ latitude: 0, longitude: 0 });
  const [startInput, setStartInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  // ===== Sailing Mode (Radio Buttons) =====
  const [sailingMode, setSailingMode] = useState<SailingMode>(SailingMode.MIXED);

  // ===== Current Position (GPS) =====
  const [currentPosition, setCurrentPosition] = useState<GPSCoordinates>({ latitude: 0, longitude: 0 });
  const [locationEnabled, setLocationEnabled] = useState(false);

  // ===== Wind Data =====
  const [windSpeed, setWindSpeed] = useState('10');
  const [trueWindAngle, setTrueWindAngle] = useState('90');

  // ===== Weather Corridor Data =====
  const [corridorWeather, setCorridorWeather] = useState<RouteCorridorWeather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [weatherBytesFetched, setWeatherBytesFetched] = useState(0);

  // ===== Planned Route =====
  const [plannedRoute, setPlannedRoute] = useState<Route | null>(null);
  const [showWaypointsModal, setShowWaypointsModal] = useState(false);

  // ===== Saved Routes =====
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  const [showSavedRoutesModal, setShowSavedRoutesModal] = useState(false);

  // ===== Sail Recommendation =====
  const [sailRecommendation, setSailRecommendation] = useState<any>(null);

  // ===== Error Handling =====
  const [error, setError] = useState<string | null>(null);

  // ===== Status Bar =====
  const [statusMessage, setStatusMessage] = useState('Ready');

  // ===== Simulation State =====
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationCompleted, setSimulationCompleted] = useState(false);
  const [simulationHour, setSimulationHour] = useState(0);
  const [simulatedWeather, setSimulatedWeather] = useState<SimulatedWeather | null>(null);
  const [stormAlerts, setStormAlerts] = useState<StormAlert[]>([]);

  // ===== Real GPS Tracking State =====
  const [trackingRunning, setTrackingRunning] = useState(false);
  const [trackingPosition, setTrackingPosition] = useState<GPSCoordinates | null>(null);
  const trackingSubscriptionRef = useRef<any>(null);

  // ===== Storm Reroute State =====
  const [showRerouteDialog, setShowRerouteDialog] = useState(false);
  const [pendingReroute, setPendingReroute] = useState<Route | null>(null);

  // ===== Weather Alert Popup State =====
  const [showWeatherAlert, setShowWeatherAlert] = useState(false);
  const [currentWeatherAlert, setCurrentWeatherAlert] = useState<StormAlert | null>(null);
  const weatherAlertTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ===== Auto-close weather alert after 30 seconds =====
  useEffect(() => {
    if (showWeatherAlert) {
      // Clear any existing timer
      if (weatherAlertTimerRef.current) {
        clearTimeout(weatherAlertTimerRef.current);
      }
      // Set new 30-second timer
      weatherAlertTimerRef.current = setTimeout(() => {
        setShowWeatherAlert(false);
        setCurrentWeatherAlert(null);
      }, 30000);
    }

    return () => {
      if (weatherAlertTimerRef.current) {
        clearTimeout(weatherAlertTimerRef.current);
      }
    };
  }, [showWeatherAlert]);

  // ===== Update navigation title with status message =====
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Lagoon 440 Sailing - [${statusMessage}]`,
    });
  }, [navigation, statusMessage]);

  // ===== Load saved routes on mount =====
  useEffect(() => {
    loadSavedRoutes();
  }, []);

  // ===== Cleanup simulation on unmount =====
  useEffect(() => {
    return () => {
      if (simulationRunning) {
        simulationService.stop();
      }
    };
  }, [simulationRunning]);

  const loadSavedRoutes = async () => {
    try {
      const stored = await AsyncStorage.getItem(`routes_${user?.id || 'guest'}`);
      if (stored) {
        setSavedRoutes(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load saved routes:', err);
    }
  };

  const saveRouteToProfile = async (route: Route) => {
    try {
      const newRoutes = [...savedRoutes, route];
      await AsyncStorage.setItem(`routes_${user?.id || 'guest'}`, JSON.stringify(newRoutes));
      setSavedRoutes(newRoutes);
      setStatusMessage(`Route "${route.name}" saved to profile`);
      Alert.alert('Success', `Route "${route.name}" has been saved to your profile.`);
    } catch (err) {
      Alert.alert('Error', 'Failed to save route to profile.');
    }
  };

  const loadRouteFromProfile = (route: Route) => {
    if (route.waypoints.length >= 2) {
      const start = route.waypoints[0];
      const end = route.waypoints[route.waypoints.length - 1];
      setStartInput(`${start.coordinates.latitude.toFixed(6)}, ${start.coordinates.longitude.toFixed(6)}`);
      setDestInput(`${end.coordinates.latitude.toFixed(6)}, ${end.coordinates.longitude.toFixed(6)}`);
      setStartPoint(start.coordinates);
      setDestination(end.coordinates);
      setPlannedRoute(route);
      setShowSavedRoutesModal(false);
      setStatusMessage(`Route "${route.name}" loaded`);
    }
  };

  const deleteRouteFromProfile = async (routeIndex: number) => {
    const routeName = savedRoutes[routeIndex].name;
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete "${routeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const newRoutes = savedRoutes.filter((_, index) => index !== routeIndex);
              await AsyncStorage.setItem(`routes_${user?.id || 'guest'}`, JSON.stringify(newRoutes));
              setSavedRoutes(newRoutes);
              setStatusMessage(`Route "${routeName}" deleted`);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete route.');
            }
          },
        },
      ]
    );
  };

  // ===== Estimate Tide Based on Time (simplified lunar cycle) =====
  const getTideEstimate = (date: Date): string => {
    const hour = date.getHours();
    const lunarDay = Math.floor((date.getTime() / (1000 * 60 * 60 * 24)) % 29.53);

    // Simplified tidal pattern based on lunar day and hour
    const tidePhase = ((lunarDay * 2 + hour / 6) % 4);

    if (tidePhase < 1) return 'Rising → High';
    if (tidePhase < 2) return 'High → Falling';
    if (tidePhase < 3) return 'Falling → Low';
    return 'Low → Rising';
  };

  // ===== Calculate Route Distance (Haversine) =====
  const calculateRouteDistance = (start: GPSCoordinates, end: GPSCoordinates): number => {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = (end.latitude - start.latitude) * Math.PI / 180;
    const dLon = (end.longitude - start.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ===== Calculate Suggested Start Time for Daylight Arrival =====
  // Returns suggested departure time to arrive at destination within daylight hours (6 AM - 5 PM)
  const calculateSuggestedStartTime = (): { time: string; arrivalTime: string } | null => {
    if (!corridorWeather) return null;

    const distance = calculateRouteDistance(corridorWeather.startPoint, corridorWeather.endPoint);

    // Estimate boat speed based on average wind (simplified)
    const avgWind = corridorWeather.averageWindSpeed;
    let estimatedSpeed = 5; // default 5 knots
    if (avgWind >= 10 && avgWind <= 20) estimatedSpeed = 6.5;
    else if (avgWind > 20 && avgWind <= 30) estimatedSpeed = 7;
    else if (avgWind < 10) estimatedSpeed = 4;
    else estimatedSpeed = 5; // Strong winds, reduced speed

    const voyageHours = distance / estimatedSpeed;

    // Target arrival time: 5 PM (17:00)
    const targetArrivalHour = 17;

    // Calculate departure time to arrive at 5 PM
    const now = new Date();
    const departureDate = new Date(startDate || now.toISOString().split('T')[0]);

    // Set target arrival to 5 PM on departure date
    const arrivalDate = new Date(departureDate);
    arrivalDate.setHours(targetArrivalHour, 0, 0, 0);

    // Subtract voyage time to get departure time
    const departureTime = new Date(arrivalDate.getTime() - voyageHours * 60 * 60 * 1000);

    // Check if departure is before 6 AM (too early - may need to depart previous day or adjust)
    const departureHour = departureTime.getHours();
    if (departureHour < 6 && departureTime.getDate() === departureDate.getDate()) {
      // Voyage too long for single day arrival, suggest earlier departure
      return {
        time: `${departureTime.toLocaleDateString()} ${departureHour}:00 (${voyageHours.toFixed(1)} hrs voyage)`,
        arrivalTime: `${arrivalDate.toLocaleDateString()} ${targetArrivalHour}:00`,
      };
    }

    // Format time as HH:MM
    const formatHour = (h: number) => {
      const isPM = h >= 12;
      const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${displayHour}:00 ${isPM ? 'PM' : 'AM'}`;
    };

    return {
      time: formatHour(departureHour),
      arrivalTime: formatHour(targetArrivalHour),
    };
  };

  const reverseRoute = () => {
    const tempInput = startInput;
    const tempPoint = startPoint;
    setStartInput(destInput);
    setDestInput(tempInput);
    setStartPoint(destination);
    setDestination(tempPoint);

    if (plannedRoute) {
      const reversedWaypoints = [...plannedRoute.waypoints].reverse();
      setPlannedRoute({
        ...plannedRoute,
        name: `${plannedRoute.name} (Reversed)`,
        waypoints: reversedWaypoints,
      });
    }
    setStatusMessage('Route reversed');
  };

  // ===== Stop Simulation =====
  const stopSimulation = () => {
    simulationService.stop();
    setSimulationRunning(false);
    setStormAlerts([]);
    getWeatherMonitoringService().clearAlerts();
    setStatusMessage('Simulation stopped');
  };

  // ===== Handle Storm Reroute Confirmation =====
  const handleRerouteConfirm = (accepted: boolean) => {
    setShowRerouteDialog(false);
    if (accepted && pendingReroute) {
      setPlannedRoute(pendingReroute);
      setStatusMessage('Route updated to avoid storm');
      Alert.alert(
        'Route Updated',
        'New waypoints have been added to navigate around the weather system.',
        [{ text: 'View Route', onPress: () => setShowWaypointsModal(true) }]
      );
    } else {
      setStatusMessage('Continuing on original route');
      Alert.alert(
        'Route Unchanged',
        'Continuing on original route. Please monitor weather conditions carefully.',
        [{ text: 'OK' }]
      );
    }
    setPendingReroute(null);
  };

  // ===== Simulation Mode =====
  // Uses current route if available, otherwise creates default Bermuda to Nassau route
  const loadSimulationRoute = async () => {
    // Stop any existing simulation
    if (simulationRunning) {
      stopSimulation();
      return;
    }

    // Reset completed state when starting new simulation
    setSimulationCompleted(false);

    let simulationRoute: Route;

    // Check if we have a current route to use
    if (plannedRoute && plannedRoute.waypoints.length >= 2) {
      // Use existing planned route
      simulationRoute = {
        ...plannedRoute,
        id: `sim-${Date.now()}`,
        name: `${plannedRoute.name} (Simulation)`,
      };
    } else if (startPoint.latitude !== 0 && destination.latitude !== 0) {
      // Use current start/destination inputs
      const totalDist = calculateRouteDistance(startPoint, destination);
      simulationRoute = {
        id: `sim-${Date.now()}`,
        name: 'Custom Route Simulation',
        waypoints: [
          {
            id: 'wp-1',
            name: 'Start',
            latitude: startPoint.latitude,
            longitude: startPoint.longitude,
            coordinates: startPoint,
            order: 1,
            arrived: false,
            sailConfiguration: 'Genoa + Full Main',
            useEngine: false,
            estimatedArrival: new Date(Date.now()),
          },
          {
            id: 'wp-2',
            name: 'Destination',
            latitude: destination.latitude,
            longitude: destination.longitude,
            coordinates: destination,
            order: 2,
            arrived: false,
            sailConfiguration: 'Genoa + Full Main',
            useEngine: false,
            estimatedArrival: new Date(Date.now() + 48 * 60 * 60 * 1000),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Default: Bermuda to Nassau, Bahamas (~500 NM)
      const bermuda = { latitude: 32.2949, longitude: -64.7814 };
      const nassau = { latitude: 25.0343, longitude: -77.3963 };

      setStartInput(`${bermuda.latitude.toFixed(6)}, ${bermuda.longitude.toFixed(6)}`);
      setStartPoint(bermuda);
      setDestInput(`${nassau.latitude.toFixed(6)}, ${nassau.longitude.toFixed(6)}`);
      setDestination(nassau);

      simulationRoute = {
        id: `sim-${Date.now()}`,
        name: 'Bermuda to Nassau Simulation',
        waypoints: [
          {
            id: 'wp-1',
            name: 'Bermuda (Start)',
            latitude: bermuda.latitude,
            longitude: bermuda.longitude,
            coordinates: bermuda,
            order: 1,
            arrived: false,
            sailConfiguration: 'Genoa + Full Main',
            useEngine: false,
            estimatedArrival: new Date(Date.now()),
          },
          {
            id: 'wp-2',
            name: 'Waypoint 1',
            latitude: 30.5,
            longitude: -68.0,
            coordinates: { latitude: 30.5, longitude: -68.0 },
            order: 2,
            arrived: false,
            sailConfiguration: 'Genoa + Full Main',
            useEngine: false,
            estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          {
            id: 'wp-3',
            name: 'Waypoint 2',
            latitude: 28.5,
            longitude: -71.0,
            coordinates: { latitude: 28.5, longitude: -71.0 },
            order: 3,
            arrived: false,
            sailConfiguration: 'Genoa + 1st Reef',
            useEngine: false,
            estimatedArrival: new Date(Date.now() + 48 * 60 * 60 * 1000),
          },
          {
            id: 'wp-4',
            name: 'Waypoint 3',
            latitude: 26.5,
            longitude: -74.0,
            coordinates: { latitude: 26.5, longitude: -74.0 },
            order: 4,
            arrived: false,
            sailConfiguration: 'Genoa + Full Main',
            useEngine: false,
            estimatedArrival: new Date(Date.now() + 72 * 60 * 60 * 1000),
          },
          {
            id: 'wp-5',
            name: 'Nassau (End)',
            latitude: nassau.latitude,
            longitude: nassau.longitude,
            coordinates: nassau,
            order: 5,
            arrived: false,
            sailConfiguration: 'Genoa + Full Main',
            useEngine: false,
            estimatedArrival: new Date(Date.now() + 96 * 60 * 60 * 1000),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Set realistic wind conditions
    setWindSpeed('15');
    setTrueWindAngle('120');
    setSailingMode(SailingMode.MIXED);

    setPlannedRoute(simulationRoute);

    // Start simulation with callbacks
    simulationService.start(simulationRoute, {
      onWeatherUpdate: (weather: SimulatedWeather) => {
        setSimulatedWeather(weather);
        setSimulationHour(weather.hour);
        setWindSpeed(weather.windSpeed.toString());

        // Update status with simulation time
        const day = Math.floor(weather.hour / 24) + 1;
        const hourOfDay = weather.hour % 24;
        setStatusMessage(`Simulation: Day ${day}, ${hourOfDay}:00 - Wind ${weather.windSpeed} kts, Waves ${weather.waveHeight}m`);

        // Check if simulation is complete (boat reached last waypoint)
        if (weather.currentWaypointIndex !== undefined &&
            weather.currentWaypointIndex >= simulationRoute.waypoints.length - 1) {
          // Simulation complete - stop and wait for user to restart
          simulationService.stop();
          setSimulationRunning(false);
          setSimulationCompleted(true);
          setStatusMessage('Simulation complete - Arrived at destination');
        }
      },
      onStormAlert: (alert: StormAlert) => {
        setStormAlerts(prev => [...prev, alert]);

        // Add to weather monitoring service for notifications
        const monitoringService = getWeatherMonitoringService();
        monitoringService.addSimulatedAlert(alert);

        // Show weather alert popup with GPS location and 30-second auto-close
        setCurrentWeatherAlert(alert);
        setShowWeatherAlert(true);
      },
      onRouteDeviation: (newRoute: Route) => {
        // Store pending reroute and show Y/N dialog
        setPendingReroute(newRoute);
        setShowRerouteDialog(true);
      },
    });

    setSimulationRunning(true);
    setStatusMessage('Simulation started: Bermuda → Nassau');

    Alert.alert(
      'Simulation Started',
      'Atlantic Route: Bermuda → Nassau, Bahamas\n\n' +
      '• Distance: ~500 NM\n' +
      '• Time scale: 5 seconds = 12 hours\n' +
      '• Weather changes will be simulated\n' +
      '• Storm alerts will trigger route deviations\n\n' +
      'Watch the status bar for weather updates and alerts.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  // ===== Start Real GPS Tracking =====
  const startRealTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for real GPS tracking.');
        return;
      }

      setTrackingRunning(true);
      setStatusMessage('Real GPS Tracking started');

      // Start watching position
      trackingSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          const newPosition: GPSCoordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setTrackingPosition(newPosition);
          setCurrentPosition(newPosition);
          setStatusMessage(
            `Tracking: ${newPosition.latitude.toFixed(4)}°N, ${Math.abs(newPosition.longitude).toFixed(4)}°W`
          );
        }
      );

      Alert.alert(
        'Real GPS Tracking Started',
        'Your position will be tracked and displayed on the route map.\n\n' +
        '• Updates every 5 seconds\n' +
        '• Requires GPS/Location enabled\n' +
        '• Battery usage may increase',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert('Tracking Error', error.message || 'Could not start GPS tracking');
      setTrackingRunning(false);
    }
  };

  // ===== Stop Real GPS Tracking =====
  const stopRealTracking = () => {
    if (trackingSubscriptionRef.current) {
      trackingSubscriptionRef.current.remove();
      trackingSubscriptionRef.current = null;
    }
    setTrackingRunning(false);
    setTrackingPosition(null);
    setStatusMessage('GPS Tracking stopped');
  };

  // ===== Show Coordinate Format Help =====
  const showCoordinateFormatHelp = () => {
    const examples = getCoordinateFormatExamples();
    Alert.alert(
      'Supported Coordinate Formats',
      examples.join('\n'),
      [{ text: 'OK', style: 'default' }]
    );
  };

  // ===== Open Google Maps =====
  const openGoogleMaps = async (type: 'start' | 'destination') => {
    const input = type === 'start' ? startInput : destInput;

    if (!input.trim()) {
      Alert.alert('No Location', `Please enter a ${type} location first.`);
      return;
    }

    // Parse the input to get coordinates
    const coords = await parseLocationInput(input);
    if (!coords) {
      Alert.alert('Invalid Location', `Could not parse "${input}" as coordinates or location name.`);
      return;
    }

    // Update state with parsed coordinates
    if (type === 'start') {
      setStartPoint(coords);
    } else {
      setDestination(coords);
    }

    const url = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    Linking.openURL(url);
  };

  // ===== Location Permission and GPS =====
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationEnabled(true);
        getCurrentLocation();
      }
    } catch (err) {
      setError('Failed to get location permission');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentPosition(coords);

      // Auto-fill start point with current location
      if (!startInput) {
        setStartPoint(coords);
        setStartInput(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      }
    } catch (err) {
      console.error('Failed to get current location:', err);
    }
  };

  // ===== Calculate Sail Recommendation =====
  useEffect(() => {
    if (windSpeed && trueWindAngle) {
      const ws = parseFloat(windSpeed);
      const twa = parseFloat(trueWindAngle);

      if (!isNaN(ws) && !isNaN(twa)) {
        const recommendation = recommendSailConfiguration(ws, twa, sailingMode);
        setSailRecommendation(recommendation);
      }
    }
  }, [windSpeed, trueWindAngle, sailingMode]);

  // ===== Fetch Weather for Route Corridor =====
  const handleFetchWeather = async () => {
    // Check for Windy API key first (stored as 'windy_api_key' by SettingsScreen)
    const windyApiKey = await AsyncStorage.getItem('windy_api_key');
    if (!windyApiKey || windyApiKey === 'YOUR_WINDY_API_KEY') {
      Alert.alert(
        'Windy API Key Required',
        'Please configure your Windy.com API key in Settings to fetch weather data.\n\nGo to Settings > Windy API Key to add your key.',
        [
          { text: 'OK', style: 'default' },
        ]
      );
      setStatusMessage('Windy API key not configured');
      return;
    }

    setStatusMessage('Parsing locations...');

    // Parse start location
    const startCoords = await parseLocationInput(startInput);
    if (!startCoords) {
      Alert.alert('Invalid Start Location', 'Please enter valid coordinates (lat, lon) or a location name.');
      setStatusMessage('Invalid start location');
      return;
    }
    setStartPoint(startCoords);

    // Parse destination
    const destCoords = await parseLocationInput(destInput);
    if (!destCoords) {
      Alert.alert('Invalid Destination', 'Please enter valid coordinates (lat, lon) or a location name.');
      setStatusMessage('Invalid destination');
      return;
    }
    setDestination(destCoords);

    setLoadingWeather(true);
    setError(null);
    setStatusMessage('Fetching weather data...');

    try {
      const weather = await fetchRouteCorridorWeather(startCoords, destCoords, 50);
      setCorridorWeather(weather);

      // Estimate bytes fetched (rough calculation based on data points)
      const bytesEstimate = JSON.stringify(weather).length;
      setWeatherBytesFetched(bytesEstimate);

      setStatusMessage(`Weather fetched: ${bytesEstimate.toLocaleString()} bytes`);
      Alert.alert(
        'Weather Data Fetched',
        `Route: ${weather.weatherPoints.length} points\n` +
        `Data size: ${bytesEstimate.toLocaleString()} bytes\n\n` +
        `Avg Wind: ${weather.averageWindSpeed.toFixed(1)} kts\n` +
        `Max Wind: ${weather.maxWindSpeed.toFixed(1)} kts\n` +
        `Avg Waves: ${weather.averageWaveHeight.toFixed(1)} m\n` +
        `Max Waves: ${weather.maxWaveHeight.toFixed(1)} m`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
      setStatusMessage('Weather fetch failed');
    } finally {
      setLoadingWeather(false);
    }
  };

  // ===== Auto Plan Route =====
  const handlePlanRoute = async () => {
    setStatusMessage('Planning route...');

    // Get wind threshold from Polar tab storage (default 3 knots)
    let threshold = 3;
    try {
      const storedThreshold = await AsyncStorage.getItem('engineWindThreshold');
      if (storedThreshold) {
        threshold = parseFloat(storedThreshold);
      }
    } catch (err) {
      console.log('Using default wind threshold');
    }

    // Ensure start and destination are parsed
    if (startPoint.latitude === 0 && startPoint.longitude === 0) {
      const startCoords = await parseLocationInput(startInput);
      if (!startCoords) {
        Alert.alert('Invalid Start', 'Please enter valid start coordinates or location name.');
        return;
      }
      setStartPoint(startCoords);
    }

    if (destination.latitude === 0 && destination.longitude === 0) {
      const destCoords = await parseLocationInput(destInput);
      if (!destCoords) {
        Alert.alert('Invalid Destination', 'Please enter valid destination coordinates or location name.');
        return;
      }
      setDestination(destCoords);
    }

    setLoadingRoute(true);
    setError(null);

    try {
      const config: RoutePlanningConfig = {
        startPoint,
        destination,
        sailingMode,
        windThreshold: threshold,
        avoidStorms: true,
        ensureDaytimeArrival: true,
        maxDailyDistance: 150,
        preferredWaypointInterval: 50,
      };

      const route = await planRoute(config);
      // Add start date to the route
      route.startDate = new Date(startDate);
      setPlannedRoute(route);
      setShowWaypointsModal(true);
      setStatusMessage(`Route planned: ${route.waypoints.length} waypoints`);

    } catch (err: any) {
      setError(err.message || 'Failed to plan route');
      setStatusMessage('Route planning failed');
      Alert.alert('Route Planning Failed', err.message || 'An error occurred');
    } finally {
      setLoadingRoute(false);
    }
  };

  // ===== Export Route to Route Tab =====
  const exportToRouteTab = () => {
    if (plannedRoute) {
      // Store the route for the Route tab to pick up
      AsyncStorage.setItem('activeRoute', JSON.stringify(plannedRoute));
      setShowWaypointsModal(false);
      setStatusMessage(`Route exported to Route tab`);
      Alert.alert('Route Exported', 'The planned route has been exported to the Route tab. Switch to the Route tab to view and manage it.');
    }
  };

  // ===== Use Current Location =====
  const useCurrentLocationForStart = () => {
    if (currentPosition.latitude !== 0) {
      setStartInput(`${currentPosition.latitude.toFixed(6)}, ${currentPosition.longitude.toFixed(6)}`);
      setStartPoint(currentPosition);
      setStatusMessage('GPS location set as start');
    } else {
      Alert.alert('No GPS Data', 'Please enable location services');
    }
  };

  // ===== Get sail config display string =====
  const getSailConfigString = (waypoint: Waypoint): string => {
    if (!waypoint.sailConfiguration) return 'N/A';
    const config = waypoint.sailConfiguration;
    // Format: Sail type + trim angle to AWA
    const trimAngle = waypoint.weatherForecast ? Math.abs(waypoint.weatherForecast.direction - 45) : 0;
    return `${config} @ ${trimAngle.toFixed(0)}° AWA`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* ===== SECTION 1: ROUTE PLANNING ===== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Route Planning</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={loadSimulationRoute}
              style={[styles.simulationButton, simulationRunning && styles.simulationButtonRunning]}
            >
              <Text style={styles.simulationButtonText}>
                {simulationRunning ? 'Stop Sim' : 'Simulation'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSavedRoutesModal(true)} style={styles.loadButton}>
              <Text style={styles.loadButtonText}>Load</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Point */}
        <View style={styles.subsection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Starting Point</Text>
            <View style={styles.labelButtons}>
              <TouchableOpacity onPress={showCoordinateFormatHelp} style={styles.helpButton}>
                <Text style={styles.helpButtonText}>?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={useCurrentLocationForStart} style={styles.gpsButton}>
                <Text style={styles.gpsButtonText}>GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openGoogleMaps('start')} style={styles.mapButton}>
                <Text style={styles.mapButtonText}>Map</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. 25.7617, -80.1918 or 25°45.7'N, 80°11.5'W"
            value={startInput}
            onChangeText={setStartInput}
          />
          {startPoint.latitude !== 0 && (
            <Text style={styles.coordDisplay}>
              Parsed: {startPoint.latitude.toFixed(4)}°, {startPoint.longitude.toFixed(4)}°
            </Text>
          )}
        </View>

        {/* Destination */}
        <View style={styles.subsection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Destination Point</Text>
            <TouchableOpacity onPress={() => openGoogleMaps('destination')} style={styles.mapButton}>
              <Text style={styles.mapButtonText}>Map</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. 32.2949, -64.7814 or 32°17.7'N, 64°46.9'W"
            value={destInput}
            onChangeText={setDestInput}
          />
          {destination.latitude !== 0 && (
            <Text style={styles.coordDisplay}>
              Parsed: {destination.latitude.toFixed(4)}°, {destination.longitude.toFixed(4)}°
            </Text>
          )}
        </View>

        {/* Start Date */}
        <View style={styles.subsection}>
          <Text style={styles.label}>Start Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
          />
          <Text style={styles.helpText}>
            Planned departure date for route planning and weather forecasts
          </Text>
        </View>

        {/* Reverse Route Button */}
        <TouchableOpacity onPress={reverseRoute} style={styles.reverseButton}>
          <Text style={styles.reverseButtonText}>⇅ Reverse Route</Text>
        </TouchableOpacity>

        {/* Save to Profile Button - shown when there's a planned route */}
        {plannedRoute && (
          <TouchableOpacity
            onPress={() => saveRouteToProfile(plannedRoute)}
            style={styles.saveToProfileButton}
          >
            <Text style={styles.saveToProfileButtonText}>Save Route to Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ===== SIMULATION STATUS SECTION ===== */}
      {simulationRunning && simulatedWeather && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simulation Status</Text>
          <View style={styles.simulationStatus}>
            <View style={styles.simStatRow}>
              <Text style={styles.simStatLabel}>Day:</Text>
              <Text style={styles.simStatValue}>{Math.floor(simulatedWeather.hour / 24) + 1}</Text>
            </View>
            <View style={styles.simStatRow}>
              <Text style={styles.simStatLabel}>Hour:</Text>
              <Text style={styles.simStatValue}>{simulatedWeather.hour % 24}:00</Text>
            </View>
            <View style={styles.simStatRow}>
              <Text style={styles.simStatLabel}>Wind:</Text>
              <Text style={styles.simStatValue}>{simulatedWeather.windSpeed} kts @ {simulatedWeather.windDirection}°</Text>
            </View>
            <View style={styles.simStatRow}>
              <Text style={styles.simStatLabel}>Waves:</Text>
              <Text style={styles.simStatValue}>{simulatedWeather.waveHeight}m</Text>
            </View>
            <View style={styles.simStatRow}>
              <Text style={styles.simStatLabel}>Conditions:</Text>
              <Text style={[styles.simStatValue, { color: simulatedWeather.conditions === 'storm' ? '#F44336' : simulatedWeather.conditions === 'rough' ? '#FF9800' : '#4CAF50' }]}>
                {simulatedWeather.conditions.charAt(0).toUpperCase() + simulatedWeather.conditions.slice(1)}
              </Text>
            </View>
          </View>

          {/* Storm Alerts */}
          {stormAlerts.length > 0 && (
            <View style={styles.alertsContainer}>
              <Text style={styles.alertsTitle}>Active Alerts ({stormAlerts.length})</Text>
              {stormAlerts.slice(-3).map((alert, index) => (
                <View key={alert.id} style={[styles.alertItem, { backgroundColor: alert.severity === 'warning' ? '#FFEBEE' : alert.severity === 'watch' ? '#FFF3E0' : '#E3F2FD' }]}>
                  <Text style={styles.alertType}>{alert.type.toUpperCase()}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ===== SECTION 2: SAILING MODE ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⛵ Sailing Mode</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[styles.radioButton, sailingMode === SailingMode.COMFORT && styles.radioButtonSelected]}
            onPress={() => setSailingMode(SailingMode.COMFORT)}
          >
            <View style={styles.radioCircle}>
              {sailingMode === SailingMode.COMFORT && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Comfort</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioButton, sailingMode === SailingMode.SPEED && styles.radioButtonSelected]}
            onPress={() => setSailingMode(SailingMode.SPEED)}
          >
            <View style={styles.radioCircle}>
              {sailingMode === SailingMode.SPEED && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Speed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioButton, sailingMode === SailingMode.MIXED && styles.radioButtonSelected]}
            onPress={() => setSailingMode(SailingMode.MIXED)}
          >
            <View style={styles.radioCircle}>
              {sailingMode === SailingMode.MIXED && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.radioLabel}>Mixed</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helpText}>
          {sailingMode === SailingMode.COMFORT && 'Prioritizes safety and ease of sailing'}
          {sailingMode === SailingMode.SPEED && 'Optimizes for maximum speed'}
          {sailingMode === SailingMode.MIXED && 'Balances speed and comfort'}
        </Text>
      </View>


      {/* ===== SECTION 4: ACTION BUTTONS ===== */}
      <View style={styles.section}>
        <View style={styles.actionButtonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.weatherButton, loadingWeather && styles.buttonDisabled]}
            onPress={handleFetchWeather}
            disabled={loadingWeather}
          >
            {loadingWeather ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🌤️</Text>
                <Text style={styles.actionButtonText}>Fetch Weather</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.planButton,
              (loadingRoute || !corridorWeather) && styles.buttonDisabled,
            ]}
            onPress={handlePlanRoute}
            disabled={loadingRoute || !corridorWeather}
          >
            {loadingRoute ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🗺️</Text>
                <Text style={styles.actionButtonText}>
                  {corridorWeather ? 'Auto Plan Route' : 'Fetch Weather First'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== SECTION 5: WEATHER CORRIDOR DISPLAY ===== */}
      {corridorWeather && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌊 Route Weather Summary</Text>

          {/* Area Coverage Info */}
          <View style={styles.weatherAreaInfo}>
            <Text style={styles.weatherAreaText}>
              Coverage Area: {calculateRouteDistance(corridorWeather.startPoint, corridorWeather.endPoint).toFixed(0)} NM route
            </Text>
            <Text style={styles.weatherAreaText}>
              Fetched: {new Date().toLocaleTimeString()}
            </Text>
          </View>

          {/* Weather Statistics */}
          <View style={styles.weatherStats}>
            <View style={styles.weatherStat}>
              <Text style={styles.weatherStatLabel}>Avg Wind</Text>
              <Text style={styles.weatherStatValue}>{corridorWeather.averageWindSpeed.toFixed(1)} kts</Text>
            </View>
            <View style={styles.weatherStat}>
              <Text style={styles.weatherStatLabel}>Max Wind</Text>
              <Text style={styles.weatherStatValue}>{corridorWeather.maxWindSpeed.toFixed(1)} kts</Text>
            </View>
            <View style={styles.weatherStat}>
              <Text style={styles.weatherStatLabel}>Avg Waves</Text>
              <Text style={styles.weatherStatValue}>{corridorWeather.averageWaveHeight.toFixed(1)} m</Text>
            </View>
            <View style={styles.weatherStat}>
              <Text style={styles.weatherStatLabel}>Max Waves</Text>
              <Text style={styles.weatherStatValue}>{corridorWeather.maxWaveHeight.toFixed(1)} m</Text>
            </View>
          </View>

          {/* Suggested Start Time */}
          {calculateSuggestedStartTime() && (
            <View style={styles.suggestedStartBox}>
              <Text style={styles.suggestedStartTitle}>Suggested Departure Time</Text>
              <View style={styles.suggestedStartContent}>
                <View style={styles.suggestedStartItem}>
                  <Text style={styles.suggestedStartIcon}>🚀</Text>
                  <Text style={styles.suggestedStartLabel}>Depart:</Text>
                  <Text style={styles.suggestedStartValue}>{calculateSuggestedStartTime()?.time}</Text>
                </View>
                <View style={styles.suggestedStartItem}>
                  <Text style={styles.suggestedStartIcon}>🏁</Text>
                  <Text style={styles.suggestedStartLabel}>Arrive:</Text>
                  <Text style={styles.suggestedStartValue}>{calculateSuggestedStartTime()?.arrivalTime}</Text>
                </View>
              </View>
              <Text style={styles.suggestedStartHint}>
                Based on route distance and wind conditions for daylight arrival
              </Text>
            </View>
          )}

          {/* Weather History / Map Display */}
          <View style={styles.weatherMapContainer}>
            <Text style={styles.weatherMapTitle}>Weather Along Route</Text>
            <View style={styles.weatherMapGrid}>
              {corridorWeather.weatherPoints.map((point, index) => {
                const windColor = point.forecast.windSpeed >= 25 ? '#F44336' :
                                  point.forecast.windSpeed >= 15 ? '#FF9800' :
                                  point.forecast.windSpeed >= 8 ? '#4CAF50' : '#2196F3';
                return (
                  <View key={index} style={styles.weatherMapPoint}>
                    <View style={[styles.weatherMapDot, { backgroundColor: windColor }]} />
                    <Text style={styles.weatherMapLabel}>{point.forecast.windSpeed.toFixed(0)}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.weatherMapLegend}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.legendLabel}>Light (&lt;8)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendLabel}>Moderate (8-15)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendLabel}>Strong (15-25)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendLabel}>Heavy (&gt;25)</Text>
              </View>
            </View>
          </View>

          <Text style={styles.helpText}>
            {corridorWeather.weatherPoints.length} weather points sampled along route corridor
          </Text>
        </View>
      )}

      {/* ===== SECTION 6: CURRENT WIND & SAIL RECOMMENDATION ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💨 Current Sailing Conditions</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wind Speed (kts)</Text>
            <TextInput
              style={styles.input}
              value={windSpeed}
              onChangeText={(text) => setWindSpeed(sanitizeNumericInput(text))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>True Wind Angle (°)</Text>
            <TextInput
              style={styles.input}
              value={trueWindAngle}
              onChangeText={(text) => setTrueWindAngle(sanitizeNumericInput(text))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {sailRecommendation && (
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>Recommended Sail Configuration:</Text>
            <SailConfigDisplay
              configuration={sailRecommendation.configuration}
              expectedSpeed={sailRecommendation.expectedSpeed}
              description={sailRecommendation.description}
            />
          </View>
        )}

        {/* Sailing Rose - B&G Style Wind Display */}
        <SailingRose
          trueWindAngle={
            simulationRunning && simulatedWeather?.windDirection !== undefined
              ? Math.abs((simulatedWeather.windDirection - 90) % 180) // Calculate TWA from wind direction
              : parseFloat(trueWindAngle) || 90
          }
          windSpeed={
            simulationRunning && simulatedWeather?.windSpeed !== undefined
              ? simulatedWeather.windSpeed
              : parseFloat(windSpeed) || 10
          }
          sailRecommendation={sailRecommendation}
          windDirection={simulatedWeather?.windDirection}
          waveHeight={simulatedWeather?.waveHeight}
          conditions={simulatedWeather?.conditions}
          isSimulation={simulationRunning}
        />
      </View>

      {/* ===== SECTION 7: ROUTE MAP VIEW ===== */}
      {plannedRoute && plannedRoute.waypoints.length >= 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Map</Text>
          <RouteMapView
            waypoints={plannedRoute.waypoints}
            routeName={plannedRoute.name}
            currentWaypointIndex={simulatedWeather?.currentWaypointIndex || 0}
            simulatedPosition={trackingRunning ? trackingPosition || undefined : simulatedWeather?.boatPosition}
            stormLocations={[
              // Add storm location if present
              ...(simulatedWeather?.hasStorm && simulatedWeather?.stormLocation
                ? [{ lat: simulatedWeather.stormLocation.latitude, lon: simulatedWeather.stormLocation.longitude, type: 'storm' as const }]
                : []),
              // Add squall locations
              ...(simulatedWeather?.squalls?.map(sq => ({
                lat: sq.location.latitude,
                lon: sq.location.longitude,
                type: 'squall' as const,
              })) || []),
            ]}
            trackingRunning={trackingRunning}
            simulationRunning={simulationRunning}
            simulationCompleted={simulationCompleted}
            simulationHour={simulationHour}
            windDirection={simulatedWeather?.windDirection || 0}
            windSpeed={simulatedWeather?.windSpeed || 0}
            onStartTracking={startRealTracking}
            onStopTracking={stopRealTracking}
            onStartSimulation={loadSimulationRoute}
            onStopSimulation={stopSimulation}
          />
        </View>
      )}

      {/* ===== ERROR PANEL ===== */}
      {error && <ErrorPanel error={error} onDismiss={() => setError(null)} />}

      {/* ===== STORM REROUTE CONFIRMATION MODAL ===== */}
      <Modal
        visible={showRerouteDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => handleRerouteConfirm(false)}
      >
        <View style={styles.rerouteModalOverlay}>
          <View style={styles.rerouteModalContent}>
            <Text style={styles.rerouteModalIcon}>⚠️</Text>
            <Text style={styles.rerouteModalTitle}>Storm Detected!</Text>
            <Text style={styles.rerouteModalMessage}>
              A storm system has been detected on your planned route.{'\n\n'}
              Would you like to add a new waypoint to navigate around the storm and continue on a safer route?
            </Text>
            <View style={styles.rerouteModalButtons}>
              <TouchableOpacity
                style={[styles.rerouteModalButton, styles.rerouteModalButtonNo]}
                onPress={() => handleRerouteConfirm(false)}
              >
                <Text style={styles.rerouteModalButtonText}>No, Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rerouteModalButton, styles.rerouteModalButtonYes]}
                onPress={() => handleRerouteConfirm(true)}
              >
                <Text style={styles.rerouteModalButtonText}>Yes, Reroute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== WEATHER ALERT POPUP MODAL ===== */}
      <Modal
        visible={showWeatherAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowWeatherAlert(false);
          setCurrentWeatherAlert(null);
        }}
      >
        <View style={styles.weatherAlertOverlay}>
          <View style={styles.weatherAlertContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.weatherAlertCloseButton}
              onPress={() => {
                setShowWeatherAlert(false);
                setCurrentWeatherAlert(null);
              }}
            >
              <Text style={styles.weatherAlertCloseText}>✕</Text>
            </TouchableOpacity>

            {/* Alert Icon based on severity */}
            <Text style={styles.weatherAlertIcon}>
              {currentWeatherAlert?.severity === 'warning' ? '🌪️' :
               currentWeatherAlert?.severity === 'watch' ? '⚠️' : 'ℹ️'}
            </Text>

            {/* Alert Title */}
            <Text style={styles.weatherAlertTitle}>
              Weather Alert: {currentWeatherAlert?.severity?.toUpperCase()}
            </Text>

            {/* Alert Type */}
            <Text style={styles.weatherAlertType}>
              {currentWeatherAlert?.type?.toUpperCase()}
            </Text>

            {/* Alert Message */}
            <Text style={styles.weatherAlertMessage}>
              {currentWeatherAlert?.message}
            </Text>

            {/* GPS Location */}
            <View style={styles.weatherAlertLocation}>
              <Text style={styles.weatherAlertLocationIcon}>📍</Text>
              <Text style={styles.weatherAlertLocationText}>
                GPS Location: {currentWeatherAlert?.location?.latitude?.toFixed(4)}°N, {Math.abs(currentWeatherAlert?.location?.longitude || 0).toFixed(4)}°W
              </Text>
            </View>

            {/* Current Position (if available) */}
            {currentPosition.latitude !== 0 && (
              <View style={styles.weatherAlertLocation}>
                <Text style={styles.weatherAlertLocationIcon}>🚤</Text>
                <Text style={styles.weatherAlertLocationText}>
                  Your Position: {currentPosition.latitude.toFixed(4)}°N, {Math.abs(currentPosition.longitude).toFixed(4)}°W
                </Text>
              </View>
            )}

            {/* Auto-close notice */}
            <Text style={styles.weatherAlertAutoClose}>
              This alert will auto-close in 30 seconds
            </Text>

            {/* Acknowledge Button */}
            <TouchableOpacity
              style={styles.weatherAlertAckButton}
              onPress={() => {
                setShowWeatherAlert(false);
                setCurrentWeatherAlert(null);
              }}
            >
              <Text style={styles.weatherAlertAckButtonText}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />

      {/* ===== WAYPOINTS MODAL ===== */}
      <Modal
        visible={showWaypointsModal}
        animationType="slide"
        onRequestClose={() => setShowWaypointsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Planned Route Waypoints</Text>
            <TouchableOpacity onPress={() => setShowWaypointsModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {plannedRoute && (
            <>
              <Text style={styles.routeInfo}>
                {plannedRoute.name} - {plannedRoute.waypoints.length} waypoints
              </Text>

              <FlatList
                data={plannedRoute.waypoints}
                keyExtractor={(item, index) => `wp-${index}`}
                renderItem={({ item, index }) => (
                  <View style={styles.waypointItem}>
                    <View style={styles.waypointHeader}>
                      <Text style={styles.waypointName}>{item.name}</Text>
                      {item.useEngine && <Text style={styles.engineBadge}>ENGINE</Text>}
                    </View>
                    <Text style={styles.waypointCoords}>
                      {item.coordinates.latitude.toFixed(4)}°, {item.coordinates.longitude.toFixed(4)}°
                    </Text>

                    {/* Wind and Weather Info */}
                    {item.weatherForecast && (
                      <View style={styles.waypointWeather}>
                        <View style={styles.waypointWeatherRow}>
                          <Text style={styles.waypointWeatherIcon}>💨</Text>
                          <Text style={styles.waypointWeatherText}>
                            Wind: {item.weatherForecast.windSpeed.toFixed(0)} kts @ {item.weatherForecast.windDirection}°
                          </Text>
                        </View>
                        <View style={styles.waypointWeatherRow}>
                          <Text style={styles.waypointWeatherIcon}>🌊</Text>
                          <Text style={styles.waypointWeatherText}>
                            Waves: {item.weatherForecast.waveHeight.toFixed(1)} m
                          </Text>
                        </View>
                        <View style={styles.waypointWeatherRow}>
                          <Text style={styles.waypointWeatherIcon}>🌡️</Text>
                          <Text style={styles.waypointWeatherText}>
                            Gusts: {item.weatherForecast.gustSpeed.toFixed(0)} kts
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Tide Info (estimated based on time) */}
                    {item.estimatedArrival && (
                      <View style={styles.waypointTide}>
                        <Text style={styles.waypointWeatherIcon}>🌙</Text>
                        <Text style={styles.waypointTideText}>
                          Tide: {getTideEstimate(new Date(item.estimatedArrival))}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.waypointSail}>
                      Sail: {getSailConfigString(item)}
                    </Text>
                    {item.estimatedArrival && (
                      <Text style={styles.waypointEta}>
                        ETA: {new Date(item.estimatedArrival).toLocaleString()}
                      </Text>
                    )}
                  </View>
                )}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.button, styles.exportButton]}
                  onPress={exportToRouteTab}
                >
                  <Text style={styles.buttonText}>Export to Route Tab</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={() => {
                    if (plannedRoute) saveRouteToProfile(plannedRoute);
                  }}
                >
                  <Text style={styles.buttonText}>Save to Profile</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ===== SAVED ROUTES MODAL ===== */}
      <Modal
        visible={showSavedRoutesModal}
        animationType="slide"
        onRequestClose={() => setShowSavedRoutesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Routes</Text>
            <TouchableOpacity onPress={() => setShowSavedRoutesModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {savedRoutes.length === 0 ? (
            <Text style={styles.noRoutesText}>No saved routes yet. Save a route using the "Save Route to Profile" button.</Text>
          ) : (
            <FlatList
              data={savedRoutes}
              keyExtractor={(item, index) => `route-${index}`}
              renderItem={({ item, index }) => (
                <View style={styles.savedRouteItem}>
                  <TouchableOpacity
                    style={styles.savedRouteContent}
                    onPress={() => loadRouteFromProfile(item)}
                  >
                    <Text style={styles.savedRouteName}>{item.name}</Text>
                    <Text style={styles.savedRouteInfo}>
                      {item.waypoints.length} waypoints
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteRouteButton}
                    onPress={() => deleteRouteFromProfile(index)}
                  >
                    <Text style={styles.deleteRouteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  simulationButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  simulationButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  simulationButtonRunning: {
    backgroundColor: '#F44336',
  },
  simulationStatus: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  simStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  simStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  simStatValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  alertsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  alertItem: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  alertType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 11,
    color: '#333',
  },
  loadButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  loadButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  labelButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  mapButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  coordDisplay: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  reverseButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  reverseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveToProfileButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  saveToProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subsection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpButton: {
    backgroundColor: '#9E9E9E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gpsButton: {
    backgroundColor: '#00ACC1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 6,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coordRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  coordInput: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  thresholdInput: {
    width: 80,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  radioButtonSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#E3F2FD',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0066CC',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066CC',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  weatherButton: {
    backgroundColor: '#00ACC1',
  },
  planButton: {
    backgroundColor: '#FF6F00',
  },
  buttonDisabled: {
    backgroundColor: '#AAA',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  weatherAreaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weatherAreaText: {
    fontSize: 12,
    color: '#666',
  },
  weatherMapContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  weatherMapTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  weatherMapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  weatherMapPoint: {
    alignItems: 'center',
    width: 40,
  },
  weatherMapDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  weatherMapLabel: {
    fontSize: 10,
    color: '#666',
  },
  weatherMapLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: '#666',
  },
  weatherStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  weatherStat: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  weatherStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weatherStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  suggestedStartBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  suggestedStartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 10,
    textAlign: 'center',
  },
  suggestedStartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  suggestedStartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestedStartIcon: {
    fontSize: 16,
  },
  suggestedStartLabel: {
    fontSize: 13,
    color: '#666',
  },
  suggestedStartValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E65100',
  },
  suggestedStartHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recommendationBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0066CC',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  routeInfo: {
    padding: 16,
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F5F5F5',
  },
  waypointItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  waypointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  waypointName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  engineBadge: {
    backgroundColor: '#FF5722',
    color: '#FFFFFF',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  waypointCoords: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  waypointSail: {
    fontSize: 12,
    color: '#0066CC',
    marginBottom: 2,
  },
  waypointEta: {
    fontSize: 11,
    color: '#999',
  },
  waypointWeather: {
    backgroundColor: '#F0F7FF',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  waypointWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  waypointWeatherIcon: {
    fontSize: 14,
    marginRight: 6,
    width: 20,
  },
  waypointWeatherText: {
    fontSize: 12,
    color: '#333',
  },
  waypointTide: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  waypointTideText: {
    fontSize: 12,
    color: '#00796B',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  noRoutesText: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  savedRouteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  savedRouteContent: {
    flex: 1,
  },
  savedRouteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  savedRouteInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteRouteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 12,
  },
  deleteRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Map styles
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  mapHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  // Reroute Modal styles
  rerouteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rerouteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rerouteModalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  rerouteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  rerouteModalMessage: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  rerouteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rerouteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  rerouteModalButtonNo: {
    backgroundColor: '#9E9E9E',
  },
  rerouteModalButtonYes: {
    backgroundColor: '#4CAF50',
  },
  rerouteModalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Weather Alert Popup styles
  weatherAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  weatherAlertContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  weatherAlertCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  weatherAlertCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  weatherAlertIcon: {
    fontSize: 56,
    marginBottom: 12,
    marginTop: 8,
  },
  weatherAlertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
    textAlign: 'center',
  },
  weatherAlertType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  weatherAlertMessage: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  weatherAlertLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  weatherAlertLocationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  weatherAlertLocationText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
  weatherAlertAutoClose: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
    marginBottom: 16,
  },
  weatherAlertAckButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  weatherAlertAckButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SailingScreenEnhanced;
