'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { buildVoronoiGeometry } from '@/lib/three/geometry';
import type { ColoredCell } from '@/types';

interface VoronoiMeshProps {
  cells: ColoredCell[];
  lineWidth?: number;
  lineColor?: string;
}

/**
 * R3F component that renders stained glass cells as a mesh with vertex colors
 */
export function VoronoiMesh({ cells, lineWidth = 2, lineColor = '#000000' }: VoronoiMeshProps) {
  const geometry = useMemo(() => {
    if (cells.length === 0) return null;
    return buildVoronoiGeometry(cells);
  }, [cells]);

  const leadLinesGeometry = useMemo(() => {
    if (cells.length === 0) return null;

    const positions: number[] = [];
    for (const cell of cells) {
      const polygon = cell.polygon;
      for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        positions.push(p1.x, p1.y, 0.1);
        positions.push(p2.x, p2.y, 0.1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [cells]);

  if (!geometry || !leadLinesGeometry) return null;

  return (
    <group>
      {/* Stained glass cells */}
      <mesh geometry={geometry}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>

      {/* Lead lines */}
      <lineSegments geometry={leadLinesGeometry}>
        <lineBasicMaterial color={lineColor} linewidth={lineWidth} />
      </lineSegments>
    </group>
  );
}
