// Enhanced Sailing Screen with Route Planning, Weather Fetch, and Professional UI
// This is the redesigned version with all requested features

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import {
  SailingMode,
  GPSCoordinates,
  RouteCorridorWeather,
  RoutePlanningConfig,
} from '../types/sailing';
import { recommendSailConfiguration } from '../utils/sailingCalculations';
import { getWindyService } from '../services/windyService';
import { planRoute, fetchRouteCorridorWeather } from '../services/routePlanningService';
import SailConfigDisplay from '../components/SailConfigDisplay';
import ErrorPanel from '../components/ErrorPanel';
import {
  validateWindSpeed,
  validateTWA,
  validateLatitude,
  validateLongitude,
  sanitizeNumericInput,
} from '../utils/validation';

const SailingScreenEnhanced: React.FC = () => {
  // ===== Route Planning Inputs =====
  const [startPoint, setStartPoint] = useState<GPSCoordinates>({ latitude: 0, longitude: 0 });
  const [destination, setDestination] = useState<GPSCoordinates>({ latitude: 0, longitude: 0 });
  const [startLat, setStartLat] = useState('');
  const [startLon, setStartLon] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLon, setDestLon] = useState('');

  // ===== Sailing Mode (Radio Buttons) =====
  const [sailingMode, setSailingMode] = useState<SailingMode>(SailingMode.MIXED);

  // ===== Wind Threshold for Engine =====
  const [windThreshold, setWindThreshold] = useState('8');

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

  // ===== Sail Recommendation =====
  const [sailRecommendation, setSailRecommendation] = useState<any>(null);

  // ===== Error Handling =====
  const [error, setError] = useState<string | null>(null);

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
      if (!startLat && !startLon) {
        setStartPoint(coords);
        setStartLat(coords.latitude.toFixed(6));
        setStartLon(coords.longitude.toFixed(6));
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
    const start = { latitude: parseFloat(startLat), longitude: parseFloat(startLon) };
    const dest = { latitude: parseFloat(destLat), longitude: parseFloat(destLon) };

    if (isNaN(start.latitude) || isNaN(start.longitude) || isNaN(dest.latitude) || isNaN(dest.longitude)) {
      Alert.alert('Validation Error', 'Please enter valid coordinates for start and destination');
      return;
    }

    setLoadingWeather(true);
    setError(null);

    try {
      const weather = await fetchRouteCorridorWeather(start, dest, 50);
      setCorridorWeather(weather);
      Alert.alert(
        'Weather Data Fetched',
        `Route: ${weather.weatherPoints.length} points\n` +
        `Avg Wind: ${weather.averageWindSpeed.toFixed(1)} kts\n` +
        `Max Wind: ${weather.maxWindSpeed.toFixed(1)} kts\n` +
        `Avg Waves: ${weather.averageWaveHeight.toFixed(1)} m\n` +
        `Max Waves: ${weather.maxWaveHeight.toFixed(1)} m`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoadingWeather(false);
    }
  };

  // ===== Auto Plan Route =====
  const handlePlanRoute = async () => {
    const start = { latitude: parseFloat(startLat), longitude: parseFloat(startLon) };
    const dest = { latitude: parseFloat(destLat), longitude: parseFloat(destLon) };
    const threshold = parseFloat(windThreshold);

    if (isNaN(start.latitude) || isNaN(start.longitude) || isNaN(dest.latitude) || isNaN(dest.longitude)) {
      Alert.alert('Validation Error', 'Please enter valid coordinates');
      return;
    }

    if (isNaN(threshold) || threshold < 0) {
      Alert.alert('Validation Error', 'Please enter a valid wind threshold');
      return;
    }

    setLoadingRoute(true);
    setError(null);

    try {
      const config: RoutePlanningConfig = {
        startPoint: start,
        destination: dest,
        sailingMode,
        windThreshold: threshold,
        avoidStorms: true,
        ensureDaytimeArrival: true,
        maxDailyDistance: 150,
        preferredWaypointInterval: 50,
      };

      const route = await planRoute(config);

      Alert.alert(
        'Route Planned Successfully!',
        `Route: ${route.name}\n` +
        `Waypoints: ${route.waypoints.length}\n` +
        `Total distance: Check Route tab for details\n\n` +
        `The route has been created with sail configurations and engine modes assigned based on forecast weather.`,
        [
          {
            text: 'View in Route Tab',
            onPress: () => {
              // Navigation would go here - user can manually switch to Route tab
            }
          },
          { text: 'OK' }
        ]
      );

      // TODO: Save route to backend or local storage
      // For now, user can see it in the alert

    } catch (err: any) {
      setError(err.message || 'Failed to plan route');
      Alert.alert('Route Planning Failed', err.message || 'An error occurred');
    } finally {
      setLoadingRoute(false);
    }
  };

  // ===== Use Current Location =====
  const useCurrentLocationForStart = () => {
    if (currentPosition.latitude !== 0) {
      setStartLat(currentPosition.latitude.toFixed(6));
      setStartLon(currentPosition.longitude.toFixed(6));
      setStartPoint(currentPosition);
    } else {
      Alert.alert('No GPS Data', 'Please enable location services');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sailing Assistant</Text>
        <Text style={styles.headerSubtitle}>Plan your route and get sailing recommendations</Text>
      </View>

      {/* ===== SECTION 1: ROUTE PLANNING ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Route Planning</Text>

        {/* Start Point */}
        <View style={styles.subsection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Starting Point</Text>
            <TouchableOpacity onPress={useCurrentLocationForStart} style={styles.gpsButton}>
              <Text style={styles.gpsButtonText}>📍 Use GPS</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.coordRow}>
            <TextInput
              style={[styles.input, styles.coordInput]}
              placeholder="Latitude"
              value={startLat}
              onChangeText={(text) => setStartLat(sanitizeNumericInput(text))}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.coordInput]}
              placeholder="Longitude"
              value={startLon}
              onChangeText={(text) => setStartLon(sanitizeNumericInput(text))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Destination */}
        <View style={styles.subsection}>
          <Text style={styles.label}>Destination Point</Text>
          <View style={styles.coordRow}>
            <TextInput
              style={[styles.input, styles.coordInput]}
              placeholder="Latitude"
              value={destLat}
              onChangeText={(text) => setDestLat(sanitizeNumericInput(text))}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.coordInput]}
              placeholder="Longitude"
              value={destLon}
              onChangeText={(text) => setDestLon(sanitizeNumericInput(text))}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

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

      {/* ===== SECTION 3: WIND THRESHOLD ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Engine Activation</Text>
        <View style={styles.inputRow}>
          <Text style={styles.label}>Wind Speed Threshold (knots)</Text>
          <TextInput
            style={[styles.input, styles.thresholdInput]}
            value={windThreshold}
            onChangeText={(text) => setWindThreshold(sanitizeNumericInput(text))}
            keyboardType="numeric"
            placeholder="8"
          />
        </View>
        <Text style={styles.helpText}>
          Engine will activate when wind speed falls below {windThreshold || '8'} knots
        </Text>
      </View>

      {/* ===== SECTION 4: ACTION BUTTONS ===== */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.button, styles.weatherButton, loadingWeather && styles.buttonDisabled]}
          onPress={handleFetchWeather}
          disabled={loadingWeather}
        >
          {loadingWeather ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>🌤️</Text>
              <Text style={styles.buttonText}>Fetch Weather Data</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.planButton, loadingRoute && styles.buttonDisabled]}
          onPress={handlePlanRoute}
          disabled={loadingRoute}
        >
          {loadingRoute ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>🗺️</Text>
              <Text style={styles.buttonText}>Plan Route Automatically</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ===== SECTION 5: WEATHER CORRIDOR DISPLAY ===== */}
      {corridorWeather && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌊 Route Weather Summary</Text>
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
          <Text style={styles.helpText}>
            Weather data collected from {corridorWeather.weatherPoints.length} points along the route
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
      </View>

      {/* ===== ERROR PANEL ===== */}
      {error && <ErrorPanel error={error} onDismiss={() => setError(null)} />}

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0066CC',
    padding: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 5,
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
    marginBottom: 16,
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
  gpsButton: {
    backgroundColor: '#00ACC1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
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
});

export default SailingScreenEnhanced;
