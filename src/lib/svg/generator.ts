import type { Point, RGB, ColoredCell } from '@/types';
import { rgbToHex as frameRgbToHex, type FrameElement } from './frames';

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
}

/**
 * Generate SVG string from colored cells with optional frame
 */
export function generateSVG(cells: ColoredCell[], options: SVGOptions): string {
  const { lineWidth, lineColor, width, height, frameElements = [] } = options;

  const svgParts: string[] = [];

  // Add white background for transparent images
  svgParts.push(`  <rect width="${width}" height="${height}" fill="#ffffff"/>`);

  // Add frame elements first (background layer)
  if (frameElements.length > 0) {
    svgParts.push('  <g class="frame">');
    for (const element of frameElements) {
      const d = polygonToPath(element.polygon);
      const fill = frameRgbToHex(element.color);
      svgParts.push(`    <path d="${d}" fill="${fill}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round"/>`);
    }
    svgParts.push('  </g>');
  }

  // Add artwork cells
  svgParts.push('  <g class="artwork">');
  for (const cell of cells) {
    const d = polygonToPath(cell.polygon);
    const fill = rgbToHex(cell.color);
    svgParts.push(`    <path d="${d}" fill="${fill}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round"/>`);
  }
  svgParts.push('  </g>');

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
