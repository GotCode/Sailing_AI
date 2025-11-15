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
import { getWeatherMonitoringService } from '../services/weatherMonitoringService';
import { getNavigationService } from '../services/navigationService';

interface MonitoringConfig {
  enabled: boolean;
  intervalHours: number;
  forecastDays: number;
  maxWindSpeed: number;
  maxWaveHeight: number;
  avoidStorms: boolean;
  ensureDaytimeArrival: boolean;
  notifyViaPush: boolean;
  notifyViaSMS: boolean;
  notifyViaEmail: boolean;
  phoneNumber: string;
  email: string;
}

export default function WeatherMonitorScreen() {
  const [config, setConfig] = useState<MonitoringConfig>({
    enabled: false,
    intervalHours: 6,
    forecastDays: 3,
    maxWindSpeed: 25,
    maxWaveHeight: 3,
    avoidStorms: true,
    ensureDaytimeArrival: true,
    notifyViaPush: true,
    notifyViaSMS: false,
    notifyViaEmail: false,
    phoneNumber: '',
    email: '',
  });

  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const weatherService = getWeatherMonitoringService();
  const navigationService = getNavigationService();

  useEffect(() => {
    // Load alerts when screen becomes active
    if (isMonitoring) {
      const alerts = weatherService.getAlerts();
      setActiveAlerts(alerts);
    }
  }, [isMonitoring]);

  const handleToggleMonitoring = async () => {
    if (!config.enabled) {
      // Start monitoring
      const route = navigationService.getCurrentRoute();
      if (!route) {
        Alert.alert('No Active Route', 'Please activate a route before enabling weather monitoring.');
        return;
      }

      const currentPosition = navigationService.getCurrentPosition();
      if (!currentPosition) {
        Alert.alert('No GPS Position', 'Unable to determine current position.');
        return;
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

      weatherService.startMonitoring(route, currentPosition);
      setConfig({ ...config, enabled: true });
      setIsMonitoring(true);
      setLastCheckTime(new Date());
      Alert.alert('Monitoring Started', 'Weather monitoring is now active.');
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
            onValueChange={(value) =>
              setConfig({ ...config, ensureDaytimeArrival: value })
            }
            disabled={config.enabled}
          />
        </View>
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
});
