'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  StainedGlassSettings,
  PointDistribution,
  ColorMode,
  ExportFormat,
} from '@/types';
import { useRef } from 'react';

interface ControlPanelProps {
  settings: StainedGlassSettings;
  onSettingsChange: (settings: Partial<StainedGlassSettings>) => void;
  onExport: (format: ExportFormat) => void;
  onReplaceImage?: (file: File) => void;
  disabled?: boolean;
}

export function ControlPanel({
  settings,
  onSettingsChange,
  onExport,
  onReplaceImage,
  disabled = false,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplaceImage) {
      onReplaceImage(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Replace Image */}
      {onReplaceImage && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Replace Image
          </Button>
        </>
      )}

      {/* Cell Generation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Cell Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="cellCount">Cell Count</Label>
              <span className="text-sm text-neutral-500">{settings.cellCount}</span>
            </div>
            <Slider
              id="cellCount"
              min={50}
              max={2000}
              step={10}
              value={[settings.cellCount]}
              onValueChange={([value]) => onSettingsChange({ cellCount: value })}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="distribution">Point Distribution</Label>
            <Select
              value={settings.pointDistribution}
              onValueChange={(value: PointDistribution) =>
                onSettingsChange({ pointDistribution: value })
              }
              disabled={disabled}
            >
              <SelectTrigger id="distribution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uniform">Uniform</SelectItem>
                <SelectItem value="poisson">Poisson Disk</SelectItem>
                <SelectItem value="edge-weighted">Edge-weighted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.pointDistribution === 'edge-weighted' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="edgeInfluence">Edge Influence</Label>
                <span className="text-sm text-neutral-500">
                  {Math.round(settings.edgeInfluence * 100)}%
                </span>
              </div>
              <Slider
                id="edgeInfluence"
                min={0}
                max={100}
                step={5}
                value={[settings.edgeInfluence * 100]}
                onValueChange={([value]) =>
                  onSettingsChange({ edgeInfluence: value / 100 })
                }
                disabled={disabled}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Lines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Lead Lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="lineWidth">Line Width</Label>
              <span className="text-sm text-neutral-500">{settings.lineWidth}px</span>
            </div>
            <Slider
              id="lineWidth"
              min={0.5}
              max={10}
              step={0.5}
              value={[settings.lineWidth]}
              onValueChange={([value]) => onSettingsChange({ lineWidth: value })}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lineColor">Line Color</Label>
            <div className="flex gap-2">
              <Input
                id="lineColor"
                type="color"
                value={settings.lineColor}
                onChange={(e) => onSettingsChange({ lineColor: e.target.value })}
                className="w-12 h-9 p-1 cursor-pointer"
                disabled={disabled}
              />
              <Input
                type="text"
                value={settings.lineColor}
                onChange={(e) => onSettingsChange({ lineColor: e.target.value })}
                className="flex-1 font-mono text-sm"
                disabled={disabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Color</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="colorMode">Color Mode</Label>
            <Select
              value={settings.colorMode}
              onValueChange={(value: ColorMode) =>
                onSettingsChange({ colorMode: value })
              }
              disabled={disabled}
            >
              <SelectTrigger id="colorMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact (Center)</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="palette">Reduced Palette</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.colorMode === 'palette' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="paletteSize">Palette Size</Label>
                <span className="text-sm text-neutral-500">
                  {settings.paletteSize} colors
                </span>
              </div>
              <Slider
                id="paletteSize"
                min={4}
                max={64}
                step={4}
                value={[settings.paletteSize]}
                onValueChange={([value]) => onSettingsChange({ paletteSize: value })}
                disabled={disabled}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="saturation">Saturation</Label>
              <span className="text-sm text-neutral-500">
                {Math.round(settings.saturation * 100)}%
              </span>
            </div>
            <Slider
              id="saturation"
              min={0}
              max={200}
              step={5}
              value={[settings.saturation * 100]}
              onValueChange={([value]) =>
                onSettingsChange({ saturation: value / 100 })
              }
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="brightness">Brightness</Label>
              <span className="text-sm text-neutral-500">
                {Math.round(settings.brightness * 100)}%
              </span>
            </div>
            <Slider
              id="brightness"
              min={0}
              max={200}
              step={5}
              value={[settings.brightness * 100]}
              onValueChange={([value]) =>
                onSettingsChange({ brightness: value / 100 })
              }
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* View & Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">View & Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showOriginal">Show Original</Label>
            <Switch
              id="showOriginal"
              checked={settings.showOriginal}
              onCheckedChange={(checked) =>
                onSettingsChange({ showOriginal: checked })
              }
              disabled={disabled}
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => onExport('svg')}
              disabled={disabled}
            >
              Export SVG
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onExport('png')}
              disabled={disabled}
            >
              Export PNG
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
