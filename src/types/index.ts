// Core geometry types
export interface Point {
  x: number;
  y: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

// Voronoi cell with polygon and associated data
export interface VoronoiCell {
  index: number;
  polygon: Point[];
  centroid: Point;
}

export interface VoronoiResult {
  cells: VoronoiCell[];
  width: number;
  height: number;
}

// Color modes for sampling
export type ColorMode = 'exact' | 'average' | 'palette';

// Point distribution strategies
export type PointDistribution = 'uniform' | 'poisson' | 'edge-weighted';

// Settings for the stained glass generator
export interface StainedGlassSettings {
  // Cell generation
  cellCount: number;
  pointDistribution: PointDistribution;
  edgeInfluence: number; // 0-1

  // Lead lines
  lineWidth: number;
  lineColor: string;

  // Color
  colorMode: ColorMode;
  paletteSize: number;
  saturation: number; // 0-2 (1 = 100%)
  brightness: number; // 0-2 (1 = 100%)

  // View
  showOriginal: boolean;
}

// Default settings
export const DEFAULT_SETTINGS: StainedGlassSettings = {
  cellCount: 500,
  pointDistribution: 'edge-weighted',
  edgeInfluence: 0.3,
  lineWidth: 2,
  lineColor: '#000000',
  colorMode: 'exact',
  paletteSize: 16,
  saturation: 1,
  brightness: 1,
  showOriginal: false,
};

// Export format
export type ExportFormat = 'svg' | 'png';

// Colored cell for rendering
export interface ColoredCell {
  polygon: Point[];
  color: RGB;
}

// Processing state
export interface ProcessingState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}
