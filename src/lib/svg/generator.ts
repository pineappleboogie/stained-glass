import type { Point, RGB, ColoredCell, LightSettings } from '@/types';
import { rgbToHex as frameRgbToHex, type FrameElement } from './frames';
import {
  generateLightingDefs,
  applyLightTransmission,
  clusterCells,
  generateGodRays,
  renderBackRaysToSVG,
  renderFrontRaysToSVG,
  renderGlowLayer,
} from '@/lib/lighting';

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(color: RGB): string {
  const r = Math.max(0, Math.min(255, color.r)).toString(16).padStart(2, '0');
  const g = Math.max(0, Math.min(255, color.g)).toString(16).padStart(2, '0');
  const b = Math.max(0, Math.min(255, color.b)).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * Convert polygon points to SVG path d attribute
 */
export function polygonToPath(polygon: Point[]): string {
  if (polygon.length === 0) return '';

  const commands = [`M ${polygon[0].x.toFixed(2)} ${polygon[0].y.toFixed(2)}`];

  for (let i = 1; i < polygon.length; i++) {
    commands.push(`L ${polygon[i].x.toFixed(2)} ${polygon[i].y.toFixed(2)}`);
  }

  commands.push('Z');
  return commands.join(' ');
}

export interface SVGOptions {
  lineWidth: number;
  lineColor: string;
  width: number;
  height: number;
  frameElements?: FrameElement[];
  lighting?: LightSettings;
}

/**
 * Generate SVG string from colored cells with optional frame and lighting
 *
 * Layer order (back to front):
 * 1. Background
 * 2. Back rays (light coming from behind glass)
 * 3. Frame
 * 4. Artwork cells
 * 5. Front rays (light projecting toward viewer)
 * 6. Glow layer
 */
export function generateSVG(cells: ColoredCell[], options: SVGOptions): string {
  const { lineWidth, lineColor, width, height, frameElements = [], lighting } = options;

  const svgParts: string[] = [];

  // Apply lighting transmission to cells if enabled
  const litCells = lighting?.enabled
    ? applyLightTransmission(cells, lighting, width, height)
    : cells;

  // Generate lighting filter definitions
  if (lighting?.enabled) {
    const defs = generateLightingDefs(lighting);
    if (defs) {
      svgParts.push(defs);
    }
  }

  // 1. Background color (dark in dark mode)
  const bgColor = lighting?.enabled && lighting.darkMode ? '#1a1a1a' : '#ffffff';
  svgParts.push(`  <rect width="${width}" height="${height}" fill="${bgColor}"/>`);

  // Pre-generate rays if enabled (we need them for both back and front layers)
  let raySet: ReturnType<typeof generateGodRays> | null = null;
  if (lighting?.enabled && lighting.rays.enabled) {
    const clusters = clusterCells(litCells, Math.ceil(Math.sqrt(lighting.rays.count * 2)), width, height);
    raySet = generateGodRays(clusters, lighting, width, height);
  }

  // 2. Back rays (light coming from behind the glass - creates depth)
  if (raySet && raySet.backRays.length > 0) {
    const backRaysLayer = renderBackRaysToSVG(raySet.backRays, width, height, lighting!.darkMode);
    if (backRaysLayer) {
      svgParts.push(backRaysLayer);
    }
  }

  // 3. Frame elements
  if (frameElements.length > 0) {
    svgParts.push('  <g class="frame">');
    for (const element of frameElements) {
      const d = polygonToPath(element.polygon);
      const fill = frameRgbToHex(element.color);
      svgParts.push(`    <path d="${d}" fill="${fill}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round"/>`);
    }
    svgParts.push('  </g>');
  }

  // 4. Artwork cells (the stained glass)
  svgParts.push('  <g class="artwork">');
  for (const cell of litCells) {
    const d = polygonToPath(cell.polygon);
    const fill = rgbToHex(cell.color);
    svgParts.push(`    <path d="${d}" fill="${fill}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round"/>`);
  }
  svgParts.push('  </g>');

  // 5. Front rays (light projecting toward viewer - volumetric effect)
  if (raySet && raySet.frontRays.length > 0) {
    const frontRaysLayer = renderFrontRaysToSVG(raySet.frontRays, width, height, lighting!.darkMode);
    if (frontRaysLayer) {
      svgParts.push(frontRaysLayer);
    }
  }

  // 6. Glow layer (rendered on top so glow bleeds over the lead lines)
  if (lighting?.enabled && lighting.glow.enabled) {
    const glowLayer = renderGlowLayer(litCells, lighting, width, height);
    if (glowLayer) {
      svgParts.push(glowLayer);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet">
${svgParts.join('\n')}
</svg>`;
}

/**
 * Generate SVG data URL for inline display
 */
export function generateSVGDataUrl(cells: ColoredCell[], options: SVGOptions): string {
  const svg = generateSVG(cells, options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
