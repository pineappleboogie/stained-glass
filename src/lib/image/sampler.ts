import type { Point, RGB, VoronoiCell, ColorMode, ColorPaletteId } from '@/types';
import { getPixel } from './loader';
import { applyPalette } from '@/lib/color-palettes';

/**
 * Check if a point is inside a polygon using ray casting
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Get bounding box of a polygon
 */
function getBoundingBox(polygon: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Sample color at the centroid of a cell
 */
export function sampleCenterColor(imageData: ImageData, cell: VoronoiCell): RGB {
  const { r, g, b } = getPixel(
    imageData,
    Math.min(Math.max(cell.centroid.x, 0), imageData.width - 1),
    Math.min(Math.max(cell.centroid.y, 0), imageData.height - 1)
  );
  return { r, g, b };
}

/**
 * Sample average color of all pixels inside a cell
 */
export function sampleAverageColor(imageData: ImageData, cell: VoronoiCell): RGB {
  const { polygon } = cell;
  const bbox = getBoundingBox(polygon);

  let totalR = 0,
    totalG = 0,
    totalB = 0,
    count = 0;

  const startX = Math.max(0, Math.floor(bbox.minX));
  const endX = Math.min(imageData.width - 1, Math.ceil(bbox.maxX));
  const startY = Math.max(0, Math.floor(bbox.minY));
  const endY = Math.min(imageData.height - 1, Math.ceil(bbox.maxY));

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (pointInPolygon({ x, y }, polygon)) {
        const { r, g, b } = getPixel(imageData, x, y);
        totalR += r;
        totalG += g;
        totalB += b;
        count++;
      }
    }
  }

  if (count === 0) {
    return sampleCenterColor(imageData, cell);
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  };
}

/**
 * Adjust saturation and brightness of a color
 */
export function adjustColor(
  color: RGB,
  saturation: number,
  brightness: number
): RGB {
  // Convert to HSL
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

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

  // Apply adjustments
  s = Math.min(1, Math.max(0, s * saturation));
  const adjustedL = Math.min(1, Math.max(0, l * brightness));

  // Convert back to RGB
  if (s === 0) {
    const v = Math.round(adjustedL * 255);
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

  const q = adjustedL < 0.5 ? adjustedL * (1 + s) : adjustedL + s - adjustedL * s;
  const p = 2 * adjustedL - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Quantize colors to a reduced palette using k-means
 */
export function quantizeColors(colors: RGB[], paletteSize: number): RGB[] {
  if (colors.length <= paletteSize) return colors;

  // Initialize centroids by sampling evenly from colors
  const step = Math.floor(colors.length / paletteSize);
  const centroids: RGB[] = [];
  for (let i = 0; i < paletteSize; i++) {
    centroids.push({ ...colors[Math.min(i * step, colors.length - 1)] });
  }

  // K-means iterations
  for (let iter = 0; iter < 10; iter++) {
    // Assign colors to nearest centroid
    const clusters: RGB[][] = Array.from({ length: paletteSize }, () => []);

    for (const color of colors) {
      let minDist = Infinity;
      let nearest = 0;

      for (let i = 0; i < centroids.length; i++) {
        const dist =
          Math.pow(color.r - centroids[i].r, 2) +
          Math.pow(color.g - centroids[i].g, 2) +
          Math.pow(color.b - centroids[i].b, 2);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }

      clusters[nearest].push(color);
    }

    // Update centroids
    for (let i = 0; i < paletteSize; i++) {
      if (clusters[i].length > 0) {
        let sumR = 0,
          sumG = 0,
          sumB = 0;
        for (const c of clusters[i]) {
          sumR += c.r;
          sumG += c.g;
          sumB += c.b;
        }
        centroids[i] = {
          r: Math.round(sumR / clusters[i].length),
          g: Math.round(sumG / clusters[i].length),
          b: Math.round(sumB / clusters[i].length),
        };
      }
    }
  }

  // Map each original color to nearest centroid
  return colors.map((color) => {
    let minDist = Infinity;
    let nearest = centroids[0];

    for (const centroid of centroids) {
      const dist =
        Math.pow(color.r - centroid.r, 2) +
        Math.pow(color.g - centroid.g, 2) +
        Math.pow(color.b - centroid.b, 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = centroid;
      }
    }

    return { ...nearest };
  });
}

/**
 * Sample colors for all cells based on color mode
 */
export function sampleColors(
  imageData: ImageData,
  cells: VoronoiCell[],
  mode: ColorMode,
  paletteSize: number,
  saturation: number,
  brightness: number,
  colorPalette: ColorPaletteId = 'original'
): RGB[] {
  // Sample raw colors
  const rawColors = cells.map((cell) =>
    mode === 'average'
      ? sampleAverageColor(imageData, cell)
      : sampleCenterColor(imageData, cell)
  );

  // Apply palette quantization if needed (auto-generates palette from image)
  let colors = mode === 'palette' ? quantizeColors(rawColors, paletteSize) : rawColors;

  // Apply preset color palette mapping if not 'original'
  colors = applyPalette(colors, colorPalette);

  // Apply saturation and brightness adjustments
  colors = colors.map((c) => adjustColor(c, saturation, brightness));

  return colors;
}
