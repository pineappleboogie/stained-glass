import type { Point, RGB, FrameStyle, ColorPaletteId } from '@/types';
import { type ClipRect } from './clip';
import { sampleColorAtPoint, getEdgeAverageColor, type EdgePosition } from '../image/edge-sampler';
import { applyPalette } from '@/lib/color-palettes';
import { adjustColor } from '@/lib/image/sampler';

export interface FrameElement {
  polygon: Point[];
  color: RGB;
}

export interface FrameOptions {
  style: FrameStyle;
  width: number;
  height: number;
  frameWidth: number; // Percentage of min(width, height)
  cellSize: number; // For geometric frame
  lineWidth: number;
  lineColor: string;
}

export interface FrameColorOptions {
  palette: ColorPaletteId;
  hueShift: number; // 0-360 degrees
  saturation: number; // 0-2 (1 = 100%)
  brightness: number; // 0-2 (1 = 100%)
}

/**
 * Shift the hue of an RGB color by a specified number of degrees
 */
export function shiftHue(color: RGB, degrees: number): RGB {
  if (degrees === 0) return color;

  // Convert RGB to HSL
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Shift hue (h is 0-1, degrees is 0-360)
  h = (h + degrees / 360) % 1;
  if (h < 0) h += 1;

  // Convert back to RGB
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Apply color transformations to frame colors
 * Order: palette → hue shift → saturation/brightness
 */
function applyFrameColorTransforms(colors: RGB[], options?: FrameColorOptions): RGB[] {
  if (!options) return colors;

  let result = colors;

  // Apply palette mapping if not 'original'
  if (options.palette !== 'original') {
    result = applyPalette(result, options.palette);
  }

  // Apply hue shift if non-zero
  if (options.hueShift !== 0) {
    result = result.map((c) => shiftHue(c, options.hueShift));
  }

  // Apply saturation and brightness adjustments
  if (options.saturation !== 1 || options.brightness !== 1) {
    result = result.map((c) => adjustColor(c, options.saturation, options.brightness));
  }

  return result;
}

export interface FrameResult {
  elements: FrameElement[];
  innerBounds: ClipRect;
}

/**
 * Calculate the frame depth in pixels from percentage
 */
export function calculateFrameDepth(
  width: number,
  height: number,
  frameWidthPercent: number
): number {
  const minDimension = Math.min(width, height);
  return Math.round(minDimension * (frameWidthPercent / 100));
}

/**
 * Generate frame elements based on style
 */
export function generateFrame(
  options: FrameOptions,
  imageData: ImageData | null,
  colorOptions?: FrameColorOptions
): FrameResult {
  const { style, width, height, frameWidth } = options;

  if (style === 'none') {
    return {
      elements: [],
      innerBounds: { left: 0, top: 0, right: width, bottom: height },
    };
  }

  const frameDepth = calculateFrameDepth(width, height, frameWidth);
  const innerBounds: ClipRect = {
    left: frameDepth,
    top: frameDepth,
    right: width - frameDepth,
    bottom: height - frameDepth,
  };

  let elements: FrameElement[];

  switch (style) {
    case 'simple':
      elements = generateSimpleFrame(width, height, frameDepth, imageData);
      break;
    case 'segmented':
      elements = generateSegmentedFrame(
        width,
        height,
        frameDepth,
        options.cellSize,
        imageData
      );
      break;
    default:
      elements = [];
  }

  // Apply color transformations to frame elements
  if (colorOptions && elements.length > 0) {
    const colors = elements.map((e) => e.color);
    const transformedColors = applyFrameColorTransforms(colors, colorOptions);
    elements = elements.map((e, i) => ({
      ...e,
      color: transformedColors[i],
    }));
  }

  return { elements, innerBounds };
}

/**
 * Generate a simple frame with four mitered trapezoid pieces
 */
function generateSimpleFrame(
  width: number,
  height: number,
  frameDepth: number,
  imageData: ImageData | null
): FrameElement[] {
  const elements: FrameElement[] = [];

  // Top piece (trapezoid)
  const topPolygon: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width - frameDepth, y: frameDepth },
    { x: frameDepth, y: frameDepth },
  ];

  // Right piece (trapezoid)
  const rightPolygon: Point[] = [
    { x: width, y: 0 },
    { x: width, y: height },
    { x: width - frameDepth, y: height - frameDepth },
    { x: width - frameDepth, y: frameDepth },
  ];

  // Bottom piece (trapezoid)
  const bottomPolygon: Point[] = [
    { x: width, y: height },
    { x: 0, y: height },
    { x: frameDepth, y: height - frameDepth },
    { x: width - frameDepth, y: height - frameDepth },
  ];

  // Left piece (trapezoid)
  const leftPolygon: Point[] = [
    { x: 0, y: height },
    { x: 0, y: 0 },
    { x: frameDepth, y: frameDepth },
    { x: frameDepth, y: height - frameDepth },
  ];

  // Sample colors from edges
  const defaultColor: RGB = { r: 40, g: 40, b: 50 };

  elements.push({
    polygon: topPolygon,
    color: imageData
      ? getEdgeAverageColor(imageData, 'top', frameDepth)
      : defaultColor,
  });

  elements.push({
    polygon: rightPolygon,
    color: imageData
      ? getEdgeAverageColor(imageData, 'right', frameDepth)
      : defaultColor,
  });

  elements.push({
    polygon: bottomPolygon,
    color: imageData
      ? getEdgeAverageColor(imageData, 'bottom', frameDepth)
      : defaultColor,
  });

  elements.push({
    polygon: leftPolygon,
    color: imageData
      ? getEdgeAverageColor(imageData, 'left', frameDepth)
      : defaultColor,
  });

  return elements;
}

/**
 * Generate a segmented frame - like simple but split into rectangular segments
 * Similar to traditional stained glass window frames with multiple rectangular pieces
 */
function generateSegmentedFrame(
  width: number,
  height: number,
  frameDepth: number,
  cellSize: number,
  imageData: ImageData | null
): FrameElement[] {
  const elements: FrameElement[] = [];
  const defaultColor: RGB = { r: 40, g: 40, b: 50 };

  // Calculate segment size - use cellSize to determine how many segments per edge
  // cellSize here represents the approximate length of each segment
  const segmentLength = Math.max(cellSize, 20);

  // Calculate number of segments for each edge (excluding corners)
  const innerWidth = width - 2 * frameDepth;
  const innerHeight = height - 2 * frameDepth;
  const numTopSegments = Math.max(1, Math.round(innerWidth / segmentLength));
  const numSideSegments = Math.max(1, Math.round(innerHeight / segmentLength));

  // Actual segment sizes to fit exactly
  const topSegmentWidth = innerWidth / numTopSegments;
  const sideSegmentHeight = innerHeight / numSideSegments;

  // Generate corner squares (4 corners)
  const corners: { x: number; y: number; edge1: EdgePosition; edge2: EdgePosition }[] = [
    { x: 0, y: 0, edge1: 'top', edge2: 'left' }, // Top-left
    { x: width - frameDepth, y: 0, edge1: 'top', edge2: 'right' }, // Top-right
    { x: width - frameDepth, y: height - frameDepth, edge1: 'bottom', edge2: 'right' }, // Bottom-right
    { x: 0, y: height - frameDepth, edge1: 'bottom', edge2: 'left' }, // Bottom-left
  ];

  for (const corner of corners) {
    const polygon: Point[] = [
      { x: corner.x, y: corner.y },
      { x: corner.x + frameDepth, y: corner.y },
      { x: corner.x + frameDepth, y: corner.y + frameDepth },
      { x: corner.x, y: corner.y + frameDepth },
    ];

    const cx = corner.x + frameDepth / 2;
    const cy = corner.y + frameDepth / 2;

    elements.push({
      polygon,
      color: imageData
        ? sampleColorAtPoint(imageData, { x: cx, y: cy }, frameDepth)
        : defaultColor,
    });
  }

  // Generate top edge segments
  for (let i = 0; i < numTopSegments; i++) {
    const x = frameDepth + i * topSegmentWidth;
    const polygon: Point[] = [
      { x, y: 0 },
      { x: x + topSegmentWidth, y: 0 },
      { x: x + topSegmentWidth, y: frameDepth },
      { x, y: frameDepth },
    ];

    const cx = x + topSegmentWidth / 2;

    elements.push({
      polygon,
      color: imageData
        ? sampleColorAtPoint(imageData, { x: cx, y: frameDepth / 2 }, frameDepth)
        : defaultColor,
    });
  }

  // Generate bottom edge segments
  for (let i = 0; i < numTopSegments; i++) {
    const x = frameDepth + i * topSegmentWidth;
    const y = height - frameDepth;
    const polygon: Point[] = [
      { x, y },
      { x: x + topSegmentWidth, y },
      { x: x + topSegmentWidth, y: height },
      { x, y: height },
    ];

    const cx = x + topSegmentWidth / 2;

    elements.push({
      polygon,
      color: imageData
        ? sampleColorAtPoint(imageData, { x: cx, y: height - frameDepth / 2 }, frameDepth)
        : defaultColor,
    });
  }

  // Generate left edge segments
  for (let i = 0; i < numSideSegments; i++) {
    const y = frameDepth + i * sideSegmentHeight;
    const polygon: Point[] = [
      { x: 0, y },
      { x: frameDepth, y },
      { x: frameDepth, y: y + sideSegmentHeight },
      { x: 0, y: y + sideSegmentHeight },
    ];

    const cy = y + sideSegmentHeight / 2;

    elements.push({
      polygon,
      color: imageData
        ? sampleColorAtPoint(imageData, { x: frameDepth / 2, y: cy }, frameDepth)
        : defaultColor,
    });
  }

  // Generate right edge segments
  for (let i = 0; i < numSideSegments; i++) {
    const y = frameDepth + i * sideSegmentHeight;
    const x = width - frameDepth;
    const polygon: Point[] = [
      { x, y },
      { x: width, y },
      { x: width, y: y + sideSegmentHeight },
      { x, y: y + sideSegmentHeight },
    ];

    const cy = y + sideSegmentHeight / 2;

    elements.push({
      polygon,
      color: imageData
        ? sampleColorAtPoint(imageData, { x: width - frameDepth / 2, y: cy }, frameDepth)
        : defaultColor,
    });
  }

  return elements;
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(color: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
