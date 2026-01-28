'use client';

import dynamic from 'next/dynamic';
import { WebGLErrorBoundary } from './three/WebGLErrorBoundary';
import type { ColoredCell, LightSettings } from '@/types';

// Lazy load to avoid SSR issues and reduce initial bundle
const ThreePreviewInner = dynamic(() => import('./three/ThreePreviewInner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-muted animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading WebGL...</span>
      </div>
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
  onError?: (error: Error) => void;
}

/**
 * Lazy-loaded wrapper for Three.js preview
 * Handles SSR safety via dynamic import and error boundaries
 */
export function ThreePreview({
  coloredCells,
  lighting,
  width,
  height,
  lineWidth,
  lineColor,
  onCanvasReady,
  onError,
}: ThreePreviewProps) {
  return (
    <WebGLErrorBoundary onError={onError}>
      <ThreePreviewInner
        coloredCells={coloredCells}
        lighting={lighting}
        width={width}
        height={height}
        lineWidth={lineWidth}
        lineColor={lineColor}
        onCanvasReady={onCanvasReady}
      />
    </WebGLErrorBoundary>
  );
}
