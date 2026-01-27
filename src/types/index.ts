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

// Edge detection methods
export type EdgeMethod = 'sobel' | 'canny';

// Preset template names
export type PresetName = 'fine-detail' | 'bold-shapes' | 'classic' | 'artistic' | 'custom';

// Settings for the stained glass generator
export interface StainedGlassSettings {
  // Cell generation
  cellCount: number;
  pointDistribution: PointDistribution;
  edgeInfluence: number; // 0-1
  relaxationIterations: number; // 0-5 (Lloyd's relaxation passes)

  // Image preprocessing
  preBlur: number; // 0-10 (blur radius before edge detection)
  contrast: number; // 0.5-2.0 (1.0 = normal)

  // Edge detection
  edgeMethod: EdgeMethod;
  edgeSensitivity: number; // 0-100

  // Lead lines
  lineWidth: number;
  lineColor: string;

  // Color
  colorMode: ColorMode;
  paletteSize: number;
  saturation: number; // 0-2 (1 = 100%)
  brightness: number; // 0-2 (1 = 100%)

  // View
  compareMode: boolean;

  // Presets
  activePreset: PresetName;
}

// Default settings
export const DEFAULT_SETTINGS: StainedGlassSettings = {
  cellCount: 500,
  pointDistribution: 'edge-weighted',
  edgeInfluence: 0.3,
  relaxationIterations: 0,
  preBlur: 0,
  contrast: 1.0,
  edgeMethod: 'sobel',
  edgeSensitivity: 50,
  lineWidth: 2,
  lineColor: '#000000',
  colorMode: 'exact',
  paletteSize: 16,
  saturation: 1,
  brightness: 1,
  compareMode: false,
  activePreset: 'custom',
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

// Preset template definition
export interface PresetTemplate {
  name: PresetName;
  label: string;
  description: string;
  settings: Partial<StainedGlassSettings>;
}
