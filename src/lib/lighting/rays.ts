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
 * Dual-layer ray set for depth effect
 */
export interface GodRaySet {
  backRays: GodRay[]; // Behind glass - light coming from source
  frontRays: GodRay[]; // In front of glass - light projecting toward viewer
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
 * Generate dual-layer volumetric god rays from cell clusters
 * Back rays: behind the glass, light coming from source
 * Front rays: in front of glass, projecting toward viewer
 */
export function generateGodRays(
  clusters: CellCluster[],
  lighting: LightSettings,
  width: number,
  height: number
): GodRaySet {
  if (!lighting.enabled || !lighting.rays.enabled || clusters.length === 0) {
    return { backRays: [], frontRays: [] };
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

  // Calculate base dimensions
  const diagonal = Math.sqrt(width * width + height * height);
  const frontRayLength = diagonal * lighting.rays.length;
  const backRayLength = frontRayLength * 0.25; // Back rays are shorter
  const baseWidth = (width / rayCount) * (lighting.rays.spread / 45);

  const backRays: GodRay[] = [];
  const frontRays: GodRay[] = [];

  selectedClusters.forEach((cluster, index) => {
    // Calculate direction from light source to cluster
    let directionToCluster: number;
    if (isCenter) {
      // For center light, spread rays evenly
      directionToCluster = (index / rayCount) * 2 * Math.PI;
    } else {
      // Calculate angle from light source through cluster
      const dx = cluster.centroid.x - lightSource.x;
      const dy = cluster.centroid.y - lightSource.y;
      directionToCluster = Math.atan2(dy, dx);
    }

    // Direction away from light (toward viewer) - this is for front rays
    const directionAwayFromLight = directionToCluster;
    // Direction toward light - this is for back rays
    const directionTowardLight = directionToCluster + Math.PI;

    const rayWidth = baseWidth * (0.5 + Math.random() * 0.5);
    const lengthVariation = 0.7 + Math.random() * 0.3;

    // Back ray: originates behind the glass (offset toward light source), points toward glass
    const backOffset = backRayLength * 0.3;
    const backOrigin = {
      x: cluster.centroid.x + Math.cos(directionTowardLight) * backOffset,
      y: cluster.centroid.y + Math.sin(directionTowardLight) * backOffset,
    };

    backRays.push({
      origin: backOrigin,
      direction: directionToCluster, // Points toward the glass
      color: cluster.dominantColor,
      opacity: lighting.rays.intensity * 0.8, // Higher opacity for back rays
      width: rayWidth * 0.7, // Narrower at source
      length: backRayLength * lengthVariation,
    });

    // Front ray: originates at the glass surface, projects toward viewer
    frontRays.push({
      origin: { ...cluster.centroid },
      direction: directionAwayFromLight, // Points away from light (toward viewer)
      color: cluster.dominantColor,
      opacity: lighting.rays.intensity * 0.5, // Lower opacity for front rays
      width: rayWidth,
      length: frontRayLength * lengthVariation,
    });
  });

  return { backRays, frontRays };
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
 * Render back rays (behind glass) as SVG elements
 * These create the "light source behind" effect
 */
export function renderBackRaysToSVG(
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
    const endHalfWidth = ray.width * 2; // Back rays widen toward the glass

    // Trapezoid points (origin is narrow, end is wider)
    const x1 = ray.origin.x + Math.cos(perpAngle) * halfWidth;
    const y1 = ray.origin.y + Math.sin(perpAngle) * halfWidth;
    const x2 = ray.origin.x - Math.cos(perpAngle) * halfWidth;
    const y2 = ray.origin.y - Math.sin(perpAngle) * halfWidth;
    const x3 = endX - Math.cos(perpAngle) * endHalfWidth;
    const y3 = endY - Math.sin(perpAngle) * endHalfWidth;
    const x4 = endX + Math.cos(perpAngle) * endHalfWidth;
    const y4 = endY + Math.sin(perpAngle) * endHalfWidth;

    const gradientId = `backRayGradient${index}`;
    const opacity = darkMode ? ray.opacity * 1.4 : ray.opacity;

    // Brighten the ray color significantly for back rays (light source)
    const brightColor = {
      r: Math.min(255, ray.color.r + 80),
      g: Math.min(255, ray.color.g + 80),
      b: Math.min(255, ray.color.b + 80),
    };

    return `
    <linearGradient id="${gradientId}" x1="${ray.origin.x}" y1="${ray.origin.y}" x2="${endX}" y2="${endY}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${rgbToString(brightColor, opacity * 0.8)}" />
      <stop offset="50%" stop-color="${rgbToString(brightColor, opacity)}" />
      <stop offset="100%" stop-color="${rgbToString(brightColor, opacity * 0.3)}" />
    </linearGradient>
    <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}"
      fill="url(#${gradientId})"
      filter="url(#rayFilter)" />`;
  });

  return `
  <g class="back-light-rays" style="mix-blend-mode: screen">
    ${rayElements.join('')}
  </g>`;
}

/**
 * Render front rays (projecting toward viewer) as SVG elements
 * These create the volumetric "light in the room" effect
 */
export function renderFrontRaysToSVG(
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
    const endHalfWidth = ray.width * 3.5; // Front rays spread wide (light diffusion)

    // Trapezoid points (origin is narrow at glass, end is wide)
    const x1 = ray.origin.x + Math.cos(perpAngle) * halfWidth;
    const y1 = ray.origin.y + Math.sin(perpAngle) * halfWidth;
    const x2 = ray.origin.x - Math.cos(perpAngle) * halfWidth;
    const y2 = ray.origin.y - Math.sin(perpAngle) * halfWidth;
    const x3 = endX - Math.cos(perpAngle) * endHalfWidth;
    const y3 = endY - Math.sin(perpAngle) * endHalfWidth;
    const x4 = endX + Math.cos(perpAngle) * endHalfWidth;
    const y4 = endY + Math.sin(perpAngle) * endHalfWidth;

    const gradientId = `frontRayGradient${index}`;
    const glowId = `rayGlow${index}`;
    const opacity = darkMode ? ray.opacity * 1.3 : ray.opacity;

    // Lighten the ray color for visibility
    const lightColor = {
      r: Math.min(255, ray.color.r + 50),
      g: Math.min(255, ray.color.g + 50),
      b: Math.min(255, ray.color.b + 50),
    };

    // Glow at origin (where light exits glass)
    const glowRadius = ray.width * 1.5;
    const glowElement = `
    <radialGradient id="${glowId}" cx="${ray.origin.x}" cy="${ray.origin.y}" r="${glowRadius}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${rgbToString(lightColor, opacity * 0.8)}" />
      <stop offset="100%" stop-color="${rgbToString(lightColor, 0)}" />
    </radialGradient>
    <circle cx="${ray.origin.x}" cy="${ray.origin.y}" r="${glowRadius}" fill="url(#${glowId})" />`;

    return `
    <linearGradient id="${gradientId}" x1="${ray.origin.x}" y1="${ray.origin.y}" x2="${endX}" y2="${endY}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${rgbToString(lightColor, opacity)}" />
      <stop offset="30%" stop-color="${rgbToString(lightColor, opacity * 0.6)}" />
      <stop offset="70%" stop-color="${rgbToString(lightColor, opacity * 0.2)}" />
      <stop offset="100%" stop-color="${rgbToString(lightColor, 0)}" />
    </linearGradient>
    ${glowElement}
    <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}"
      fill="url(#${gradientId})"
      filter="url(#rayFilter)" />`;
  });

  // Use soft-light blend for front rays to create volumetric effect
  const blendMode = darkMode ? 'screen' : 'soft-light';

  return `
  <g class="front-light-rays" style="mix-blend-mode: ${blendMode}">
    ${rayElements.join('')}
  </g>`;
}

/**
 * Legacy function for backwards compatibility
 * Renders all rays in the old single-layer style
 */
export function renderGodRaysToSVG(
  rays: GodRay[],
  width: number,
  height: number,
  darkMode: boolean
): string {
  // For backwards compatibility, render as front rays
  return renderFrontRaysToSVG(rays, width, height, darkMode);
}
