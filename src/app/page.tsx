'use client';

import { useStainedGlass } from '@/hooks/useStainedGlass';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { DropZone } from '@/components/DropZone';
import { Preview } from '@/components/Preview';
import { ControlPanel } from '@/components/ControlPanel';

export default function Home() {
  const {
    settings,
    svgString,
    coloredCells,
    originalImageUrl,
    processingState,
    imageDimensions,
    setSettings,
    loadImage,
    exportImage,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useStainedGlass();

  // Keyboard shortcuts for undo/redo
  useKeyboardShortcuts({
    onUndo: canUndo ? undo : undefined,
    onRedo: canRedo ? redo : undefined,
  });

  const hasImage = !!originalImageUrl;

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
          <div className="flex-1 min-w-0 flex flex-col">
            <Preview
              svgString={svgString}
              coloredCells={coloredCells}
              originalImageUrl={originalImageUrl}
              compareMode={settings.compareMode}
              isProcessing={processingState.isLoading || processingState.isProcessing}
              lighting={settings.lighting}
              imageDimensions={imageDimensions}
              lineWidth={settings.lineWidth}
              lineColor={settings.lineColor}
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
              svgString={svgString}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
