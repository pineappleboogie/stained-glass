import type { Point, RGB, ColoredCell } from '@/types';

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
}

/**
 * Generate SVG string from colored cells
 */
export function generateSVG(cells: ColoredCell[], options: SVGOptions): string {
  const { lineWidth, lineColor, width, height } = options;

  const paths = cells.map((cell) => {
    const d = polygonToPath(cell.polygon);
    const fill = rgbToHex(cell.color);
    return `  <path d="${d}" fill="${fill}" stroke="${lineColor}" stroke-width="${lineWidth}" stroke-linejoin="round"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${paths.join('\n')}
</svg>`;
}

/**
 * Generate SVG data URL for inline display
 */
export function generateSVGDataUrl(cells: ColoredCell[], options: SVGOptions): string {
  const svg = generateSVG(cells, options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
