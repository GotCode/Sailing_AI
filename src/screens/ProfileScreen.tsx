// Profile Screen for Sailing AI
// User account management and settings

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import SavedRoutesModal from '../components/SavedRoutesModal';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [showRoutesModal, setShowRoutesModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID</Text>
          <Text style={styles.infoValue}>{user?.id || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
        </View>
      </View>

      {/* Saved Routes Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.viewRoutesButton}
          onPress={() => setShowRoutesModal(true)}
          accessibilityLabel="View saved routes"
          title="View and manage your saved routes"
        >
          <Text style={styles.viewRoutesButtonText}>View Saved Routes</Text>
        </TouchableOpacity>
      </View>

      <SavedRoutesModal
        visible={showRoutesModal}
        onClose={() => setShowRoutesModal(false)}
        userId={user?.id}
      />

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuIcon}>⛵</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Sailing AI</Text>
            <Text style={styles.menuSubtitle}>Lagoon 440 Navigation Assistant</Text>
          </View>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuIcon}>📱</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Version</Text>
            <Text style={styles.menuSubtitle}>1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Features Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Agent Features</Text>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Real-time Sailing Recommendations</Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Automated Route Planning</Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>AI Weather Monitoring & Alerts</Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Cloud Sync & Storage</Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>GPX Import/Export</Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Sailing Polar Configuration</Text>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Sail with ❤️ for sailors
        </Text>
        <Text style={styles.footerSubtext}>
          © 2025 Sailing AI. All rights reserved.
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
    padding: 30,
    alignItems: 'center',
    paddingTop: 50,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#004C99',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userEmail: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewRoutesButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  viewRoutesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  closeModalButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyRoutesText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  routeMeta: {
    fontSize: 12,
    color: '#888',
  },
  deleteRouteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteRouteText: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: 'bold',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});
