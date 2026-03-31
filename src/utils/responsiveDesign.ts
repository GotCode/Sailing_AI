// Responsive design utilities for desktop, tablet, and mobile layouts
import { useWindowDimensions, Platform } from 'react-native';

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export interface ResponsiveValues<T> {
  mobile: T;
  tablet: T;
  desktop: T;
}

export interface DimensionInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Determine device type based on screen dimensions and platform
 */
export function getDeviceType(width: number, height: number): DeviceType {
  // Mobile: width < 600
  if (width < 600) {
    return DeviceType.MOBILE;
  }
  // Tablet: width 600-900
  else if (width < 900) {
    return DeviceType.TABLET;
  }
  // Desktop: width >= 900
  else {
    return DeviceType.DESKTOP;
  }
}

/**
 * Get orientation based on width and height
 */
export function getOrientation(width: number, height: number): Orientation {
  return width > height ? Orientation.LANDSCAPE : Orientation.PORTRAIT;
}

/**
 * Hook to get responsive dimension information - use this in components
 */
export function useResponsiveDimensions(): DimensionInfo {
  const dims = useWindowDimensions();
  const width = dims.width;
  const height = dims.height;
  const deviceType = getDeviceType(width, height);
  const orientation = getOrientation(width, height);

  return {
    width,
    height,
    deviceType,
    orientation,
    isPortrait: orientation === Orientation.PORTRAIT,
    isLandscape: orientation === Orientation.LANDSCAPE,
    isMobile: deviceType === DeviceType.MOBILE,
    isTablet: deviceType === DeviceType.TABLET,
    isDesktop: deviceType === DeviceType.DESKTOP,
  };
}

/**
 * Helper function to select value based on device type
 */
export function selectByDevice<T>(
  values: ResponsiveValues<T>,
  deviceType: DeviceType
): T {
  switch (deviceType) {
    case DeviceType.MOBILE:
      return values.mobile;
    case DeviceType.TABLET:
      return values.tablet;
    case DeviceType.DESKTOP:
      return values.desktop;
    default:
      return values.mobile;
  }
}

/**
 * Common responsive layout values
 */
export const responsiveValues = {
  padding: {
    mobile: 12,
    tablet: 16,
    desktop: 20,
  },
  sectionMargin: {
    mobile: 16,
    tablet: 20,
    desktop: 24,
  },
  fontSize: {
    title: { mobile: 18, tablet: 20, desktop: 24 },
    subtitle: { mobile: 14, tablet: 16, desktop: 18 },
    body: { mobile: 12, tablet: 14, desktop: 16 },
    small: { mobile: 10, tablet: 12, desktop: 14 },
  },
  buttonHeight: {
    mobile: 44,
    tablet: 48,
    desktop: 48,
  },
  columnCount: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  gridGap: {
    mobile: 8,
    tablet: 12,
    desktop: 16,
  },
  inputHeight: {
    mobile: 40,
    tablet: 44,
    desktop: 44,
  },
};

/**
 * Create responsive style values
 */
export function getResponsiveStyle<T>(
  values: ResponsiveValues<T>,
  dims: DimensionInfo
): T {
  return selectByDevice(values, dims.deviceType);
}

/**
 * Get column flex value based on column count
 */
export function getColumnFlex(columnCount: number): number {
  return 1 / columnCount;
}
