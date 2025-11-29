// Settings Screen for API Configuration and App Preferences
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWindyService, initializeWindyService } from '../services/windyService';

const WINDY_API_KEY_STORAGE = 'windy_api_key';
export const ROUTE_FORMAT_STORAGE = 'route_format';
export const ARRIVAL_TIME_WINDOW_STORAGE = 'arrival_time_window_enabled';

export type RouteFormat = 'GPX' | 'KML' | 'KMZ' | 'CSV';

export const ROUTE_FORMATS: { id: RouteFormat; label: string; extension: string; mimeType: string }[] = [
  { id: 'GPX', label: 'GPX (GPS Exchange Format)', extension: '.gpx', mimeType: 'application/gpx+xml' },
  { id: 'KML', label: 'KML (Keyhole Markup Language)', extension: '.kml', mimeType: 'application/vnd.google-earth.kml+xml' },
  { id: 'KMZ', label: 'KMZ (Compressed KML)', extension: '.kmz', mimeType: 'application/vnd.google-earth.kmz' },
  { id: 'CSV', label: 'CSV (Comma Separated Values)', extension: '.csv', mimeType: 'text/csv' },
];

const SettingsScreen: React.FC = () => {
  const [windyApiKey, setWindyApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRouteFormat, setSelectedRouteFormat] = useState<RouteFormat>('GPX');

  // Load saved settings on mount
  useEffect(() => {
    loadSavedApiKey();
    loadRouteFormat();
  }, []);

  const loadRouteFormat = async () => {
    try {
      const format = await AsyncStorage.getItem(ROUTE_FORMAT_STORAGE);
      if (format && ['GPX', 'KML', 'KMZ', 'CSV'].includes(format)) {
        setSelectedRouteFormat(format as RouteFormat);
      }
    } catch (err) {
      console.error('Failed to load route format:', err);
    }
  };

  const saveRouteFormat = async (format: RouteFormat) => {
    try {
      await AsyncStorage.setItem(ROUTE_FORMAT_STORAGE, format);
      setSelectedRouteFormat(format);
    } catch (err) {
      Alert.alert('Error', 'Failed to save route format preference');
    }
  };

  const loadSavedApiKey = async () => {
    try {
      const storedApiKey = await AsyncStorage.getItem(WINDY_API_KEY_STORAGE);
      if (storedApiKey) {
        setWindyApiKey(storedApiKey);
        setSavedApiKey(storedApiKey);
        setValidationStatus('valid'); // Assume valid if saved
      }
    } catch (err) {
      console.error('Failed to load API key:', err);
    }
  };

  const validateApiKey = async () => {
    if (!windyApiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationStatus('none');

    try {
      // Initialize service with new key and test it
      initializeWindyService(windyApiKey.trim());
      const windyService = getWindyService();

      // Test API call with a sample location (Miami)
      const result = await windyService.getCurrentConditions({
        latitude: 25.7617,
        longitude: -80.1918,
      });

      if (result.error) {
        setValidationStatus('invalid');
        Alert.alert('Invalid API Key', result.error);
      } else if (result.forecast) {
        setValidationStatus('valid');
        Alert.alert(
          'API Key Valid',
          `Successfully connected to Windy.com!\n\nCurrent conditions at test location:\nWind: ${result.forecast.windSpeed.toFixed(1)} kts\nWaves: ${result.forecast.waveHeight.toFixed(1)} m`
        );
      } else {
        setValidationStatus('invalid');
        Alert.alert('Validation Failed', 'Could not verify API key. Please check and try again.');
      }
    } catch (err) {
      setValidationStatus('invalid');
      Alert.alert('Validation Error', 'Failed to validate API key. Check your internet connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const saveApiKey = async () => {
    if (!windyApiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setIsSaving(true);

    try {
      const keyToSave = windyApiKey.trim();
      await AsyncStorage.setItem(WINDY_API_KEY_STORAGE, keyToSave);
      initializeWindyService(keyToSave);
      setSavedApiKey(keyToSave);
      setWindyApiKey(''); // Clear the input field after saving
      Alert.alert('Success', 'Windy API key saved successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const clearApiKey = async () => {
    Alert.alert(
      'Clear API Key',
      'Are you sure you want to remove your Windy API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(WINDY_API_KEY_STORAGE);
              setWindyApiKey('');
              setSavedApiKey('');
              setValidationStatus('none');
              initializeWindyService('');
              Alert.alert('Cleared', 'API key has been removed');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear API key');
            }
          },
        },
      ]
    );
  };

  const openWindyApiPage = () => {
    Linking.openURL('https://api.windy.com/keys');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Windy API Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Windy.com API Configuration</Text>

        <Text style={styles.description}>
          To fetch real-time weather data along your sailing routes, you need a Windy.com API key.
          The API is free for personal use with limited requests.
        </Text>

        <TouchableOpacity style={styles.linkButton} onPress={openWindyApiPage}>
          <Text style={styles.linkButtonText}>Get Free API Key from Windy.com</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste your Windy API key here"
            value={windyApiKey}
            onChangeText={setWindyApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={false}
          />

          {/* Status Indicator */}
          {validationStatus !== 'none' && (
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  validationStatus === 'valid' ? styles.statusValid : styles.statusInvalid,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  validationStatus === 'valid' ? styles.statusTextValid : styles.statusTextInvalid,
                ]}
              >
                {validationStatus === 'valid' ? 'API Key Valid' : 'API Key Invalid'}
              </Text>
            </View>
          )}

          {savedApiKey && (
            <Text style={styles.savedIndicator}>
              API key saved ({savedApiKey.substring(0, 8)}...)
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.validateButton]}
            onPress={validateApiKey}
            disabled={isValidating || !windyApiKey.trim()}
          >
            {isValidating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Validate</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={saveApiKey}
            disabled={isSaving || !windyApiKey.trim()}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {savedApiKey && (
          <TouchableOpacity style={styles.clearButton} onPress={clearApiKey}>
            <Text style={styles.clearButtonText}>Clear Saved API Key</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Route Format Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Export Format</Text>
        <Text style={styles.description}>
          Select the default format for exporting and importing sailing routes.
        </Text>

        <View style={styles.formatOptions}>
          {ROUTE_FORMATS.map((format) => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatOption,
                selectedRouteFormat === format.id && styles.formatOptionSelected,
              ]}
              onPress={() => saveRouteFormat(format.id)}
            >
              <View style={styles.formatRadio}>
                {selectedRouteFormat === format.id && (
                  <View style={styles.formatRadioSelected} />
                )}
              </View>
              <View style={styles.formatInfo}>
                <Text style={[
                  styles.formatLabel,
                  selectedRouteFormat === format.id && styles.formatLabelSelected,
                ]}>
                  {format.id}
                </Text>
                <Text style={styles.formatDescription}>{format.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.note}>
          GPX is recommended for most navigation apps. KML/KMZ work with Google Earth.
          CSV provides a spreadsheet-compatible format with all waypoint data.
        </Text>
      </View>

      {/* Help Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Get Your API Key</Text>

        <View style={styles.stepContainer}>
          <Text style={styles.step}>1. Visit api.windy.com/keys</Text>
          <Text style={styles.step}>2. Sign in with your Windy account (or create one)</Text>
          <Text style={styles.step}>3. Click "New Key" and select "Point Forecast API"</Text>
          <Text style={styles.step}>4. Copy the generated API key</Text>
          <Text style={styles.step}>5. Paste it above, click "Validate" then "Save"</Text>
        </View>

        <Text style={styles.note}>
          Note: Make sure to select "Point Forecast API" when creating your key.
          Keys for other services (map forecast, webcams) will not work.
          The free tier allows up to 1000 API calls per day.
        </Text>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Sailing AI</Text>
        <Text style={styles.aboutText}>
          Sailing AI is a comprehensive sailing assistant for your Lagoon 440 catamaran.
          Features include route planning, weather monitoring, polar diagrams, and sail configuration recommendations.
        </Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={{ height: 40 }} />
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
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkButton: {
    marginBottom: 16,
  },
  linkButtonText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusValid: {
    backgroundColor: '#4CAF50',
  },
  statusInvalid: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextValid: {
    color: '#4CAF50',
  },
  statusTextInvalid: {
    color: '#F44336',
  },
  savedIndicator: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButton: {
    backgroundColor: '#00ACC1',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#F44336',
    fontSize: 14,
  },
  stepContainer: {
    marginBottom: 12,
  },
  step: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 8,
  },
  note: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  version: {
    fontSize: 12,
    color: '#999',
  },
  formatOptions: {
    marginVertical: 12,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  formatOptionSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#E3F2FD',
  },
  formatRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0066CC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066CC',
  },
  formatInfo: {
    flex: 1,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  formatLabelSelected: {
    color: '#0066CC',
  },
  formatDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default SettingsScreen;
