import earcut from 'earcut';
import * as THREE from 'three';
import type { ColoredCell } from '@/types';

/**
 * Triangulate a polygon using earcut algorithm
 * Returns array of triangle indices
 */
function triangulatePolygon(polygon: { x: number; y: number }[]): number[] {
  // Flatten polygon to earcut format [x0, y0, x1, y1, ...]
  const flat: number[] = [];
  for (const point of polygon) {
    flat.push(point.x, point.y);
  }
  return earcut(flat);
}

/**
 * Build a Three.js BufferGeometry from ColoredCell array
 * Each cell is triangulated and colored with vertex colors
 */
export function buildVoronoiGeometry(cells: ColoredCell[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];

  for (const cell of cells) {
    if (cell.polygon.length < 3) continue;

    const indices = triangulatePolygon(cell.polygon);

    // Add triangles - indices refer to vertices in the polygon
    for (const i of indices) {
      const point = cell.polygon[i];
      // Position: x, y, z (z=0 for flat plane)
      positions.push(point.x, point.y, 0);
      // Color: r, g, b normalized to 0-1
      colors.push(cell.color.r / 255, cell.color.g / 255, cell.color.b / 255);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}

/**
 * Build lead lines geometry from cell edges
 * Creates line segments for the borders between cells
 */
export function buildLeadLinesGeometry(
  cells: ColoredCell[],
  lineColor: string = '#000000'
): THREE.BufferGeometry {
  const positions: number[] = [];

  // Convert hex color to RGB
  const color = new THREE.Color(lineColor);

  for (const cell of cells) {
    const polygon = cell.polygon;
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      // Line segment from p1 to p2
      positions.push(p1.x, p1.y, 0.01); // Slightly above cells
      positions.push(p2.x, p2.y, 0.01);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  // Store color for use with LineBasicMaterial
  geometry.userData.lineColor = color;

  return geometry;
}
