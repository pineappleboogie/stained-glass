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

// Color palette preset IDs
export type ColorPaletteId =
  | 'original'
  | 'tiffany-classic'
  | 'gothic-cathedral'
  | 'art-nouveau'
  | 'sunset-warm'
  | 'ocean-cool'
  | 'forest'
  | 'modern-minimal'
  | 'monochrome-blue'
  | 'sepia-vintage'
  | 'jewel-tones'
  | 'earth-tones'
  | 'pastel-dream';

// Point distribution strategies
export type PointDistribution = 'uniform' | 'poisson' | 'edge-weighted';

// Frame styles
export type FrameStyle = 'none' | 'simple' | 'segmented';

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
  colorPalette: ColorPaletteId;

  // View
  compareMode: boolean;

  // Frame
  frameStyle: FrameStyle;
  frameWidth: number; // 2-15% of min(width, height)
  frameCellSize: number; // Size of geometric cells (10-50px)

  // Frame color settings
  frameColorPalette: ColorPaletteId; // 'original' or preset name
  frameHueShift: number; // 0-360 degrees
  frameSaturation: number; // 0-2 (1 = 100%)
  frameBrightness: number; // 0-2 (1 = 100%)

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
  colorPalette: 'original',
  compareMode: false,
  frameStyle: 'none',
  frameWidth: 5,
  frameCellSize: 30,
  frameColorPalette: 'original',
  frameHueShift: 0,
  frameSaturation: 1,
  frameBrightness: 1,
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

// Section-to-settings mapping for reset functionality
export const SECTION_SETTINGS = {
  cellGeneration: ['cellCount', 'pointDistribution', 'edgeInfluence', 'relaxationIterations'] as const,
  imageProcessing: ['preBlur', 'contrast', 'edgeMethod', 'edgeSensitivity'] as const,
  leadLines: ['lineWidth', 'lineColor'] as const,
  frame: ['frameStyle', 'frameWidth', 'frameCellSize', 'frameColorPalette', 'frameHueShift', 'frameSaturation', 'frameBrightness'] as const,
  color: ['colorMode', 'paletteSize', 'saturation', 'brightness', 'colorPalette'] as const,
} as const;

export type SettingsSection = keyof typeof SECTION_SETTINGS;

/**
 * Get default values for a specific section
 */
export function getDefaultsForSection(section: SettingsSection): Partial<StainedGlassSettings> {
  const keys = SECTION_SETTINGS[section];
  const defaults: Partial<StainedGlassSettings> = {};

  for (const key of keys) {
    (defaults as Record<string, unknown>)[key] = DEFAULT_SETTINGS[key];
  }

  return defaults;
}
