'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  StainedGlassSettings,
  ColoredCell,
  ExportFormat,
  ProcessingState,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { loadImageToCanvas, type LoadedImage } from '@/lib/image/loader';
import { detectEdges } from '@/lib/image/edge-detection';
import { sampleColors } from '@/lib/image/sampler';
import {
  generateUniformPoints,
  generatePoissonPoints,
  generateEdgeWeightedPoints,
} from '@/lib/voronoi/points';
import { generateVoronoi } from '@/lib/voronoi/generator';
import { generateSVG } from '@/lib/svg/generator';
import { downloadSVG, downloadPNG } from '@/lib/svg/exporter';

interface UseStainedGlassReturn {
  // State
  settings: StainedGlassSettings;
  svgString: string | null;
  originalImageUrl: string | null;
  processingState: ProcessingState;
  imageDimensions: { width: number; height: number } | null;

  // Actions
  setSettings: (settings: Partial<StainedGlassSettings>) => void;
  loadImage: (file: File) => Promise<void>;
  exportImage: (format: ExportFormat) => Promise<void>;
}

export function useStainedGlass(): UseStainedGlassReturn {
  const [settings, setSettingsState] = useState<StainedGlassSettings>(DEFAULT_SETTINGS);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isLoading: false,
    isProcessing: false,
    error: null,
  });
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Store loaded image data for reprocessing
  const loadedImageRef = useRef<LoadedImage | null>(null);
  const edgesRef = useRef<Float32Array | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Process the current image with current settings
  const processImage = useCallback(async () => {
    const loadedImage = loadedImageRef.current;
    const edges = edgesRef.current;

    if (!loadedImage || !edges) return;

    setProcessingState((prev) => ({ ...prev, isProcessing: true }));

    try {
      // Run processing in next frame to allow UI update
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const { imageData, width, height } = loadedImage;

      // Generate points based on distribution strategy
      let points;
      switch (settings.pointDistribution) {
        case 'uniform':
          points = generateUniformPoints(width, height, settings.cellCount);
          break;
        case 'poisson':
          points = generatePoissonPoints(width, height, settings.cellCount);
          break;
        case 'edge-weighted':
          points = generateEdgeWeightedPoints(
            edges,
            width,
            height,
            settings.cellCount,
            settings.edgeInfluence
          );
          break;
      }

      // Generate Voronoi diagram
      const voronoiResult = generateVoronoi(points, width, height);

      // Sample colors for each cell
      const colors = sampleColors(
        imageData,
        voronoiResult.cells,
        settings.colorMode,
        settings.paletteSize,
        settings.saturation,
        settings.brightness
      );

      // Create colored cells
      const coloredCells: ColoredCell[] = voronoiResult.cells.map((cell, i) => ({
        polygon: cell.polygon,
        color: colors[i],
      }));

      // Generate SVG
      const svg = generateSVG(coloredCells, {
        lineWidth: settings.lineWidth,
        lineColor: settings.lineColor,
        width,
        height,
      });

      setSvgString(svg);
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Processing failed',
      }));
    } finally {
      setProcessingState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [settings]);

  // Debounced processing
  const debouncedProcess = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      processImage();
    }, 300);
  }, [processImage]);

  // Reprocess when settings change
  useEffect(() => {
    if (loadedImageRef.current) {
      debouncedProcess();
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [settings, debouncedProcess]);

  // Load a new image
  const loadImage = useCallback(
    async (file: File) => {
      setProcessingState({ isLoading: true, isProcessing: false, error: null });

      try {
        // Revoke old URL if exists
        if (originalImageUrl) {
          URL.revokeObjectURL(originalImageUrl);
        }

        // Load image
        const loadedImage = await loadImageToCanvas(file);
        loadedImageRef.current = loadedImage;

        // Create URL for original preview
        const url = URL.createObjectURL(file);
        setOriginalImageUrl(url);
        setImageDimensions({ width: loadedImage.width, height: loadedImage.height });

        // Detect edges
        const edges = detectEdges(loadedImage.imageData);
        edgesRef.current = edges;

        setProcessingState({ isLoading: false, isProcessing: true, error: null });

        // Process with current settings
        await processImage();
      } catch (error) {
        console.error('Load error:', error);
        setProcessingState({
          isLoading: false,
          isProcessing: false,
          error: error instanceof Error ? error.message : 'Failed to load image',
        });
      }
    },
    [originalImageUrl, processImage]
  );

  // Update settings
  const setSettings = useCallback((newSettings: Partial<StainedGlassSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Export image
  const exportImage = useCallback(
    async (format: ExportFormat) => {
      if (!svgString || !loadedImageRef.current) return;

      const { width, height } = loadedImageRef.current;

      try {
        if (format === 'svg') {
          downloadSVG(svgString);
        } else {
          await downloadPNG(svgString, width, height);
        }
      } catch (error) {
        console.error('Export error:', error);
      }
    },
    [svgString]
  );

  return {
    settings,
    svgString,
    originalImageUrl,
    processingState,
    imageDimensions,
    setSettings,
    loadImage,
    exportImage,
  };
}
