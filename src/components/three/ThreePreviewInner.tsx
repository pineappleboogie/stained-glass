'use client';

import { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { GodRaysScene } from './GodRaysScene';
import type { ColoredCell, LightSettings } from '@/types';

interface SceneProps {
  cells: ColoredCell[];
  lighting: LightSettings;
  width: number;
  height: number;
  lineWidth: number;
  lineColor: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

/**
 * Inner scene component that renders cells with god rays
 */
function Scene({ cells, lighting, width, height, lineWidth, lineColor, onCanvasReady }: SceneProps) {
  const { gl } = useThree();
  const reportedRef = useRef(false);

  useEffect(() => {
    // Report canvas element for PNG export
    if (onCanvasReady && !reportedRef.current) {
      onCanvasReady(gl.domElement);
      reportedRef.current = true;
    }
  }, [gl, onCanvasReady]);

  return (
    <GodRaysScene
      cells={cells}
      lighting={lighting}
      width={width}
      height={height}
      lineWidth={lineWidth}
      lineColor={lineColor}
    />
  );
}

interface ThreePreviewInnerProps {
  coloredCells: ColoredCell[];
  lighting: LightSettings;
  width: number;
  height: number;
  lineWidth?: number;
  lineColor?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

/**
 * R3F Canvas wrapper with orthographic camera sized to image dimensions
 * Uses key prop to recreate canvas when dimensions change
 */
export default function ThreePreviewInner({
  coloredCells,
  lighting,
  width,
  height,
  lineWidth = 2,
  lineColor = '#000000',
  onCanvasReady,
}: ThreePreviewInnerProps) {
  // Key forces canvas recreation when dimensions change
  const canvasKey = `${width}-${height}`;

  return (
    <Canvas
      key={canvasKey}
      orthographic
      camera={{
        left: 0,
        right: width,
        top: 0,
        bottom: height,
        near: -1000,
        far: 1000,
        position: [0, 0, 100],
      }}
      style={{ width, height }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <Scene
        cells={coloredCells}
        lighting={lighting}
        width={width}
        height={height}
        lineWidth={lineWidth}
        lineColor={lineColor}
        onCanvasReady={onCanvasReady}
      />
    </Canvas>
  );
}
