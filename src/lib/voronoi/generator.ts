import { Delaunay } from 'd3-delaunay';
import type { Point, VoronoiCell, VoronoiResult } from '@/types';

/**
 * Calculate centroid of a polygon
 */
function calculateCentroid(polygon: Point[]): Point {
  let cx = 0,
    cy = 0;
  for (const p of polygon) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / polygon.length, y: cy / polygon.length };
}

/**
 * Generate Voronoi diagram from seed points
 * Uses d3-delaunay for efficient computation
 */
export function generateVoronoi(
  points: Point[],
  width: number,
  height: number
): VoronoiResult {
  // Flatten points for d3-delaunay
  const flatPoints = points.flatMap((p) => [p.x, p.y]);

  // Create Delaunay triangulation and Voronoi diagram
  const delaunay = new Delaunay(flatPoints);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  // Extract cells
  const cells: VoronoiCell[] = [];

  for (let i = 0; i < points.length; i++) {
    const cellPolygon = voronoi.cellPolygon(i);

    if (cellPolygon && cellPolygon.length > 2) {
      // Convert to Point array (remove closing point if present)
      const polygon: Point[] = [];
      for (let j = 0; j < cellPolygon.length - 1; j++) {
        polygon.push({ x: cellPolygon[j][0], y: cellPolygon[j][1] });
      }

      // Skip degenerate cells
      if (polygon.length < 3) continue;

      cells.push({
        index: i,
        polygon,
        centroid: calculateCentroid(polygon),
      });
    }
  }

  return { cells, width, height };
}

/**
 * Apply Lloyd's relaxation to make cells more uniform
 * Moves seed points toward cell centroids
 */
export function relaxPoints(
  points: Point[],
  width: number,
  height: number,
  iterations: number = 1
): Point[] {
  let currentPoints = [...points];

  for (let iter = 0; iter < iterations; iter++) {
    const result = generateVoronoi(currentPoints, width, height);
    const newPoints: Point[] = [];

    for (let i = 0; i < currentPoints.length; i++) {
      const cell = result.cells.find((c) => c.index === i);
      if (cell) {
        // Move point toward centroid (partial movement for stability)
        newPoints.push({
          x: currentPoints[i].x * 0.3 + cell.centroid.x * 0.7,
          y: currentPoints[i].y * 0.3 + cell.centroid.y * 0.7,
        });
      } else {
        newPoints.push(currentPoints[i]);
      }
    }

    currentPoints = newPoints;
  }

  return currentPoints;
}
