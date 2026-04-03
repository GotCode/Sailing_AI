import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SailConfiguration } from '../types/sailing';
import { getReefingRecommendation } from '../data/lagoon440Polar';

interface SailConfigDisplayProps {
  configuration: SailConfiguration;
  expectedSpeed: number;
  description: string;
  reefingAdvice?: string;
}

const SailConfigDisplay: React.FC<SailConfigDisplayProps> = React.memo(({
  configuration,
  expectedSpeed,
  description,
  reefingAdvice,
}) => {
  const activeSails = [];
  if (configuration.mainSail) {
    const reefLabel = configuration.reefLevel ? ` (Reef ${configuration.reefLevel})` : '';
    activeSails.push(`Main Sail${reefLabel}`);
  }
  if (configuration.jib) {
    const reefLabel = configuration.headsailReef ? ` (Reef ${configuration.headsailReef})` : '';
    activeSails.push(`Jib${reefLabel}`);
  }
  if (configuration.asymmetrical) activeSails.push('Asymmetrical');
  if (configuration.spinnaker) activeSails.push('Spinnaker');
  if (configuration.codeZero) activeSails.push('Code Zero');
  if (configuration.stormJib) activeSails.push('Storm Jib');

  const hasReefing = (configuration.reefLevel && configuration.reefLevel > 0) || (configuration.headsailReef && configuration.headsailReef > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended Sail Configuration</Text>
      <View style={styles.sailList}>
        {activeSails.map((sail, index) => (
          <View key={index} style={[styles.sailBadge, hasReefing && sail.includes('Reef') ? styles.reefBadge : null]}>
            <Text style={styles.sailText}>{sail}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.description}>{description}</Text>
      {reefingAdvice && (
        <View style={styles.reefingContainer}>
          <Text style={styles.reefingLabel}>⛵ Reefing:</Text>
          <Text style={styles.reefingValue}>{reefingAdvice}</Text>
        </View>
      )}
      <View style={styles.speedContainer}>
        <Text style={styles.speedLabel}>Expected Speed:</Text>
        <Text style={styles.speedValue}>{expectedSpeed.toFixed(1)} kts</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sailList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  sailBadge: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  sailText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  speedValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  reefBadge: {
    backgroundColor: '#E65100',
  },
  reefingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  reefingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginRight: 8,
  },
  reefingValue: {
    fontSize: 14,
    color: '#BF360C',
    flex: 1,
  },
});

export default SailConfigDisplay;
