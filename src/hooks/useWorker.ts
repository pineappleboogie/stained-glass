'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { EdgeMethod } from '@/types';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

interface WorkerResponse {
  type: 'result' | 'error';
  id: string;
  payload: { edges: ArrayBuffer } | { message: string };
}

export interface EdgeDetectionResult {
  edges: Float32Array;
}

export function useImageWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());

  useEffect(() => {
    // Create worker using the URL pattern that works with Next.js
    workerRef.current = new Worker(
      new URL('../workers/image.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, id, payload } = event.data;
      const pending = pendingRef.current.get(id);

      if (pending) {
        if (type === 'result') {
          pending.resolve(payload);
        } else if (type === 'error') {
          pending.reject(new Error((payload as { message: string }).message));
        }
        pendingRef.current.delete(id);
      }
    };

    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      // Reject all pending requests
      pendingRef.current.forEach((pending) => {
        pending.reject(new Error('Worker error'));
      });
      pendingRef.current.clear();
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const detectEdges = useCallback(
    async (
      imageData: ImageData,
      options: {
        method: EdgeMethod;
        sensitivity: number;
        preBlur: number;
        contrast: number;
      }
    ): Promise<Float32Array> => {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const id = crypto.randomUUID();
      const { method, sensitivity, preBlur, contrast } = options;

      // Copy the image data buffer (workers need transferable objects)
      const buffer = imageData.data.buffer.slice(0);

      return new Promise((resolve, reject) => {
        pendingRef.current.set(id, {
          resolve: (result) => {
            const { edges } = result as { edges: ArrayBuffer };
            resolve(new Float32Array(edges));
          },
          reject,
        });

        workerRef.current!.postMessage(
          {
            type: 'detectEdges',
            id,
            payload: {
              imageData: buffer,
              width: imageData.width,
              height: imageData.height,
              method,
              sensitivity,
              preBlur,
              contrast,
            },
          },
          [buffer]
        );
      });
    },
    []
  );

  const isReady = useCallback(() => {
    return workerRef.current !== null;
  }, []);

  return { detectEdges, isReady };
}
