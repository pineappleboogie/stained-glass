# Stained Glass Lighting Effects - Implementation Plan

## Overview
Add realistic lighting effects that simulate light passing through stained glass, including configurable light direction, intensity, and diffused light rays.

## Light Configuration Options

### Direction & Intensity
- **Light Preset**: Dropdown (top-left, top, top-right, right, bottom-right, bottom, bottom-left, left, center, custom)
- **Light Angle**: Slider 0-360° (visible when preset = "custom")
- **Light Elevation**: Slider 0-90° (grazing to perpendicular)
- **Light Intensity**: Slider 0-200% (overall brightness)
- **Ambient Light**: Slider 0-100% (base illumination level)

### Volumetric God Rays
- **Rays Enabled**: Toggle
- **Ray Count**: Slider 3-12 (number of distinct ray beams)
- **Ray Intensity**: Slider 0-100% (visibility of rays)
- **Ray Spread**: Slider 0-90° (beam width/divergence)
- **Ray Length**: Slider 0-100% (relative to image height)

### Color Glow/Transmission
- **Glow Enabled**: Toggle
- **Glow Intensity**: Slider 0-100%
- **Glow Radius**: Slider 0-50px

### Dark Mode Behavior
- In dark mode, lighting effects should be more prominent:
  - Background becomes dark (near black) instead of white
  - Glow intensity automatically boosted (1.5x multiplier)
  - Ray visibility enhanced against dark background
  - Cells appear to "emit" light rather than transmit it

---

## Technical Approach: Pure SVG with Filters

Using SVG filters and blend modes (GPU-accelerated in browsers). This preserves vector export quality and fits the existing optimization tiers.

### SVG Layer Stack (bottom to top)
1. Background rect (white in light mode, dark gray/black in dark mode)
2. Color glow layer (blurred cell duplicates)
   - Light mode: `mix-blend-mode: multiply` (subtle colored shadows)
   - Dark mode: `mix-blend-mode: screen` (glowing halos, 1.5x intensity)
3. Frame elements (existing)
4. Artwork cells with per-cell brightness adjustment
5. Light rays layer (gradient trapezoids with `mix-blend-mode: screen`)
6. Lead lines layer (kept crisp on top)

### Key Algorithms

**Per-Cell Light Transmission:**
- Calculate position along light direction vector
- Cells closer to light source appear brighter
- Color luminance affects transmission (darker glass = less light)
- Elevation affects overall intensity

**Volumetric God Ray Generation:**
- Cluster cells by region (grid-based spatial partitioning)
- Sample dominant color from each cluster
- Generate 3-12 broad ray beams from light source through clusters
- Each ray uses gradient from cluster's dominant color to transparent
- Rays rendered as wide trapezoids or gradient paths with blur filter
- Much better performance than per-cell rays (O(ray_count) vs O(cell_count))

---

## Files to Modify

### [types/index.ts](src/types/index.ts)
- Add `LightPreset` type (direction presets)
- Add `LightSettings` interface:
  ```typescript
  interface LightSettings {
    enabled: boolean;
    preset: LightPreset;
    angle: number;        // 0-360°
    elevation: number;    // 0-90°
    intensity: number;    // 0-2 (0-200%)
    ambient: number;      // 0-1 (0-100%)
    darkMode: boolean;    // Dark background with enhanced glow
    rays: {
      enabled: boolean;
      count: number;      // 3-12
      intensity: number;  // 0-1
      spread: number;     // 0-90°
      length: number;     // 0-1 (relative to height)
    };
    glow: {
      enabled: boolean;
      intensity: number;  // 0-1
      radius: number;     // 0-50px
    };
  }
  ```
- Add `DEFAULT_LIGHT_SETTINGS` constant (disabled by default)
- Add `lighting: LightSettings` to `StainedGlassSettings`
- Update `DEFAULT_SETTINGS` with `lighting: DEFAULT_LIGHT_SETTINGS`
- Add `lighting` section to `SECTION_SETTINGS` for reset functionality

### [lib/svg/generator.ts](src/lib/svg/generator.ts)
- Add `lighting?: LightSettings` to `SVGOptions`
- Generate SVG `<defs>` with filters (blur, glow)
- Add glow layer rendering
- Add light ray layer rendering
- Apply per-cell brightness based on light direction

## Files to Create

### `lib/lighting/index.ts`
- Re-exports all lighting modules

### `lib/lighting/transmission.ts`
- `calculateCellBrightness(cell, lightAngle, lightElevation, imageSize)` - per-cell brightness multiplier
- `applyLightTransmission(cells, lightSettings, width, height)` - returns cells with adjusted colors

### `lib/lighting/rays.ts`
- `GodRay` interface (origin, direction, color, opacity, width, length)
- `clusterCells(cells, gridSize)` - spatial clustering for dominant colors
- `generateGodRays(clusters, lightSettings, width, height)` - creates volumetric ray beams
- `renderGodRaysToSVG(rays)` - renders rays as gradient trapezoids with blur

### `lib/lighting/glow.ts`
- `renderGlowLayer(cells, lightSettings)` - blurred offset cell duplicates

### `lib/lighting/filters.ts`
- `generateLightingDefs(lightSettings)` - SVG filter definitions

### [hooks/useStainedGlass.ts](src/hooks/useStainedGlass.ts)
- Add `lightingSettingsRef` for SVG-only updates (like `lineSettingsRef` pattern)
- Pass lighting to `generateSVG()`
- **CRITICAL**: Lighting changes trigger **SVG-only regeneration** (`regenerateSVG` tier 3)
- Lighting settings must NOT be included in `processImage` dependencies
- Add `useEffect` to sync `lightingSettingsRef` when lighting settings change
- Modify `regenerateSVG` to include lighting in `generateSVG()` call
- Add lighting to `SECTION_SETTINGS` in types for reset functionality

### [components/ControlPanel.tsx](src/components/ControlPanel.tsx)
- Add "Lighting" section with all controls:
  - **Enable Lighting** toggle (master switch)
  - **Dark Mode** toggle (dark background with enhanced glow)
  - Light preset dropdown (top-left, top, top-right, etc.)
  - Angle slider (visible when preset = "custom")
  - Elevation/Intensity/Ambient sliders
  - **Rays** collapsible group with toggle + count/intensity/spread/length sliders
  - **Glow** collapsible group with toggle + intensity/radius sliders

---

## Implementation Phases

### Phase 1: Data Structures
1. Add types to `types/index.ts`
2. Create `lib/lighting/index.ts` with stub exports

### Phase 2: Core Lighting
1. Implement `lib/lighting/transmission.ts`
2. Implement `lib/lighting/filters.ts`
3. Update `generator.ts` to apply per-cell brightness

### Phase 3: Light Rays
1. Implement `lib/lighting/rays.ts`
2. Add ray layer to `generator.ts`

### Phase 4: Color Glow
1. Implement `lib/lighting/glow.ts`
2. Add glow layer to `generator.ts`

### Phase 5: UI Integration
1. Add Lighting section to `ControlPanel.tsx`
2. Update `useStainedGlass.ts`:
   - Add `lightingSettingsRef` ref (pattern: `lineSettingsRef`)
   - Add `useEffect` to sync lighting ref when settings change
   - Update `regenerateSVG` to pass lighting to `generateSVG()`
   - **Do NOT add lighting to `processImage` dependencies** - this ensures no cell reprocessing
3. Verify lighting slider changes trigger only SVG regeneration (not `processImage`)

### Phase 6: Polish
1. Add lighting presets (sunset, morning, backlit, etc.)
2. Performance tuning (limit ray count, optimize blur)
3. Test with various images

---

## Verification Plan

1. **No-reprocessing check**: Add `console.log('processImage called')` temporarily to `processImage()`. Adjust lighting sliders - console should NOT log. Only cell generation settings should trigger it.
2. **Visual verification**: Load an image, enable lighting, adjust direction/intensity sliders - should see brightness gradient across cells
3. **Ray verification**: Enable rays, adjust count/spread/length - should see broad volumetric god rays with colors sampled from the glass regions they pass through
4. **Glow verification**: Enable glow, increase radius - should see colored shadows offset from cells
5. **Dark mode verification**: Toggle dark mode - background should become dark, glow should become more prominent and use `screen` blend mode
6. **Export verification**: Export SVG, open in browser/Illustrator - lighting effects should be preserved
7. **Performance check**: With 1000+ cells, slider adjustments should remain responsive (< 100ms)
