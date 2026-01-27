import type { Point } from '@/types';

export interface ClipRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type Edge = 'left' | 'right' | 'top' | 'bottom';

/**
 * Check if a point is inside the clipping boundary for a given edge
 */
function isInside(point: Point, edge: Edge, rect: ClipRect): boolean {
  switch (edge) {
    case 'left':
      return point.x >= rect.left;
    case 'right':
      return point.x <= rect.right;
    case 'top':
      return point.y >= rect.top;
    case 'bottom':
      return point.y <= rect.bottom;
  }
}

/**
 * Compute intersection of line segment with clipping edge
 */
function intersect(p1: Point, p2: Point, edge: Edge, rect: ClipRect): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let t: number;

  switch (edge) {
    case 'left':
      t = (rect.left - p1.x) / dx;
      return { x: rect.left, y: p1.y + t * dy };
    case 'right':
      t = (rect.right - p1.x) / dx;
      return { x: rect.right, y: p1.y + t * dy };
    case 'top':
      t = (rect.top - p1.y) / dy;
      return { x: p1.x + t * dx, y: rect.top };
    case 'bottom':
      t = (rect.bottom - p1.y) / dy;
      return { x: p1.x + t * dx, y: rect.bottom };
  }
}

/**
 * Clip polygon against a single edge
 */
function clipAgainstEdge(polygon: Point[], edge: Edge, rect: ClipRect): Point[] {
  if (polygon.length === 0) return [];

  const output: Point[] = [];
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % n];

    const currentInside = isInside(current, edge, rect);
    const nextInside = isInside(next, edge, rect);

    if (currentInside && nextInside) {
      // Both inside: add next vertex
      output.push(next);
    } else if (currentInside && !nextInside) {
      // Going out: add intersection
      output.push(intersect(current, next, edge, rect));
    } else if (!currentInside && nextInside) {
      // Coming in: add intersection and next vertex
      output.push(intersect(current, next, edge, rect));
      output.push(next);
    }
    // Both outside: add nothing
  }

  return output;
}

/**
 * Sutherland-Hodgman polygon clipping algorithm
 * Clips a polygon to a rectangular boundary
 */
export function clipPolygon(polygon: Point[], rect: ClipRect): Point[] {
  if (polygon.length < 3) return [];

  let output = [...polygon];

  // Clip against each edge in order
  output = clipAgainstEdge(output, 'left', rect);
  output = clipAgainstEdge(output, 'right', rect);
  output = clipAgainstEdge(output, 'top', rect);
  output = clipAgainstEdge(output, 'bottom', rect);

  return output;
}

/**
 * Calculate the area of a polygon using the shoelace formula
 */
export function polygonArea(polygon: Point[]): number {
  if (polygon.length < 3) return 0;

  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }

  return Math.abs(area / 2);
}

/**
 * Calculate the centroid of a polygon
 */
export function polygonCentroid(polygon: Point[]): Point {
  if (polygon.length === 0) return { x: 0, y: 0 };
  if (polygon.length === 1) return { ...polygon[0] };
  if (polygon.length === 2) {
    return {
      x: (polygon[0].x + polygon[1].x) / 2,
      y: (polygon[0].y + polygon[1].y) / 2,
    };
  }

  let cx = 0, cy = 0;
  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    cx += (polygon[i].x + polygon[j].x) * cross;
    cy += (polygon[i].y + polygon[j].y) * cross;
    area += cross;
  }

  area /= 2;
  if (Math.abs(area) < 1e-10) {
    // Degenerate polygon, return average of vertices
    let sumX = 0, sumY = 0;
    for (const p of polygon) {
      sumX += p.x;
      sumY += p.y;
    }
    return { x: sumX / n, y: sumY / n };
  }

  cx /= 6 * area;
  cy /= 6 * area;

  return { x: cx, y: cy };
}
