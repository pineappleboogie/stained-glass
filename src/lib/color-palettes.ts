import type { RGB } from '@/types';

export interface ColorPalette {
  id: string;
  name: string;
  category: 'traditional' | 'moods' | 'artistic';
  colors: RGB[];
}

// All available color palette IDs
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

export const COLOR_PALETTES: ColorPalette[] = [
  // === TRADITIONAL GLASS ===
  {
    id: 'tiffany-classic',
    name: 'Tiffany Classic',
    category: 'traditional',
    colors: [
      // Blues
      { r: 0, g: 71, b: 171 },      // Cobalt blue
      { r: 65, g: 105, b: 225 },    // Royal blue
      { r: 135, g: 170, b: 222 },   // Light cobalt
      // Greens
      { r: 0, g: 155, b: 119 },     // Emerald green
      { r: 0, g: 100, b: 80 },      // Dark emerald
      { r: 100, g: 180, b: 150 },   // Light emerald
      // Warm tones
      { r: 255, g: 191, b: 0 },     // Amber gold
      { r: 255, g: 220, b: 100 },   // Light amber
      { r: 155, g: 17, b: 30 },     // Ruby red
      { r: 200, g: 50, b: 60 },     // Medium ruby
      // Neutrals
      { r: 255, g: 253, b: 208 },   // Cream white
      { r: 40, g: 40, b: 40 },      // Near black
    ],
  },
  {
    id: 'gothic-cathedral',
    name: 'Gothic Cathedral',
    category: 'traditional',
    colors: [
      // Purples
      { r: 75, g: 0, b: 130 },      // Deep purple
      { r: 128, g: 0, b: 128 },     // Purple
      { r: 148, g: 87, b: 166 },    // Medium purple
      // Reds
      { r: 139, g: 0, b: 0 },       // Dark crimson
      { r: 180, g: 30, b: 30 },     // Crimson
      { r: 220, g: 80, b: 80 },     // Light crimson
      // Blues
      { r: 25, g: 25, b: 112 },     // Midnight blue
      { r: 70, g: 70, b: 150 },     // Medium blue
      // Gold
      { r: 255, g: 215, b: 0 },     // Gold
      { r: 218, g: 165, b: 32 },    // Goldenrod
      // Neutrals
      { r: 20, g: 20, b: 20 },      // Near black
      { r: 80, g: 80, b: 80 },      // Dark gray
    ],
  },
  {
    id: 'art-nouveau',
    name: 'Art Nouveau',
    category: 'traditional',
    colors: [
      // Greens
      { r: 143, g: 188, b: 143 },   // Sage green
      { r: 34, g: 139, b: 34 },     // Forest green
      { r: 85, g: 130, b: 85 },     // Medium sage
      { r: 180, g: 210, b: 180 },   // Light sage
      // Pinks/Rose
      { r: 199, g: 144, b: 165 },   // Dusty rose
      { r: 160, g: 100, b: 130 },   // Dark rose
      { r: 220, g: 180, b: 195 },   // Light rose
      // Copper/Brown
      { r: 184, g: 115, b: 51 },    // Copper
      { r: 140, g: 80, b: 30 },     // Dark copper
      { r: 210, g: 155, b: 100 },   // Light copper
      // Neutrals
      { r: 255, g: 253, b: 208 },   // Cream
      { r: 60, g: 50, b: 40 },      // Dark brown
    ],
  },

  // === COLOR MOODS ===
  {
    id: 'sunset-warm',
    name: 'Sunset Warm',
    category: 'moods',
    colors: [
      // Oranges
      { r: 255, g: 127, b: 80 },    // Coral orange
      { r: 255, g: 165, b: 0 },     // Orange
      { r: 255, g: 200, b: 150 },   // Light peach
      // Reds
      { r: 255, g: 99, b: 71 },     // Tomato coral
      { r: 200, g: 60, b: 40 },     // Dark coral
      { r: 128, g: 0, b: 32 },      // Burgundy
      // Yellows/Golds
      { r: 255, g: 191, b: 0 },     // Amber
      { r: 255, g: 215, b: 0 },     // Gold
      { r: 255, g: 240, b: 150 },   // Light gold
      // Darks
      { r: 80, g: 20, b: 20 },      // Dark burgundy
      { r: 50, g: 30, b: 20 },      // Near black warm
    ],
  },
  {
    id: 'ocean-cool',
    name: 'Ocean Cool',
    category: 'moods',
    colors: [
      // Teals
      { r: 0, g: 128, b: 128 },     // Teal
      { r: 0, g: 180, b: 180 },     // Bright teal
      { r: 100, g: 180, b: 180 },   // Light teal
      // Blues
      { r: 0, g: 0, b: 128 },       // Navy
      { r: 0, g: 80, b: 160 },      // Ocean blue
      { r: 100, g: 149, b: 237 },   // Cornflower
      // Greens
      { r: 143, g: 188, b: 143 },   // Seafoam
      { r: 60, g: 140, b: 120 },    // Sea green
      // Neutrals
      { r: 192, g: 192, b: 192 },   // Silver
      { r: 220, g: 230, b: 240 },   // Ice blue
      { r: 255, g: 255, b: 255 },   // White
      { r: 30, g: 40, b: 50 },      // Deep ocean
    ],
  },
  {
    id: 'forest',
    name: 'Forest',
    category: 'moods',
    colors: [
      // Greens
      { r: 0, g: 155, b: 119 },     // Emerald
      { r: 0, g: 100, b: 70 },      // Dark emerald
      { r: 85, g: 107, b: 47 },     // Moss green
      { r: 34, g: 80, b: 34 },      // Dark forest
      { r: 144, g: 180, b: 120 },   // Light moss
      // Browns
      { r: 139, g: 90, b: 43 },     // Bark brown
      { r: 90, g: 60, b: 30 },      // Dark bark
      { r: 180, g: 130, b: 80 },    // Light bark
      // Accents
      { r: 218, g: 165, b: 32 },    // Goldenrod
      { r: 255, g: 253, b: 208 },   // Cream
      { r: 30, g: 30, b: 20 },      // Forest shadow
    ],
  },

  // === ARTISTIC STYLES ===
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'artistic',
    colors: [
      // Primary colors with variations
      { r: 255, g: 0, b: 0 },       // Primary red
      { r: 180, g: 0, b: 0 },       // Dark red
      { r: 255, g: 100, b: 100 },   // Light red
      { r: 0, g: 0, b: 255 },       // Primary blue
      { r: 0, g: 0, b: 180 },       // Dark blue
      { r: 100, g: 100, b: 255 },   // Light blue
      { r: 255, g: 255, b: 0 },     // Primary yellow
      { r: 200, g: 200, b: 0 },     // Dark yellow
      { r: 255, g: 255, b: 150 },   // Light yellow
      // Neutrals
      { r: 0, g: 0, b: 0 },         // Black
      { r: 128, g: 128, b: 128 },   // Gray
      { r: 255, g: 255, b: 255 },   // White
    ],
  },
  {
    id: 'monochrome-blue',
    name: 'Monochrome Blue',
    category: 'artistic',
    colors: [
      { r: 0, g: 0, b: 30 },        // Nearly black
      { r: 0, g: 0, b: 51 },        // Deep navy
      { r: 0, g: 30, b: 80 },       // Dark navy
      { r: 0, g: 51, b: 102 },      // Dark blue
      { r: 0, g: 80, b: 140 },      // Medium dark blue
      { r: 0, g: 102, b: 153 },     // Medium blue
      { r: 30, g: 130, b: 180 },    // Medium bright blue
      { r: 51, g: 153, b: 204 },    // Sky blue
      { r: 100, g: 180, b: 230 },   // Light sky blue
      { r: 153, g: 204, b: 255 },   // Light blue
      { r: 180, g: 220, b: 255 },   // Very light blue
      { r: 204, g: 229, b: 255 },   // Pale blue
      { r: 230, g: 242, b: 255 },   // Nearly white
    ],
  },
  {
    id: 'sepia-vintage',
    name: 'Sepia Vintage',
    category: 'artistic',
    colors: [
      { r: 40, g: 25, b: 10 },      // Very dark brown
      { r: 70, g: 45, b: 20 },      // Dark sepia
      { r: 112, g: 66, b: 20 },     // Dark brown
      { r: 140, g: 90, b: 50 },     // Medium sepia
      { r: 160, g: 120, b: 80 },    // Medium brown
      { r: 180, g: 155, b: 100 },   // Muted gold
      { r: 195, g: 165, b: 120 },   // Light sepia
      { r: 210, g: 180, b: 140 },   // Tan
      { r: 225, g: 205, b: 170 },   // Light tan
      { r: 245, g: 235, b: 210 },   // Cream
      { r: 255, g: 250, b: 235 },   // Off-white
    ],
  },
  {
    id: 'jewel-tones',
    name: 'Jewel Tones',
    category: 'artistic',
    colors: [
      // Ruby
      { r: 155, g: 17, b: 30 },     // Ruby
      { r: 200, g: 50, b: 70 },     // Light ruby
      { r: 100, g: 10, b: 20 },     // Dark ruby
      // Sapphire
      { r: 15, g: 82, b: 186 },     // Sapphire
      { r: 60, g: 120, b: 210 },    // Light sapphire
      { r: 10, g: 50, b: 120 },     // Dark sapphire
      // Emerald
      { r: 0, g: 155, b: 119 },     // Emerald
      { r: 50, g: 190, b: 150 },    // Light emerald
      { r: 0, g: 100, b: 80 },      // Dark emerald
      // Amethyst
      { r: 155, g: 89, b: 182 },    // Amethyst
      { r: 100, g: 50, b: 130 },    // Dark amethyst
      // Gold
      { r: 255, g: 191, b: 0 },     // Topaz gold
      { r: 200, g: 150, b: 0 },     // Dark gold
      // Neutral
      { r: 30, g: 30, b: 30 },      // Near black
    ],
  },
  {
    id: 'earth-tones',
    name: 'Earth Tones',
    category: 'artistic',
    colors: [
      // Browns
      { r: 139, g: 90, b: 43 },     // Sienna
      { r: 90, g: 55, b: 25 },      // Dark sienna
      { r: 180, g: 130, b: 80 },    // Light sienna
      // Tans
      { r: 210, g: 180, b: 140 },   // Tan
      { r: 240, g: 220, b: 190 },   // Light tan
      // Pinks/Browns
      { r: 188, g: 143, b: 143 },   // Rosy brown
      { r: 150, g: 110, b: 110 },   // Dark rosy
      // Greens
      { r: 85, g: 107, b: 47 },     // Olive
      { r: 55, g: 75, b: 30 },      // Dark olive
      { r: 130, g: 150, b: 90 },    // Light olive
      // Grays
      { r: 105, g: 105, b: 105 },   // Dim gray
      { r: 60, g: 60, b: 55 },      // Dark gray
      { r: 160, g: 160, b: 150 },   // Light gray
    ],
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    category: 'artistic',
    colors: [
      // Pinks
      { r: 255, g: 182, b: 193 },   // Light pink
      { r: 255, g: 220, b: 225 },   // Very light pink
      { r: 220, g: 150, b: 165 },   // Medium pink
      // Blues
      { r: 173, g: 216, b: 230 },   // Light blue
      { r: 200, g: 230, b: 245 },   // Very light blue
      { r: 140, g: 180, b: 200 },   // Medium blue
      // Yellows
      { r: 255, g: 255, b: 200 },   // Light yellow
      { r: 255, g: 255, b: 230 },   // Very light yellow
      { r: 230, g: 220, b: 160 },   // Medium yellow
      // Greens
      { r: 200, g: 255, b: 200 },   // Light green
      { r: 160, g: 210, b: 160 },   // Medium green
      // Lavenders
      { r: 230, g: 190, b: 255 },   // Light lavender
      { r: 200, g: 160, b: 220 },   // Medium lavender
      // White
      { r: 255, g: 255, b: 255 },   // White
    ],
  },
];

/**
 * Calculate perceptually-weighted color distance between two RGB colors.
 * Uses the "redmean" formula which approximates human color perception
 * without requiring full LAB color space conversion.
 */
export function colorDistance(c1: RGB, c2: RGB): number {
  const rmean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(
    (2 + rmean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rmean) / 256) * db * db
  );
}

/**
 * Find the nearest color in a palette to a target color.
 */
export function findNearestColor(target: RGB, palette: RGB[]): RGB {
  let nearest = palette[0];
  let minDistance = colorDistance(target, palette[0]);

  for (let i = 1; i < palette.length; i++) {
    const dist = colorDistance(target, palette[i]);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = palette[i];
    }
  }

  return nearest;
}

/**
 * Get a palette by its ID.
 */
export function getPaletteById(id: ColorPaletteId): ColorPalette | undefined {
  if (id === 'original') return undefined;
  return COLOR_PALETTES.find((p) => p.id === id);
}

/**
 * Apply a preset palette to an array of colors, mapping each to the nearest palette color.
 */
export function applyPalette(colors: RGB[], paletteId: ColorPaletteId): RGB[] {
  if (paletteId === 'original') return colors;

  const palette = getPaletteById(paletteId);
  if (!palette) return colors;

  return colors.map((color) => findNearestColor(color, palette.colors));
}

/**
 * Get palettes grouped by category for UI display.
 */
export function getPalettesByCategory(): Record<string, ColorPalette[]> {
  return {
    traditional: COLOR_PALETTES.filter((p) => p.category === 'traditional'),
    moods: COLOR_PALETTES.filter((p) => p.category === 'moods'),
    artistic: COLOR_PALETTES.filter((p) => p.category === 'artistic'),
  };
}
