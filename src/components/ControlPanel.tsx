'use client';

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
import {
  Divider,
  SectionHeader,
  PanelHeader,
} from '@/components/OrnamentalDivider';
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <PanelHeader title="VITRUM" subtitle="Stained Glass Studio" />

      <Divider />

      {/* Replace Image Button */}
      {onReplaceImage && (
        <div className="px-5 py-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full text-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Replace Image
          </Button>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Cell Generation Section */}
        <section className="py-4">
          <SectionHeader>Cell Generation</SectionHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="cellCount" className="text-sm">
                  Cell Count
                </Label>
                <span className="text-sm text-muted-foreground">
                  {settings.cellCount}
                </span>
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
              <Label htmlFor="distribution" className="text-sm">
                Point Distribution
              </Label>
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
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="edgeInfluence" className="text-sm">
                    Edge Influence
                  </Label>
                  <span className="text-sm text-muted-foreground">
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
          </div>
        </section>

        <Divider />

        {/* Lead Lines Section */}
        <section className="py-4">
          <SectionHeader>Lead Lines</SectionHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="lineWidth" className="text-sm">
                  Line Width
                </Label>
                <span className="text-sm text-muted-foreground">
                  {settings.lineWidth}px
                </span>
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
              <Label htmlFor="lineColor" className="text-sm">
                Line Color
              </Label>
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
          </div>
        </section>

        <Divider />

        {/* Color Section */}
        <section className="py-4">
          <SectionHeader>Color</SectionHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="colorMode" className="text-sm">
                Color Mode
              </Label>
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
                <div className="flex justify-between items-baseline">
                  <Label htmlFor="paletteSize" className="text-sm">
                    Palette Size
                  </Label>
                  <span className="text-sm text-muted-foreground">
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
              <div className="flex justify-between items-baseline">
                <Label htmlFor="saturation" className="text-sm">
                  Saturation
                </Label>
                <span className="text-sm text-muted-foreground">
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
              <div className="flex justify-between items-baseline">
                <Label htmlFor="brightness" className="text-sm">
                  Brightness
                </Label>
                <span className="text-sm text-muted-foreground">
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
          </div>
        </section>

        <Divider />

        {/* View & Export Section */}
        <section className="py-4">
          <SectionHeader>Export</SectionHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showOriginal" className="text-sm">
                Show Original
              </Label>
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
          </div>
        </section>
      </div>
    </div>
  );
}
