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
import { generateVoronoi, relaxPoints } from '@/lib/voronoi/generator';
import { generateSVG } from '@/lib/svg/generator';
import { downloadSVG, downloadPNG } from '@/lib/svg/exporter';
import { useImageWorker } from './useWorker';

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

  // Web worker for edge detection
  const { detectEdges: detectEdgesWorker, isReady: isWorkerReady } = useImageWorker();

  // Store loaded image data for reprocessing
  const loadedImageRef = useRef<LoadedImage | null>(null);
  const edgesRef = useRef<Float32Array | null>(null);
  const lastEdgeSettingsRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract processing-relevant settings (exclude view-only settings like showOriginal)
  const {
    cellCount,
    pointDistribution,
    edgeInfluence,
    relaxationIterations,
    preBlur,
    contrast,
    edgeMethod,
    edgeSensitivity,
    lineWidth,
    lineColor,
    colorMode,
    paletteSize,
    saturation,
    brightness,
  } = settings;

  // Process the current image with current settings
  const processImage = useCallback(async () => {
    const loadedImage = loadedImageRef.current;

    if (!loadedImage) return;

    setProcessingState((prev) => ({ ...prev, isProcessing: true }));

    try {
      // Run processing in next frame to allow UI update
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const { imageData, width, height } = loadedImage;

      // Check if we need to recompute edges (preprocessing settings changed)
      const currentEdgeSettings = `${edgeMethod}-${edgeSensitivity}-${preBlur}-${contrast}`;
      if (currentEdgeSettings !== lastEdgeSettingsRef.current || !edgesRef.current) {
        const edgeOptions = {
          method: edgeMethod,
          sensitivity: edgeSensitivity,
          preBlur,
          contrast,
        };

        // Use worker if available, otherwise fallback to synchronous
        if (isWorkerReady()) {
          edgesRef.current = await detectEdgesWorker(imageData, edgeOptions);
        } else {
          edgesRef.current = detectEdges(imageData, edgeOptions);
        }
        lastEdgeSettingsRef.current = currentEdgeSettings;
      }

      const edges = edgesRef.current;

      // Generate points based on distribution strategy
      let points;
      switch (pointDistribution) {
        case 'uniform':
          points = generateUniformPoints(width, height, cellCount);
          break;
        case 'poisson':
          points = generatePoissonPoints(width, height, cellCount);
          break;
        case 'edge-weighted':
          points = generateEdgeWeightedPoints(
            edges,
            width,
            height,
            cellCount,
            edgeInfluence
          );
          break;
      }

      // Apply Lloyd's relaxation if enabled (smooths cell shapes)
      if (relaxationIterations > 0) {
        points = relaxPoints(points, width, height, relaxationIterations);
      }

      // Generate Voronoi diagram
      const voronoiResult = generateVoronoi(points, width, height);

      // Sample colors for each cell
      const colors = sampleColors(
        imageData,
        voronoiResult.cells,
        colorMode,
        paletteSize,
        saturation,
        brightness
      );

      // Create colored cells
      const coloredCells: ColoredCell[] = voronoiResult.cells.map((cell, i) => ({
        polygon: cell.polygon,
        color: colors[i],
      }));

      // Generate SVG
      const svg = generateSVG(coloredCells, {
        lineWidth,
        lineColor,
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
  }, [
    cellCount,
    pointDistribution,
    edgeInfluence,
    relaxationIterations,
    preBlur,
    contrast,
    edgeMethod,
    edgeSensitivity,
    lineWidth,
    lineColor,
    colorMode,
    paletteSize,
    saturation,
    brightness,
    detectEdgesWorker,
    isWorkerReady,
  ]);

  // Debounced processing
  const debouncedProcess = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      processImage();
    }, 300);
  }, [processImage]);

  // Reprocess when processing-relevant settings change
  useEffect(() => {
    if (loadedImageRef.current) {
      debouncedProcess();
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedProcess]);

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

        // Detect edges with current preprocessing settings (use worker if available)
        const edgeOptions = {
          method: edgeMethod,
          sensitivity: edgeSensitivity,
          preBlur,
          contrast,
        };

        if (isWorkerReady()) {
          edgesRef.current = await detectEdgesWorker(loadedImage.imageData, edgeOptions);
        } else {
          edgesRef.current = detectEdges(loadedImage.imageData, edgeOptions);
        }
        lastEdgeSettingsRef.current = `${edgeMethod}-${edgeSensitivity}-${preBlur}-${contrast}`;

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
    [originalImageUrl, processImage, edgeMethod, edgeSensitivity, preBlur, contrast, detectEdgesWorker, isWorkerReady]
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
