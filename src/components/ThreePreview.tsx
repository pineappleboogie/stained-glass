'use client';

import dynamic from 'next/dynamic';
import type { ColoredCell, LightSettings } from '@/types';

// Lazy load to avoid SSR issues and reduce initial bundle
const ThreePreviewInner = dynamic(() => import('./three/ThreePreviewInner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-muted animate-pulse">
      <span className="text-muted-foreground">Loading WebGL...</span>
    </div>
  ),
});

export interface ThreePreviewProps {
  coloredCells: ColoredCell[];
  lighting: LightSettings;
  width: number;
  height: number;
  lineWidth?: number;
  lineColor?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

/**
 * Lazy-loaded wrapper for Three.js preview
 * Handles SSR safety via dynamic import
 */
export function ThreePreview({
  coloredCells,
  lighting,
  width,
  height,
  lineWidth,
  lineColor,
  onCanvasReady,
}: ThreePreviewProps) {
  return (
    <ThreePreviewInner
      coloredCells={coloredCells}
      lighting={lighting}
      width={width}
      height={height}
      lineWidth={lineWidth}
      lineColor={lineColor}
      onCanvasReady={onCanvasReady}
    />
  );
}
