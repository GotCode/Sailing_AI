// Windy.com API integration service

import axios from 'axios';
import { WindForecast, GPSCoordinates } from '../types/sailing';

/**
 * Windy.com Point Forecast API
 * API Key is included in the request body
 * Register at https://api.windy.com/keys
 */

const WINDY_API_BASE_URL = 'https://api.windy.com/api';

export class WindyService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch wind forecast for a specific location
   */
  async getWindForecast(
    coordinates: GPSCoordinates,
    hours: number = 24
  ): Promise<{ forecasts: WindForecast[]; error?: string }> {
    try {
      if (!this.apiKey || this.apiKey === 'YOUR_WINDY_API_KEY') {
        return {
          forecasts: [],
          error: 'Windy.com API key not configured. Please add your API Key in Settings.',
        };
      }

      // Windy Point Forecast API - key goes in request body
      // Use gfs model for wind data (waves requires gfsWave model)
      const response = await axios.post(
        `${WINDY_API_BASE_URL}/point-forecast/v2`,
        {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          model: 'gfs',
          parameters: ['wind', 'windGust'],
          levels: ['surface'],
          key: this.apiKey,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data && response.data.ts && response.data['wind_u-surface']) {
        return this.parseWindyResponse(response.data);
      } else {
        return {
          forecasts: [],
          error: 'Invalid response from Windy.com API',
        };
      }
    } catch (error: any) {
      console.error('Error fetching wind forecast:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      let errorMessage = 'Failed to fetch wind forecast from Windy.com';

      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const responseData = error.response.data;
        const errorData = responseData?.error || responseData?.message || responseData || error.response.statusText;

        console.error('Full error response:', JSON.stringify(responseData));

        if (status === 401 || status === 403) {
          errorMessage = `Authentication failed (${status}): ${typeof errorData === 'object' ? JSON.stringify(errorData) : errorData}`;
        } else if (status === 429) {
          errorMessage = 'API rate limit exceeded. Try again later.';
        } else if (status === 400) {
          errorMessage = `Bad request (${status}): ${typeof errorData === 'object' ? JSON.stringify(errorData) : errorData}`;
        } else {
          errorMessage = `Windy.com API error (${status}): ${typeof errorData === 'object' ? JSON.stringify(errorData) : errorData}`;
        }
      } else if (error.request) {
        // No response received
        errorMessage = 'No response from Windy.com API. Check your internet connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }

      return {
        forecasts: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Parse Windy API response into WindForecast objects
   */
  private parseWindyResponse(data: any): { forecasts: WindForecast[]; error?: string } {
    const forecasts: WindForecast[] = [];

    try {
      const timestamps = data.ts || [];
      const windU = data['wind_u-surface'] || [];
      const windV = data['wind_v-surface'] || [];
      const gust = data['windGust-surface'] || [];

      for (let i = 0; i < timestamps.length; i++) {
        const u = windU[i] || 0;
        const v = windV[i] || 0;

        // Calculate wind speed from u and v components (m/s to knots)
        const windSpeedMS = Math.sqrt(u * u + v * v);
        const windSpeedKnots = windSpeedMS * 1.94384;

        // Calculate wind direction from u and v components
        // Wind direction is where the wind comes FROM
        let windDirection = (Math.atan2(-u, -v) * 180) / Math.PI;
        if (windDirection < 0) windDirection += 360;

        // Gust speed (m/s to knots)
        const gustSpeedKnots = (gust[i] || windSpeedMS) * 1.94384;

        forecasts.push({
          timestamp: new Date(timestamps[i]),
          windSpeed: Math.round(windSpeedKnots * 10) / 10,
          windDirection: Math.round(windDirection),
          direction: Math.round(windDirection),
          gustSpeed: Math.round(gustSpeedKnots * 10) / 10,
          waveHeight: 0, // Wave data requires separate gfsWave model call
        });
      }

      return { forecasts };
    } catch (error) {
      console.error('Error parsing Windy response:', error);
      return {
        forecasts: [],
        error: 'Failed to parse wind forecast data',
      };
    }
  }

  /**
   * Get current conditions (first forecast point)
   */
  async getCurrentConditions(
    coordinates: GPSCoordinates
  ): Promise<{ forecast?: WindForecast; error?: string }> {
    const result = await this.getWindForecast(coordinates, 3);

    if (result.error) {
      return { error: result.error };
    }

    if (result.forecasts.length > 0) {
      return { forecast: result.forecasts[0] };
    }

    return { error: 'No forecast data available' };
  }
}

// Singleton instance
let windyServiceInstance: WindyService | null = null;
let storedApiKey: string = '';

/**
 * Initialize the Windy service with API Key
 * Call this when loading saved credentials from AsyncStorage or when user enters new ones
 */
export function initializeWindyService(apiKey: string): void {
  storedApiKey = apiKey || '';
  windyServiceInstance = new WindyService(storedApiKey);
}

export function getWindyService(): WindyService {
  if (!windyServiceInstance) {
    windyServiceInstance = new WindyService(storedApiKey);
  }
  return windyServiceInstance;
}

/**
 * Check if valid API key is configured
 */
export function isWindyApiKeyConfigured(): boolean {
  return storedApiKey.length > 10;
}

/**
 * Get current API key (for display purposes)
 */
export function getWindyApiKey(): string {
  return storedApiKey;
}
