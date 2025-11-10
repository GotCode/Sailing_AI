import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LAGOON_440_POLAR } from '../data/lagoon440Polar';
import { PolarDiagram } from '../types/polar';
import PolarChart from '../components/PolarChart';
import ErrorPanel from '../components/ErrorPanel';

const PolarScreen: React.FC = () => {
  const [currentPolar, setCurrentPolar] = useState<PolarDiagram>(LAGOON_440_POLAR);
  const [windSpeed, setWindSpeed] = useState<string>('12');
  const [currentTWA, setCurrentTWA] = useState<string>('90');
  const [currentSpeed, setCurrentSpeed] = useState<string>('8.0');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const windSpeedNum = parseFloat(windSpeed) || 12;
  const twaNum = parseFloat(currentTWA) || 90;
  const speedNum = parseFloat(currentSpeed) || 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <Text style={styles.panelTitle}>Polar Diagram Controls</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wind Speed (kts)</Text>
              <TextInput
                style={styles.input}
                value={windSpeed}
                onChangeText={setWindSpeed}
                keyboardType="numeric"
                placeholder="12"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current TWA (°)</Text>
              <TextInput
                style={styles.input}
                value={currentTWA}
                onChangeText={setCurrentTWA}
                keyboardType="numeric"
                placeholder="90"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Speed (kts)</Text>
              <TextInput
                style={styles.input}
                value={currentSpeed}
                onChangeText={setCurrentSpeed}
                keyboardType="numeric"
                placeholder="8.0"
              />
            </View>
            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => setShowDetails(true)}
              >
                <Text style={styles.buttonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Polar Chart */}
        <PolarChart
          polar={currentPolar}
          windSpeed={windSpeedNum}
          currentTWA={twaNum}
          currentSpeed={speedNum}
        />

        {/* Quick Reference */}
        <View style={styles.quickRef}>
          <Text style={styles.quickRefTitle}>Quick Reference</Text>
          <View style={styles.quickRefItem}>
            <Text style={styles.quickRefLabel}>Best VMG Upwind:</Text>
            <Text style={styles.quickRefValue}>~45-52° TWA</Text>
          </View>
          <View style={styles.quickRefItem}>
            <Text style={styles.quickRefLabel}>Best VMG Downwind:</Text>
            <Text style={styles.quickRefValue}>~135-150° TWA</Text>
          </View>
          <View style={styles.quickRefItem}>
            <Text style={styles.quickRefLabel}>Max Speed:</Text>
            <Text style={styles.quickRefValue}>Reaching 90-120° TWA</Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>About Polar Diagrams</Text>
          <Text style={styles.infoText}>
            A polar diagram shows your boat's theoretical speed at different wind angles and wind
            speeds. Use it to:
          </Text>
          <Text style={styles.infoText}>• Find optimal sailing angles</Text>
          <Text style={styles.infoText}>• Compare your actual speed vs. target</Text>
          <Text style={styles.infoText}>• Choose the best sail configuration</Text>
          <Text style={styles.infoText}>• Calculate VMG (Velocity Made Good)</Text>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Polar Diagram Details</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <PolarChart
              polar={currentPolar}
              windSpeed={windSpeedNum}
              currentTWA={twaNum}
              currentSpeed={speedNum}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Error Panel */}
      <ErrorPanel error={error} onDismiss={() => setError(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  controlPanel: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  detailsButton: {
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickRef: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  quickRefTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 12,
  },
  quickRefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  quickRefLabel: {
    fontSize: 14,
    color: '#666',
  },
  quickRefValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  infoBox: {
    backgroundColor: '#FFFDE7',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default PolarScreen;
