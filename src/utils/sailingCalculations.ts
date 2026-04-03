// Sailing calculations and recommendations for Lagoon 440

import { SailConfiguration, SailRecommendation, SailingMode, GPSCoordinates, StormHandlingConfig, StormHandlingRecommendation, StormTactic } from '../types/sailing';
import { PolarDiagram } from '../types/polar';
import { LAGOON_440_POLAR, getSpeedFromPolar, findOptimalVMG, getReefingRecommendation } from '../data/lagoon440Polar';

/**
 * Calculate apparent wind angle from true wind
 *
 * Apparent wind is the wind experienced on the boat, which is the vector sum
 * of the true wind and the boat's motion through the water.
 *
 * @param trueWindAngle - True wind angle in degrees (0-360)
 * @param trueWindSpeed - True wind speed in knots
 * @param boatSpeed - Boat speed in knots
 * @param boatHeading - Boat heading in degrees (0-360) - currently not used but kept for API compatibility
 * @returns Apparent wind angle in degrees (0-360)
 */
export function calculateApparentWindAngle(
  trueWindAngle: number,
  trueWindSpeed: number,
  boatSpeed: number,
  boatHeading: number
): number {
  // Convert TWA to radians
  const twaRad = (trueWindAngle * Math.PI) / 180;

  // Calculate apparent wind components using vector addition
  // True wind components (in boat reference frame)
  const trueWindX = trueWindSpeed * Math.sin(twaRad);
  const trueWindY = trueWindSpeed * Math.cos(twaRad);

  // Boat motion creates opposite wind (headwind)
  const boatWindX = 0;
  const boatWindY = -boatSpeed;

  // Apparent wind is the vector sum
  const apparentWindX = trueWindX + boatWindX;
  const apparentWindY = trueWindY + boatWindY;

  // Calculate apparent wind angle
  let apparentWindAngle = Math.atan2(apparentWindX, apparentWindY) * (180 / Math.PI);

  // Normalize to 0-360 range
  if (apparentWindAngle < 0) {
    apparentWindAngle += 360;
  }

  return apparentWindAngle;
}

/**
 * Calculate apparent wind speed
 *
 * @param trueWindAngle - True wind angle in degrees (0-360)
 * @param trueWindSpeed - True wind speed in knots
 * @param boatSpeed - Boat speed in knots
 * @returns Apparent wind speed in knots
 */
export function calculateApparentWindSpeed(
  trueWindAngle: number,
  trueWindSpeed: number,
  boatSpeed: number
): number {
  // Convert TWA to radians
  const twaRad = (trueWindAngle * Math.PI) / 180;

  // Calculate using law of cosines
  const apparentWindSpeed = Math.sqrt(
    trueWindSpeed * trueWindSpeed +
    boatSpeed * boatSpeed -
    2 * trueWindSpeed * boatSpeed * Math.cos(twaRad)
  );

  return apparentWindSpeed;
}

/**
 * Get the appropriate sail configuration name based on conditions
 */
function getSailConfigName(
  windSpeed: number,
  trueWindAngle: number,
  sailingMode: SailingMode,
  config: SailConfiguration
): string {
  if (config.stormJib) return 'Storm Jib + Reefed Main';
  if (config.codeZero) return 'Code Zero';
  if (config.spinnaker) return 'Main + Spinnaker';
  if (config.asymmetrical) return 'Main + Asymmetrical';

  // Default to Main + Jib
  return 'Main + Jib';
}

/**
 * Recommend sail configuration based on wind conditions
 * Uses comprehensive Lagoon 440 polar diagram
 */
export function recommendSailConfiguration(
  windSpeed: number,
  trueWindAngle: number,
  sailingMode: SailingMode,
  customPolar?: PolarDiagram
): SailRecommendation {
  const polar = customPolar || LAGOON_440_POLAR;
  const config: SailConfiguration = {
    mainSail: false,
    jib: false,
    asymmetrical: false,
    spinnaker: false,
    codeZero: false,
    stormJib: false,
    reefLevel: 0,
    headsailReef: 0,
  };

  let description = '';
  let speedMultiplier = 1.0;

  // Get Lagoon 440 factory reefing recommendation
  const { mainReef, headsailReef, reefingAdvice } = getReefingRecommendation(windSpeed);

  // Storm conditions (>35 knots)
  if (windSpeed > 35) {
    config.mainSail = true;
    config.stormJib = true;
    config.reefLevel = 3;
    config.headsailReef = 3;
    description = 'Storm conditions: Deep reefed main + storm jib';
    speedMultiplier = 0.6;
  }
  // Heavy wind (25-35 knots)
  else if (windSpeed > 25) {
    config.mainSail = true;
    config.reefLevel = mainReef.reefLevel; // 3rd reef (deep)
    config.headsailReef = headsailReef.reefLevel;
    if (trueWindAngle < 90) {
      config.jib = true;
      description = `Heavy wind upwind: ${mainReef.label} + ${headsailReef.label}`;
      speedMultiplier = 0.8;
    } else {
      config.jib = true;
      description = `Heavy wind downwind: ${mainReef.label} + ${headsailReef.label}`;
      speedMultiplier = 0.85;
    }
  }
  // Moderate to strong wind (20-25 knots) - 2nd reef zone
  else if (windSpeed > 20) {
    config.mainSail = true;
    config.reefLevel = mainReef.reefLevel; // 2nd reef
    config.headsailReef = headsailReef.reefLevel;
    if (trueWindAngle < 60) {
      config.jib = true;
      description = `Close hauled: ${mainReef.label} + ${headsailReef.label}`;
      speedMultiplier = 0.9;
    } else if (trueWindAngle < 120) {
      config.jib = true;
      description = `Reaching: ${mainReef.label} + ${headsailReef.label}`;
      speedMultiplier = 0.9;
    } else {
      config.jib = true;
      description = `Downwind: ${mainReef.label} + ${headsailReef.label}`;
      speedMultiplier = 0.85;
    }
  }
  // Moderate to strong wind (15-20 knots) - 1st reef zone
  else if (windSpeed > 15) {
    config.mainSail = true;
    config.reefLevel = mainReef.reefLevel; // 1st reef
    config.headsailReef = headsailReef.reefLevel;
    if (trueWindAngle < 60) {
      config.jib = true;
      description = `Close hauled: ${mainReef.label} + ${headsailReef.label}`;
      speedMultiplier = 0.95;
    } else if (trueWindAngle < 90) {
      config.jib = true;
      description = `Close reach: ${mainReef.label} + ${headsailReef.label}`;
      speedMultiplier = 0.95;
    } else if (trueWindAngle < 120) {
      config.jib = true;
      description = `Beam reach: ${mainReef.label} + ${headsailReef.label}`;
      speedMultiplier = 1.0;
    } else if (trueWindAngle < 150) {
      if (sailingMode === SailingMode.SPEED) {
        config.asymmetrical = true;
        description = `Broad reach: Asymmetrical spinnaker`;
        speedMultiplier = 1.15;
      } else if (sailingMode === SailingMode.MIXED) {
        config.asymmetrical = true;
        description = `Broad reach: Asymmetrical (balanced)`;
        speedMultiplier = 1.05;
      } else {
        config.mainSail = true;
        config.jib = true;
        description = `Broad reach: ${mainReef.label} + jib (comfort mode)`;
        speedMultiplier = 0.95;
      }
    } else {
      if (sailingMode === SailingMode.SPEED) {
        config.spinnaker = true;
        description = 'Running: Spinnaker';
        speedMultiplier = 1.1;
      } else if (sailingMode === SailingMode.MIXED) {
        config.asymmetrical = true;
        description = 'Running: Asymmetrical (balanced)';
        speedMultiplier = 1.0;
      } else {
        config.mainSail = true;
        config.jib = true;
        description = `Running: Wing-on-wing ${mainReef.label} + jib`;
        speedMultiplier = 0.9;
      }
    }
  }
  // Light to moderate wind (8-15 knots)
  else if (windSpeed > 8) {
    config.mainSail = true;
    if (trueWindAngle < 90) {
      config.jib = true;
      description = 'Moderate upwind: Full main + jib';
      speedMultiplier = 1.0;
    } else if (trueWindAngle < 120) {
      config.jib = true;
      description = 'Moderate reaching: Full main + jib';
      speedMultiplier = 1.0;
    } else {
      if (sailingMode === SailingMode.SPEED) {
        config.asymmetrical = true;
        description = 'Moderate downwind: Asymmetrical spinnaker';
        speedMultiplier = 1.2;
      } else if (sailingMode === SailingMode.MIXED) {
        config.asymmetrical = true;
        description = 'Moderate downwind: Asymmetrical (balanced)';
        speedMultiplier = 1.1;
      } else {
        config.jib = true;
        description = 'Moderate downwind: Main + jib';
        speedMultiplier = 0.95;
      }
    }
  }
  // Light wind (4-8 knots)
  else if (windSpeed > 4) {
    if (trueWindAngle < 90) {
      config.mainSail = true;
      config.jib = true;
      description = 'Light wind upwind: Full main + jib';
      speedMultiplier = 1.0;
    } else {
      if (sailingMode === SailingMode.SPEED) {
        config.codeZero = true;
        description = 'Light wind downwind: Code Zero';
        speedMultiplier = 1.25;
      } else if (sailingMode === SailingMode.MIXED) {
        config.codeZero = true;
        description = 'Light wind downwind: Code Zero (balanced)';
        speedMultiplier = 1.15;
      } else {
        config.mainSail = true;
        config.jib = true;
        description = 'Light wind downwind: Full main + jib';
        speedMultiplier = 1.0;
      }
    }
  }
  // Very light wind (<4 knots)
  else {
    config.codeZero = true;
    description = 'Very light wind: Code Zero only';
    speedMultiplier = 1.2;
  }

  // Calculate expected speed using polar diagram
  const sailConfigName = getSailConfigName(windSpeed, trueWindAngle, sailingMode, config);
  const baseSpeed = getSpeedFromPolar(polar, windSpeed, trueWindAngle, sailConfigName);
  const expectedSpeed = baseSpeed * speedMultiplier;

  return {
    configuration: config,
    expectedSpeed: Math.round(expectedSpeed * 10) / 10,
    description,
    confidence: windSpeed > 4 ? 85 : 65,
    reefingAdvice,
  };
}

/**
 * Assess whether a preventer should be rigged.
 *
 * A preventer is a safety line that tensions the boom forward, preventing
 * an accidental gybe on a catamaran.  The Lagoon 440's large mainsail
 * (54 m²) makes an uncontrolled gybe especially destructive.
 *
 * Conditions that require a preventer:
 *  1. Deep downwind sailing (AWA 140°-180°) – "by the lee" risk
 *  2. Following seas / large swells (wave height > 2 m at AWA > 120°)
 *  3. Light wind with leftover swell (wind < 8 kts, waves > 1 m)
 *  4. Wing-on-wing sailing (running with sails on opposite sides)
 */
export function assessPreventer(
  trueWindAngle: number,   // TWA in degrees (0-180)
  windSpeed: number,       // TWS in knots
  waveHeight: number,      // metres
  sailDescription: string  // from recommendSailConfiguration().description
): { usePreventer: boolean; reason: string } {
  const reasons: string[] = [];
  const awa = trueWindAngle; // using TWA as proxy for AWA on a catamaran

  // 1. Deep downwind – broad reaching or running (140°-180° AWA)
  if (awa >= 140) {
    reasons.push(`Deep downwind sailing (${awa.toFixed(0)}° AWA) – high gybe risk`);
  }

  // 4. Wing-on-wing sailing (typically described in sail recommendation)
  const isWingOnWing = sailDescription.toLowerCase().includes('wing-on-wing');
  if (isWingOnWing) {
    reasons.push('Wing-on-wing sailing – zero margin for accidental gybe');
  }

  // 2. Following seas with large swells while sailing downwind
  if (waveHeight > 2.0 && awa > 120) {
    reasons.push(`Following seas ${waveHeight.toFixed(1)} m at ${awa.toFixed(0)}° – yaw-induced gybe risk`);
  }

  // 3. Light wind with leftover swell – boom will flop
  if (windSpeed < 8 && waveHeight > 1.0 && awa > 90) {
    reasons.push(`Light wind ${windSpeed.toFixed(0)} kts with ${waveHeight.toFixed(1)} m swell – boom slap risk`);
  }

  if (reasons.length === 0) {
    return { usePreventer: false, reason: '' };
  }

  return {
    usePreventer: true,
    reason: reasons.join('; '),
  };
}

/**
 * Get optimal sailing angles for current conditions
 */
export function getOptimalAngles(
  windSpeed: number,
  sailConfig?: string,
  customPolar?: PolarDiagram
): {
  upwind: { twa: number; speed: number; vmg: number };
  downwind: { twa: number; speed: number; vmg: number };
} {
  const polar = customPolar || LAGOON_440_POLAR;
  return findOptimalVMG(polar, windSpeed, sailConfig);
}

/**
 * Evaluate the recommended storm-handling tactic for a Lagoon 440
 * at a specific waypoint, based on wind speed, wave height, wave period,
 * available sea room, and the equipment on board.
 *
 * Decision matrix (specific to heavy, high-freeboard cruising catamaran):
 *
 *  Wind              | Sea State                    | Tactic
 *  ------------------+------------------------------+--------
 *  < 25 kts          | any                          | normal
 *  25–35 kts         | breaking crests / short freq | heave-to  (caution)
 *  35–45 kts         | breaking crests / short freq | heave-to  (danger)
 *  > 45 kts (or >35  | massive, long-period swells  | run-off   (danger)
 *   w/ bridge deck   | or bridge-deck slamming risk |
 *   slamming risk)   |                              |
 *
 *  Override: If sea room < 20 nm and wind > 35 kts → heave-to regardless
 *            If no drogue available and wind > 45 kts → heave-to + engine assist
 */
export function evaluateStormTactic(
  windSpeed: number,      // TWS in knots
  waveHeight: number,     // metres
  wavePeriod: number,     // seconds between crests (0 = unknown)
  seaRoomNm: number,      // available run downwind before land
  equipment: StormHandlingConfig
): StormHandlingRecommendation {
  // ── Normal conditions ─────────────────────────────────────────
  if (windSpeed < 25) {
    return {
      tactic: 'normal',
      label: 'NORMAL SAILING',
      reason: 'Conditions within normal sailing parameters.',
      details: [],
      severity: 'normal',
    };
  }

  const details: string[] = [];
  let tactic: StormTactic;
  let label: string;
  let reason: string;
  let severity: 'caution' | 'danger';

  // Flags
  const shortPeriodWaves = wavePeriod > 0 && wavePeriod < 8;       // short, steep waves
  const longPeriodSwells  = wavePeriod >= 8;                        // massive rolling swells
  const bridgeDeckRisk    = waveHeight > 3.0 || (waveHeight > 2.5 && shortPeriodWaves);
  const limitedSeaRoom    = seaRoomNm < 20;

  details.push(`Wind: ${windSpeed.toFixed(0)} kts`);
  details.push(`Waves: ${waveHeight.toFixed(1)} m${wavePeriod > 0 ? ` / ${wavePeriod.toFixed(0)}s period` : ''}`);
  details.push(`Sea room: ${seaRoomNm.toFixed(0)} nm downwind`);
  if (equipment.hasParachuteSeaAnchor) details.push('Equipment: Parachute sea anchor available');
  if (equipment.hasJordanSeriesDrogue) details.push('Equipment: Jordan Series Drogue available');

  // ── Survival conditions (> 45 kts) ───────────────────────────
  if (windSpeed > 45) {
    severity = 'danger';

    if (limitedSeaRoom || !equipment.hasJordanSeriesDrogue) {
      // No room or no drogue → heave-to with engine assist
      tactic = 'heave-to';
      label = 'HEAVE-TO (SURVIVAL)';
      reason = limitedSeaRoom
        ? 'Sea room too limited to run off safely. Heave-to with engine assist to hold 45° to seas.'
        : 'No Jordan Series Drogue aboard — running off risks uncontrolled surfing. Heave-to with engine assist.';
      details.push('Use engines at low RPM to help maintain angle to seas');
      details.push('Remove all bimini/flybridge enclosures to reduce windage');
      if (equipment.hasParachuteSeaAnchor) {
        details.push('Deploy parachute sea anchor from bow for maximum stability');
      }
    } else {
      // Drogue + sea room → run off
      tactic = 'run-off';
      label = 'RUN OFF (WITH DROGUE)';
      reason = 'Survival conditions. Run off downwind with Jordan Series Drogue for speed control.';
      details.push('Deploy Jordan Series Drogue from stern');
      details.push('Target 4–5 kts boat speed for steering control');
      details.push('Monitor for bow burying — if surfing accelerates, increase drogue drag');
      if (!equipment.autopilotReliable) {
        details.push('⚠️ Autopilot unreliable — requires active hand-steering');
      }
    }
  }
  // ── Heavy storm (35–45 kts) ───────────────────────────────────
  else if (windSpeed > 35) {
    severity = 'danger';

    if (bridgeDeckRisk && equipment.hasJordanSeriesDrogue && !limitedSeaRoom) {
      // Bridge deck slamming → switch to run off
      tactic = 'run-off';
      label = 'RUN OFF (BRIDGE DECK RISK)';
      reason = 'Bridge deck slamming risk in beam-on heave-to position. Run off to reduce impact.';
      details.push('Wave height risks violent bridge deck hits when hove-to');
      details.push('Deploy Jordan Series Drogue from stern');
      details.push('Remove flybridge enclosures to reduce windage drag');
    } else {
      // Default: heave-to
      tactic = 'heave-to';
      label = 'HEAVE-TO';
      reason = 'Heavy storm conditions. Heave-to to create protective wave slick to windward.';
      details.push('Back storm jib, deep reef main, wheel slightly to windward');
      details.push('Target 40°–60° angle to wind');
      if (bridgeDeckRisk) {
        details.push('⚠️ Monitor bridge deck slamming — if violent, turn downwind immediately');
      }
      details.push('Use engines at low RPM if needed to maintain angle');
    }
  }
  // ── Moderate heavy weather (25–35 kts) ────────────────────────
  else {
    severity = 'caution';
    tactic = 'heave-to';
    label = 'HEAVE-TO (CAUTION)';
    reason = 'Moderate heavy weather. Heave-to if crew needs rest, repairs, or conditions are uncomfortable.';
    details.push('Deeply reef main + backed jib to create slick');
    details.push('Use for crew rest, cooking, or rigging repairs');
    if (waveHeight > 2.0) {
      details.push(`Wave height ${waveHeight.toFixed(1)}m — monitor for bridge deck impact`);
    }

    // Could also motor through at this level
    if (equipment.autopilotReliable) {
      tactic = 'motor';
      label = 'MOTOR THROUGH (or HEAVE-TO)';
      reason = 'Moderate conditions — can motor through with reefed sails or heave-to for crew comfort.';
      details.push('Autopilot reliable — motoring through is viable');
    }
  }

  return { tactic, label, reason, details, severity };
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in nautical miles
 */
export function calculateDistance(
  point1: GPSCoordinates,
  point2: GPSCoordinates
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing between two GPS coordinates
 * Returns bearing in degrees (0-360)
 */
export function calculateBearing(
  point1: GPSCoordinates,
  point2: GPSCoordinates
): number {
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360;
}

/**
 * Calculate estimated time to arrival
 * Returns time in minutes
 */
export function calculateETA(
  distance: number,
  speed: number
): number {
  if (speed <= 0) return 0;
  return (distance / speed) * 60;
}

/**
 * Adjust course for tide/current
 */
export function calculateCourseWithTide(
  desiredCourse: number,
  boatSpeed: number,
  tideSpeed: number,
  tideDirection: number
): { adjustedCourse: number; speedOverGround: number } {
  // Simplified calculation - convert to vectors and add
  const boatVectorX = boatSpeed * Math.sin((desiredCourse * Math.PI) / 180);
  const boatVectorY = boatSpeed * Math.cos((desiredCourse * Math.PI) / 180);

  const tideVectorX = tideSpeed * Math.sin((tideDirection * Math.PI) / 180);
  const tideVectorY = tideSpeed * Math.cos((tideDirection * Math.PI) / 180);

  const resultX = boatVectorX + tideVectorX;
  const resultY = boatVectorY + tideVectorY;

  const speedOverGround = Math.sqrt(resultX * resultX + resultY * resultY);
  let adjustedCourse = (Math.atan2(resultX, resultY) * 180) / Math.PI;
  if (adjustedCourse < 0) adjustedCourse += 360;

  return { adjustedCourse, speedOverGround };
}
