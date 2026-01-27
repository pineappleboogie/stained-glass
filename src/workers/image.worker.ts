/**
 * Web Worker for heavy image processing operations
 * Handles edge detection and color sampling off the main thread
 */

import type { EdgeMethod } from '@/types';

// Re-implement edge detection functions for the worker context
// (Workers don't have access to the main bundle imports)

const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

function toGrayscale(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  return gray;
}

function convolve(
  gray: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  kernel: number[]
): number {
  let sum = 0;
  for (let ky = -1; ky <= 1; ky++) {
    for (let kx = -1; kx <= 1; kx++) {
      const px = Math.min(Math.max(x + kx, 0), width - 1);
      const py = Math.min(Math.max(y + ky, 0), height - 1);
      const idx = py * width + px;
      const kidx = (ky + 1) * 3 + (kx + 1);
      sum += gray[idx] * kernel[kidx];
    }
  }
  return sum;
}

function generateGaussianKernel(radius: number): number[] {
  const sigma = radius / 2;
  const size = Math.ceil(radius) * 2 + 1;
  const kernel: number[] = [];
  let sum = 0;

  for (let i = 0; i < size; i++) {
    const x = i - Math.floor(size / 2);
    const value = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(value);
    sum += value;
  }

  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

function convolve1DHorizontal(
  data: Float32Array,
  width: number,
  height: number,
  kernel: number[]
): Float32Array {
  const result = new Float32Array(data.length);
  const halfKernel = Math.floor(kernel.length / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = 0; k < kernel.length; k++) {
        const px = Math.min(Math.max(x + k - halfKernel, 0), width - 1);
        sum += data[y * width + px] * kernel[k];
      }
      result[y * width + x] = sum;
    }
  }

  return result;
}

function convolve1DVertical(
  data: Float32Array,
  width: number,
  height: number,
  kernel: number[]
): Float32Array {
  const result = new Float32Array(data.length);
  const halfKernel = Math.floor(kernel.length / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = 0; k < kernel.length; k++) {
        const py = Math.min(Math.max(y + k - halfKernel, 0), height - 1);
        sum += data[py * width + x] * kernel[k];
      }
      result[y * width + x] = sum;
    }
  }

  return result;
}

function applyGaussianBlur(
  gray: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  if (radius <= 0) return gray;

  const kernel = generateGaussianKernel(radius);
  let result = convolve1DHorizontal(gray, width, height, kernel);
  result = convolve1DVertical(result, width, height, kernel);

  return result;
}

function applyContrast(gray: Float32Array, contrast: number): Float32Array {
  if (contrast === 1.0) return gray;

  const result = new Float32Array(gray.length);

  for (let i = 0; i < gray.length; i++) {
    const value = (gray[i] - 128) * contrast + 128;
    result[i] = Math.max(0, Math.min(255, value));
  }

  return result;
}

function computeGradients(
  gray: Float32Array,
  width: number,
  height: number
): { magnitude: Float32Array; direction: Float32Array } {
  const magnitude = new Float32Array(width * height);
  const direction = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx = convolve(gray, width, height, x, y, SOBEL_X);
      const gy = convolve(gray, width, height, x, y, SOBEL_Y);

      const idx = y * width + x;
      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }

  return { magnitude, direction };
}

function nonMaxSuppression(
  magnitude: Float32Array,
  direction: Float32Array,
  width: number,
  height: number
): Float32Array {
  const result = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const mag = magnitude[idx];
      const angle = direction[idx];

      let neighbor1 = 0,
        neighbor2 = 0;
      const normalizedAngle = ((angle * 180) / Math.PI + 180) % 180;

      if (normalizedAngle < 22.5 || normalizedAngle >= 157.5) {
        neighbor1 = magnitude[idx - 1];
        neighbor2 = magnitude[idx + 1];
      } else if (normalizedAngle < 67.5) {
        neighbor1 = magnitude[(y - 1) * width + x + 1];
        neighbor2 = magnitude[(y + 1) * width + x - 1];
      } else if (normalizedAngle < 112.5) {
        neighbor1 = magnitude[(y - 1) * width + x];
        neighbor2 = magnitude[(y + 1) * width + x];
      } else {
        neighbor1 = magnitude[(y - 1) * width + x - 1];
        neighbor2 = magnitude[(y + 1) * width + x + 1];
      }

      if (mag >= neighbor1 && mag >= neighbor2) {
        result[idx] = mag;
      }
    }
  }

  return result;
}

function hysteresisThreshold(
  edges: Float32Array,
  width: number,
  height: number,
  lowThreshold: number,
  highThreshold: number
): Float32Array {
  const result = new Float32Array(width * height);
  const STRONG = 255;
  const WEAK = 50;

  for (let i = 0; i < edges.length; i++) {
    if (edges[i] >= highThreshold) {
      result[i] = STRONG;
    } else if (edges[i] >= lowThreshold) {
      result[i] = WEAK;
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (result[idx] === WEAK) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (result[(y + dy) * width + (x + dx)] === STRONG) {
                result[idx] = STRONG;
                changed = true;
                break;
              }
            }
            if (result[idx] === STRONG) break;
          }
        }
      }
    }
  }

  for (let i = 0; i < result.length; i++) {
    result[i] = result[i] === STRONG ? 1 : 0;
  }

  return result;
}

function detectEdgesCanny(
  gray: Float32Array,
  width: number,
  height: number,
  sensitivity: number
): Float32Array {
  const lowThreshold = Math.max(5, 50 - sensitivity * 0.4);
  const highThreshold = Math.max(20, 100 - sensitivity * 0.7);

  const { magnitude, direction } = computeGradients(gray, width, height);
  const suppressed = nonMaxSuppression(magnitude, direction, width, height);
  const edges = hysteresisThreshold(suppressed, width, height, lowThreshold, highThreshold);

  return edges;
}

function detectEdgesSobel(
  gray: Float32Array,
  width: number,
  height: number,
  sensitivity: number
): Float32Array {
  const edges = new Float32Array(width * height);
  let maxMagnitude = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx = convolve(gray, width, height, x, y, SOBEL_X);
      const gy = convolve(gray, width, height, x, y, SOBEL_Y);
      const magnitude = Math.sqrt(gx * gx + gy * gy);

      const idx = y * width + x;
      edges[idx] = magnitude;
      maxMagnitude = Math.max(maxMagnitude, magnitude);
    }
  }

  if (maxMagnitude > 0) {
    for (let i = 0; i < edges.length; i++) {
      edges[i] /= maxMagnitude;
    }
  }

  const threshold = ((100 - sensitivity) / 100) * 0.3;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] < threshold) {
      edges[i] = 0;
    }
  }

  return edges;
}

function detectEdges(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  method: EdgeMethod,
  sensitivity: number,
  preBlur: number,
  contrast: number
): Float32Array {
  let gray = toGrayscale(data, width, height);

  if (preBlur > 0) {
    gray = applyGaussianBlur(gray, width, height, preBlur);
  }
  if (contrast !== 1.0) {
    gray = applyContrast(gray, contrast);
  }

  if (method === 'canny') {
    return detectEdgesCanny(gray, width, height, sensitivity);
  }

  return detectEdgesSobel(gray, width, height, sensitivity);
}

// Worker message types
export interface WorkerRequest {
  type: 'detectEdges';
  id: string;
  payload: {
    imageData: ArrayBuffer;
    width: number;
    height: number;
    method: EdgeMethod;
    sensitivity: number;
    preBlur: number;
    contrast: number;
  };
}

export interface WorkerResponse {
  type: 'result' | 'error';
  id: string;
  payload: { edges: ArrayBuffer } | { message: string };
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, id, payload } = event.data;

  try {
    if (type === 'detectEdges') {
      const { imageData, width, height, method, sensitivity, preBlur, contrast } = payload;

      // Reconstruct Uint8ClampedArray from ArrayBuffer
      const data = new Uint8ClampedArray(imageData);

      const edges = detectEdges(data, width, height, method, sensitivity, preBlur, contrast);

      // Transfer the buffer back (efficient, no copy)
      const edgesBuffer = edges.buffer as ArrayBuffer;
      const response: WorkerResponse = {
        type: 'result',
        id,
        payload: { edges: edgesBuffer },
      };

      self.postMessage(response, { transfer: [edgesBuffer] });
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      id,
      payload: { message: error instanceof Error ? error.message : 'Unknown error' },
    };
    self.postMessage(response);
  }
};
