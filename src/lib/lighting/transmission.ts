import type { ColoredCell, LightSettings, Point, RGB } from '@/types';
import { LIGHT_PRESET_ANGLES } from '@/types';

/**
 * Get the light source position based on angle and image dimensions
 * Returns a point outside the image bounds representing the light source
 */
function getLightSourcePosition(
  angle: number,
  width: number,
  height: number
): Point {
  // Convert angle to radians (0° = right, 90° = bottom, etc.)
  const rad = (angle * Math.PI) / 180;

  // Calculate a point far outside the image bounds
  const distance = Math.max(width, height) * 2;
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    x: centerX + Math.cos(rad) * distance,
    y: centerY + Math.sin(rad) * distance,
  };
}

/**
 * Get the effective angle from light settings (preset or custom)
 */
export function getEffectiveAngle(lighting: LightSettings): number {
  if (lighting.preset === 'custom') {
    return lighting.angle;
  }
  if (lighting.preset === 'center') {
    return 0; // Center light doesn't use angle
  }
  return LIGHT_PRESET_ANGLES[lighting.preset];
}

/**
 * Calculate brightness multiplier for a cell based on its position relative to light source
 *
 * @param cellCentroid - Center point of the cell
 * @param lightAngle - Light direction in degrees (0-360)
 * @param lightElevation - Light elevation in degrees (0-90, higher = more perpendicular)
 * @param imageSize - { width, height } of the image
 * @param isCenter - Whether the light is centered (no direction gradient)
 * @returns Brightness multiplier (0-1)
 */
export function calculateCellBrightness(
  cellCentroid: Point,
  lightAngle: number,
  lightElevation: number,
  imageSize: { width: number; height: number },
  isCenter: boolean = false
): number {
  const { width, height } = imageSize;

  // For center light, all cells get uniform brightness based on elevation
  if (isCenter) {
    // Elevation affects overall intensity: 0° = dim, 90° = full
    return 0.5 + (lightElevation / 90) * 0.5;
  }

  // Get light source position
  const lightSource = getLightSourcePosition(lightAngle, width, height);

  // Calculate cell's position along the light direction
  // Cells closer to the light source appear brighter
  const centerX = width / 2;
  const centerY = height / 2;

  // Vector from center to light source
  const lightDirX = lightSource.x - centerX;
  const lightDirY = lightSource.y - centerY;
  const lightDirLength = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY);

  // Normalize light direction
  const normLightX = lightDirX / lightDirLength;
  const normLightY = lightDirY / lightDirLength;

  // Vector from center to cell
  const cellDirX = cellCentroid.x - centerX;
  const cellDirY = cellCentroid.y - centerY;

  // Project cell position onto light direction (dot product)
  const projection = cellDirX * normLightX + cellDirY * normLightY;

  // Normalize projection to 0-1 range based on image diagonal
  const diagonal = Math.sqrt(width * width + height * height) / 2;
  const normalizedPosition = (projection / diagonal + 1) / 2; // 0 = away from light, 1 = toward light

  // Apply elevation factor: lower elevation = steeper gradient
  const elevationFactor = lightElevation / 90; // 0-1
  const gradientStrength = 1 - elevationFactor * 0.7; // High elevation reduces gradient

  // Calculate brightness: cells toward light are brighter
  const baseBrightness = 0.3 + normalizedPosition * 0.7;
  const brightness = 0.5 + (baseBrightness - 0.5) * gradientStrength;

  return Math.max(0.2, Math.min(1, brightness));
}

/**
 * Adjust RGB color brightness
 */
function adjustBrightness(color: RGB, brightness: number): RGB {
  // Convert to HSL for better brightness adjustment
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Adjust lightness
  l = Math.min(1, Math.max(0, l * brightness));

  // Convert back to RGB
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Apply light transmission effect to all cells
 * Returns cells with adjusted colors based on light direction and intensity
 */
export function applyLightTransmission(
  cells: ColoredCell[],
  lighting: LightSettings,
  width: number,
  height: number
): ColoredCell[] {
  if (!lighting.enabled) {
    return cells;
  }

  const effectiveAngle = getEffectiveAngle(lighting);
  const isCenter = lighting.preset === 'center';
  const imageSize = { width, height };

  return cells.map((cell) => {
    // Calculate cell centroid for brightness calculation
    const centroid = {
      x: cell.polygon.reduce((sum, p) => sum + p.x, 0) / cell.polygon.length,
      y: cell.polygon.reduce((sum, p) => sum + p.y, 0) / cell.polygon.length,
    };

    // Get base brightness from position
    const positionBrightness = calculateCellBrightness(
      centroid,
      effectiveAngle,
      lighting.elevation,
      imageSize,
      isCenter
    );

    // Apply ambient light (minimum brightness)
    const ambientAdjusted = lighting.ambient + (1 - lighting.ambient) * positionBrightness;

    // Apply overall intensity
    const finalBrightness = ambientAdjusted * lighting.intensity;

    // Adjust the cell color
    return {
      polygon: cell.polygon,
      color: adjustBrightness(cell.color, finalBrightness),
    };
  });
}
