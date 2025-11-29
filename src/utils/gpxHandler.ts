// Route file parser and generator (GPX, KML, KMZ, CSV)

import { parseString, Builder } from 'xml2js';
import { Waypoint, Route } from '../types/sailing';
import { RouteFormat } from '../screens/SettingsScreen';

export interface GPXParseResult {
  waypoints: Waypoint[];
  error?: string;
}

/**
 * Parse GPX file content into waypoints
 */
export function parseGPX(gpxContent: string): Promise<GPXParseResult> {
  return new Promise((resolve) => {
    parseString(gpxContent, (err, result) => {
      if (err) {
        resolve({
          waypoints: [],
          error: `Failed to parse GPX file: ${err.message}`,
        });
        return;
      }

      try {
        const waypoints: Waypoint[] = [];
        let order = 0;

        // Check for waypoints in <wpt> tags
        if (result.gpx?.wpt) {
          for (const wpt of result.gpx.wpt) {
            const lat = parseFloat(wpt.$.lat);
            const lon = parseFloat(wpt.$.lon);
            waypoints.push({
              id: `wpt-${Date.now()}-${order}`,
              name: wpt.name?.[0] || `Waypoint ${order + 1}`,
              latitude: lat,
              longitude: lon,
              coordinates: { latitude: lat, longitude: lon },
              order: order++,
            });
          }
        }

        // Check for route waypoints in <rte><rtept> tags
        if (result.gpx?.rte) {
          for (const rte of result.gpx.rte) {
            if (rte.rtept) {
              for (const rtept of rte.rtept) {
                const lat = parseFloat(rtept.$.lat);
                const lon = parseFloat(rtept.$.lon);
                waypoints.push({
                  id: `rtept-${Date.now()}-${order}`,
                  name: rtept.name?.[0] || `Waypoint ${order + 1}`,
                  latitude: lat,
                  longitude: lon,
                  coordinates: { latitude: lat, longitude: lon },
                  order: order++,
                });
              }
            }
          }
        }

        // Check for track waypoints in <trk><trkseg><trkpt> tags
        if (result.gpx?.trk) {
          for (const trk of result.gpx.trk) {
            if (trk.trkseg) {
              for (const trkseg of trk.trkseg) {
                if (trkseg.trkpt) {
                  for (const trkpt of trkseg.trkpt) {
                    const lat = parseFloat(trkpt.$.lat);
                    const lon = parseFloat(trkpt.$.lon);
                    waypoints.push({
                      id: `trkpt-${Date.now()}-${order}`,
                      name: trkpt.name?.[0] || `Waypoint ${order + 1}`,
                      latitude: lat,
                      longitude: lon,
                      coordinates: { latitude: lat, longitude: lon },
                      order: order++,
                    });
                  }
                }
              }
            }
          }
        }

        if (waypoints.length === 0) {
          resolve({
            waypoints: [],
            error: 'No waypoints found in GPX file',
          });
          return;
        }

        resolve({ waypoints });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        resolve({
          waypoints: [],
          error: `Error processing GPX data: ${errorMessage}`,
        });
      }
    });
  });
}

/**
 * Generate GPX file content from route
 */
export function generateGPX(route: Route): string {
  // Ensure updatedAt is a proper Date object
  const updatedAt = route.updatedAt instanceof Date
    ? route.updatedAt
    : new Date(route.updatedAt || Date.now());

  const gpxObject = {
    gpx: {
      $: {
        version: '1.1',
        creator: 'Lagoon 440 Sailing App',
        xmlns: 'http://www.topografix.com/GPX/1/1',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation':
          'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd',
      },
      metadata: [
        {
          name: [route.name],
          time: [updatedAt.toISOString()],
        },
      ],
      rte: [
        {
          name: [route.name],
          rtept: route.waypoints.map((wp) => {
            // Handle arrivalTime - ensure it's a Date if present
            let arrivalTimeStr = 'Not visited';
            if (wp.arrived && wp.arrivalTime) {
              const arrivalTime = wp.arrivalTime instanceof Date
                ? wp.arrivalTime
                : new Date(wp.arrivalTime);
              arrivalTimeStr = `Arrived: ${arrivalTime.toISOString()}`;
            }
            return {
              $: {
                lat: wp.latitude.toString(),
                lon: wp.longitude.toString(),
              },
              name: [wp.name],
              desc: [arrivalTimeStr],
            };
          }),
        },
      ],
    },
  };

  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
  });

  return builder.buildObject(gpxObject);
}

/**
 * Generate KML file content from route
 */
export function generateKML(route: Route): string {
  const updatedAt = route.updatedAt instanceof Date
    ? route.updatedAt
    : new Date(route.updatedAt || Date.now());

  const coordinates = route.waypoints
    .map(wp => `${wp.longitude},${wp.latitude},0`)
    .join('\n              ');

  const placemarks = route.waypoints.map((wp, index) => {
    const desc = wp.sailConfiguration
      ? `Sail: ${wp.sailConfiguration}${wp.useEngine ? ' (Engine)' : ''}`
      : (wp.useEngine ? 'Engine mode' : '');
    return `
      <Placemark>
        <name>${wp.name}</name>
        <description>${desc}</description>
        <Point>
          <coordinates>${wp.longitude},${wp.latitude},0</coordinates>
        </Point>
      </Placemark>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${route.name}</name>
    <description>Generated by Lagoon 440 Sailing App on ${updatedAt.toISOString()}</description>
    <Style id="routeLine">
      <LineStyle>
        <color>ff0066cc</color>
        <width>3</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>Route Path</name>
      <styleUrl>#routeLine</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
              ${coordinates}
        </coordinates>
      </LineString>
    </Placemark>
    ${placemarks}
  </Document>
</kml>`;
}

/**
 * Generate CSV file content from route with all waypoint details
 */
export function generateCSV(route: Route): string {
  const headers = [
    'Order',
    'Name',
    'Latitude',
    'Longitude',
    'Elapsed Time (hrs)',
    'Heading (deg)',
    'Speed (kts)',
    'Wind Speed (kts)',
    'Wind Direction (deg)',
    'TWA (deg)',
    'AWA (deg)',
    'COG (deg)',
    'SOG (kts)',
    'Current Speed (kts)',
    'Current Direction (deg)',
    'Sail Configuration',
    'Sailing Mode',
    'Use Engine',
    'ETA',
    'Arrived',
  ];

  const rows = route.waypoints.map((wp, index) => {
    const weather = wp.weatherForecast;
    const eta = wp.estimatedArrival instanceof Date
      ? wp.estimatedArrival.toISOString()
      : (wp.estimatedArrival || '');

    // Calculate elapsed time from previous waypoint
    let elapsedHours = 0;
    if (index > 0 && route.waypoints[index - 1].estimatedArrival && wp.estimatedArrival) {
      const prevTime = new Date(route.waypoints[index - 1].estimatedArrival!).getTime();
      const currTime = new Date(wp.estimatedArrival!).getTime();
      elapsedHours = (currTime - prevTime) / (1000 * 60 * 60);
    }

    // Calculate TWA from wind direction and heading
    const windDir = weather?.windDirection || weather?.direction || 0;
    const heading = wp.cog || 0;
    const twa = windDir ? Math.abs(windDir - heading) % 180 : 0;
    const awa = twa * 0.85; // Approximate AWA

    return [
      wp.order || index + 1,
      `"${wp.name}"`,
      wp.latitude.toFixed(6),
      wp.longitude.toFixed(6),
      (wp.elapsedTime || elapsedHours).toFixed(2),
      heading.toFixed(1),
      wp.sog?.toFixed(1) || '',
      weather?.windSpeed?.toFixed(1) || '',
      windDir.toFixed(1),
      twa.toFixed(1),
      awa.toFixed(1),
      wp.cog?.toFixed(1) || '',
      wp.sog?.toFixed(1) || '',
      wp.currentSpeed?.toFixed(2) || '',
      wp.currentDirection?.toFixed(1) || '',
      `"${wp.sailConfiguration || ''}"`,
      wp.useEngine ? 'Engine' : 'Sailing',
      wp.useEngine ? 'Yes' : 'No',
      eta,
      wp.arrived ? 'Yes' : 'No',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate route in specified format
 */
export function generateRoute(route: Route, format: RouteFormat): string {
  switch (format) {
    case 'KML':
      return generateKML(route);
    case 'KMZ':
      // KMZ is a zipped KML - for now, return KML content
      // Full KMZ support would require a zip library
      return generateKML(route);
    case 'CSV':
      return generateCSV(route);
    case 'GPX':
    default:
      return generateGPX(route);
  }
}

/**
 * Get file extension for route format
 */
export function getRouteFileExtension(format: RouteFormat): string {
  switch (format) {
    case 'KML': return '.kml';
    case 'KMZ': return '.kmz';
    case 'CSV': return '.csv';
    case 'GPX':
    default: return '.gpx';
  }
}

/**
 * Get MIME type for route format
 */
export function getRouteMimeType(format: RouteFormat): string {
  switch (format) {
    case 'KML': return 'application/vnd.google-earth.kml+xml';
    case 'KMZ': return 'application/vnd.google-earth.kmz';
    case 'CSV': return 'text/csv';
    case 'GPX':
    default: return 'application/gpx+xml';
  }
}

/**
 * Validate GPX file content
 */
export function validateGPX(gpxContent: string): { valid: boolean; error?: string } {
  try {
    // Basic validation - check if it's valid XML with gpx root element
    if (!gpxContent.includes('<gpx') || !gpxContent.includes('</gpx>')) {
      return {
        valid: false,
        error: 'Invalid GPX format: Missing <gpx> root element',
      };
    }

    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      valid: false,
      error: `GPX validation error: ${errorMessage}`,
    };
  }
}

/**
 * Create sample GPX content for testing
 */
export function createSampleGPX(): string {
  const sampleRoute: Route = {
    id: 'sample',
    name: 'Sample Caribbean Route',
    waypoints: [
      {
        id: '1',
        name: 'Marina Fort-de-France',
        latitude: 14.6037,
        longitude: -61.0589,
        coordinates: { latitude: 14.6037, longitude: -61.0589 },
        order: 0,
      },
      {
        id: '2',
        name: 'St. Anne',
        latitude: 14.4333,
        longitude: -60.8833,
        coordinates: { latitude: 14.4333, longitude: -60.8833 },
        order: 1,
      },
      {
        id: '3',
        name: 'St. Lucia - Rodney Bay',
        latitude: 14.0833,
        longitude: -60.9667,
        coordinates: { latitude: 14.0833, longitude: -60.9667 },
        order: 2,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return generateGPX(sampleRoute);
}
