// Google Maps integration service for displaying sailing routes and locations
// Supports both web and mobile platforms

import { GPSCoordinates } from '../types/sailing';

export interface GoogleMapsConfig {
  apiKey?: string;
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  zoom?: number;
  center?: GPSCoordinates;
}

export interface MapMarker {
  id: string;
  position: GPSCoordinates;
  title: string;
  description?: string;
  icon?: string;
  infoWindow?: boolean;
}

export interface MapPolyline {
  id: string;
  path: GPSCoordinates[];
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
}

class GoogleMapsService {
  private apiKey: string = '';
  private config: GoogleMapsConfig = {
    mapType: 'roadmap',
    zoom: 13,
  };

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  setConfig(config: Partial<GoogleMapsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): GoogleMapsConfig {
    return this.config;
  }

  /**
   * Generate Google Maps Embed URL for displaying a map in a web view or iframe
   */
  generateEmbedUrl(center: GPSCoordinates, zoom: number = 13): string {
    if (!this.apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      center: `${center.latitude},${center.longitude}`,
      zoom: zoom.toString(),
      maptype: this.config.mapType || 'roadmap',
    });

    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
  }

  /**
   * Generate Google Maps URL for opening in browser or maps app
   */
  generateMapUrl(
    center: GPSCoordinates,
    markers?: MapMarker[],
    polylines?: MapPolyline[]
  ): string {
    const baseUrl = 'https://www.google.com/maps?';
    const params = new URLSearchParams();

    // Add center point
    params.set('center', `${center.latitude},${center.longitude}`);
    params.set('zoom', (this.config.zoom || 13).toString());

    // Add markers
    if (markers && markers.length > 0) {
      const markerStr = markers
        .map(m => `${m.position.latitude},${m.position.longitude}(${m.title})`)
        .join('/');
      params.set('markers', markerStr);
    }

    // Add polylines (path routing)
    if (polylines && polylines.length > 0) {
      const pathStr = polylines[0].path
        .map(p => `${p.latitude},${p.longitude}`)
        .join('|');
      params.set('path', pathStr);
    }

    return baseUrl + params.toString();
  }

  /**
   * Generate Google Maps Static API URL for static map images
   */
  generateStaticMapUrl(
    center: GPSCoordinates,
    markers?: MapMarker[],
    width: number = 400,
    height: number = 300,
    zoom: number = 13
  ): string {
    if (!this.apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      center: `${center.latitude},${center.longitude}`,
      zoom: zoom.toString(),
      size: `${width}x${height}`,
      maptype: this.config.mapType || 'roadmap',
    });

    // Add markers to static map
    if (markers && markers.length > 0) {
      markers.forEach((marker, index) => {
        const markerParam = `markers=color:red%7Clabel:${String.fromCharCode(65 + index)}%7C${marker.position.latitude},${marker.position.longitude}`;
        params.append('markers', markerParam);
      });
    }

    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in nautical miles (for sailing)
   */
  calculateDistance(from: GPSCoordinates, to: GPSCoordinates): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.degreesToRadians(to.latitude - from.latitude);
    const dLong = this.degreesToRadians(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(from.latitude)) *
      Math.cos(this.degreesToRadians(to.latitude)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Generate directions URL for Google Maps navigation
   */
  generateDirectionsUrl(origin: GPSCoordinates, destination: GPSCoordinates): string {
    const params = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      travelmode: 'driving',
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  /**
   * Calculate bearing from one coordinate to another (in degrees)
   */
  calculateBearing(from: GPSCoordinates, to: GPSCoordinates): number {
    const dLong = this.degreesToRadians(to.longitude - from.longitude);
    const lat1 = this.degreesToRadians(from.latitude);
    const lat2 = this.degreesToRadians(to.latitude);

    const y = Math.sin(dLong) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLong);
    const bearing = this.radiansToDegrees(Math.atan2(y, x));

    return (bearing + 360) % 360;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

let googleMapsServiceInstance: GoogleMapsService | null = null;

export function initializeGoogleMapsService(apiKey?: string): GoogleMapsService {
  if (!googleMapsServiceInstance) {
    googleMapsServiceInstance = new GoogleMapsService(apiKey);
  } else if (apiKey) {
    googleMapsServiceInstance.setApiKey(apiKey);
  }
  return googleMapsServiceInstance;
}

export function getGoogleMapsService(): GoogleMapsService {
  if (!googleMapsServiceInstance) {
    googleMapsServiceInstance = new GoogleMapsService();
  }
  return googleMapsServiceInstance;
}

export default GoogleMapsService;
