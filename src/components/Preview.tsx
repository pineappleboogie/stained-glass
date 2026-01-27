'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PreviewProps {
  svgString: string | null;
  originalImageUrl: string | null;
  compareMode: boolean;
  isProcessing: boolean;
  className?: string;
}

export function Preview({
  svgString,
  originalImageUrl,
  compareMode,
  isProcessing,
  className,
}: PreviewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden flex items-center justify-center bg-muted',
        compareMode && 'cursor-ew-resize select-none',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Processing...</p>
          </div>
        </div>
      )}

      <div
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Stained glass layer (bottom) */}
        {svgString ? (
          <div
            className="absolute inset-4 flex items-center justify-center"
          >
            <div
              className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
          </div>
        ) : originalImageUrl ? (
          <img
            src={originalImageUrl}
            alt="Original"
            className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-contain"
          />
        ) : null}

        {/* Original image overlay (clipped by slider) - only in compare mode */}
        {compareMode && originalImageUrl && svgString && (
          <div
            className="absolute inset-4 flex items-center justify-center overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={originalImageUrl}
              alt="Original"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        )}

        {/* Slider divider line */}
        {compareMode && originalImageUrl && svgString && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)] z-10 cursor-ew-resize"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            onMouseDown={handleMouseDown}
          >
            {/* Slider handle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-3 bg-neutral-400 rounded-full" />
                <div className="w-0.5 h-3 bg-neutral-400 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
