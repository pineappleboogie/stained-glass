'use client';

import { useStainedGlass } from '@/hooks/useStainedGlass';
import { DropZone } from '@/components/DropZone';
import { Preview } from '@/components/Preview';
import { ControlPanel } from '@/components/ControlPanel';

export default function Home() {
  const {
    settings,
    svgString,
    originalImageUrl,
    processingState,
    imageDimensions,
    setSettings,
    loadImage,
    exportImage,
  } = useStainedGlass();

  const hasImage = !!originalImageUrl;
  const aspectRatio = imageDimensions
    ? imageDimensions.width / imageDimensions.height
    : undefined;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {!hasImage ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <DropZone
            onFileAccepted={loadImage}
            className="w-full max-w-2xl h-[400px]"
          />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Preview area - fills remaining space */}
          <div className="flex-1 min-w-0 p-6 flex flex-col">
            <Preview
              svgString={svgString}
              originalImageUrl={originalImageUrl}
              showOriginal={settings.showOriginal}
              isProcessing={processingState.isLoading || processingState.isProcessing}
              aspectRatio={aspectRatio}
              className="flex-1 min-h-0"
            />

            {processingState.error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-md">
                <p className="text-destructive text-sm">
                  {processingState.error}
                </p>
              </div>
            )}
          </div>

          {/* Control panel */}
          <aside className="w-80 shrink-0 panel overflow-hidden flex flex-col">
            <ControlPanel
              settings={settings}
              onSettingsChange={setSettings}
              onExport={exportImage}
              onReplaceImage={loadImage}
              disabled={processingState.isLoading}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
