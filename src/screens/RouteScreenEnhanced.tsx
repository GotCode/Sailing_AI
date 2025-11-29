// Enhanced Route Screen with Sail Configuration, Engine Mode, and Daylight Arrival Validation
// Comprehensive route management with all new features

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  Route,
  Waypoint,
} from '../types/sailing';
import { parseGPX, generateGPX } from '../utils/gpxHandler';
import { validateDaylightArrival } from '../services/routePlanningService';
import { formatToDDM } from '../utils/coordinateParser';

const RouteScreenEnhanced: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);

  // Waypoint form fields
  const [waypointName, setWaypointName] = useState('');
  const [waypointLat, setWaypointLat] = useState('');
  const [waypointLon, setWaypointLon] = useState('');
  const [useEngine, setUseEngine] = useState(false);
  const [selectedSailConfig, setSelectedSailConfig] = useState<string>('main+jib');

  // Load exported route from AsyncStorage when tab becomes focused
  const loadExportedRoute = useCallback(async () => {
    try {
      console.log('Loading route from AsyncStorage...');
      const stored = await AsyncStorage.getItem('activeRoute');
      if (stored) {
        const route = JSON.parse(stored);
        // Ensure dates are properly parsed
        if (route.createdAt) route.createdAt = new Date(route.createdAt);
        if (route.updatedAt) route.updatedAt = new Date(route.updatedAt);
        if (route.startDate) route.startDate = new Date(route.startDate);
        route.waypoints = route.waypoints.map((wp: any) => ({
          ...wp,
          estimatedArrival: wp.estimatedArrival ? new Date(wp.estimatedArrival) : undefined,
          arrivalTime: wp.arrivalTime ? new Date(wp.arrivalTime) : undefined,
        }));
        console.log('Loaded route with', route.waypoints.length, 'waypoints');
        setCurrentRoute(route);
      } else {
        console.log('No route found in AsyncStorage');
      }
    } catch (err) {
      console.error('Failed to load exported route:', err);
    }
  }, []);

  // Reload route every time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadExportedRoute();
    }, [loadExportedRoute])
  );

  // Sail configuration options
  const sailConfigurations = [
    { id: 'main+jib', label: 'Main + Jib', config: { mainSail: true, jib: true, asymmetrical: false, spinnaker: false, codeZero: false, stormJib: false } },
    { id: 'main+genoa', label: 'Main + Genoa', config: { mainSail: true, jib: true, asymmetrical: false, spinnaker: false, codeZero: false, stormJib: false } },
    { id: 'asymmetrical', label: 'Asymmetrical Spinnaker', config: { mainSail: true, jib: false, asymmetrical: true, spinnaker: false, codeZero: false, stormJib: false } },
    { id: 'spinnaker', label: 'Spinnaker', config: { mainSail: true, jib: false, asymmetrical: false, spinnaker: true, codeZero: false, stormJib: false } },
    { id: 'codezero', label: 'Code Zero', config: { mainSail: false, jib: false, asymmetrical: false, spinnaker: false, codeZero: true, stormJib: false } },
    { id: 'storm', label: 'Storm Jib + Reefed Main', config: { mainSail: true, jib: false, asymmetrical: false, spinnaker: false, codeZero: false, stormJib: true } },
  ];

  const handleImportGPX = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/gpx+xml',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const gpxContent = await FileSystem.readAsStringAsync(fileUri);
      const parseResult = await parseGPX(gpxContent);

      if (parseResult.error || parseResult.waypoints.length === 0) {
        Alert.alert('Error', parseResult.error || 'No waypoints found in GPX file');
        return;
      }

      const newRoute: Route = {
        id: `route-${Date.now()}`,
        name: result.assets[0].name.replace('.gpx', ''),
        waypoints: parseResult.waypoints,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCurrentRoute(newRoute);
      Alert.alert('Success', `Imported ${parseResult.waypoints.length} waypoints`);
    } catch (error) {
      Alert.alert('Import Failed', 'Could not import GPX file');
    }
  };

  const handleExportGPX = async () => {
    console.log('Export GPX clicked, currentRoute:', currentRoute);
    if (!currentRoute || currentRoute.waypoints.length === 0) {
      Alert.alert('No Route', 'Please create a route with waypoints first, or use "Plan Route Automatically" on the Sailing tab.');
      return;
    }
    console.log('Exporting route with', currentRoute.waypoints.length, 'waypoints');

    try {
      // Ensure route has proper date objects before generating GPX
      const routeForExport = {
        ...currentRoute,
        createdAt: currentRoute.createdAt instanceof Date ? currentRoute.createdAt : new Date(currentRoute.createdAt || Date.now()),
        updatedAt: currentRoute.updatedAt instanceof Date ? currentRoute.updatedAt : new Date(currentRoute.updatedAt || Date.now()),
      };

      const gpxContent = generateGPX(routeForExport);

      // Generate filename from Start-End coordinates and start date
      const startWp = currentRoute.waypoints[0];
      const endWp = currentRoute.waypoints[currentRoute.waypoints.length - 1];
      const startDate = currentRoute.startDate ? new Date(currentRoute.startDate) : new Date();
      const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const startCoords = `${startWp.latitude.toFixed(2)}_${startWp.longitude.toFixed(2)}`;
      const endCoords = `${endWp.latitude.toFixed(2)}_${endWp.longitude.toFixed(2)}`;
      const fileName = `Route_${startCoords}_to_${endCoords}_${dateStr}.gpx`.replace(/[^\w\d.-]/g, '_');

      // Web platform - direct download using data URI (more reliable)
      if (Platform.OS === 'web') {
        console.log('Web export: creating download for', fileName);
        console.log('GPX content length:', gpxContent.length);
        try {
          // Use data URI approach which is more reliable across browsers
          const dataUri = 'data:application/gpx+xml;charset=utf-8,' + encodeURIComponent(gpxContent);
          // Access DOM via global for React Native Web compatibility
          const doc = (global as any).document;
          const win = (global as any).window;
          if (doc && win) {
            const link = doc.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            doc.body.appendChild(link);
            link.click();
            doc.body.removeChild(link);
            console.log('Download triggered successfully');
            Alert.alert('Export Successful', `Route downloaded as ${fileName}`);
          } else {
            // Fallback for environments without DOM
            Alert.alert('Export', `GPX generated but download not supported in this environment.\nContent length: ${gpxContent.length} bytes`);
          }
        } catch (webError) {
          console.error('Web export error:', webError);
          // Fallback: try opening in new window
          try {
            const win = (global as any).window;
            const newWindow = win?.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`<pre>${gpxContent}</pre>`);
              newWindow.document.title = fileName;
              Alert.alert('Export', 'GPX content opened in new tab. Right-click and Save As to download.');
            } else {
              Alert.alert('Export Failed', 'Could not open download. Check popup blocker settings.');
            }
          } catch (e) {
            Alert.alert('Export Failed', 'Web export not supported');
          }
        }
        return;
      }

      // Mobile platform - use file system and sharing
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, gpxContent);

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/gpx+xml',
          dialogTitle: 'Save GPX Route File',
          UTI: 'com.topografix.gpx',
        });
      } else {
        Alert.alert('Export Successful', `Route exported to:\n${fileUri}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Export Failed', `Could not export GPX file: ${errorMsg}`);
    }
  };

  const openWaypointModal = (waypoint?: Waypoint) => {
    if (waypoint) {
      setEditingWaypoint(waypoint);
      setWaypointName(waypoint.name);
      setWaypointLat(waypoint.latitude.toString());
      setWaypointLon(waypoint.longitude.toString());
      setUseEngine(waypoint.useEngine || false);

      // Determine sail config
      if (waypoint.sailConfiguration) {
        const matchingSail = sailConfigurations.find(sc =>
          JSON.stringify(sc.config) === JSON.stringify(waypoint.sailConfiguration)
        );
        setSelectedSailConfig(matchingSail?.id || 'main+jib');
      }
    } else {
      setEditingWaypoint(null);
      setWaypointName('');
      setWaypointLat('');
      setWaypointLon('');
      setUseEngine(false);
      setSelectedSailConfig('main+jib');
    }
    setModalVisible(true);
  };

  const saveWaypoint = () => {
    if (!waypointName || !waypointLat || !waypointLon) {
      Alert.alert('Validation Error', 'Please fill all fields');
      return;
    }

    const lat = parseFloat(waypointLat);
    const lon = parseFloat(waypointLon);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      Alert.alert('Validation Error', 'Invalid coordinates');
      return;
    }

    const selectedConfig = sailConfigurations.find(sc => sc.id === selectedSailConfig);

    const waypoint: Waypoint = {
      id: editingWaypoint?.id || `wp-${Date.now()}`,
      name: waypointName,
      latitude: lat,
      longitude: lon,
      coordinates: { latitude: lat, longitude: lon },
      order: editingWaypoint?.order || (currentRoute?.waypoints.length || 0) + 1,
      arrived: editingWaypoint?.arrived || false,
      sailConfiguration: useEngine ? undefined : selectedConfig?.label,
      useEngine,
    };

    // Validate daylight arrival
    const daylightCheck = validateDaylightArrival(waypoint, { latitude: lat, longitude: lon });
    if (!daylightCheck.isValid && waypoint.estimatedArrival) {
      Alert.alert(
        'Daylight Warning',
        daylightCheck.message || 'Arrival outside daylight hours',
        [
          { text: 'Save Anyway', onPress: () => finalizeWaypoint(waypoint) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      finalizeWaypoint(waypoint);
    }
  };

  const finalizeWaypoint = (waypoint: Waypoint) => {
    if (editingWaypoint) {
      // Update existing
      const updatedWaypoints = currentRoute!.waypoints.map(wp =>
        wp.id === waypoint.id ? waypoint : wp
      );
      setCurrentRoute({
        ...currentRoute!,
        waypoints: updatedWaypoints,
        updatedAt: new Date(),
      });
    } else {
      // Add new
      const newWaypoints = [...(currentRoute?.waypoints || []), waypoint];
      if (currentRoute) {
        setCurrentRoute({
          ...currentRoute,
          waypoints: newWaypoints,
          updatedAt: new Date(),
        });
      } else {
        setCurrentRoute({
          id: `route-${Date.now()}`,
          name: 'New Route',
          waypoints: newWaypoints,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    setModalVisible(false);
  };

  const deleteWaypoint = (waypointId: string) => {
    Alert.alert(
      'Delete Waypoint',
      'Are you sure you want to delete this waypoint?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedWaypoints = currentRoute!.waypoints.filter(wp => wp.id !== waypointId);
            setCurrentRoute({
              ...currentRoute!,
              waypoints: updatedWaypoints,
              updatedAt: new Date(),
            });
          }
        }
      ]
    );
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    const waypoints = [...currentRoute!.waypoints];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= waypoints.length) return;

    [waypoints[index], waypoints[newIndex]] = [waypoints[newIndex], waypoints[index]];

    // Update order
    waypoints.forEach((wp, i) => {
      wp.order = i + 1;
    });

    setCurrentRoute({
      ...currentRoute!,
      waypoints,
      updatedAt: new Date(),
    });
  };

  const getSailConfigLabel = (waypoint: Waypoint): string => {
    if (waypoint.useEngine) return 'Engine';

    const config = waypoint.sailConfiguration;
    if (!config) return 'N/A';

    // If it's a string (from route planning service), use it directly
    if (typeof config === 'string') {
      // Calculate trim angle to AWA
      const trimAngle = waypoint.weatherForecast
        ? Math.abs(waypoint.weatherForecast.direction - 45)
        : 0;
      return `${config} @ ${trimAngle.toFixed(0)}° AWA`;
    }

    // If it's an object, find matching label
    const match = sailConfigurations.find(sc =>
      JSON.stringify(sc.config) === JSON.stringify(config)
    );
    const label = match?.label || 'Custom';
    const trimAngle = waypoint.weatherForecast
      ? Math.abs(waypoint.weatherForecast.direction - 45)
      : 0;
    return `${label} @ ${trimAngle.toFixed(0)}° AWA`;
  };

  const renderWaypoint = ({ item, index }: { item: Waypoint; index: number }) => {
    // Only check daylight arrival for the final waypoint
    const isLastWaypoint = currentRoute && index === currentRoute.waypoints.length - 1;
    const daylightCheck = (isLastWaypoint && item.estimatedArrival)
      ? validateDaylightArrival(item, { latitude: item.latitude, longitude: item.longitude })
      : { isValid: true };

    return (
      <View style={styles.waypointCard}>
        <View style={styles.waypointHeader}>
          <View style={styles.waypointNumber}>
            <Text style={styles.waypointNumberText}>{item.order}</Text>
          </View>
          <View style={styles.waypointInfo}>
            <Text style={styles.waypointName}>{item.name}</Text>
            <Text style={styles.waypointCoords}>
              {formatToDDM({ latitude: item.latitude, longitude: item.longitude })}
            </Text>
          </View>
          {item.arrived && (
            <View style={styles.arrivedBadge}>
              <Text style={styles.arrivedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.waypointDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mode:</Text>
            <Text style={[styles.detailValue, item.useEngine && styles.engineMode]}>
              {item.useEngine ? '⚙️ Engine' : '⛵ Sailing'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sails:</Text>
            <Text style={styles.detailValue}>{getSailConfigLabel(item)}</Text>
          </View>

          {item.estimatedArrival && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ETA:</Text>
              <Text style={[styles.detailValue, !daylightCheck.isValid && styles.nightArrival]}>
                {item.estimatedArrival.toLocaleString()}
                {!daylightCheck.isValid && ' 🌙'}
              </Text>
            </View>
          )}
        </View>

        {!daylightCheck.isValid && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ {daylightCheck.message}</Text>
          </View>
        )}

        <View style={styles.waypointActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => moveWaypoint(index, 'up')}
            disabled={index === 0}
          >
            <Text style={[styles.actionButtonText, index === 0 && styles.actionButtonDisabled]}>↑</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => moveWaypoint(index, 'down')}
            disabled={index === currentRoute!.waypoints.length - 1}
          >
            <Text style={[styles.actionButtonText, index === currentRoute!.waypoints.length - 1 && styles.actionButtonDisabled]}>↓</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openWaypointModal(item)}
          >
            <Text style={styles.actionButtonText}>✎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteWaypoint(item.id)}
          >
            <Text style={styles.actionButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Route Management</Text>
        <Text style={styles.headerSubtitle}>
          {currentRoute ? `${currentRoute.waypoints.length} waypoints` : 'No active route'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => openWaypointModal()}>
          <Text style={styles.buttonText}>+ Add Waypoint</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleImportGPX}>
          <Text style={styles.buttonText}>Import GPX</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, (!currentRoute || currentRoute.waypoints.length === 0) && styles.buttonDisabled]}
          onPress={handleExportGPX}
          disabled={!currentRoute || currentRoute.waypoints.length === 0}
        >
          <Text style={styles.buttonText}>Export GPX</Text>
        </TouchableOpacity>
      </View>

      {/* Waypoint List */}
      {currentRoute && currentRoute.waypoints.length > 0 ? (
        <FlatList
          data={currentRoute.waypoints}
          renderItem={renderWaypoint}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyText}>No waypoints yet</Text>
          <Text style={styles.emptySubtext}>Add waypoints or import a GPX file to get started</Text>
        </View>
      )}

      {/* Waypoint Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingWaypoint ? 'Edit Waypoint' : 'Add Waypoint'}
            </Text>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={waypointName}
                  onChangeText={setWaypointName}
                  placeholder="Waypoint Name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Latitude</Text>
                <TextInput
                  style={styles.formInput}
                  value={waypointLat}
                  onChangeText={setWaypointLat}
                  placeholder="e.g., 25.7617"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Longitude</Text>
                <TextInput
                  style={styles.formInput}
                  value={waypointLon}
                  onChangeText={setWaypointLon}
                  placeholder="e.g., -80.1918"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.formLabel}>Use Engine</Text>
                  <TouchableOpacity
                    style={[styles.toggle, useEngine && styles.toggleActive]}
                    onPress={() => setUseEngine(!useEngine)}
                  >
                    <View style={[styles.toggleThumb, useEngine && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              {!useEngine && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Sail Configuration</Text>
                  {sailConfigurations.map((config) => (
                    <TouchableOpacity
                      key={config.id}
                      style={[
                        styles.sailOption,
                        selectedSailConfig === config.id && styles.sailOptionSelected
                      ]}
                      onPress={() => setSelectedSailConfig(config.id)}
                    >
                      <View style={styles.sailRadio}>
                        {selectedSailConfig === config.id && <View style={styles.sailRadioSelected} />}
                      </View>
                      <Text style={styles.sailLabel}>{config.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveWaypoint}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#00ACC1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  waypointCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waypointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  waypointNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waypointNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  waypointInfo: {
    flex: 1,
  },
  waypointName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  waypointCoords: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  arrivedBadge: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrivedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  waypointDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  engineMode: {
    color: '#FF6F00',
    fontWeight: 'bold',
  },
  nightArrival: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 12,
    color: '#E65100',
  },
  waypointActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FFF3E0',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  actionButtonDisabled: {
    color: '#CCC',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCC',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    marginLeft: 22,
  },
  sailOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 8,
  },
  sailOptionSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#E3F2FD',
  },
  sailRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0066CC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sailRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066CC',
  },
  sailLabel: {
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  saveButton: {
    backgroundColor: '#0066CC',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RouteScreenEnhanced;
