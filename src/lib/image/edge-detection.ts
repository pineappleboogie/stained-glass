/**
 * Sobel edge detection filter
 * Returns a Float32Array of edge magnitudes (0-1)
 */

// Sobel kernels
const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

/**
 * Convert ImageData to grayscale values
 */
function toGrayscale(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);

  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4;
    // Luminance formula
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  return gray;
}

/**
 * Apply 3x3 convolution kernel at a position
 */
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

/**
 * Detect edges using Sobel filter
 * Returns normalized edge magnitude map (0-1)
 */
export function detectEdges(imageData: ImageData): Float32Array {
  const { width, height } = imageData;
  const gray = toGrayscale(imageData);
  const edges = new Float32Array(width * height);

  let maxMagnitude = 0;

  // Apply Sobel filter
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

  // Normalize to 0-1
  if (maxMagnitude > 0) {
    for (let i = 0; i < edges.length; i++) {
      edges[i] /= maxMagnitude;
    }
  }

  return edges;
}

/**
 * Get edge magnitude at a position
 */
export function getEdgeAt(
  edges: Float32Array,
  width: number,
  x: number,
  y: number
): number {
  const idx = Math.floor(y) * width + Math.floor(x);
  return edges[idx] || 0;
}
