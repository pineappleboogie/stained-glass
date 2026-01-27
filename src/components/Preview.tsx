'use client';

import { cn } from '@/lib/utils';

interface PreviewProps {
  svgString: string | null;
  originalImageUrl: string | null;
  showOriginal: boolean;
  isProcessing: boolean;
  aspectRatio?: number;
  className?: string;
}

export function Preview({
  svgString,
  originalImageUrl,
  showOriginal,
  isProcessing,
  aspectRatio,
  className,
}: PreviewProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center',
        className
      )}
    >
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Processing...</p>
          </div>
        </div>
      )}

      <div
        className="relative w-full h-full flex items-center justify-center"
        style={aspectRatio ? { aspectRatio: aspectRatio } : undefined}
      >
        {showOriginal && originalImageUrl ? (
          <img
            src={originalImageUrl}
            alt="Original"
            className="max-w-full max-h-full object-contain"
          />
        ) : svgString ? (
          <div
            className="max-w-full max-h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        ) : originalImageUrl ? (
          <img
            src={originalImageUrl}
            alt="Original"
            className="max-w-full max-h-full object-contain"
          />
        ) : null}
      </div>
    </div>
  );
}
