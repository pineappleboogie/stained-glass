import type { ColoredCell, LightSettings, Point, RGB } from '@/types';
import { getEffectiveAngle } from './transmission';

/**
 * A god ray beam with origin, direction, color, and dimensions
 */
export interface GodRay {
  origin: Point;
  direction: number; // Angle in radians
  color: RGB;
  opacity: number;
  width: number; // Base width at origin
  length: number; // Ray length
}

/**
 * A cluster of cells for sampling dominant colors
 */
export interface CellCluster {
  cells: ColoredCell[];
  centroid: Point;
  dominantColor: RGB;
}

/**
 * Cluster cells into a grid for efficient color sampling
 */
export function clusterCells(
  cells: ColoredCell[],
  gridSize: number,
  width: number,
  height: number
): CellCluster[] {
  // Calculate grid dimensions
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  // Initialize grid
  const grid: ColoredCell[][][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => [])
  );

  // Assign cells to grid positions
  for (const cell of cells) {
    const centroid = getCentroid(cell.polygon);
    const gridX = Math.min(Math.floor(centroid.x / cellWidth), gridSize - 1);
    const gridY = Math.min(Math.floor(centroid.y / cellHeight), gridSize - 1);
    if (gridX >= 0 && gridY >= 0) {
      grid[gridY][gridX].push(cell);
    }
  }

  // Convert grid to clusters
  const clusters: CellCluster[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const clusterCells = grid[y][x];
      if (clusterCells.length > 0) {
        const centroid = {
          x: (x + 0.5) * cellWidth,
          y: (y + 0.5) * cellHeight,
        };
        const dominantColor = calculateDominantColor(clusterCells);
        clusters.push({
          cells: clusterCells,
          centroid,
          dominantColor,
        });
      }
    }
  }

  return clusters;
}

/**
 * Get centroid of a polygon
 */
function getCentroid(polygon: Point[]): Point {
  const x = polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length;
  const y = polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length;
  return { x, y };
}

/**
 * Calculate the dominant (average) color of a cluster
 */
function calculateDominantColor(cells: ColoredCell[]): RGB {
  if (cells.length === 0) {
    return { r: 255, g: 255, b: 255 };
  }

  let totalR = 0, totalG = 0, totalB = 0;
  for (const cell of cells) {
    totalR += cell.color.r;
    totalG += cell.color.g;
    totalB += cell.color.b;
  }

  return {
    r: Math.round(totalR / cells.length),
    g: Math.round(totalG / cells.length),
    b: Math.round(totalB / cells.length),
  };
}

/**
 * Get light source position based on angle
 */
function getLightSourcePosition(
  angle: number,
  width: number,
  height: number,
  isCenter: boolean
): Point {
  if (isCenter) {
    return { x: width / 2, y: height / 2 };
  }

  // Convert angle to radians
  const rad = (angle * Math.PI) / 180;

  // Position light source at edge of image
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.max(width, height);

  return {
    x: centerX + Math.cos(rad) * maxDist,
    y: centerY + Math.sin(rad) * maxDist,
  };
}

/**
 * Generate volumetric god rays from cell clusters
 */
export function generateGodRays(
  clusters: CellCluster[],
  lighting: LightSettings,
  width: number,
  height: number
): GodRay[] {
  if (!lighting.enabled || !lighting.rays.enabled || clusters.length === 0) {
    return [];
  }

  const effectiveAngle = getEffectiveAngle(lighting);
  const isCenter = lighting.preset === 'center';
  const lightSource = getLightSourcePosition(effectiveAngle, width, height, isCenter);

  // Sort clusters by brightness/saturation to pick the most vibrant ones
  const sortedClusters = [...clusters].sort((a, b) => {
    const aVibrance = getColorVibrance(a.dominantColor);
    const bVibrance = getColorVibrance(b.dominantColor);
    return bVibrance - aVibrance;
  });

  // Select top N clusters for rays
  const rayCount = Math.min(lighting.rays.count, sortedClusters.length);
  const selectedClusters = sortedClusters.slice(0, rayCount);

  // Generate rays
  const diagonal = Math.sqrt(width * width + height * height);
  const rayLength = diagonal * lighting.rays.length;
  const baseWidth = (width / rayCount) * (lighting.rays.spread / 45); // Spread affects width

  return selectedClusters.map((cluster, index) => {
    // Calculate direction from light source to cluster
    let direction: number;
    if (isCenter) {
      // For center light, spread rays evenly
      direction = (index / rayCount) * 2 * Math.PI;
    } else {
      // Calculate angle from light source through cluster
      const dx = cluster.centroid.x - lightSource.x;
      const dy = cluster.centroid.y - lightSource.y;
      direction = Math.atan2(dy, dx);
    }

    // Calculate ray origin (at light source position for non-center, or at center for center)
    const origin = isCenter
      ? { x: width / 2, y: height / 2 }
      : lightSource;

    return {
      origin,
      direction,
      color: cluster.dominantColor,
      opacity: lighting.rays.intensity * 0.6, // Base opacity
      width: baseWidth * (0.5 + Math.random() * 0.5), // Some variation
      length: rayLength * (0.7 + Math.random() * 0.3), // Some variation
    };
  });
}

/**
 * Calculate color vibrance (saturation * brightness)
 */
function getColorVibrance(color: RGB): number {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let s = 0;
  if (max !== min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  }

  return s * l;
}

/**
 * Convert RGB to CSS color string
 */
function rgbToString(color: RGB, alpha: number = 1): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

/**
 * Render god rays as SVG elements
 */
export function renderGodRaysToSVG(
  rays: GodRay[],
  width: number,
  height: number,
  darkMode: boolean
): string {
  if (rays.length === 0) {
    return '';
  }

  const rayElements = rays.map((ray, index) => {
    // Calculate ray end point
    const endX = ray.origin.x + Math.cos(ray.direction) * ray.length;
    const endY = ray.origin.y + Math.sin(ray.direction) * ray.length;

    // Calculate perpendicular offset for trapezoid width
    const perpAngle = ray.direction + Math.PI / 2;
    const halfWidth = ray.width / 2;
    const endHalfWidth = ray.width * 1.5; // Rays widen at the end

    // Trapezoid points (origin is narrow, end is wide)
    const x1 = ray.origin.x + Math.cos(perpAngle) * halfWidth;
    const y1 = ray.origin.y + Math.sin(perpAngle) * halfWidth;
    const x2 = ray.origin.x - Math.cos(perpAngle) * halfWidth;
    const y2 = ray.origin.y - Math.sin(perpAngle) * halfWidth;
    const x3 = endX - Math.cos(perpAngle) * endHalfWidth;
    const y3 = endY - Math.sin(perpAngle) * endHalfWidth;
    const x4 = endX + Math.cos(perpAngle) * endHalfWidth;
    const y4 = endY + Math.sin(perpAngle) * endHalfWidth;

    const gradientId = `rayGradient${index}`;
    const opacity = darkMode ? ray.opacity * 1.3 : ray.opacity;

    // Lighten the ray color for better visibility
    const lightColor = {
      r: Math.min(255, ray.color.r + 50),
      g: Math.min(255, ray.color.g + 50),
      b: Math.min(255, ray.color.b + 50),
    };

    return `
    <linearGradient id="${gradientId}" x1="${ray.origin.x}" y1="${ray.origin.y}" x2="${endX}" y2="${endY}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${rgbToString(lightColor, opacity)}" />
      <stop offset="100%" stop-color="${rgbToString(lightColor, 0)}" />
    </linearGradient>
    <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}"
      fill="url(#${gradientId})"
      filter="url(#rayFilter)" />`;
  });

  const blendMode = darkMode ? 'screen' : 'screen';

  return `
  <g class="light-rays" style="mix-blend-mode: ${blendMode}">
    ${rayElements.join('')}
  </g>`;
}
