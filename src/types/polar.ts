// Polar chart types and interfaces

export interface PolarPoint {
  twa: number; // True Wind Angle in degrees (0-180)
  tws: number; // True Wind Speed in knots
  speed: number; // Boat speed in knots
}

export interface PolarCurve {
  tws: number; // True Wind Speed for this curve
  points: {
    twa: number; // True Wind Angle
    speed: number; // Boat speed at this TWA
    vmg?: number; // Velocity Made Good (optional)
  }[];
}

export interface SailPolarData {
  sailConfig: string; // e.g., "Main + Jib", "Main + Spinnaker"
  curves: PolarCurve[];
  description?: string;
  windRange: {
    min: number;
    max: number;
  };
}

export interface PolarDiagram {
  id: string;
  name: string;
  boatType: string;
  boatModel: string;
  description?: string;
  length: number; // meters
  beam: number; // meters
  displacement: number; // tons
  sailArea: {
    main: number; // m²
    jib: number; // m²
    genoa?: number; // m²
    spinnaker?: number; // m²
    asymmetrical?: number; // m²
    codeZero?: number; // m²
  };
  polarData: SailPolarData[];
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
  userId?: string; // For user-specific polars
}

export interface PolarCalculationResult {
  optimalTWA: number; // Optimal true wind angle
  optimalSpeed: number; // Speed at optimal TWA
  vmgUpwind: {
    twa: number;
    speed: number;
    vmg: number;
  };
  vmgDownwind: {
    twa: number;
    speed: number;
    vmg: number;
  };
}

export interface PolarPerformance {
  targetSpeed: number; // Target speed from polar
  actualSpeed: number; // Actual boat speed
  performance: number; // Performance percentage (actual/target * 100)
  speedDifference: number; // Difference in knots
}
