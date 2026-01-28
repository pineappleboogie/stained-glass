'use client';

import { useMemo } from 'react';

interface WebGLSupport {
  supported: boolean;
  version: 1 | 2 | null;
  error: string | null;
}

/**
 * Check WebGL support synchronously
 * Safe to call during render since it only reads browser capabilities
 */
function checkWebGLSupport(): WebGLSupport {
  // SSR check - assume supported on server
  if (typeof window === 'undefined') {
    return { supported: true, version: null, error: null };
  }

  try {
    const canvas = document.createElement('canvas');

    // Try WebGL 2 first
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      return { supported: true, version: 2, error: null };
    }

    // Fall back to WebGL 1
    const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl1) {
      return { supported: true, version: 1, error: null };
    }

    return {
      supported: false,
      version: null,
      error: 'WebGL is not supported in your browser',
    };
  } catch (e) {
    return {
      supported: false,
      version: null,
      error: e instanceof Error ? e.message : 'Failed to initialize WebGL',
    };
  }
}

/**
 * Detect WebGL support in the browser
 * Returns support status, version, and any error message
 * Uses useMemo for stable reference - WebGL support won't change during session
 */
export function useWebGLSupport(): WebGLSupport {
  return useMemo(() => checkWebGLSupport(), []);
}
