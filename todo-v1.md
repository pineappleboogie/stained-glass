# Stained Glass Converter - Tasks v1

## Phase 1: Project Setup

- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Set up Tailwind CSS 4
- [ ] Initialize Shadcn/ui (`npx shadcn@latest init`)
- [ ] Install Shadcn components: slider, select, switch, button, card, label, input
- [ ] Install d3-delaunay (`npm install d3-delaunay @types/d3-delaunay`)
- [ ] Install react-dropzone (`npm install react-dropzone`)
- [ ] Create folder structure (`lib/`, `components/`, `hooks/`, `types/`)

---

## Phase 2: Core Algorithm

### Image Loading
- [ ] Create `lib/image/loader.ts` - load image to canvas
- [ ] Implement `loadImageToCanvas(file: File): Promise<ImageData>`
- [ ] Handle image resize for large images (max 2048px)

### Edge Detection
- [ ] Create `lib/image/edge-detection.ts` - Sobel filter
- [ ] Implement `detectEdges(imageData: ImageData): Float32Array`
- [ ] Convert to grayscale
- [ ] Apply Sobel X and Y kernels
- [ ] Calculate edge magnitude

### Point Sampling
- [ ] Create `lib/voronoi/points.ts` - point generation strategies
- [ ] Implement `generateUniformPoints(width, height, count): Point[]`
- [ ] Implement `generatePoissonPoints(width, height, minDistance): Point[]`
- [ ] Implement `generateEdgeWeightedPoints(edges, count, influence): Point[]`

### Voronoi Generation
- [ ] Create `lib/voronoi/generator.ts` - Voronoi diagram
- [ ] Implement `generateVoronoi(points, width, height): VoronoiResult`
- [ ] Extract cell polygons from d3-delaunay
- [ ] Clip cells to image bounds

### Color Sampling
- [ ] Create `lib/image/sampler.ts` - color extraction
- [ ] Implement `sampleCenterColor(imageData, cell): RGB`
- [ ] Implement `sampleAverageColor(imageData, cell): RGB`
- [ ] Implement `pointInPolygon(point, polygon): boolean`
- [ ] Implement saturation/brightness adjustments

---

## Phase 3: SVG Generation

- [ ] Create `lib/svg/generator.ts` - SVG creation
- [ ] Implement `polygonToPath(polygon): string` - convert points to SVG path d attribute
- [ ] Implement `generateSVG(cells, colors, options): string`
- [ ] Add lead line stroke with configurable width/color
- [ ] Set viewBox and dimensions

### Export
- [ ] Create `lib/svg/exporter.ts` - download handling
- [ ] Implement `downloadSVG(svgString, filename)`
- [ ] Implement `downloadPNG(svgString, width, height, filename)`
- [ ] Use canvas to render SVG for PNG export

---

## Phase 4: UI Components

### Drop Zone
- [ ] Create `components/DropZone.tsx`
- [ ] Integrate react-dropzone
- [ ] Accept jpg, png, webp
- [ ] Show drag-over state
- [ ] Display "Click to upload" fallback

### Preview Canvas
- [ ] Create `components/Preview.tsx`
- [ ] Render SVG result
- [ ] Handle zoom/pan (optional)
- [ ] Show loading spinner during processing

### Control Panel
- [ ] Create `components/ControlPanel.tsx`
- [ ] **Cell Generation section**
  - [ ] Cell Count slider (50-2000, default 500)
  - [ ] Point Distribution select (Uniform/Poisson/Edge-weighted)
  - [ ] Edge Influence slider (0-100%, default 30%)
- [ ] **Lead Lines section**
  - [ ] Line Width slider (0.5-10px, default 2px)
  - [ ] Line Color input (default #000000)
- [ ] **Color section**
  - [ ] Color Mode select (Exact/Average/Palette)
  - [ ] Palette Size slider (4-64, default 16) - show only in Palette mode
  - [ ] Saturation slider (0-200%, default 100%)
  - [ ] Brightness slider (0-200%, default 100%)
- [ ] **View & Export section**
  - [ ] Show Original switch
  - [ ] Export Format select (SVG/PNG)
  - [ ] Export button

### Main Hook
- [ ] Create `hooks/useStainedGlass.ts`
- [ ] Orchestrate full pipeline: load → detect → sample → voronoi → color → svg
- [ ] Expose settings state and setters
- [ ] Debounce regeneration (300ms)
- [ ] Track loading/processing state

### Main Page
- [ ] Update `app/page.tsx`
- [ ] Layout: DropZone + Preview + ControlPanel
- [ ] Wire up useStainedGlass hook
- [ ] Handle empty state (no image uploaded)

---

## Phase 5: Polish

- [ ] Add loading spinner during image processing
- [ ] Add error toast for invalid file types
- [ ] Debounce slider changes to prevent excessive rerenders
- [ ] Responsive layout for tablet/mobile
- [ ] Persist settings to localStorage (optional)
- [ ] Add keyboard shortcut for export (Cmd+S)

---

## Verification

- [ ] Upload jpg, png, webp - all load correctly
- [ ] Voronoi cells cover entire image without gaps
- [ ] Cells follow edges when Edge Influence > 0
- [ ] Cell colors match original image regions
- [ ] All controls update preview in real-time
- [ ] SVG export opens in Figma/Illustrator
- [ ] PNG export has correct resolution
- [ ] Mobile layout works on small screens
