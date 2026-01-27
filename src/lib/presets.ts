import type { PresetTemplate, PresetName, StainedGlassSettings } from '@/types';

export const PRESETS: PresetTemplate[] = [
  {
    name: 'fine-detail',
    label: 'Fine Detail',
    description: 'High cell count with strong edge influence for intricate designs',
    settings: {
      cellCount: 1500,
      pointDistribution: 'edge-weighted',
      edgeInfluence: 0.7,
      lineWidth: 1,
      relaxationIterations: 0,
      edgeSensitivity: 60,
      edgeMethod: 'sobel',
    },
  },
  {
    name: 'bold-shapes',
    label: 'Bold Shapes',
    description: 'Fewer cells with smoothing for large, organic shapes',
    settings: {
      cellCount: 200,
      pointDistribution: 'poisson',
      edgeInfluence: 0.2,
      lineWidth: 4,
      relaxationIterations: 3,
      edgeSensitivity: 30,
      edgeMethod: 'sobel',
    },
  },
  {
    name: 'classic',
    label: 'Classic',
    description: 'Traditional stained glass appearance with simple frame',
    settings: {
      cellCount: 500,
      pointDistribution: 'edge-weighted',
      edgeInfluence: 0.4,
      lineWidth: 2.5,
      lineColor: '#1a1a1a',
      relaxationIterations: 1,
      colorMode: 'average',
      edgeSensitivity: 50,
      edgeMethod: 'sobel',
      frameStyle: 'simple',
      frameWidth: 5,
    },
  },
  {
    name: 'artistic',
    label: 'Artistic',
    description: 'Reduced palette with high saturation for bold colors',
    settings: {
      cellCount: 350,
      pointDistribution: 'edge-weighted',
      edgeInfluence: 0.5,
      colorMode: 'palette',
      paletteSize: 12,
      saturation: 1.3,
      relaxationIterations: 2,
      edgeSensitivity: 50,
      edgeMethod: 'canny',
    },
  },
  {
    name: 'custom',
    label: 'Custom',
    description: 'Your custom settings',
    settings: {},
  },
];

export function getPreset(name: PresetName): PresetTemplate | undefined {
  return PRESETS.find((p) => p.name === name);
}

export function applyPreset(
  currentSettings: StainedGlassSettings,
  presetName: PresetName
): StainedGlassSettings {
  const preset = getPreset(presetName);
  if (!preset || presetName === 'custom') {
    return { ...currentSettings, activePreset: 'custom' };
  }
  return {
    ...currentSettings,
    ...preset.settings,
    activePreset: presetName,
  };
}
