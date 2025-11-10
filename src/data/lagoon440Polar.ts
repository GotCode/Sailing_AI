// Comprehensive Lagoon 440 Polar Diagram Data
// Based on published performance data and sailing characteristics

import { PolarDiagram, SailPolarData } from '../types/polar';

/**
 * Factory specification for Lagoon 440:
 * - Length: 13.61m (44.7 ft)
 * - Beam: 7.7m (25.3 ft)
 * - Displacement: 12,000 kg (26,455 lbs)
 * - Sail area: 103 m² upwind, 213 m² with spinnaker
 * - Draft: 1.25m (4.1 ft)
 */

export const LAGOON_440_POLAR: PolarDiagram = {
  id: 'lagoon-440-default',
  name: 'Lagoon 440 - Factory Standard',
  boatType: 'Catamaran',
  boatModel: 'Lagoon 440',
  description: 'Factory standard polar diagram for Lagoon 440 catamaran. Based on clean hull, standard sails, and normal cruising load.',
  length: 13.61,
  beam: 7.7,
  displacement: 12.0,
  sailArea: {
    main: 54,
    jib: 49,
    genoa: 58,
    spinnaker: 110,
    asymmetrical: 105,
    codeZero: 95,
  },
  polarData: [
    // Main + Jib (Standard upwind/reaching configuration)
    {
      sailConfig: 'Main + Jib',
      description: 'Standard cruising configuration for upwind and reaching',
      windRange: { min: 6, max: 30 },
      curves: [
        {
          tws: 6,
          points: [
            { twa: 40, speed: 4.2, vmg: 3.2 },
            { twa: 45, speed: 4.5, vmg: 3.2 },
            { twa: 50, speed: 4.9, vmg: 3.1 },
            { twa: 52, speed: 5.1, vmg: 3.1 },
            { twa: 60, speed: 5.4, vmg: 2.7 },
            { twa: 75, speed: 5.6, vmg: 1.4 },
            { twa: 90, speed: 5.5, vmg: 0 },
            { twa: 110, speed: 5.2, vmg: -1.8 },
            { twa: 120, speed: 4.9, vmg: -2.4 },
            { twa: 135, speed: 4.5, vmg: -3.2 },
            { twa: 150, speed: 4.0, vmg: -3.5 },
            { twa: 165, speed: 3.5, vmg: -3.4 },
            { twa: 180, speed: 3.2, vmg: -3.2 },
          ],
        },
        {
          tws: 8,
          points: [
            { twa: 40, speed: 5.1, vmg: 3.9 },
            { twa: 45, speed: 5.5, vmg: 3.9 },
            { twa: 50, speed: 5.9, vmg: 3.8 },
            { twa: 52, speed: 6.0, vmg: 3.7 },
            { twa: 60, speed: 6.4, vmg: 3.2 },
            { twa: 75, speed: 6.7, vmg: 1.7 },
            { twa: 90, speed: 6.6, vmg: 0 },
            { twa: 110, speed: 6.3, vmg: -2.2 },
            { twa: 120, speed: 6.0, vmg: -3.0 },
            { twa: 135, speed: 5.5, vmg: -3.9 },
            { twa: 150, speed: 5.0, vmg: -4.3 },
            { twa: 165, speed: 4.4, vmg: -4.3 },
            { twa: 180, speed: 4.0, vmg: -4.0 },
          ],
        },
        {
          tws: 10,
          points: [
            { twa: 40, speed: 5.8, vmg: 4.4 },
            { twa: 45, speed: 6.3, vmg: 4.5 },
            { twa: 50, speed: 6.8, vmg: 4.4 },
            { twa: 52, speed: 6.7, vmg: 4.1 },
            { twa: 60, speed: 7.2, vmg: 3.6 },
            { twa: 75, speed: 7.6, vmg: 2.0 },
            { twa: 90, speed: 7.5, vmg: 0 },
            { twa: 110, speed: 7.2, vmg: -2.5 },
            { twa: 120, speed: 6.9, vmg: -3.5 },
            { twa: 135, speed: 6.4, vmg: -4.5 },
            { twa: 150, speed: 5.8, vmg: -5.0 },
            { twa: 165, speed: 5.1, vmg: -5.0 },
            { twa: 180, speed: 4.7, vmg: -4.7 },
          ],
        },
        {
          tws: 12,
          points: [
            { twa: 40, speed: 6.3, vmg: 4.8 },
            { twa: 45, speed: 6.9, vmg: 4.9 },
            { twa: 50, speed: 7.5, vmg: 4.8 },
            { twa: 52, speed: 7.3, vmg: 4.5 },
            { twa: 60, speed: 7.9, vmg: 4.0 },
            { twa: 75, speed: 8.4, vmg: 2.2 },
            { twa: 90, speed: 8.3, vmg: 0 },
            { twa: 110, speed: 8.0, vmg: -2.7 },
            { twa: 120, speed: 7.6, vmg: -3.8 },
            { twa: 135, speed: 7.1, vmg: -5.0 },
            { twa: 150, speed: 6.5, vmg: -5.6 },
            { twa: 165, speed: 5.7, vmg: -5.6 },
            { twa: 180, speed: 5.2, vmg: -5.2 },
          ],
        },
        {
          tws: 14,
          points: [
            { twa: 40, speed: 6.7, vmg: 5.1 },
            { twa: 45, speed: 7.4, vmg: 5.2 },
            { twa: 50, speed: 8.1, vmg: 5.2 },
            { twa: 52, speed: 7.8, vmg: 4.8 },
            { twa: 60, speed: 8.5, vmg: 4.3 },
            { twa: 75, speed: 9.0, vmg: 2.3 },
            { twa: 90, speed: 8.9, vmg: 0 },
            { twa: 110, speed: 8.6, vmg: -2.9 },
            { twa: 120, speed: 8.2, vmg: -4.1 },
            { twa: 135, speed: 7.7, vmg: -5.4 },
            { twa: 150, speed: 7.0, vmg: -6.1 },
            { twa: 165, speed: 6.2, vmg: -6.1 },
            { twa: 180, speed: 5.6, vmg: -5.6 },
          ],
        },
        {
          tws: 16,
          points: [
            { twa: 40, speed: 7.0, vmg: 5.4 },
            { twa: 45, speed: 7.8, vmg: 5.5 },
            { twa: 50, speed: 8.6, vmg: 5.5 },
            { twa: 52, speed: 8.2, vmg: 5.0 },
            { twa: 60, speed: 8.9, vmg: 4.5 },
            { twa: 75, speed: 9.5, vmg: 2.5 },
            { twa: 90, speed: 9.4, vmg: 0 },
            { twa: 110, speed: 9.1, vmg: -3.1 },
            { twa: 120, speed: 8.7, vmg: -4.4 },
            { twa: 135, speed: 8.1, vmg: -5.7 },
            { twa: 150, speed: 7.4, vmg: -6.4 },
            { twa: 165, speed: 6.5, vmg: -6.4 },
            { twa: 180, speed: 5.9, vmg: -5.9 },
          ],
        },
        {
          tws: 20,
          points: [
            { twa: 40, speed: 7.4, vmg: 5.7 },
            { twa: 45, speed: 8.3, vmg: 5.9 },
            { twa: 50, speed: 9.2, vmg: 5.9 },
            { twa: 52, speed: 8.7, vmg: 5.3 },
            { twa: 60, speed: 9.5, vmg: 4.8 },
            { twa: 75, speed: 10.2, vmg: 2.6 },
            { twa: 90, speed: 10.1, vmg: 0 },
            { twa: 110, speed: 9.8, vmg: -3.4 },
            { twa: 120, speed: 9.3, vmg: -4.7 },
            { twa: 135, speed: 8.7, vmg: -6.2 },
            { twa: 150, speed: 8.0, vmg: -6.9 },
            { twa: 165, speed: 7.0, vmg: -6.9 },
            { twa: 180, speed: 6.4, vmg: -6.4 },
          ],
        },
        {
          tws: 25,
          points: [
            { twa: 40, speed: 7.7, vmg: 5.9 },
            { twa: 45, speed: 8.7, vmg: 6.2 },
            { twa: 50, speed: 9.7, vmg: 6.2 },
            { twa: 52, speed: 9.1, vmg: 5.6 },
            { twa: 60, speed: 10.0, vmg: 5.0 },
            { twa: 75, speed: 10.7, vmg: 2.8 },
            { twa: 90, speed: 10.6, vmg: 0 },
            { twa: 110, speed: 10.3, vmg: -3.5 },
            { twa: 120, speed: 9.8, vmg: -4.9 },
            { twa: 135, speed: 9.2, vmg: -6.5 },
            { twa: 150, speed: 8.4, vmg: -7.3 },
            { twa: 165, speed: 7.4, vmg: -7.3 },
            { twa: 180, speed: 6.7, vmg: -6.7 },
          ],
        },
      ],
    },
    // Main + Genoa (Light air/racing configuration)
    {
      sailConfig: 'Main + Genoa',
      description: 'Larger headsail for better light air performance',
      windRange: { min: 4, max: 20 },
      curves: [
        {
          tws: 6,
          points: [
            { twa: 40, speed: 4.5, vmg: 3.4 },
            { twa: 45, speed: 4.9, vmg: 3.5 },
            { twa: 52, speed: 5.4, vmg: 3.3 },
            { twa: 60, speed: 5.7, vmg: 2.9 },
            { twa: 75, speed: 5.9, vmg: 1.5 },
            { twa: 90, speed: 5.8, vmg: 0 },
            { twa: 110, speed: 5.4, vmg: -1.8 },
            { twa: 120, speed: 5.1, vmg: -2.6 },
            { twa: 135, speed: 4.7, vmg: -3.3 },
            { twa: 150, speed: 4.2, vmg: -3.6 },
            { twa: 180, speed: 3.4, vmg: -3.4 },
          ],
        },
        {
          tws: 10,
          points: [
            { twa: 40, speed: 6.2, vmg: 4.7 },
            { twa: 45, speed: 6.7, vmg: 4.7 },
            { twa: 52, speed: 7.1, vmg: 4.4 },
            { twa: 60, speed: 7.6, vmg: 3.8 },
            { twa: 75, speed: 8.0, vmg: 2.1 },
            { twa: 90, speed: 7.9, vmg: 0 },
            { twa: 110, speed: 7.5, vmg: -2.6 },
            { twa: 120, speed: 7.1, vmg: -3.6 },
            { twa: 135, speed: 6.6, vmg: -4.7 },
            { twa: 150, speed: 6.0, vmg: -5.2 },
            { twa: 180, speed: 4.9, vmg: -4.9 },
          ],
        },
      ],
    },
    // Main + Spinnaker (Downwind performance)
    {
      sailConfig: 'Main + Spinnaker',
      description: 'Symmetric spinnaker for deep downwind angles',
      windRange: { min: 6, max: 20 },
      curves: [
        {
          tws: 10,
          points: [
            { twa: 90, speed: 8.5, vmg: 0 },
            { twa: 110, speed: 9.2, vmg: -3.1 },
            { twa: 120, speed: 9.8, vmg: -4.9 },
            { twa: 135, speed: 10.1, vmg: -7.1 },
            { twa: 150, speed: 9.8, vmg: -8.5 },
            { twa: 165, speed: 9.2, vmg: -9.0 },
            { twa: 180, speed: 8.7, vmg: -8.7 },
          ],
        },
        {
          tws: 14,
          points: [
            { twa: 90, speed: 10.2, vmg: 0 },
            { twa: 110, speed: 11.1, vmg: -3.8 },
            { twa: 120, speed: 11.8, vmg: -5.9 },
            { twa: 135, speed: 12.1, vmg: -8.6 },
            { twa: 150, speed: 11.7, vmg: -10.1 },
            { twa: 165, speed: 11.0, vmg: -10.8 },
            { twa: 180, speed: 10.4, vmg: -10.4 },
          ],
        },
        {
          tws: 18,
          points: [
            { twa: 90, speed: 11.5, vmg: 0 },
            { twa: 110, speed: 12.5, vmg: -4.3 },
            { twa: 120, speed: 13.2, vmg: -6.6 },
            { twa: 135, speed: 13.5, vmg: -9.5 },
            { twa: 150, speed: 13.0, vmg: -11.3 },
            { twa: 165, speed: 12.2, vmg: -12.0 },
            { twa: 180, speed: 11.5, vmg: -11.5 },
          ],
        },
      ],
    },
    // Main + Asymmetrical (Reaching spinnaker)
    {
      sailConfig: 'Main + Asymmetrical',
      description: 'Asymmetrical spinnaker for fast reaching',
      windRange: { min: 6, max: 25 },
      curves: [
        {
          tws: 10,
          points: [
            { twa: 60, speed: 8.2, vmg: 4.1 },
            { twa: 75, speed: 9.1, vmg: 2.4 },
            { twa: 90, speed: 9.8, vmg: 0 },
            { twa: 110, speed: 10.5, vmg: -3.6 },
            { twa: 120, speed: 10.8, vmg: -5.4 },
            { twa: 135, speed: 10.4, vmg: -7.4 },
            { twa: 150, speed: 9.5, vmg: -8.2 },
            { twa: 165, speed: 8.4, vmg: -8.2 },
          ],
        },
        {
          tws: 14,
          points: [
            { twa: 60, speed: 9.8, vmg: 4.9 },
            { twa: 75, speed: 10.9, vmg: 2.8 },
            { twa: 90, speed: 11.7, vmg: 0 },
            { twa: 110, speed: 12.5, vmg: -4.3 },
            { twa: 120, speed: 12.9, vmg: -6.5 },
            { twa: 135, speed: 12.4, vmg: -8.8 },
            { twa: 150, speed: 11.3, vmg: -9.8 },
            { twa: 165, speed: 10.0, vmg: -9.8 },
          ],
        },
        {
          tws: 18,
          points: [
            { twa: 60, speed: 11.0, vmg: 5.5 },
            { twa: 75, speed: 12.2, vmg: 3.2 },
            { twa: 90, speed: 13.1, vmg: 0 },
            { twa: 110, speed: 13.9, vmg: -4.8 },
            { twa: 120, speed: 14.3, vmg: -7.2 },
            { twa: 135, speed: 13.7, vmg: -9.7 },
            { twa: 150, speed: 12.5, vmg: -10.8 },
            { twa: 165, speed: 11.0, vmg: -10.8 },
          ],
        },
      ],
    },
    // Code Zero (Light air reacher)
    {
      sailConfig: 'Code Zero',
      description: 'Code zero for light air reaching and close reaching',
      windRange: { min: 3, max: 12 },
      curves: [
        {
          tws: 6,
          points: [
            { twa: 40, speed: 5.0, vmg: 3.8 },
            { twa: 50, speed: 5.8, vmg: 3.7 },
            { twa: 60, speed: 6.4, vmg: 3.2 },
            { twa: 75, speed: 6.8, vmg: 1.8 },
            { twa: 90, speed: 6.9, vmg: 0 },
            { twa: 110, speed: 6.5, vmg: -2.2 },
            { twa: 120, speed: 6.0, vmg: -3.0 },
          ],
        },
        {
          tws: 10,
          points: [
            { twa: 40, speed: 7.2, vmg: 5.5 },
            { twa: 50, speed: 8.3, vmg: 5.3 },
            { twa: 60, speed: 9.1, vmg: 4.6 },
            { twa: 75, speed: 9.7, vmg: 2.5 },
            { twa: 90, speed: 9.9, vmg: 0 },
            { twa: 110, speed: 9.3, vmg: -3.2 },
            { twa: 120, speed: 8.5, vmg: -4.3 },
          ],
        },
      ],
    },
    // Storm Jib + Reefed Main (Heavy weather)
    {
      sailConfig: 'Storm Jib + Reefed Main',
      description: 'Heavy weather configuration with reduced sail area',
      windRange: { min: 25, max: 50 },
      curves: [
        {
          tws: 30,
          points: [
            { twa: 45, speed: 6.5, vmg: 4.6 },
            { twa: 52, speed: 6.8, vmg: 4.2 },
            { twa: 60, speed: 7.2, vmg: 3.6 },
            { twa: 75, speed: 7.5, vmg: 1.9 },
            { twa: 90, speed: 7.4, vmg: 0 },
            { twa: 110, speed: 7.0, vmg: -2.4 },
            { twa: 120, speed: 6.6, vmg: -3.3 },
            { twa: 135, speed: 6.1, vmg: -4.3 },
            { twa: 150, speed: 5.5, vmg: -4.8 },
            { twa: 180, speed: 4.8, vmg: -4.8 },
          ],
        },
        {
          tws: 40,
          points: [
            { twa: 45, speed: 7.2, vmg: 5.1 },
            { twa: 52, speed: 7.5, vmg: 4.6 },
            { twa: 60, speed: 7.9, vmg: 4.0 },
            { twa: 75, speed: 8.2, vmg: 2.1 },
            { twa: 90, speed: 8.1, vmg: 0 },
            { twa: 110, speed: 7.7, vmg: -2.6 },
            { twa: 120, speed: 7.2, vmg: -3.6 },
            { twa: 135, speed: 6.7, vmg: -4.7 },
            { twa: 150, speed: 6.0, vmg: -5.2 },
            { twa: 180, speed: 5.2, vmg: -5.2 },
          ],
        },
      ],
    },
  ],
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  isDefault: true,
};

/**
 * Get speed from polar for given conditions
 */
export function getSpeedFromPolar(
  polar: PolarDiagram,
  tws: number,
  twa: number,
  sailConfig?: string
): number {
  // Normalize TWA to 0-180 range
  const normalizedTWA = twa > 180 ? 360 - twa : twa;

  // Find matching sail configuration or use first one
  let polarData = polar.polarData[0];
  if (sailConfig) {
    const match = polar.polarData.find((pd) => pd.sailConfig === sailConfig);
    if (match) polarData = match;
  }

  // Find closest wind speed curves
  const curves = polarData.curves.sort((a, b) => a.tws - b.tws);
  let lowerCurve = curves[0];
  let upperCurve = curves[curves.length - 1];

  for (let i = 0; i < curves.length - 1; i++) {
    if (tws >= curves[i].tws && tws <= curves[i + 1].tws) {
      lowerCurve = curves[i];
      upperCurve = curves[i + 1];
      break;
    }
  }

  // Interpolate between curves
  const weight = (tws - lowerCurve.tws) / (upperCurve.tws - lowerCurve.tws || 1);

  // Get speeds at TWA from both curves
  const lowerSpeed = interpolateSpeed(lowerCurve, normalizedTWA);
  const upperSpeed = interpolateSpeed(upperCurve, normalizedTWA);

  // Interpolate between the two speeds
  return lowerSpeed + (upperSpeed - lowerSpeed) * weight;
}

/**
 * Interpolate speed for a given TWA within a curve
 */
function interpolateSpeed(curve: any, twa: number): number {
  const points = curve.points.sort((a: any, b: any) => a.twa - b.twa);

  // Find surrounding points
  let lowerPoint = points[0];
  let upperPoint = points[points.length - 1];

  for (let i = 0; i < points.length - 1; i++) {
    if (twa >= points[i].twa && twa <= points[i + 1].twa) {
      lowerPoint = points[i];
      upperPoint = points[i + 1];
      break;
    }
  }

  // Linear interpolation
  const weight = (twa - lowerPoint.twa) / (upperPoint.twa - lowerPoint.twa || 1);
  return lowerPoint.speed + (upperPoint.speed - lowerPoint.speed) * weight;
}

/**
 * Calculate VMG (Velocity Made Good)
 */
export function calculateVMG(speed: number, twa: number): number {
  const twaRad = (twa * Math.PI) / 180;
  return speed * Math.cos(twaRad);
}

/**
 * Find optimal VMG angles
 */
export function findOptimalVMG(
  polar: PolarDiagram,
  tws: number,
  sailConfig?: string
): { upwind: { twa: number; speed: number; vmg: number }; downwind: { twa: number; speed: number; vmg: number } } {
  let bestUpwindVMG = -Infinity;
  let bestDownwindVMG = Infinity;
  let upwindResult = { twa: 45, speed: 0, vmg: 0 };
  let downwindResult = { twa: 135, speed: 0, vmg: 0 };

  // Check angles from 30 to 180 degrees
  for (let twa = 30; twa <= 180; twa += 1) {
    const speed = getSpeedFromPolar(polar, tws, twa, sailConfig);
    const vmg = calculateVMG(speed, twa);

    // Upwind (positive VMG, TWA < 90)
    if (twa < 90 && vmg > bestUpwindVMG) {
      bestUpwindVMG = vmg;
      upwindResult = { twa, speed, vmg };
    }

    // Downwind (negative VMG, TWA > 90)
    if (twa > 90 && vmg < bestDownwindVMG) {
      bestDownwindVMG = vmg;
      downwindResult = { twa, speed, vmg: Math.abs(vmg) };
    }
  }

  return { upwind: upwindResult, downwind: downwindResult };
}
