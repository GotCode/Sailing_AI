// B&G Style Sailing Rose / Wind Rose Component
// Displays wind direction relative to boat heading with laylines

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText, G } from 'react-native-svg';

interface SailingRoseProps {
  trueWindAngle: number; // TWA in degrees (0-180, mirrored for port/starboard)
  windSpeed: number; // Wind speed in knots
  boatHeading?: number; // Optional boat heading for display
}

const SailingRose: React.FC<SailingRoseProps> = ({
  trueWindAngle,
  windSpeed,
  boatHeading = 0,
}) => {
  const size = 220;
  const center = size / 2;
  const radius = 85;
  const innerRadius = 60;

  // Convert TWA to radians for calculations
  // TWA is 0 at bow, 180 at stern
  const twaRad = (trueWindAngle * Math.PI) / 180;

  // Wind indicator position (both port and starboard)
  const windX = center + radius * Math.sin(twaRad);
  const windY = center - radius * Math.cos(twaRad);
  const windXPort = center - radius * Math.sin(twaRad);
  const windYPort = center - radius * Math.cos(twaRad);

  // Determine point of sail
  const getPointOfSail = (twa: number): string => {
    if (twa < 30) return 'In Irons';
    if (twa < 50) return 'Close Hauled';
    if (twa < 70) return 'Close Reach';
    if (twa < 110) return 'Beam Reach';
    if (twa < 150) return 'Broad Reach';
    return 'Running';
  };

  // Get color based on point of sail efficiency
  const getWindColor = (twa: number): string => {
    if (twa < 30) return '#FF4444'; // No-go zone
    if (twa < 50) return '#FF9800'; // Close hauled
    if (twa < 70) return '#4CAF50'; // Close reach - good
    if (twa < 110) return '#2196F3'; // Beam reach - optimal
    if (twa < 150) return '#4CAF50'; // Broad reach - good
    return '#FF9800'; // Running
  };

  // Cardinal direction marks
  const cardinals = [
    { angle: 0, label: 'N', short: true },
    { angle: 30, label: '30', short: true },
    { angle: 60, label: '60', short: true },
    { angle: 90, label: '90', short: false },
    { angle: 120, label: '120', short: true },
    { angle: 150, label: '150', short: true },
    { angle: 180, label: 'S', short: false },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wind Rose</Text>

      <View style={styles.roseContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="#1A1A2E"
            stroke="#333"
            strokeWidth={2}
          />

          {/* Inner circle */}
          <Circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="#444"
            strokeWidth={1}
          />

          {/* No-go zone (red arc at bow) */}
          <Path
            d={`M ${center + radius * Math.sin(-30 * Math.PI / 180)} ${center - radius * Math.cos(-30 * Math.PI / 180)}
                A ${radius} ${radius} 0 0 1 ${center + radius * Math.sin(30 * Math.PI / 180)} ${center - radius * Math.cos(30 * Math.PI / 180)}`}
            stroke="#FF444466"
            strokeWidth={20}
            fill="none"
          />

          {/* Degree marks - both sides */}
          {cardinals.map((cardinal, index) => {
            const angleRad = (cardinal.angle * Math.PI) / 180;
            const markLength = cardinal.short ? 8 : 12;

            // Starboard side (right)
            const x1s = center + (radius - markLength) * Math.sin(angleRad);
            const y1s = center - (radius - markLength) * Math.cos(angleRad);
            const x2s = center + radius * Math.sin(angleRad);
            const y2s = center - radius * Math.cos(angleRad);

            // Port side (left)
            const x1p = center - (radius - markLength) * Math.sin(angleRad);
            const y1p = center - (radius - markLength) * Math.cos(angleRad);
            const x2p = center - radius * Math.sin(angleRad);
            const y2p = center - radius * Math.cos(angleRad);

            // Label positions
            const labelRadius = radius + 12;
            const labelXs = center + labelRadius * Math.sin(angleRad);
            const labelYs = center - labelRadius * Math.cos(angleRad);
            const labelXp = center - labelRadius * Math.sin(angleRad);
            const labelYp = center - labelRadius * Math.cos(angleRad);

            return (
              <G key={`mark-${index}`}>
                {/* Starboard marks */}
                <Line
                  x1={x1s}
                  y1={y1s}
                  x2={x2s}
                  y2={y2s}
                  stroke="#666"
                  strokeWidth={1}
                />
                {cardinal.angle !== 0 && (
                  <SvgText
                    x={labelXs}
                    y={labelYs + 4}
                    fontSize={8}
                    fill="#888"
                    textAnchor="middle"
                  >
                    {cardinal.label}
                  </SvgText>
                )}

                {/* Port marks (except 0 and 180) */}
                {cardinal.angle !== 0 && cardinal.angle !== 180 && (
                  <>
                    <Line
                      x1={x1p}
                      y1={y1p}
                      x2={x2p}
                      y2={y2p}
                      stroke="#666"
                      strokeWidth={1}
                    />
                    <SvgText
                      x={labelXp}
                      y={labelYp + 4}
                      fontSize={8}
                      fill="#888"
                      textAnchor="middle"
                    >
                      {cardinal.label}
                    </SvgText>
                  </>
                )}
              </G>
            );
          })}

          {/* Boat icon (triangle at center pointing up) */}
          <Path
            d={`M ${center} ${center - 25}
                L ${center + 8} ${center + 10}
                L ${center - 8} ${center + 10} Z`}
            fill="#0066CC"
            stroke="#FFFFFF"
            strokeWidth={1}
          />

          {/* Wind direction indicator - Starboard */}
          <Circle
            cx={windX}
            cy={windY}
            r={8}
            fill={getWindColor(trueWindAngle)}
          />

          {/* Wind arrow line - Starboard */}
          <Line
            x1={center + innerRadius * 0.5 * Math.sin(twaRad)}
            y1={center - innerRadius * 0.5 * Math.cos(twaRad)}
            x2={windX}
            y2={windY}
            stroke={getWindColor(trueWindAngle)}
            strokeWidth={3}
          />

          {/* Wind direction indicator - Port (mirrored) */}
          <Circle
            cx={windXPort}
            cy={windYPort}
            r={8}
            fill={getWindColor(trueWindAngle)}
            opacity={0.5}
          />

          {/* Wind arrow line - Port */}
          <Line
            x1={center - innerRadius * 0.5 * Math.sin(twaRad)}
            y1={center - innerRadius * 0.5 * Math.cos(twaRad)}
            x2={windXPort}
            y2={windYPort}
            stroke={getWindColor(trueWindAngle)}
            strokeWidth={3}
            opacity={0.5}
          />

          {/* Center label - TWA */}
          <SvgText
            x={center}
            y={center + 35}
            fontSize={14}
            fill="#FFFFFF"
            textAnchor="middle"
            fontWeight="bold"
          >
            {trueWindAngle}°
          </SvgText>
        </Svg>
      </View>

      {/* Info display */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Point of Sail:</Text>
          <Text style={[styles.infoValue, { color: getWindColor(trueWindAngle) }]}>
            {getPointOfSail(trueWindAngle)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Wind Speed:</Text>
          <Text style={styles.infoValue}>{windSpeed} kts</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>TWA:</Text>
          <Text style={styles.infoValue}>{trueWindAngle}°</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF4444' }]} />
          <Text style={styles.legendText}>No-go</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Close/Run</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Reach</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Beam</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  roseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 9,
    color: '#666',
  },
});

export default SailingRose;
