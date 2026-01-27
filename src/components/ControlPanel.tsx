'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  ColorPaletteId,
  ExportFormat,
  PresetName,
  EdgeMethod,
  FrameStyle,
  SettingsSection,
  LightPreset,
} from '@/types';
import { getDefaultsForSection } from '@/types';
import { useRef, useState, useEffect } from 'react';
import { PRESETS, applyPreset } from '@/lib/presets';
import { getPalettesByCategory } from '@/lib/color-palettes';
import { copySVGToClipboard } from '@/lib/svg/exporter';
import { ImagePlus, SplitSquareHorizontal, Copy, Check, Download, Sun, Moon, Lightbulb } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';

interface ControlPanelProps {
  settings: StainedGlassSettings;
  onSettingsChange: (settings: Partial<StainedGlassSettings>) => void;
  onExport: (format: ExportFormat) => void;
  onReplaceImage?: (file: File) => void;
  disabled?: boolean;
  svgString: string | null;
}

export function ControlPanel({
  settings,
  onSettingsChange,
  onExport,
  onReplaceImage,
  disabled = false,
  svgString,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for theme - use layout effect equivalent
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleSectionReset = (section: SettingsSection) => {
    const defaults = getDefaultsForSection(section);
    onSettingsChange({ ...defaults, activePreset: 'custom' });
  };

  const handleCopySVG = async () => {
    if (!svgString) return;
    const success = await copySVGToClipboard(svgString);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

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
      <div className="relative">
        <PanelHeader title="VITRUM" subtitle="Stained Glass Studio" />
        {/* Theme toggle button */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground"
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <Divider />

      {/* Main Controls */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Replace Image Button */}
        {onReplaceImage && (
          <div className="py-3">
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
              <ImagePlus className="w-4 h-4 mr-2" />
              Replace Image
            </Button>
          </div>
        )}

        {/* Presets Section */}
        <section className="py-4">
          <SectionHeader>Presets</SectionHeader>
          <div className="space-y-2">
            <Select
              value={settings.activePreset}
              onValueChange={(value: PresetName) => {
                const newSettings = applyPreset(settings, value);
                onSettingsChange(newSettings);
              }}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {PRESETS.find((p) => p.name === settings.activePreset)?.description}
            </p>
          </div>
        </section>

        <Divider />

        {/* Cell Generation Section */}
        <section className="py-4">
          <SectionHeader onReset={() => handleSectionReset('cellGeneration')}>Cell Generation</SectionHeader>
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
                onValueChange={([value]) => onSettingsChange({ cellCount: value, activePreset: 'custom' })}
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
                  onSettingsChange({ pointDistribution: value, activePreset: 'custom' })
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
                    onSettingsChange({ edgeInfluence: value / 100, activePreset: 'custom' })
                  }
                  disabled={disabled}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="relaxation" className="text-sm">
                  Cell Smoothing
                </Label>
                <span className="text-sm text-muted-foreground">
                  {settings.relaxationIterations === 0
                    ? 'Off'
                    : `${settings.relaxationIterations} ${settings.relaxationIterations === 1 ? 'pass' : 'passes'}`}
                </span>
              </div>
              <Slider
                id="relaxation"
                min={0}
                max={5}
                step={1}
                value={[settings.relaxationIterations]}
                onValueChange={([value]) =>
                  onSettingsChange({ relaxationIterations: value, activePreset: 'custom' })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </section>

        <Divider />

        {/* Image Processing Section */}
        <section className="py-4">
          <SectionHeader onReset={() => handleSectionReset('imageProcessing')}>Image Processing</SectionHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="preBlur" className="text-sm">
                  Pre-blur
                </Label>
                <span className="text-sm text-muted-foreground">
                  {settings.preBlur === 0 ? 'Off' : settings.preBlur.toFixed(1)}
                </span>
              </div>
              <Slider
                id="preBlur"
                min={0}
                max={10}
                step={0.5}
                value={[settings.preBlur]}
                onValueChange={([value]) =>
                  onSettingsChange({ preBlur: value, activePreset: 'custom' })
                }
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="contrast" className="text-sm">
                  Contrast
                </Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(settings.contrast * 100)}%
                </span>
              </div>
              <Slider
                id="contrast"
                min={50}
                max={200}
                step={5}
                value={[settings.contrast * 100]}
                onValueChange={([value]) =>
                  onSettingsChange({ contrast: value / 100, activePreset: 'custom' })
                }
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edgeMethod" className="text-sm">
                Edge Detection
              </Label>
              <Select
                value={settings.edgeMethod}
                onValueChange={(value: EdgeMethod) =>
                  onSettingsChange({ edgeMethod: value, activePreset: 'custom' })
                }
                disabled={disabled}
              >
                <SelectTrigger id="edgeMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sobel">Sobel</SelectItem>
                  <SelectItem value="canny">Canny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="edgeSensitivity" className="text-sm">
                  Edge Sensitivity
                </Label>
                <span className="text-sm text-muted-foreground">
                  {settings.edgeSensitivity}%
                </span>
              </div>
              <Slider
                id="edgeSensitivity"
                min={0}
                max={100}
                step={5}
                value={[settings.edgeSensitivity]}
                onValueChange={([value]) =>
                  onSettingsChange({ edgeSensitivity: value, activePreset: 'custom' })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </section>

        <Divider />

        {/* Lead Lines Section */}
        <section className="py-4">
          <SectionHeader onReset={() => handleSectionReset('leadLines')}>Lead Lines</SectionHeader>
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
                onValueChange={([value]) => onSettingsChange({ lineWidth: value, activePreset: 'custom' })}
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
                  onChange={(e) => onSettingsChange({ lineColor: e.target.value, activePreset: 'custom' })}
                  className="w-12 h-9 p-1 cursor-pointer"
                  disabled={disabled}
                />
                <Input
                  type="text"
                  value={settings.lineColor}
                  onChange={(e) => onSettingsChange({ lineColor: e.target.value, activePreset: 'custom' })}
                  className="flex-1 font-mono text-sm"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* Frame Section */}
        <section className="py-4">
          <SectionHeader onReset={() => handleSectionReset('frame')}>Frame</SectionHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frameStyle" className="text-sm">
                Frame Style
              </Label>
              <Select
                value={settings.frameStyle}
                onValueChange={(value: FrameStyle) =>
                  onSettingsChange({ frameStyle: value, activePreset: 'custom' })
                }
                disabled={disabled}
              >
                <SelectTrigger id="frameStyle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="simple">Simple Border</SelectItem>
                  <SelectItem value="segmented">Segmented Border</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.frameStyle !== 'none' && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="frameWidth" className="text-sm">
                      Frame Width
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.frameWidth}%
                    </span>
                  </div>
                  <Slider
                    id="frameWidth"
                    min={2}
                    max={15}
                    step={1}
                    value={[settings.frameWidth]}
                    onValueChange={([value]) =>
                      onSettingsChange({ frameWidth: value, activePreset: 'custom' })
                    }
                    disabled={disabled}
                  />
                </div>

                {settings.frameStyle === 'segmented' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <Label htmlFor="frameCellSize" className="text-sm">
                        Segment Size
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {settings.frameCellSize}px
                      </span>
                    </div>
                    <Slider
                      id="frameCellSize"
                      min={30}
                      max={150}
                      step={10}
                      value={[settings.frameCellSize]}
                      onValueChange={([value]) =>
                        onSettingsChange({ frameCellSize: value, activePreset: 'custom' })
                      }
                      disabled={disabled}
                    />
                  </div>
                )}

                {/* Frame Color Subsection */}
                <div className="pt-2 border-t border-border/50 mt-3">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Frame Color
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frameColorPalette" className="text-sm">
                    Frame Palette
                  </Label>
                  <Select
                    value={settings.frameColorPalette}
                    onValueChange={(value: ColorPaletteId) =>
                      onSettingsChange({ frameColorPalette: value, activePreset: 'custom' })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger id="frameColorPalette">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original Colors</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Traditional Glass</SelectLabel>
                        {getPalettesByCategory().traditional.map((palette) => (
                          <SelectItem key={palette.id} value={palette.id}>
                            {palette.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Color Moods</SelectLabel>
                        {getPalettesByCategory().moods.map((palette) => (
                          <SelectItem key={palette.id} value={palette.id}>
                            {palette.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Artistic Styles</SelectLabel>
                        {getPalettesByCategory().artistic.map((palette) => (
                          <SelectItem key={palette.id} value={palette.id}>
                            {palette.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="frameHueShift" className="text-sm">
                      Hue Shift
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.frameHueShift}°
                    </span>
                  </div>
                  <Slider
                    id="frameHueShift"
                    min={0}
                    max={360}
                    step={5}
                    value={[settings.frameHueShift]}
                    onValueChange={([value]) =>
                      onSettingsChange({ frameHueShift: value, activePreset: 'custom' })
                    }
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="frameSaturation" className="text-sm">
                      Frame Saturation
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(settings.frameSaturation * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="frameSaturation"
                    min={0}
                    max={200}
                    step={5}
                    value={[settings.frameSaturation * 100]}
                    onValueChange={([value]) =>
                      onSettingsChange({ frameSaturation: value / 100, activePreset: 'custom' })
                    }
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="frameBrightness" className="text-sm">
                      Frame Brightness
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(settings.frameBrightness * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="frameBrightness"
                    min={0}
                    max={200}
                    step={5}
                    value={[settings.frameBrightness * 100]}
                    onValueChange={([value]) =>
                      onSettingsChange({ frameBrightness: value / 100, activePreset: 'custom' })
                    }
                    disabled={disabled}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <Divider />

        {/* Color Section */}
        <section className="py-4">
          <SectionHeader onReset={() => handleSectionReset('color')}>Color</SectionHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="colorPalette" className="text-sm">
                Color Palette
              </Label>
              <Select
                value={settings.colorPalette}
                onValueChange={(value: ColorPaletteId) =>
                  onSettingsChange({ colorPalette: value, activePreset: 'custom' })
                }
                disabled={disabled}
              >
                <SelectTrigger id="colorPalette">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original Colors</SelectItem>
                  <SelectGroup>
                    <SelectLabel>Traditional Glass</SelectLabel>
                    {getPalettesByCategory().traditional.map((palette) => (
                      <SelectItem key={palette.id} value={palette.id}>
                        {palette.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Color Moods</SelectLabel>
                    {getPalettesByCategory().moods.map((palette) => (
                      <SelectItem key={palette.id} value={palette.id}>
                        {palette.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Artistic Styles</SelectLabel>
                    {getPalettesByCategory().artistic.map((palette) => (
                      <SelectItem key={palette.id} value={palette.id}>
                        {palette.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorMode" className="text-sm">
                Color Mode
              </Label>
              <Select
                value={settings.colorMode}
                onValueChange={(value: ColorMode) =>
                  onSettingsChange({ colorMode: value, activePreset: 'custom' })
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
                  onValueChange={([value]) => onSettingsChange({ paletteSize: value, activePreset: 'custom' })}
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
                  onSettingsChange({ saturation: value / 100, activePreset: 'custom' })
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
                  onSettingsChange({ brightness: value / 100, activePreset: 'custom' })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </section>

        <Divider />

        {/* Lighting Section */}
        <section className="py-4">
          <SectionHeader onReset={() => handleSectionReset('lighting')}>Lighting</SectionHeader>
          <div className="space-y-4">
            {/* Enable Lighting Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="lightingEnabled" className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Enable Lighting
              </Label>
              <Switch
                id="lightingEnabled"
                checked={settings.lighting.enabled}
                onCheckedChange={(checked) =>
                  onSettingsChange({
                    lighting: { ...settings.lighting, enabled: checked },
                    activePreset: 'custom',
                  })
                }
                disabled={disabled}
              />
            </div>

            {settings.lighting.enabled && (
              <>
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="lightingDarkMode" className="text-sm">
                    Dark Background
                  </Label>
                  <Switch
                    id="lightingDarkMode"
                    checked={settings.lighting.darkMode}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        lighting: { ...settings.lighting, darkMode: checked },
                        activePreset: 'custom',
                      })
                    }
                    disabled={disabled}
                  />
                </div>

                {/* Light Preset */}
                <div className="space-y-2">
                  <Label htmlFor="lightPreset" className="text-sm">
                    Light Direction
                  </Label>
                  <Select
                    value={settings.lighting.preset}
                    onValueChange={(value: LightPreset) =>
                      onSettingsChange({
                        lighting: { ...settings.lighting, preset: value },
                        activePreset: 'custom',
                      })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger id="lightPreset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="custom">Custom Angle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Angle (only when preset is 'custom') */}
                {settings.lighting.preset === 'custom' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <Label htmlFor="lightAngle" className="text-sm">
                        Light Angle
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {settings.lighting.angle}°
                      </span>
                    </div>
                    <Slider
                      id="lightAngle"
                      min={0}
                      max={360}
                      step={5}
                      value={[settings.lighting.angle]}
                      onValueChange={([value]) =>
                        onSettingsChange({
                          lighting: { ...settings.lighting, angle: value },
                          activePreset: 'custom',
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                )}

                {/* Light Elevation */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="lightElevation" className="text-sm">
                      Light Elevation
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.lighting.elevation}°
                    </span>
                  </div>
                  <Slider
                    id="lightElevation"
                    min={0}
                    max={90}
                    step={5}
                    value={[settings.lighting.elevation]}
                    onValueChange={([value]) =>
                      onSettingsChange({
                        lighting: { ...settings.lighting, elevation: value },
                        activePreset: 'custom',
                      })
                    }
                    disabled={disabled}
                  />
                </div>

                {/* Light Intensity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="lightIntensity" className="text-sm">
                      Light Intensity
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(settings.lighting.intensity * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="lightIntensity"
                    min={0}
                    max={200}
                    step={5}
                    value={[settings.lighting.intensity * 100]}
                    onValueChange={([value]) =>
                      onSettingsChange({
                        lighting: { ...settings.lighting, intensity: value / 100 },
                        activePreset: 'custom',
                      })
                    }
                    disabled={disabled}
                  />
                </div>

                {/* Ambient Light */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="lightAmbient" className="text-sm">
                      Ambient Light
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(settings.lighting.ambient * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="lightAmbient"
                    min={0}
                    max={100}
                    step={5}
                    value={[settings.lighting.ambient * 100]}
                    onValueChange={([value]) =>
                      onSettingsChange({
                        lighting: { ...settings.lighting, ambient: value / 100 },
                        activePreset: 'custom',
                      })
                    }
                    disabled={disabled}
                  />
                </div>

                {/* God Rays Subsection */}
                <div className="pt-2 border-t border-border/50 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      God Rays
                    </Label>
                    <Switch
                      checked={settings.lighting.rays.enabled}
                      onCheckedChange={(checked) =>
                        onSettingsChange({
                          lighting: {
                            ...settings.lighting,
                            rays: { ...settings.lighting.rays, enabled: checked },
                          },
                          activePreset: 'custom',
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>

                {settings.lighting.rays.enabled && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="rayCount" className="text-sm">
                          Ray Count
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {settings.lighting.rays.count}
                        </span>
                      </div>
                      <Slider
                        id="rayCount"
                        min={3}
                        max={12}
                        step={1}
                        value={[settings.lighting.rays.count]}
                        onValueChange={([value]) =>
                          onSettingsChange({
                            lighting: {
                              ...settings.lighting,
                              rays: { ...settings.lighting.rays, count: value },
                            },
                            activePreset: 'custom',
                          })
                        }
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="rayIntensity" className="text-sm">
                          Ray Intensity
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(settings.lighting.rays.intensity * 100)}%
                        </span>
                      </div>
                      <Slider
                        id="rayIntensity"
                        min={0}
                        max={100}
                        step={5}
                        value={[settings.lighting.rays.intensity * 100]}
                        onValueChange={([value]) =>
                          onSettingsChange({
                            lighting: {
                              ...settings.lighting,
                              rays: { ...settings.lighting.rays, intensity: value / 100 },
                            },
                            activePreset: 'custom',
                          })
                        }
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="raySpread" className="text-sm">
                          Ray Spread
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {settings.lighting.rays.spread}°
                        </span>
                      </div>
                      <Slider
                        id="raySpread"
                        min={0}
                        max={90}
                        step={5}
                        value={[settings.lighting.rays.spread]}
                        onValueChange={([value]) =>
                          onSettingsChange({
                            lighting: {
                              ...settings.lighting,
                              rays: { ...settings.lighting.rays, spread: value },
                            },
                            activePreset: 'custom',
                          })
                        }
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="rayLength" className="text-sm">
                          Ray Length
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(settings.lighting.rays.length * 100)}%
                        </span>
                      </div>
                      <Slider
                        id="rayLength"
                        min={0}
                        max={100}
                        step={5}
                        value={[settings.lighting.rays.length * 100]}
                        onValueChange={([value]) =>
                          onSettingsChange({
                            lighting: {
                              ...settings.lighting,
                              rays: { ...settings.lighting.rays, length: value / 100 },
                            },
                            activePreset: 'custom',
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                  </>
                )}

                {/* Glow Subsection */}
                <div className="pt-2 border-t border-border/50 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Color Glow
                    </Label>
                    <Switch
                      checked={settings.lighting.glow.enabled}
                      onCheckedChange={(checked) =>
                        onSettingsChange({
                          lighting: {
                            ...settings.lighting,
                            glow: { ...settings.lighting.glow, enabled: checked },
                          },
                          activePreset: 'custom',
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>

                {settings.lighting.glow.enabled && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="glowIntensity" className="text-sm">
                          Glow Intensity
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(settings.lighting.glow.intensity * 100)}%
                        </span>
                      </div>
                      <Slider
                        id="glowIntensity"
                        min={0}
                        max={100}
                        step={5}
                        value={[settings.lighting.glow.intensity * 100]}
                        onValueChange={([value]) =>
                          onSettingsChange({
                            lighting: {
                              ...settings.lighting,
                              glow: { ...settings.lighting.glow, intensity: value / 100 },
                            },
                            activePreset: 'custom',
                          })
                        }
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <Label htmlFor="glowRadius" className="text-sm">
                          Glow Radius
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {settings.lighting.glow.radius}px
                        </span>
                      </div>
                      <Slider
                        id="glowRadius"
                        min={0}
                        max={50}
                        step={1}
                        value={[settings.lighting.glow.radius]}
                        onValueChange={([value]) =>
                          onSettingsChange({
                            lighting: {
                              ...settings.lighting,
                              glow: { ...settings.lighting.glow, radius: value },
                            },
                            activePreset: 'custom',
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        <Divider />

        {/* View & Export Section */}
        <section className="py-4">
          <SectionHeader>Export</SectionHeader>
          <div className="space-y-4">
            <Button
              variant={settings.compareMode ? 'default' : 'outline'}
              className="w-full text-sm"
              onClick={() => onSettingsChange({ compareMode: !settings.compareMode })}
              disabled={disabled}
            >
              <SplitSquareHorizontal className="w-4 h-4 mr-2" />
              {settings.compareMode ? 'Exit Compare' : 'Compare Original'}
            </Button>

            {/* Copy SVG - Primary Action */}
            <Button
              className="w-full"
              onClick={handleCopySVG}
              disabled={disabled || !svgString}
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy SVG
                </>
              )}
            </Button>

            {/* Download buttons - Secondary Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onExport('svg')}
                disabled={disabled}
              >
                <Download className="w-4 h-4 mr-2" />
                SVG
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onExport('png')}
                disabled={disabled}
              >
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
