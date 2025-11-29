// Interactive Route Map Visualization Component
// Shows waypoints with relative coordinates, dashed connections, and zoom support

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  G,
  Polygon,
  Rect,
  Path,
} from 'react-native-svg';
import { Waypoint } from '../types/sailing';

interface RouteMapViewProps {
  waypoints: Waypoint[];
  routeName: string;
  currentWaypointIndex?: number;
  simulatedPosition?: { latitude: number; longitude: number };
  stormLocations?: Array<{ lat: number; lon: number; type: 'storm' | 'squall' }>;
  // Tracking/Simulation controls
  trackingRunning?: boolean; // Real GPS tracking mode
  simulationRunning?: boolean; // Simulation mode
  simulationCompleted?: boolean;
  simulationHour?: number;
  windDirection?: number;
  windSpeed?: number;
  onStartTracking?: () => void; // Start real GPS tracking
  onStopTracking?: () => void; // Stop real GPS tracking
  onStartSimulation?: () => void;
  onStopSimulation?: () => void;
}

const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const MAP_SIZE = 300;
const PADDING = 40;

// Calculate simulated date/time from hour offset
function getSimulatedDateTime(hour: number): { date: string; time: string } {
  const startDate = new Date();
  const simDate = new Date(startDate.getTime() + hour * 60 * 60 * 1000);

  const dateStr = simDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = simDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return { date: dateStr, time: timeStr };
}

export default function RouteMapView({
  waypoints,
  routeName,
  currentWaypointIndex = 0,
  simulatedPosition,
  stormLocations = [],
  trackingRunning = false,
  simulationRunning = false,
  simulationCompleted = false,
  simulationHour = 0,
  windDirection = 0,
  windSpeed = 0,
  onStartTracking,
  onStopTracking,
  onStartSimulation,
  onStopSimulation,
}: RouteMapViewProps) {
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isSimulationMode, setIsSimulationMode] = useState(true); // Toggle between Real and Simulation

  // Calculate bounds and scale
  const { bounds, scale, mapPoints, gridLines } = useMemo(() => {
    if (waypoints.length === 0) {
      return {
        bounds: { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 },
        scale: 1,
        mapPoints: [],
        gridLines: { horizontal: [], vertical: [] },
      };
    }

    // Find bounds
    let minLat = waypoints[0].latitude;
    let maxLat = waypoints[0].latitude;
    let minLon = waypoints[0].longitude;
    let maxLon = waypoints[0].longitude;

    waypoints.forEach(wp => {
      minLat = Math.min(minLat, wp.latitude);
      maxLat = Math.max(maxLat, wp.latitude);
      minLon = Math.min(minLon, wp.longitude);
      maxLon = Math.max(maxLon, wp.longitude);
    });

    // Add padding to bounds (15% on each side)
    const latPadding = (maxLat - minLat) * 0.15 || 0.5;
    const lonPadding = (maxLon - minLon) * 0.15 || 0.5;
    minLat -= latPadding;
    maxLat += latPadding;
    minLon -= lonPadding;
    maxLon += lonPadding;

    // Calculate scale (pixels per degree)
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    const drawableSize = MAP_SIZE - PADDING * 2;

    // Use the smaller scale to fit both dimensions
    const latScale = drawableSize / latRange;
    const lonScale = drawableSize / lonRange;
    const finalScale = Math.min(latScale, lonScale);

    // Convert waypoints to map coordinates
    // North is up, so higher latitude = lower Y
    const mapPoints = waypoints.map((wp, idx) => {
      const x = PADDING + (wp.longitude - minLon) * finalScale;
      const y = PADDING + (maxLat - wp.latitude) * finalScale; // Invert Y for north-up
      return {
        x,
        y,
        waypoint: wp,
        index: idx,
        isSailing: !wp.useEngine,
      };
    });

    // Generate grid lines
    const gridStep = Math.ceil((maxLat - minLat) / 4 * 10) / 10; // Round to 0.1 degree
    const horizontal: number[] = [];
    const vertical: number[] = [];

    for (let lat = Math.floor(minLat); lat <= Math.ceil(maxLat); lat += gridStep) {
      horizontal.push(lat);
    }
    for (let lon = Math.floor(minLon); lon <= Math.ceil(maxLon); lon += gridStep) {
      vertical.push(lon);
    }

    return {
      bounds: { minLat, maxLat, minLon, maxLon },
      scale: finalScale,
      mapPoints,
      gridLines: { horizontal, vertical },
    };
  }, [waypoints]);

  // Convert storm locations to map coordinates
  const stormPoints = useMemo(() => {
    if (!stormLocations.length || !bounds) return [];

    const drawableSize = MAP_SIZE - PADDING * 2;
    const latRange = bounds.maxLat - bounds.minLat;
    const lonRange = bounds.maxLon - bounds.minLon;
    const latScale = drawableSize / latRange;
    const lonScale = drawableSize / lonRange;
    const finalScale = Math.min(latScale, lonScale);

    return stormLocations.map(storm => ({
      x: PADDING + (storm.lon - bounds.minLon) * finalScale,
      y: PADDING + (bounds.maxLat - storm.lat) * finalScale,
      type: storm.type,
    }));
  }, [stormLocations, bounds]);

  // Convert simulated position to map coordinates
  const simPoint = useMemo(() => {
    if (!simulatedPosition || !bounds) return null;

    const drawableSize = MAP_SIZE - PADDING * 2;
    const latRange = bounds.maxLat - bounds.minLat;
    const lonRange = bounds.maxLon - bounds.minLon;
    const latScale = drawableSize / latRange;
    const lonScale = drawableSize / lonRange;
    const finalScale = Math.min(latScale, lonScale);

    return {
      x: PADDING + (simulatedPosition.longitude - bounds.minLon) * finalScale,
      y: PADDING + (bounds.maxLat - simulatedPosition.latitude) * finalScale,
    };
  }, [simulatedPosition, bounds]);

  // Create wind arrow path for a given position and direction
  const createWindArrow = (cx: number, cy: number, direction: number, size: number = 12) => {
    // Wind direction is where wind comes FROM, arrow should point in wind direction
    const angle = (direction - 90) * Math.PI / 180; // Convert to radians, -90 for SVG coordinates
    const tipX = cx + Math.cos(angle) * size;
    const tipY = cy + Math.sin(angle) * size;
    const baseX = cx - Math.cos(angle) * (size * 0.5);
    const baseY = cy - Math.sin(angle) * (size * 0.5);
    const leftX = baseX + Math.cos(angle + Math.PI / 2) * (size * 0.3);
    const leftY = baseY + Math.sin(angle + Math.PI / 2) * (size * 0.3);
    const rightX = baseX + Math.cos(angle - Math.PI / 2) * (size * 0.3);
    const rightY = baseY + Math.sin(angle - Math.PI / 2) * (size * 0.3);

    return `M ${tipX} ${tipY} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, MIN_ZOOM));
  };

  const handleReset = () => {
    setZoom(INITIAL_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  };

  // Format coordinate for display
  const formatCoord = (value: number, isLat: boolean): string => {
    const abs = Math.abs(value);
    const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return `${abs.toFixed(1)}°${dir}`;
  };

  // Get simulated date/time
  const simDateTime = getSimulatedDateTime(simulationHour);

  if (waypoints.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Plan a route to see the map</Text>
        {onStartSimulation && (
          <TouchableOpacity
            style={[styles.simButton, styles.simButtonDisabled]}
            disabled={true}
          >
            <Text style={styles.simButtonText}>Run Simulation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with simulation status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            Route: {formatCoord(waypoints[0].latitude, true)}, {formatCoord(waypoints[0].longitude, false)} → {formatCoord(waypoints[waypoints.length - 1].latitude, true)}, {formatCoord(waypoints[waypoints.length - 1].longitude, false)}
          </Text>
          <Text style={styles.subtitle}>{waypoints.length} waypoints</Text>
        </View>
        {simulationRunning && (
          <View style={styles.simStatus}>
            <View style={styles.simStatusDot} />
            <Text style={styles.simStatusText}>SIM</Text>
          </View>
        )}
        {trackingRunning && (
          <View style={[styles.simStatus, styles.trackingStatus]}>
            <View style={[styles.simStatusDot, styles.trackingStatusDot]} />
            <Text style={[styles.simStatusText, styles.trackingStatusText]}>GPS</Text>
          </View>
        )}
      </View>

      {/* Simulation Date/Time Display */}
      {simulationRunning && (
        <View style={styles.dateTimeBar}>
          <View style={styles.dateTimeItem}>
            <Text style={styles.dateTimeLabel}>Date:</Text>
            <Text style={styles.dateTimeValue}>{simDateTime.date}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Text style={styles.dateTimeLabel}>Time:</Text>
            <Text style={styles.dateTimeValue}>{simDateTime.time}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Text style={styles.dateTimeLabel}>Hour:</Text>
            <Text style={styles.dateTimeValue}>{simulationHour}h</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Text style={styles.dateTimeLabel}>Wind:</Text>
            <Text style={styles.dateTimeValue}>{windSpeed.toFixed(0)}kts @ {windDirection.toFixed(0)}°</Text>
          </View>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapWrapper}>
        <Svg
          width={MAP_SIZE}
          height={MAP_SIZE}
          viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
          style={styles.svg}
        >
          {/* Background */}
          <Rect x="0" y="0" width={MAP_SIZE} height={MAP_SIZE} fill="#E8F4FD" />

          {/* Grid lines */}
          <G opacity={0.3}>
            {gridLines.horizontal.map((lat, idx) => {
              const y = PADDING + (bounds.maxLat - lat) * scale;
              if (y < PADDING || y > MAP_SIZE - PADDING) return null;
              return (
                <G key={`h-${idx}`}>
                  <Line
                    x1={PADDING}
                    y1={y}
                    x2={MAP_SIZE - PADDING}
                    y2={y}
                    stroke="#90CAF9"
                    strokeWidth={0.5}
                  />
                  <SvgText
                    x={PADDING - 5}
                    y={y}
                    fontSize={8}
                    fill="#666"
                    textAnchor="end"
                    alignmentBaseline="middle"
                  >
                    {formatCoord(lat, true)}
                  </SvgText>
                </G>
              );
            })}
            {gridLines.vertical.map((lon, idx) => {
              const x = PADDING + (lon - bounds.minLon) * scale;
              if (x < PADDING || x > MAP_SIZE - PADDING) return null;
              return (
                <G key={`v-${idx}`}>
                  <Line
                    x1={x}
                    y1={PADDING}
                    x2={x}
                    y2={MAP_SIZE - PADDING}
                    stroke="#90CAF9"
                    strokeWidth={0.5}
                  />
                  <SvgText
                    x={x}
                    y={MAP_SIZE - PADDING + 12}
                    fontSize={8}
                    fill="#666"
                    textAnchor="middle"
                  >
                    {formatCoord(lon, false)}
                  </SvgText>
                </G>
              );
            })}
          </G>

          {/* Route lines - dashed, blue for sailing, green for motor */}
          {mapPoints.slice(0, -1).map((point, idx) => {
            const nextPoint = mapPoints[idx + 1];
            const isSailing = nextPoint.isSailing;
            return (
              <Line
                key={`line-${idx}`}
                x1={point.x}
                y1={point.y}
                x2={nextPoint.x}
                y2={nextPoint.y}
                stroke={isSailing ? '#2196F3' : '#4CAF50'}
                strokeWidth={2.5}
                strokeDasharray={isSailing ? '8,4' : '4,4'}
                strokeLinecap="round"
              />
            );
          })}

          {/* Storm/Squall markers */}
          {stormPoints.map((storm, idx) => (
            <G key={`storm-${idx}`}>
              {storm.type === 'storm' ? (
                <G>
                  <Circle
                    cx={storm.x}
                    cy={storm.y}
                    r={12}
                    fill="rgba(244, 67, 54, 0.3)"
                    stroke="#F44336"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={storm.x}
                    y={storm.y + 4}
                    fontSize={14}
                    fill="#F44336"
                    textAnchor="middle"
                  >
                    ⚡
                  </SvgText>
                </G>
              ) : (
                <G>
                  <Circle
                    cx={storm.x}
                    cy={storm.y}
                    r={10}
                    fill="rgba(255, 152, 0, 0.3)"
                    stroke="#FF9800"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={storm.x}
                    y={storm.y + 4}
                    fontSize={12}
                    fill="#FF9800"
                    textAnchor="middle"
                  >
                    💨
                  </SvgText>
                </G>
              )}
            </G>
          ))}

          {/* Waypoint markers with wind arrows */}
          {mapPoints.map((point, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === mapPoints.length - 1;
            const isCurrent = idx === currentWaypointIndex;

            let fillColor = '#2196F3'; // Default blue
            if (isStart) fillColor = '#4CAF50'; // Green for start
            else if (isEnd) fillColor = '#F44336'; // Red for end

            const radius = isCurrent ? 10 : 8;

            return (
              <G key={`wp-${idx}`}>
                {/* Outer ring for current waypoint */}
                {isCurrent && (
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={14}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth={2}
                    opacity={0.5}
                  />
                )}
                {/* Main circle */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={fillColor}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                {/* Waypoint number */}
                <SvgText
                  x={point.x}
                  y={point.y + 3}
                  fontSize={10}
                  fill="#FFFFFF"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {idx + 1}
                </SvgText>
                {/* Waypoint name label */}
                <SvgText
                  x={point.x}
                  y={point.y - 14}
                  fontSize={9}
                  fill="#333"
                  textAnchor="middle"
                >
                  {point.waypoint.name.length > 12
                    ? point.waypoint.name.substring(0, 10) + '...'
                    : point.waypoint.name}
                </SvgText>
                {/* Wind arrow at current waypoint during simulation */}
                {simulationRunning && isCurrent && windDirection > 0 && (
                  <Path
                    d={createWindArrow(point.x + 20, point.y, windDirection, 10)}
                    fill="#FF5722"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                )}
              </G>
            );
          })}

          {/* Simulated boat position */}
          {simPoint && (
            <G>
              <Circle
                cx={simPoint.x}
                cy={simPoint.y}
                r={6}
                fill="#FF5722"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              {/* Boat icon - simple triangle pointing direction */}
              <Polygon
                points={`${simPoint.x},${simPoint.y - 8} ${simPoint.x - 5},${simPoint.y + 4} ${simPoint.x + 5},${simPoint.y + 4}`}
                fill="#FF5722"
                stroke="#FFFFFF"
                strokeWidth={1}
              />
              {/* Wind arrow at boat position */}
              {windDirection > 0 && (
                <Path
                  d={createWindArrow(simPoint.x + 15, simPoint.y - 10, windDirection, 8)}
                  fill="#9C27B0"
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                />
              )}
            </G>
          )}

          {/* North indicator */}
          <G>
            <Polygon
              points={`${MAP_SIZE - 25},15 ${MAP_SIZE - 30},30 ${MAP_SIZE - 25},25 ${MAP_SIZE - 20},30`}
              fill="#333"
            />
            <SvgText
              x={MAP_SIZE - 25}
              y={40}
              fontSize={10}
              fill="#333"
              textAnchor="middle"
              fontWeight="bold"
            >
              N
            </SvgText>
          </G>

          {/* Scale indicator */}
          <G>
            <Line
              x1={PADDING}
              y1={MAP_SIZE - 15}
              x2={PADDING + 50}
              y2={MAP_SIZE - 15}
              stroke="#333"
              strokeWidth={2}
            />
            <Line
              x1={PADDING}
              y1={MAP_SIZE - 18}
              x2={PADDING}
              y2={MAP_SIZE - 12}
              stroke="#333"
              strokeWidth={2}
            />
            <Line
              x1={PADDING + 50}
              y1={MAP_SIZE - 18}
              x2={PADDING + 50}
              y2={MAP_SIZE - 12}
              stroke="#333"
              strokeWidth={2}
            />
            <SvgText
              x={PADDING + 25}
              y={MAP_SIZE - 5}
              fontSize={8}
              fill="#333"
              textAnchor="middle"
            >
              {scale > 0 ? `${(50 / scale).toFixed(1)}°` : ''}
            </SvgText>
          </G>
        </Svg>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Text style={styles.zoomButtonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleReset}>
            <Text style={styles.zoomButtonText}>⟲</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Start</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Sailing</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Motor</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>End</Text>
        </View>
      </View>

      {/* Storm legend if storms present */}
      {stormLocations.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Text style={{ fontSize: 12 }}>⚡</Text>
            <Text style={styles.legendText}>Storm</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={{ fontSize: 12 }}>💨</Text>
            <Text style={styles.legendText}>Squall</Text>
          </View>
        </View>
      )}

      {/* Run Mode Controls */}
      {(onStartSimulation || onStartTracking) && (
        <View style={styles.simButtonContainer}>
          {/* Mode Toggle */}
          <View style={styles.modeToggleContainer}>
            <Text style={[styles.modeLabel, !isSimulationMode && styles.modeLabelActive]}>
              Real GPS
            </Text>
            <Switch
              value={isSimulationMode}
              onValueChange={(value) => {
                // Can only toggle when not running
                if (!simulationRunning && !trackingRunning) {
                  setIsSimulationMode(value);
                }
              }}
              trackColor={{ false: '#4CAF50', true: '#9C27B0' }}
              thumbColor={isSimulationMode ? '#7B1FA2' : '#388E3C'}
              disabled={simulationRunning || trackingRunning}
            />
            <Text style={[styles.modeLabel, isSimulationMode && styles.modeLabelActive]}>
              Simulation
            </Text>
          </View>

          {/* Mode Description */}
          <Text style={styles.modeDescription}>
            {isSimulationMode
              ? 'Run simulated weather scenarios with storms and squalls'
              : 'Track real sailing progress using GPS location'
            }
          </Text>

          {/* Completed State */}
          {simulationCompleted && !simulationRunning && isSimulationMode ? (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>Simulation Complete</Text>
              <TouchableOpacity
                style={[styles.simButton, styles.simButtonRefresh]}
                onPress={onStartSimulation}
              >
                <Text style={styles.simButtonText}>Restart Simulation</Text>
              </TouchableOpacity>
            </View>
          ) : isSimulationMode ? (
            /* Simulation Mode Button */
            <TouchableOpacity
              style={[
                styles.simButton,
                simulationRunning ? styles.simButtonStop : styles.simButtonSimulation,
              ]}
              onPress={simulationRunning ? onStopSimulation : onStartSimulation}
            >
              {simulationRunning ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.simButtonText}>Stop Simulation</Text>
                </>
              ) : (
                <Text style={styles.simButtonText}>Run Simulation</Text>
              )}
            </TouchableOpacity>
          ) : (
            /* Real GPS Tracking Mode Button */
            <TouchableOpacity
              style={[
                styles.simButton,
                trackingRunning ? styles.simButtonStop : styles.simButtonStart,
              ]}
              onPress={trackingRunning ? onStopTracking : onStartTracking}
            >
              {trackingRunning ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.simButtonText}>Stop Tracking</Text>
                </>
              ) : (
                <Text style={styles.simButtonText}>Start Real Tracking</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066CC',
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  simStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackingStatus: {
    backgroundColor: '#E8F5E9',
  },
  simStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9C27B0',
    marginRight: 4,
  },
  trackingStatusDot: {
    backgroundColor: '#4CAF50',
  },
  trackingStatusText: {
    color: '#4CAF50',
  },
  simStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  dateTimeBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  dateTimeItem: {
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 9,
    color: '#666',
  },
  dateTimeValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  mapWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
  },
  zoomButton: {
    width: 32,
    height: 32,
    backgroundColor: '#0066CC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  zoomButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  coordInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  coordText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 40,
  },
  simButtonContainer: {
    marginTop: 12,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  simButtonStart: {
    backgroundColor: '#4CAF50',
  },
  simButtonStop: {
    backgroundColor: '#F44336',
  },
  simButtonSimulation: {
    backgroundColor: '#9C27B0',
  },
  simButtonRefresh: {
    backgroundColor: '#2196F3',
  },
  simButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  simButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedContainer: {
    alignItems: 'center',
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  modeLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  modeLabelActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  modeDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});
