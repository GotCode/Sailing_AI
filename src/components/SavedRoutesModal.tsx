import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Route } from '../types/sailing';
import { formatCoordsDM } from '../utils/coordinateParser';

interface SavedRoutesModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  onLoadRoute?: (route: Route) => void;
}

const SavedRoutesModal: React.FC<SavedRoutesModalProps> = ({
  visible,
  onClose,
  userId,
  onLoadRoute,
}) => {
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);

  const storageKey = `routes_${userId || 'guest'}`;

  const loadSavedRoutes = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const routes: Route[] = JSON.parse(stored);
        routes.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setSavedRoutes(routes);
      } else {
        setSavedRoutes([]);
      }
    } catch (err) {
      console.error('Failed to load saved routes:', err);
    }
  }, [storageKey]);

  useEffect(() => {
    if (visible) {
      loadSavedRoutes();
    }
  }, [visible, loadSavedRoutes]);

  const deleteRoute = (index: number) => {
    const routeName = savedRoutes[index].name;
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
              const updated = savedRoutes.filter((_, i) => i !== index);
              await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
              setSavedRoutes(updated);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete route.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Saved Routes</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {savedRoutes.length === 0 ? (
          <Text style={styles.noRoutesText}>No saved routes yet. Save a route using the "Save to Profile" button.</Text>
        ) : (
          <FlatList
            data={savedRoutes}
            keyExtractor={(item, index) => `route-${item.id || index}`}
            renderItem={({ item, index }) => {
              const savedDate = item.updatedAt || item.createdAt;
              const dateStr = savedDate
                ? new Date(savedDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Unknown date';

              const startPoint = item.waypoints[0];
              const endPoint = item.waypoints[item.waypoints.length - 1];
              const startCoords = startPoint ? formatCoordsDM(startPoint.coordinates.latitude, startPoint.coordinates.longitude) : '(Unknown)';
              const endCoords = endPoint ? formatCoordsDM(endPoint.coordinates.latitude, endPoint.coordinates.longitude) : '(Unknown)';
              const startDateStr = item.startDate
                ? new Date(item.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                : dateStr;
              const totalMiles = item.waypoints.reduce((sum, wp) => sum + (wp.legDistance || 0), 0);
              const milesLabel = totalMiles > 0 ? `${totalMiles.toFixed(1)} nm` : 'unknown nm';
              const routeLabel = `Sailing Route ${startCoords} TO ${endCoords}, ${startDateStr}, ${milesLabel}`;

              return (
                <View style={styles.savedRouteItem}>
                  <TouchableOpacity
                    style={styles.savedRouteContent}
                    onPress={() => {
                      if (onLoadRoute) {
                        onLoadRoute(item);
                      }
                    }}
                    disabled={!onLoadRoute}
                  >
                    <Text style={styles.savedRouteName}>{routeLabel}</Text>
                    <Text style={styles.savedRouteInfo}>
                      {item.waypoints.length} waypoints
                    </Text>
                    <Text style={styles.savedRouteTimestamp}>{dateStr}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteRouteButton}
                    onPress={() => deleteRoute(index)}
                  >
                    <Text style={styles.deleteRouteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  savedRouteTimestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
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
});

export default SavedRoutesModal;
