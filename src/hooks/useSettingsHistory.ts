'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { StainedGlassSettings } from '@/types';

interface UseSettingsHistoryOptions {
  initialSettings: StainedGlassSettings;
  maxHistorySize?: number;
  debounceMs?: number;
}

interface UseSettingsHistoryReturn {
  currentSettings: StainedGlassSettings;
  pushSettings: (settings: StainedGlassSettings) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Check if two settings objects are deeply equal
 */
function settingsEqual(a: StainedGlassSettings, b: StainedGlassSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Hook for managing settings history with undo/redo support
 */
export function useSettingsHistory({
  initialSettings,
  maxHistorySize = 50,
  debounceMs = 500,
}: UseSettingsHistoryOptions): UseSettingsHistoryReturn {
  // History state: array of settings snapshots
  const [history, setHistory] = useState<StainedGlassSettings[]>([initialSettings]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Pending settings that haven't been committed to history yet
  const pendingSettingsRef = useRef<StainedGlassSettings | null>(null);

  // Current settings based on history index
  const currentSettings = history[historyIndex];

  // Can undo if we're not at the beginning of history
  const canUndo = historyIndex > 0;
  // Can redo if we're not at the end of history
  const canRedo = historyIndex < history.length - 1;

  // Ref to track current history index for use in callbacks (avoids stale closure)
  const historyIndexRef = useRef(historyIndex);
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  /**
   * Commit pending settings to history
   */
  const commitToHistory = useCallback((settings: StainedGlassSettings) => {
    // Use ref to get current index (avoids stale closure from debounce)
    const currentIndex = historyIndexRef.current;

    setHistory((prev) => {
      // Don't add if identical to current position
      if (settingsEqual(prev[currentIndex], settings)) {
        return prev;
      }

      // Truncate any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);

      // Add new settings
      newHistory.push(settings);

      // Trim oldest entries if exceeding max size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(newHistory.length - maxHistorySize);
      }

      return newHistory;
    });

    setHistoryIndex((prev) => {
      // Move to the new end of history
      return Math.min(prev + 1, maxHistorySize - 1);
    });
  }, [maxHistorySize]);

  /**
   * Push new settings (debounced to batch rapid changes)
   */
  const pushSettings = useCallback((settings: StainedGlassSettings) => {
    // Store pending settings
    pendingSettingsRef.current = settings;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to commit after debounce period
    debounceTimerRef.current = setTimeout(() => {
      if (pendingSettingsRef.current) {
        commitToHistory(pendingSettingsRef.current);
        pendingSettingsRef.current = null;
      }
    }, debounceMs);
  }, [commitToHistory, debounceMs]);

  /**
   * Undo: move back in history
   */
  const undo = useCallback(() => {
    // Clear any pending changes first
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingSettingsRef.current = null;

    if (canUndo) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [canUndo]);

  /**
   * Redo: move forward in history
   */
  const redo = useCallback(() => {
    // Clear any pending changes first
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingSettingsRef.current = null;

    if (canRedo) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [canRedo]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    currentSettings,
    pushSettings,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
