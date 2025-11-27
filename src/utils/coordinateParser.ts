// Comprehensive Coordinate Parser
// Supports: DD (Decimal Degrees), DDM (Degrees Decimal Minutes), DMS (Degrees Minutes Seconds), Plus Codes

import * as Location from 'expo-location';
import { decode as decodePlusCode, isValid as isValidPlusCode } from 'open-location-code';
import { GPSCoordinates } from '../types/sailing';

/**
 * Parse coordinates in various formats:
 * - DD: 25.7617, -80.1918 or N25.7617 W80.1918
 * - DDM: 25°45.7020'N, 80°11.5080'W or 25 45.702 N, 80 11.508 W
 * - DMS: 25°45'42.12"N, 80°11'30.48"W or 25 45 42.12 N, 80 11 30.48 W
 * - Plus Code: 76QXQR6R+6P or 76QXQR6R+6P Miami
 * - Location name: "Miami, FL" (geocoded)
 */
export async function parseLocationInput(input: string): Promise<GPSCoordinates | null> {
  const trimmed = input.trim();

  // Try Plus Code first (unique format)
  const plusCodeResult = parsePlusCode(trimmed);
  if (plusCodeResult) return plusCodeResult;

  // Try DMS (most specific format)
  const dmsResult = parseDMS(trimmed);
  if (dmsResult) return dmsResult;

  // Try DDM
  const ddmResult = parseDDM(trimmed);
  if (ddmResult) return ddmResult;

  // Try DD (decimal degrees)
  const ddResult = parseDD(trimmed);
  if (ddResult) return ddResult;

  // Try geocoding as location name
  return await geocodeLocation(trimmed);
}

/**
 * Parse Decimal Degrees (DD)
 * Examples:
 * - 25.7617, -80.1918
 * - N25.7617 W80.1918
 * - 25.7617N, 80.1918W
 */
function parseDD(input: string): GPSCoordinates | null {
  // Pattern 1: Simple comma-separated
  const simpleMatch = input.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (simpleMatch) {
    const lat = parseFloat(simpleMatch[1]);
    const lon = parseFloat(simpleMatch[2]);
    if (isValidCoordinate(lat, lon)) {
      return { latitude: lat, longitude: lon };
    }
  }

  // Pattern 2: With N/S/E/W indicators
  const hemisphereMatch = input.match(
    /([NS])?\s*(-?\d+\.?\d*)\s*([NS])?\s*[,\s]+([EW])?\s*(-?\d+\.?\d*)\s*([EW])?/i
  );
  if (hemisphereMatch) {
    let lat = parseFloat(hemisphereMatch[2]);
    let lon = parseFloat(hemisphereMatch[5]);

    // Apply hemisphere indicators
    const latHemi = hemisphereMatch[1] || hemisphereMatch[3];
    const lonHemi = hemisphereMatch[4] || hemisphereMatch[6];

    if (latHemi && latHemi.toUpperCase() === 'S') lat = -Math.abs(lat);
    if (latHemi && latHemi.toUpperCase() === 'N') lat = Math.abs(lat);
    if (lonHemi && lonHemi.toUpperCase() === 'W') lon = -Math.abs(lon);
    if (lonHemi && lonHemi.toUpperCase() === 'E') lon = Math.abs(lon);

    if (isValidCoordinate(lat, lon)) {
      return { latitude: lat, longitude: lon };
    }
  }

  return null;
}

/**
 * Parse Degrees Decimal Minutes (DDM)
 * Examples:
 * - 25°45.7020'N, 80°11.5080'W
 * - 25 45.702 N, 80 11.508 W
 * - N25°45.702', W80°11.508'
 */
function parseDDM(input: string): GPSCoordinates | null {
  const ddmPattern = /([NS])?\s*(\d+)[°\s]+(\d+\.?\d*)['\s]*([NS])?\s*[,\s]+([EW])?\s*(\d+)[°\s]+(\d+\.?\d*)['\s]*([EW])?/i;
  const match = input.match(ddmPattern);

  if (match) {
    const latDeg = parseFloat(match[2]);
    const latMin = parseFloat(match[3]);
    const lonDeg = parseFloat(match[6]);
    const lonMin = parseFloat(match[7]);

    let lat = latDeg + latMin / 60;
    let lon = lonDeg + lonMin / 60;

    // Apply hemisphere indicators
    const latHemi = match[1] || match[4];
    const lonHemi = match[5] || match[8];

    if (latHemi && latHemi.toUpperCase() === 'S') lat = -lat;
    if (lonHemi && lonHemi.toUpperCase() === 'W') lon = -lon;

    if (isValidCoordinate(lat, lon)) {
      return { latitude: lat, longitude: lon };
    }
  }

  return null;
}

/**
 * Parse Degrees Minutes Seconds (DMS)
 * Examples:
 * - 25°45'42.12"N, 80°11'30.48"W
 * - 25 45 42.12 N, 80 11 30.48 W
 * - N25°45'42", W80°11'30"
 */
function parseDMS(input: string): GPSCoordinates | null {
  const dmsPattern = /([NS])?\s*(\d+)[°\s]+(\d+)['\s]+(\d+\.?\d*)["'\s]*([NS])?\s*[,\s]+([EW])?\s*(\d+)[°\s]+(\d+)['\s]+(\d+\.?\d*)["'\s]*([EW])?/i;
  const match = input.match(dmsPattern);

  if (match) {
    const latDeg = parseFloat(match[2]);
    const latMin = parseFloat(match[3]);
    const latSec = parseFloat(match[4]);
    const lonDeg = parseFloat(match[7]);
    const lonMin = parseFloat(match[8]);
    const lonSec = parseFloat(match[9]);

    let lat = latDeg + latMin / 60 + latSec / 3600;
    let lon = lonDeg + lonMin / 60 + lonSec / 3600;

    // Apply hemisphere indicators
    const latHemi = match[1] || match[5];
    const lonHemi = match[6] || match[10];

    if (latHemi && latHemi.toUpperCase() === 'S') lat = -lat;
    if (lonHemi && lonHemi.toUpperCase() === 'W') lon = -lon;

    if (isValidCoordinate(lat, lon)) {
      return { latitude: lat, longitude: lon };
    }
  }

  return null;
}

/**
 * Parse Google Plus Code (Open Location Code)
 * Examples:
 * - 76QXQR6R+6P
 * - 76QXQR6R+6P Miami
 * - 76QX+QR Miami, FL
 */
function parsePlusCode(input: string): GPSCoordinates | null {
  // Extract potential plus code (8 or 10 characters with + sign)
  const plusCodeMatch = input.match(/([23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,3})/i);

  if (plusCodeMatch) {
    const code = plusCodeMatch[1].toUpperCase();

    try {
      if (isValidPlusCode(code)) {
        const decoded = decodePlusCode(code);
        const lat = decoded.latitudeCenter;
        const lon = decoded.longitudeCenter;

        if (isValidCoordinate(lat, lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    } catch (err) {
      console.error('Plus code parsing error:', err);
    }
  }

  return null;
}

/**
 * Geocode location name using Expo Location API
 */
async function geocodeLocation(locationName: string): Promise<GPSCoordinates | null> {
  try {
    const results = await Location.geocodeAsync(locationName);
    if (results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }

  return null;
}

/**
 * Validate coordinate values
 */
function isValidCoordinate(lat: number, lon: number): boolean {
  return !isNaN(lat) && !isNaN(lon) &&
         lat >= -90 && lat <= 90 &&
         lon >= -180 && lon <= 180;
}

/**
 * Format coordinates to DD (Decimal Degrees) string
 */
export function formatToDD(coords: GPSCoordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * Format coordinates to DDM (Degrees Decimal Minutes) string
 */
export function formatToDDM(coords: GPSCoordinates): string {
  const latDeg = Math.floor(Math.abs(coords.latitude));
  const latMin = (Math.abs(coords.latitude) - latDeg) * 60;
  const latHemi = coords.latitude >= 0 ? 'N' : 'S';

  const lonDeg = Math.floor(Math.abs(coords.longitude));
  const lonMin = (Math.abs(coords.longitude) - lonDeg) * 60;
  const lonHemi = coords.longitude >= 0 ? 'E' : 'W';

  return `${latDeg}°${latMin.toFixed(4)}'${latHemi}, ${lonDeg}°${lonMin.toFixed(4)}'${lonHemi}`;
}

/**
 * Format coordinates to DMS (Degrees Minutes Seconds) string
 */
export function formatToDMS(coords: GPSCoordinates): string {
  const latDeg = Math.floor(Math.abs(coords.latitude));
  const latMinTotal = (Math.abs(coords.latitude) - latDeg) * 60;
  const latMin = Math.floor(latMinTotal);
  const latSec = (latMinTotal - latMin) * 60;
  const latHemi = coords.latitude >= 0 ? 'N' : 'S';

  const lonDeg = Math.floor(Math.abs(coords.longitude));
  const lonMinTotal = (Math.abs(coords.longitude) - lonDeg) * 60;
  const lonMin = Math.floor(lonMinTotal);
  const lonSec = (lonMinTotal - lonMin) * 60;
  const lonHemi = coords.longitude >= 0 ? 'E' : 'W';

  return `${latDeg}°${latMin}'${latSec.toFixed(2)}"${latHemi}, ${lonDeg}°${lonMin}'${lonSec.toFixed(2)}"${lonHemi}`;
}

/**
 * Get example formats for user help
 */
export function getCoordinateFormatExamples(): string[] {
  return [
    'DD: 25.7617, -80.1918',
    'DDM: 25°45.7020\'N, 80°11.5080\'W',
    'DMS: 25°45\'42"N, 80°11\'30"W',
    'Plus Code: 76QXQR6R+6P',
    'Location: Miami, FL',
  ];
}
