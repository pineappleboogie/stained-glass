'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  StainedGlassSettings,
  ColoredCell,
  ExportFormat,
  ProcessingState,
  VoronoiCell,
} from '@/types';
import { DEFAULT_SETTINGS, DEFAULT_LIGHT_SETTINGS, type LightSettings } from '@/types';
import { useSettingsHistory } from './useSettingsHistory';
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
import { generateFrame, type FrameElement, type FrameColorOptions } from '@/lib/svg/frames';
import { useImageWorker } from './useWorker';
import { exportWebGLToPNG } from '@/lib/three/exporter';

interface UseStainedGlassReturn {
  // State
  settings: StainedGlassSettings;
  svgString: string | null;
  coloredCells: ColoredCell[] | null;
  originalImageUrl: string | null;
  processingState: ProcessingState;
  imageDimensions: { width: number; height: number } | null;

  // Actions
  setSettings: (settings: Partial<StainedGlassSettings>) => void;
  loadImage: (file: File) => Promise<void>;
  exportImage: (format: ExportFormat) => Promise<void>;
  setWebGLCanvas: (canvas: HTMLCanvasElement | null) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useStainedGlass(): UseStainedGlassReturn {
  // Settings history for undo/redo
  const {
    currentSettings: historySettings,
    pushSettings,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useSettingsHistory({ initialSettings: DEFAULT_SETTINGS });

  const [settings, setSettingsState] = useState<StainedGlassSettings>(DEFAULT_SETTINGS);

  // Sync settings state with history when undo/redo occurs
  // Merge with defaults to handle new settings added after history was saved
  useEffect(() => {
    setSettingsState({ ...DEFAULT_SETTINGS, ...historySettings });
  }, [historySettings]);
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
  // Cache colored cells for SVG-only updates (line width/color changes)
  const coloredCellsRef = useRef<ColoredCell[] | null>(null);
  // Cache Voronoi cells for color-only updates (color mode/saturation/brightness changes)
  const voronoiCellsRef = useRef<VoronoiCell[] | null>(null);
  // Cache frame elements for SVG regeneration
  const frameElementsRef = useRef<FrameElement[]>([]);
  // Ref for line settings to avoid triggering full reprocessing
  const lineSettingsRef = useRef({ lineWidth: DEFAULT_SETTINGS.lineWidth, lineColor: DEFAULT_SETTINGS.lineColor });
  // Ref for lighting settings (SVG-only updates, no reprocessing needed)
  const lightingSettingsRef = useRef<LightSettings>(DEFAULT_LIGHT_SETTINGS);
  // Ref for WebGL canvas (for PNG export when WebGL preview is active)
  const webGLCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Merge settings with defaults to handle missing properties
  const safeSettings = { ...DEFAULT_SETTINGS, ...settings };

  // Extract processing-relevant settings (exclude view-only settings like showOriginal)
  // Note: lineWidth and lineColor are SVG-only settings, handled separately
  const {
    cellCount,
    pointDistribution,
    edgeInfluence,
    relaxationIterations,
    preBlur,
    contrast,
    edgeMethod,
    edgeSensitivity,
    colorMode,
    paletteSize,
    saturation,
    brightness,
    colorPalette,
    frameStyle,
    frameWidth,
    frameCellSize,
    frameColorPalette,
    frameHueShift,
    frameSaturation,
    frameBrightness,
  } = safeSettings;

  // Ref for color settings to handle color-only updates separately
  const colorSettingsRef = useRef({
    colorMode: DEFAULT_SETTINGS.colorMode,
    paletteSize: DEFAULT_SETTINGS.paletteSize,
    saturation: DEFAULT_SETTINGS.saturation,
    brightness: DEFAULT_SETTINGS.brightness,
    colorPalette: DEFAULT_SETTINGS.colorPalette
  });
  // Ref for frame cell size to handle frame-only updates separately
  const frameCellSizeRef = useRef(DEFAULT_SETTINGS.frameCellSize);
  // Ref for frame color settings to handle frame color-only updates separately
  const frameColorSettingsRef = useRef<FrameColorOptions>({
    palette: DEFAULT_SETTINGS.frameColorPalette,
    hueShift: DEFAULT_SETTINGS.frameHueShift,
    saturation: DEFAULT_SETTINGS.frameSaturation,
    brightness: DEFAULT_SETTINGS.frameBrightness,
  });

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

      // Generate frame and get inner bounds for artwork
      const frameResult = generateFrame(
        {
          style: frameStyle,
          width,
          height,
          frameWidth,
          cellSize: frameCellSizeRef.current,
          lineWidth: lineSettingsRef.current.lineWidth,
          lineColor: lineSettingsRef.current.lineColor,
        },
        imageData,
        frameColorSettingsRef.current
      );

      // Cache frame elements for SVG regeneration
      frameElementsRef.current = frameResult.elements;

      // Calculate bounds for Voronoi generation (inside the frame)
      const { innerBounds } = frameResult;
      const artworkWidth = innerBounds.right - innerBounds.left;
      const artworkHeight = innerBounds.bottom - innerBounds.top;

      // Generate points based on distribution strategy (within inner bounds)
      let points;
      switch (pointDistribution) {
        case 'uniform':
          points = generateUniformPoints(artworkWidth, artworkHeight, cellCount);
          break;
        case 'poisson':
          points = generatePoissonPoints(artworkWidth, artworkHeight, cellCount);
          break;
        case 'edge-weighted':
          // For edge-weighted, we need to adjust the edge map sampling
          points = generateEdgeWeightedPoints(
            edges,
            width,
            height,
            cellCount,
            edgeInfluence,
            innerBounds.left,
            innerBounds.top,
            artworkWidth,
            artworkHeight
          );
          break;
      }

      // Offset points if we're not using edge-weighted (which handles offset internally)
      if (pointDistribution !== 'edge-weighted' && frameStyle !== 'none') {
        points = points.map(p => ({
          x: p.x + innerBounds.left,
          y: p.y + innerBounds.top,
        }));
      }

      // Apply Lloyd's relaxation if enabled (smooths cell shapes)
      if (relaxationIterations > 0) {
        points = relaxPoints(
          points,
          innerBounds.right,
          innerBounds.bottom,
          relaxationIterations,
          innerBounds.left,
          innerBounds.top
        );
      }

      // Generate Voronoi diagram within inner bounds
      const voronoiResult = generateVoronoi(
        points,
        innerBounds.right,
        innerBounds.bottom,
        innerBounds.left,
        innerBounds.top
      );

      // Cache Voronoi cells for color-only updates
      voronoiCellsRef.current = voronoiResult.cells;

      // Sample colors for each cell (use ref for color settings to avoid dependency)
      const { colorMode: cm, paletteSize: ps, saturation: sat, brightness: br, colorPalette: cp } = colorSettingsRef.current;
      const colors = sampleColors(
        imageData,
        voronoiResult.cells,
        cm,
        ps,
        sat,
        br,
        cp
      );

      // Create colored cells
      const coloredCells: ColoredCell[] = voronoiResult.cells.map((cell, i) => ({
        polygon: cell.polygon,
        color: colors[i],
      }));

      // Cache cells for SVG-only updates
      coloredCellsRef.current = coloredCells;

      // Generate SVG with frame elements (use refs for line/lighting settings to avoid dependency)
      const svg = generateSVG(coloredCells, {
        lineWidth: lineSettingsRef.current.lineWidth,
        lineColor: lineSettingsRef.current.lineColor,
        width,
        height,
        frameElements: frameElementsRef.current,
        lighting: lightingSettingsRef.current,
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
    frameStyle,
    frameWidth,
    detectEdgesWorker,
    isWorkerReady,
  ]);

  // Keep line settings ref in sync
  useEffect(() => {
    lineSettingsRef.current = {
      lineWidth: settings?.lineWidth ?? DEFAULT_SETTINGS.lineWidth,
      lineColor: settings?.lineColor ?? DEFAULT_SETTINGS.lineColor,
    };
  }, [settings?.lineWidth, settings?.lineColor]);

  // Keep lighting settings ref in sync
  useEffect(() => {
    lightingSettingsRef.current = settings?.lighting ?? DEFAULT_LIGHT_SETTINGS;
  }, [settings?.lighting]);

  // Keep color settings ref in sync
  useEffect(() => {
    colorSettingsRef.current = { colorMode, paletteSize, saturation, brightness, colorPalette };
  }, [colorMode, paletteSize, saturation, brightness, colorPalette]);

  // Keep frame cell size ref in sync
  useEffect(() => {
    frameCellSizeRef.current = frameCellSize;
  }, [frameCellSize]);

  // Keep frame color settings ref in sync
  useEffect(() => {
    frameColorSettingsRef.current = {
      palette: frameColorPalette,
      hueShift: frameHueShift,
      saturation: frameSaturation,
      brightness: frameBrightness,
    };
  }, [frameColorPalette, frameHueShift, frameSaturation, frameBrightness]);

  // Regenerate frame only when frameCellSize or frame color settings change (no cell regeneration needed)
  const regenerateFrame = useCallback(() => {
    const loadedImage = loadedImageRef.current;
    const coloredCells = coloredCellsRef.current;

    if (!loadedImage || !coloredCells) return;

    const { imageData, width, height } = loadedImage;

    // Regenerate frame elements with new settings
    const frameResult = generateFrame(
      {
        style: frameStyle,
        width,
        height,
        frameWidth,
        cellSize: frameCellSize,
        lineWidth: lineSettingsRef.current.lineWidth,
        lineColor: lineSettingsRef.current.lineColor,
      },
      imageData,
      {
        palette: frameColorPalette,
        hueShift: frameHueShift,
        saturation: frameSaturation,
        brightness: frameBrightness,
      }
    );

    // Update cached frame elements
    frameElementsRef.current = frameResult.elements;

    // Generate SVG with existing cells and new frame
    const svg = generateSVG(coloredCells, {
      lineWidth: lineSettingsRef.current.lineWidth,
      lineColor: lineSettingsRef.current.lineColor,
      width,
      height,
      frameElements: frameResult.elements,
      lighting: lightingSettingsRef.current,
    });

    setSvgString(svg);
  }, [frameStyle, frameWidth, frameCellSize, frameColorPalette, frameHueShift, frameSaturation, frameBrightness]);

  // Track previous frame settings to avoid unnecessary regeneration
  const prevFrameSettingsRef = useRef<string>('');

  // Handle frame-only updates (debounced)
  useEffect(() => {
    // Create a stable key for current frame settings
    const frameKey = `${frameCellSize}-${frameColorPalette}-${frameHueShift}-${frameSaturation}-${frameBrightness}-${frameStyle}`;

    // Only regenerate frame if frame settings actually changed and frame is enabled
    if (coloredCellsRef.current && frameStyle !== 'none' && frameKey !== prevFrameSettingsRef.current) {
      prevFrameSettingsRef.current = frameKey;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        regenerateFrame();
      }, 150);
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [frameCellSize, frameColorPalette, frameHueShift, frameSaturation, frameBrightness, regenerateFrame, frameStyle]);

  // Re-sample colors only when color settings change (no cell regeneration needed)
  const resampleColors = useCallback(() => {
    const loadedImage = loadedImageRef.current;
    const voronoiCells = voronoiCellsRef.current;

    if (!loadedImage || !voronoiCells) return;

    const { imageData, width, height } = loadedImage;

    // Sample colors with current settings
    const colors = sampleColors(
      imageData,
      voronoiCells,
      colorMode,
      paletteSize,
      saturation,
      brightness,
      colorPalette
    );

    // Create colored cells
    const coloredCells: ColoredCell[] = voronoiCells.map((cell, i) => ({
      polygon: cell.polygon,
      color: colors[i],
    }));

    // Cache cells for SVG-only updates
    coloredCellsRef.current = coloredCells;

    // Generate SVG
    const svg = generateSVG(coloredCells, {
      lineWidth: lineSettingsRef.current.lineWidth,
      lineColor: lineSettingsRef.current.lineColor,
      width,
      height,
      frameElements: frameElementsRef.current,
      lighting: lightingSettingsRef.current,
    });

    setSvgString(svg);
  }, [colorMode, paletteSize, saturation, brightness, colorPalette]);

  // Track previous color settings to avoid unnecessary resampling
  const prevColorSettingsRef = useRef<string>('');

  // Handle color-only updates (debounced)
  useEffect(() => {
    // Create a stable key for current color settings
    const colorKey = `${colorMode}-${paletteSize}-${saturation}-${brightness}-${colorPalette}`;

    // Only resample if color settings actually changed (not just callback recreation)
    if (voronoiCellsRef.current && colorKey !== prevColorSettingsRef.current) {
      prevColorSettingsRef.current = colorKey;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        resampleColors();
      }, 150);
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [colorMode, paletteSize, saturation, brightness, colorPalette, resampleColors]);

  // Regenerate SVG only (for line width/color/lighting changes - no reprocessing needed)
  const regenerateSVG = useCallback(() => {
    const loadedImage = loadedImageRef.current;
    const coloredCells = coloredCellsRef.current;

    if (!loadedImage || !coloredCells) return;

    const { width, height } = loadedImage;
    const svg = generateSVG(coloredCells, {
      lineWidth: settings?.lineWidth ?? DEFAULT_SETTINGS.lineWidth,
      lineColor: settings?.lineColor ?? DEFAULT_SETTINGS.lineColor,
      width,
      height,
      frameElements: frameElementsRef.current,
      lighting: settings?.lighting ?? DEFAULT_LIGHT_SETTINGS,
    });

    setSvgString(svg);
  }, [settings?.lineWidth, settings?.lineColor, settings?.lighting]);

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

  // Regenerate SVG immediately when line settings change (no debounce needed)
  useEffect(() => {
    if (coloredCellsRef.current) {
      regenerateSVG();
    }
  }, [regenerateSVG]);

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
    setSettingsState((prev) => {
      const merged = { ...prev, ...newSettings };
      // Push to history for undo/redo
      pushSettings(merged);
      return merged;
    });
  }, [pushSettings]);

  // Set WebGL canvas ref for PNG export
  const setWebGLCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    webGLCanvasRef.current = canvas;
  }, []);

  // Check if WebGL mode is active
  const isWebGLActive = settings.lighting.enabled && settings.lighting.rays.enabled && settings.lighting.useWebGL;

  // Export image
  const exportImage = useCallback(
    async (format: ExportFormat) => {
      if (!loadedImageRef.current) return;

      const { width, height } = loadedImageRef.current;

      try {
        if (format === 'svg') {
          if (!svgString) return;
          downloadSVG(svgString);
        } else {
          // Use WebGL canvas if available and WebGL mode is active
          if (isWebGLActive && webGLCanvasRef.current) {
            await exportWebGLToPNG(webGLCanvasRef.current);
          } else if (svgString) {
            await downloadPNG(svgString, width, height);
          }
        }
      } catch (error) {
        console.error('Export error:', error);
      }
    },
    [svgString, isWebGLActive]
  );

  return {
    settings,
    svgString,
    coloredCells: coloredCellsRef.current,
    originalImageUrl,
    processingState,
    imageDimensions,
    setSettings,
    loadImage,
    exportImage,
    setWebGLCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
