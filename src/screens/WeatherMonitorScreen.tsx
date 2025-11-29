// Weather Monitor Screen
// Allows users to configure and monitor weather conditions along their route

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getWeatherMonitoringService } from '../services/weatherMonitoringService';
import { Route, GPSCoordinates } from '../types/sailing';
import { ARRIVAL_TIME_WINDOW_STORAGE } from './SettingsScreen';

interface MonitoringConfig {
  enabled: boolean;
  intervalHours: number;
  forecastDays: number;
  maxWindSpeed: number;
  maxWaveHeight: number;
  avoidStorms: boolean;
  ensureDaytimeArrival: boolean;
  arrivalStartHour: number; // Earliest arrival hour (e.g., 6 for 6 AM)
  arrivalEndHour: number; // Latest arrival hour (e.g., 17 for 5 PM)
  notifyViaPush: boolean;
  notifyViaSMS: boolean;
  notifyViaEmail: boolean;
  phoneNumber: string;
  email: string;
}

export default function WeatherMonitorScreen() {
  const [config, setConfig] = useState<MonitoringConfig>({
    enabled: false,
    intervalHours: 4,
    forecastDays: 3,
    maxWindSpeed: 35,
    maxWaveHeight: 3,
    avoidStorms: true,
    ensureDaytimeArrival: true,
    arrivalStartHour: 6, // 6 AM
    arrivalEndHour: 17, // 5 PM
    notifyViaPush: true,
    notifyViaSMS: false,
    notifyViaEmail: false,
    phoneNumber: '',
    email: '',
  });

  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GPSCoordinates | null>(null);

  const weatherService = getWeatherMonitoringService();

  useEffect(() => {
    // Load active route, current position, and saved settings on mount
    loadActiveRoute();
    getCurrentPosition();
    loadEnsureDaylightArrivalSetting();
  }, []);

  const loadEnsureDaylightArrivalSetting = async () => {
    try {
      const value = await AsyncStorage.getItem(ARRIVAL_TIME_WINDOW_STORAGE);
      // Default to true if not set
      const enabled = value === null ? true : value === 'true';
      setConfig((prev) => ({ ...prev, ensureDaytimeArrival: enabled }));
    } catch (err) {
      console.error('Failed to load ensure daylight arrival setting:', err);
    }
  };

  const saveEnsureDaylightArrivalSetting = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(ARRIVAL_TIME_WINDOW_STORAGE, enabled.toString());
    } catch (err) {
      console.error('Failed to save ensure daylight arrival setting:', err);
    }
  };

  useEffect(() => {
    // Load alerts when monitoring is active
    if (isMonitoring) {
      const alerts = weatherService.getAlerts();
      setActiveAlerts(alerts);
    }
  }, [isMonitoring]);

  const loadActiveRoute = async () => {
    try {
      const stored = await AsyncStorage.getItem('activeRoute');
      if (stored) {
        setActiveRoute(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load active route:', err);
    }
  };

  const getCurrentPosition = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (err) {
      console.error('Failed to get current position:', err);
    }
  };

  const handleToggleMonitoring = async () => {
    if (!config.enabled) {
      // Start monitoring
      // Reload active route in case it was updated
      await loadActiveRoute();

      if (!activeRoute) {
        Alert.alert(
          'No Active Route',
          'Please export a route from the Sailing tab first.\n\n' +
          '1. Go to Sailing tab\n' +
          '2. Plan a route\n' +
          '3. Click "Export to Route Tab"'
        );
        return;
      }

      if (!currentPosition) {
        // Try to get position again
        await getCurrentPosition();
        if (!currentPosition) {
          Alert.alert('No GPS Position', 'Unable to determine current position. Please enable location services.');
          return;
        }
      }

      // Update weather service config
      weatherService.updateConfig({
        intervalHours: config.intervalHours,
        forecastDays: config.forecastDays,
        maxWindSpeed: config.maxWindSpeed,
        maxWaveHeight: config.maxWaveHeight,
        avoidStorms: config.avoidStorms,
        ensureDaytimeArrival: config.ensureDaytimeArrival,
        notifyViaPush: config.notifyViaPush,
        notifyViaSMS: config.notifyViaSMS,
      });

      weatherService.startMonitoring(activeRoute, currentPosition);
      setConfig({ ...config, enabled: true });
      setIsMonitoring(true);
      setLastCheckTime(new Date());
      Alert.alert(
        'Monitoring Started',
        `Weather monitoring is now active for route:\n"${activeRoute.name}"\n\n${activeRoute.waypoints.length} waypoints being monitored.`
      );
    } else {
      // Stop monitoring
      weatherService.stopMonitoring();
      setConfig({ ...config, enabled: false });
      setIsMonitoring(false);
      Alert.alert('Monitoring Stopped', 'Weather monitoring has been disabled.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#D32F2F';
      case 'high':
        return '#F57C00';
      case 'medium':
        return '#FBC02D';
      case 'low':
        return '#388E3C';
      default:
        return '#757575';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'storm':
        return '⛈️';
      case 'high_wind':
        return '💨';
      case 'high_waves':
        return '🌊';
      case 'squall':
        return '🌀';
      case 'daytime_arrival':
        return '🌙';
      default:
        return '⚠️';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Weather Monitor</Text>
        <Text style={styles.subtitle}>
          Monitor weather conditions along your route and receive alerts
        </Text>
      </View>

      {/* Monitoring Status */}
      <View style={styles.section}>
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Text style={styles.sectionTitle}>Enable Monitoring</Text>
            <Text style={styles.statusText}>
              {config.enabled ? '✓ Active' : '✕ Inactive'}
            </Text>
          </View>
          <Switch
            value={config.enabled}
            onValueChange={handleToggleMonitoring}
            trackColor={{ false: '#DDD', true: '#0066CC' }}
            thumbColor={config.enabled ? '#0044AA' : '#999'}
          />
        </View>

        {activeRoute && (
          <Text style={styles.routeInfo}>
            Route: {activeRoute.name} ({activeRoute.waypoints.length} waypoints)
          </Text>
        )}

        {!activeRoute && (
          <Text style={styles.noRouteWarning}>
            No route loaded. Export a route from the Sailing tab first.
          </Text>
        )}

        {lastCheckTime && (
          <Text style={styles.lastCheck}>
            Last check: {lastCheckTime.toLocaleString()}
          </Text>
        )}
      </View>

      {/* Configuration Panel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>

        {/* Check Interval */}
        <View style={styles.configRow}>
          <Text style={styles.label}>Check Interval (hours)</Text>
          <TextInput
            style={styles.input}
            value={config.intervalHours.toString()}
            onChangeText={(text) =>
              setConfig({ ...config, intervalHours: parseInt(text) || 6 })
            }
            keyboardType="numeric"
            editable={!config.enabled}
          />
        </View>

        {/* Forecast Duration */}
        <View style={styles.configRow}>
          <Text style={styles.label}>Forecast Duration (days)</Text>
          <TextInput
            style={styles.input}
            value={config.forecastDays.toString()}
            onChangeText={(text) =>
              setConfig({ ...config, forecastDays: parseInt(text) || 3 })
            }
            keyboardType="numeric"
            editable={!config.enabled}
          />
        </View>

        {/* Wind Speed Threshold */}
        <View style={styles.configRow}>
          <Text style={styles.label}>Max Wind Speed (knots)</Text>
          <TextInput
            style={styles.input}
            value={config.maxWindSpeed.toString()}
            onChangeText={(text) =>
              setConfig({ ...config, maxWindSpeed: parseInt(text) || 25 })
            }
            keyboardType="numeric"
            editable={!config.enabled}
          />
        </View>

        {/* Wave Height Threshold */}
        <View style={styles.configRow}>
          <Text style={styles.label}>Max Wave Height (meters)</Text>
          <TextInput
            style={styles.input}
            value={config.maxWaveHeight.toString()}
            onChangeText={(text) =>
              setConfig({ ...config, maxWaveHeight: parseFloat(text) || 3 })
            }
            keyboardType="numeric"
            editable={!config.enabled}
          />
        </View>

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Avoid Storms</Text>
          <Switch
            value={config.avoidStorms}
            onValueChange={(value) =>
              setConfig({ ...config, avoidStorms: value })
            }
            disabled={config.enabled}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Ensure Daylight Arrival</Text>
          <Switch
            value={config.ensureDaytimeArrival}
            onValueChange={(value) => {
              setConfig({ ...config, ensureDaytimeArrival: value });
              saveEnsureDaylightArrivalSetting(value);
            }}
            disabled={config.enabled}
          />
        </View>

        {/* Arrival Time Range - shown when daylight arrival is enabled */}
        {config.ensureDaytimeArrival && (
          <View style={styles.arrivalTimeContainer}>
            <Text style={styles.arrivalTimeLabel}>Arrival Time Window</Text>
            <View style={styles.arrivalTimeRow}>
              <View style={styles.arrivalTimeInput}>
                <Text style={styles.arrivalTimeInputLabel}>From</Text>
                <TextInput
                  style={styles.input}
                  value={config.arrivalStartHour.toString()}
                  onChangeText={(text) => {
                    const hour = parseInt(text) || 6;
                    setConfig({ ...config, arrivalStartHour: Math.min(Math.max(hour, 0), 23) });
                  }}
                  keyboardType="numeric"
                  editable={!config.enabled}
                />
                <Text style={styles.arrivalTimeHint}>
                  {config.arrivalStartHour === 0 ? '12 AM' :
                   config.arrivalStartHour < 12 ? `${config.arrivalStartHour} AM` :
                   config.arrivalStartHour === 12 ? '12 PM' :
                   `${config.arrivalStartHour - 12} PM`}
                </Text>
              </View>
              <Text style={styles.arrivalTimeTo}>to</Text>
              <View style={styles.arrivalTimeInput}>
                <Text style={styles.arrivalTimeInputLabel}>To</Text>
                <TextInput
                  style={styles.input}
                  value={config.arrivalEndHour.toString()}
                  onChangeText={(text) => {
                    const hour = parseInt(text) || 17;
                    setConfig({ ...config, arrivalEndHour: Math.min(Math.max(hour, 0), 23) });
                  }}
                  keyboardType="numeric"
                  editable={!config.enabled}
                />
                <Text style={styles.arrivalTimeHint}>
                  {config.arrivalEndHour === 0 ? '12 AM' :
                   config.arrivalEndHour < 12 ? `${config.arrivalEndHour} AM` :
                   config.arrivalEndHour === 12 ? '12 PM' :
                   `${config.arrivalEndHour - 12} PM`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Push Notifications</Text>
          <Switch
            value={config.notifyViaPush}
            onValueChange={(value) =>
              setConfig({ ...config, notifyViaPush: value })
            }
            disabled={config.enabled}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.label}>SMS Notifications</Text>
          <Switch
            value={config.notifyViaSMS}
            onValueChange={(value) =>
              setConfig({ ...config, notifyViaSMS: value })
            }
            disabled={config.enabled}
          />
        </View>

        {config.notifyViaSMS && (
          <View style={styles.configRow}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, styles.flexInput]}
              value={config.phoneNumber}
              onChangeText={(text) => setConfig({ ...config, phoneNumber: text })}
              placeholder="+1234567890"
              keyboardType="phone-pad"
              editable={!config.enabled}
            />
          </View>
        )}

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Email Notifications</Text>
          <Switch
            value={config.notifyViaEmail}
            onValueChange={(value) =>
              setConfig({ ...config, notifyViaEmail: value })
            }
            disabled={config.enabled}
          />
        </View>

        {config.notifyViaEmail && (
          <View style={styles.configRow}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.flexInput]}
              value={config.email}
              onChangeText={(text) => setConfig({ ...config, email: text })}
              placeholder="your@email.com"
              keyboardType="email-address"
              editable={!config.enabled}
            />
          </View>
        )}
      </View>

      {/* Active Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Alerts ({activeAlerts.length})</Text>

        {activeAlerts.length === 0 ? (
          <View style={styles.noAlertsBox}>
            <Text style={styles.noAlertsText}>
              {config.enabled ? 'No alerts at this time ✓' : 'Enable monitoring to see alerts'}
            </Text>
          </View>
        ) : (
          activeAlerts.map((alert, index) => (
            <View
              key={index}
              style={[
                styles.alertBox,
                { borderLeftColor: getSeverityColor(alert.severity) },
              ]}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                <Text style={styles.alertTitle}>{alert.type.replace('_', ' ').toUpperCase()}</Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(alert.severity) },
                  ]}
                >
                  <Text style={styles.severityText}>{alert.severity}</Text>
                </View>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>
                {new Date(alert.timestamp).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ About Weather Monitoring</Text>
        <Text style={styles.infoText}>
          • Monitors weather conditions at waypoints and along your route{'\n'}
          • Checks every {config.intervalHours} hours for {config.forecastDays}-day forecasts{'\n'}
          • Sends alerts for high winds, waves, storms, and arrival time issues{'\n'}
          • Notifications sent via your preferred method(s){'\n'}
          • Disable before changing route to avoid false alerts
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0066CC',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
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
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lastCheck: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  routeInfo: {
    fontSize: 12,
    color: '#0066CC',
    marginTop: 8,
    fontWeight: '500',
  },
  noRouteWarning: {
    fontSize: 12,
    color: '#F57C00',
    marginTop: 8,
    fontStyle: 'italic',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#FFF',
    minWidth: 80,
    textAlign: 'right',
  },
  flexInput: {
    flex: 2,
    textAlign: 'left',
    minWidth: 0,
  },
  noAlertsBox: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
  },
  noAlertsText: {
    color: '#2E7D32',
    fontSize: 14,
  },
  alertBox: {
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  alertMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#FFFDE7',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF9C4',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  // Arrival time range styles
  arrivalTimeContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  arrivalTimeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  arrivalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrivalTimeInput: {
    flex: 1,
    alignItems: 'center',
  },
  arrivalTimeInputLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  arrivalTimeTo: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 12,
  },
  arrivalTimeHint: {
    fontSize: 11,
    color: '#0066CC',
    marginTop: 4,
    fontWeight: '500',
  },
});
