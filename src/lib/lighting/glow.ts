import type { ColoredCell, LightSettings, Point } from '@/types';
import { getGlowBlendMode, getGlowIntensityMultiplier } from './filters';

/**
 * Generate SVG path data from polygon points
 */
function polygonToPath(polygon: Point[]): string {
  if (polygon.length === 0) return '';
  const start = polygon[0];
  const rest = polygon.slice(1);
  const pathData = `M ${start.x} ${start.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(' ') + ' Z';
  return pathData;
}

/**
 * Convert RGB to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Render glow layer as SVG elements
 * Creates blurred duplicates of cells offset slightly to create a glow effect
 */
export function renderGlowLayer(
  cells: ColoredCell[],
  lighting: LightSettings,
  _width: number,
  _height: number
): string {
  if (!lighting.enabled || !lighting.glow.enabled || lighting.glow.intensity === 0) {
    return '';
  }

  const blendMode = getGlowBlendMode(lighting.darkMode);
  const intensityMultiplier = getGlowIntensityMultiplier(lighting.darkMode);
  const glowOpacity = lighting.glow.intensity * intensityMultiplier * 0.7;

  // Create glow paths for each cell
  const glowPaths = cells.map((cell) => {
    const pathData = polygonToPath(cell.polygon);
    const { r, g, b } = cell.color;

    // Boost saturation for glow effect
    const boostedColor = boostSaturation(r, g, b, 1.3);
    const fillColor = rgbToHex(boostedColor.r, boostedColor.g, boostedColor.b);

    return `<path d="${pathData}" fill="${fillColor}" />`;
  });

  return `
  <g class="glow-layer" style="mix-blend-mode: ${blendMode}; opacity: ${glowOpacity}" filter="url(#glowFilter)">
    ${glowPaths.join('\n    ')}
  </g>`;
}

/**
 * Boost saturation of a color for more vivid glow
 */
function boostSaturation(r: number, g: number, b: number, factor: number): { r: number; g: number; b: number } {
  // Convert to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  // Boost saturation
  s = Math.min(1, s * factor);

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
