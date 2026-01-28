'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { EffectComposer, GodRays } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';
import { VoronoiMesh } from './VoronoiMesh';
import type { ColoredCell, LightSettings } from '@/types';

interface GodRaysSceneProps {
  cells: ColoredCell[];
  lighting: LightSettings;
  width: number;
  height: number;
  lineWidth: number;
  lineColor: string;
}

/**
 * Calculate light source position based on angle and image dimensions
 * Angle: 0=right, 90=bottom, 180=left, 270=top (clockwise from right)
 */
function calculateLightPosition(
  angle: number,
  width: number,
  height: number,
  preset: string
): [number, number, number] {
  // For center preset, place light in the middle
  if (preset === 'center') {
    return [width / 2, height / 2, -50];
  }

  // Convert angle to radians (adjust so 0=right, going clockwise)
  const rad = (angle * Math.PI) / 180;

  // Calculate position on the edge of the image
  // Use a distance that places the light outside the visible area
  const distance = Math.max(width, height) * 0.6;
  const centerX = width / 2;
  const centerY = height / 2;

  const x = centerX + Math.cos(rad) * distance;
  const y = centerY + Math.sin(rad) * distance;

  return [x, y, -50];
}

interface GodRaysEffectProps {
  sunMesh: THREE.Mesh;
  lighting: LightSettings;
}

/**
 * Separate component for god rays effect to avoid ref access during render
 */
function GodRaysEffect({ sunMesh, lighting }: GodRaysEffectProps) {
  // Map lighting settings to GodRays parameters
  const godRaysParams = useMemo(() => {
    const rays = lighting.rays;
    return {
      exposure: rays.intensity * 0.6,
      density: 0.96 * (rays.spread / 90),
      decay: 0.9 + rays.length * 0.08,
      weight: 0.4 * rays.intensity,
    };
  }, [lighting.rays]);

  return (
    <EffectComposer>
      <GodRays
        sun={sunMesh}
        blendFunction={BlendFunction.SCREEN}
        samples={60}
        density={godRaysParams.density}
        decay={godRaysParams.decay}
        weight={godRaysParams.weight}
        exposure={godRaysParams.exposure}
        clampMax={1}
        kernelSize={KernelSize.SMALL}
      />
    </EffectComposer>
  );
}

/**
 * Scene with god rays post-processing effect
 */
export function GodRaysScene({
  cells,
  lighting,
  width,
  height,
  lineWidth,
  lineColor,
}: GodRaysSceneProps) {
  const sunRef = useRef<THREE.Mesh>(null);
  const [sunMesh, setSunMesh] = useState<THREE.Mesh | null>(null);

  const lightPosition = useMemo(
    () => calculateLightPosition(lighting.angle, width, height, lighting.preset),
    [lighting.angle, width, height, lighting.preset]
  );

  // Track when sun mesh is ready via effect
  useEffect(() => {
    if (sunRef.current) {
      setSunMesh(sunRef.current);
    }
  }, []);

  // Only render god rays if lighting and rays are enabled and sun mesh is ready
  const showGodRays = lighting.enabled && lighting.rays.enabled && sunMesh !== null;

  return (
    <>
      {/* Light source mesh - small sphere for god rays calculation */}
      <mesh ref={sunRef} position={lightPosition}>
        <sphereGeometry args={[Math.max(width, height) * 0.05, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Stained glass mesh */}
      <VoronoiMesh cells={cells} lineWidth={lineWidth} lineColor={lineColor} />

      {/* Post-processing with god rays */}
      {showGodRays && <GodRaysEffect sunMesh={sunMesh} lighting={lighting} />}
    </>
  );
}
