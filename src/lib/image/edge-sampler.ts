import type { RGB, Point } from '@/types';
import { getPixel } from './loader';

export type EdgePosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Sample a color from a specific position along an edge of the image
 * @param imageData - The image data to sample from
 * @param edge - Which edge to sample from
 * @param position - Position along the edge (0-1)
 * @param depth - How far into the image to sample (in pixels)
 */
export function sampleEdgeColor(
  imageData: ImageData,
  edge: EdgePosition,
  position: number,
  depth: number = 5
): RGB {
  const { width, height } = imageData;
  let x: number;
  let y: number;

  // Calculate sample point based on edge and position
  switch (edge) {
    case 'top':
      x = Math.floor(position * (width - 1));
      y = Math.min(depth, height - 1);
      break;
    case 'right':
      x = Math.max(0, width - 1 - depth);
      y = Math.floor(position * (height - 1));
      break;
    case 'bottom':
      x = Math.floor(position * (width - 1));
      y = Math.max(0, height - 1 - depth);
      break;
    case 'left':
      x = Math.min(depth, width - 1);
      y = Math.floor(position * (height - 1));
      break;
  }

  // Sample a small area and average the colors for smoother results
  const sampleRadius = 3;
  let totalR = 0, totalG = 0, totalB = 0;
  let count = 0;

  for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
    for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
      const sx = Math.max(0, Math.min(width - 1, x + dx));
      const sy = Math.max(0, Math.min(height - 1, y + dy));
      const pixel = getPixel(imageData, sx, sy);
      totalR += pixel.r;
      totalG += pixel.g;
      totalB += pixel.b;
      count++;
    }
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  };
}

/**
 * Sample color at a specific point, using nearby edge if the point is in the frame area
 */
export function sampleColorAtPoint(
  imageData: ImageData,
  point: Point,
  frameDepth: number
): RGB {
  const { width, height } = imageData;

  // Determine which edge this point is closest to
  const distTop = point.y;
  const distBottom = height - point.y;
  const distLeft = point.x;
  const distRight = width - point.x;

  const minDist = Math.min(distTop, distBottom, distLeft, distRight);

  let edge: EdgePosition;
  let position: number;

  if (minDist === distTop) {
    edge = 'top';
    position = point.x / width;
  } else if (minDist === distRight) {
    edge = 'right';
    position = point.y / height;
  } else if (minDist === distBottom) {
    edge = 'bottom';
    position = point.x / width;
  } else {
    edge = 'left';
    position = point.y / height;
  }

  // Sample from slightly inside the image (past the frame area)
  return sampleEdgeColor(imageData, edge, position, frameDepth + 5);
}

/**
 * Sample multiple colors along an edge for geometric frame cells
 */
export function sampleEdgeColors(
  imageData: ImageData,
  edge: EdgePosition,
  count: number,
  frameDepth: number
): RGB[] {
  const colors: RGB[] = [];

  for (let i = 0; i < count; i++) {
    const position = count === 1 ? 0.5 : i / (count - 1);
    colors.push(sampleEdgeColor(imageData, edge, position, frameDepth + 5));
  }

  return colors;
}

/**
 * Get the average color along an entire edge
 */
export function getEdgeAverageColor(
  imageData: ImageData,
  edge: EdgePosition,
  frameDepth: number
): RGB {
  const samples = sampleEdgeColors(imageData, edge, 10, frameDepth);

  let totalR = 0, totalG = 0, totalB = 0;
  for (const sample of samples) {
    totalR += sample.r;
    totalG += sample.g;
    totalB += sample.b;
  }

  return {
    r: Math.round(totalR / samples.length),
    g: Math.round(totalG / samples.length),
    b: Math.round(totalB / samples.length),
  };
}
