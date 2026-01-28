/**
 * Export WebGL canvas to PNG
 * Uses the WebGL canvas directly to capture the rendered output including god rays
 */
export async function exportWebGLToPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'stained-glass.png',
  scale: number = 2
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Get the actual canvas dimensions
      const width = canvas.width;
      const height = canvas.height;

      // If scaling is needed, create a larger canvas and draw scaled
      if (scale !== 1) {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = width * scale;
        scaledCanvas.height = height * scale;

        const ctx = scaledCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D context for scaling'));
          return;
        }

        // Draw the WebGL canvas scaled up
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scale, scale);
        ctx.drawImage(canvas, 0, 0);

        // Export the scaled canvas
        scaledCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create PNG blob'));
              return;
            }
            downloadBlob(blob, filename);
            resolve();
          },
          'image/png',
          1.0
        );
      } else {
        // Export the WebGL canvas directly
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create PNG blob'));
              return;
            }
            downloadBlob(blob, filename);
            resolve();
          },
          'image/png',
          1.0
        );
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper to download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
