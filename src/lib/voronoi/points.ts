import type { Point } from '@/types';
import { getEdgeAt } from '../image/edge-detection';

/**
 * Generate uniformly distributed random points
 */
export function generateUniformPoints(
  width: number,
  height: number,
  count: number
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
    });
  }
  return points;
}

/**
 * Generate points using Poisson disk sampling
 * Creates more evenly distributed points than pure random
 */
export function generatePoissonPoints(
  width: number,
  height: number,
  count: number
): Point[] {
  // Calculate minimum distance based on desired count
  // Approximate: area / count = pi * r^2
  const minDist = Math.sqrt((width * height) / count / Math.PI) * 0.8;
  const cellSize = minDist / Math.SQRT2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid: (Point | null)[] = new Array(gridWidth * gridHeight).fill(null);

  const points: Point[] = [];
  const activeList: Point[] = [];
  const k = 30; // Number of attempts before rejection

  // Helper to get grid index
  const gridIndex = (x: number, y: number): number => {
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    return gy * gridWidth + gx;
  };

  // Check if point is too close to existing points
  const isTooClose = (p: Point): boolean => {
    const gx = Math.floor(p.x / cellSize);
    const gy = Math.floor(p.y / cellSize);

    // Check neighboring cells
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const neighbor = grid[ny * gridWidth + nx];
          if (neighbor) {
            const dist = Math.hypot(p.x - neighbor.x, p.y - neighbor.y);
            if (dist < minDist) return true;
          }
        }
      }
    }
    return false;
  };

  // Start with a random point
  const firstPoint = { x: Math.random() * width, y: Math.random() * height };
  points.push(firstPoint);
  activeList.push(firstPoint);
  grid[gridIndex(firstPoint.x, firstPoint.y)] = firstPoint;

  while (activeList.length > 0 && points.length < count * 2) {
    const idx = Math.floor(Math.random() * activeList.length);
    const point = activeList[idx];
    let found = false;

    for (let i = 0; i < k; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * minDist;
      const newPoint = {
        x: point.x + Math.cos(angle) * dist,
        y: point.y + Math.sin(angle) * dist,
      };

      if (
        newPoint.x >= 0 &&
        newPoint.x < width &&
        newPoint.y >= 0 &&
        newPoint.y < height &&
        !isTooClose(newPoint)
      ) {
        points.push(newPoint);
        activeList.push(newPoint);
        grid[gridIndex(newPoint.x, newPoint.y)] = newPoint;
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(idx, 1);
    }
  }

  // If we don't have enough points, add more randomly
  while (points.length < count) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
    });
  }

  return points.slice(0, count);
}

/**
 * Generate points weighted by edge density
 * More points are placed near edges in the image
 */
export function generateEdgeWeightedPoints(
  edges: Float32Array,
  width: number,
  height: number,
  count: number,
  edgeInfluence: number
): Point[] {
  const points: Point[] = [];

  // Calculate cumulative distribution for weighted sampling
  const weights = new Float32Array(edges.length);
  let totalWeight = 0;

  for (let i = 0; i < edges.length; i++) {
    // Blend between uniform (0) and edge-weighted (1)
    const weight = 1 - edgeInfluence + edgeInfluence * (edges[i] + 0.1);
    totalWeight += weight;
    weights[i] = totalWeight;
  }

  // Generate points using weighted random sampling
  for (let i = 0; i < count; i++) {
    const target = Math.random() * totalWeight;

    // Binary search for the position
    let lo = 0,
      hi = weights.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (weights[mid] < target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    // Convert index to coordinates
    const y = Math.floor(lo / width);
    const x = lo % width;

    // Add some jitter to avoid grid alignment
    points.push({
      x: x + Math.random() - 0.5,
      y: y + Math.random() - 0.5,
    });
  }

  return points;
}

/**
 * Combine Poisson sampling with edge weighting
 * Uses rejection sampling based on edge weights
 */
export function generateEdgeWeightedPoissonPoints(
  edges: Float32Array,
  width: number,
  height: number,
  count: number,
  edgeInfluence: number
): Point[] {
  if (edgeInfluence === 0) {
    return generatePoissonPoints(width, height, count);
  }

  // Generate more candidates than needed
  const candidates = generatePoissonPoints(width, height, count * 3);

  // Score each candidate based on edge weight
  const scored = candidates.map((p) => ({
    point: p,
    score: getEdgeAt(edges, width, p.x, p.y) * edgeInfluence + (1 - edgeInfluence),
  }));

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  // Take top candidates but with some randomness
  const selected: Point[] = [];
  const used = new Set<number>();

  while (selected.length < count && used.size < scored.length) {
    // Pick from top half of remaining candidates
    const remaining = scored.filter((_, i) => !used.has(i));
    const idx = Math.floor(Math.random() * Math.min(remaining.length, count));
    const originalIdx = scored.indexOf(remaining[idx]);

    if (!used.has(originalIdx)) {
      used.add(originalIdx);
      selected.push(remaining[idx].point);
    }
  }

  return selected;
}
