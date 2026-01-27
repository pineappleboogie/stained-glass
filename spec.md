# Stained Glass Image Converter - Specification

## Overview

A web application that converts uploaded images into stained glass designs using edge-weighted Voronoi patterns, outputting scalable SVG vectors.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Shadcn/ui | Control panel components |
| d3-delaunay | Voronoi diagram generation |
| Canvas API | Image pixel manipulation |

---

## Algorithm Pipeline

```
Image Upload → Canvas Rendering → Edge Detection → Point Sampling → Voronoi Generation → Color Sampling → SVG Output
```

### Step 1: Image Loading
- Accept jpg, png, webp formats
- Load image onto hidden canvas
- Extract pixel data via `getImageData()`
- **Transparent PNGs**: Treat transparent pixels as white
- **Max dimension**: 2048px (resize larger images to fit)

### Step 2: Edge Detection (Sobel Filter)
- Convert image to grayscale
- Apply Sobel kernels to detect horizontal and vertical edges
- Output edge magnitude map (0-255 per pixel)

### Step 3: Point Sampling (Edge-Weighted Poisson Disk)
- Generate points using Poisson disk sampling for even distribution
- Weight point placement by edge magnitude (more points along edges)
- Edge Influence parameter (0-100%) controls weighting strength
- Cell Count parameter determines total number of points

### Step 4: Voronoi Generation
- Use d3-delaunay to create Delaunay triangulation from points
- Generate Voronoi diagram with image bounds as clipping region
- Extract cell polygons as arrays of vertices

### Step 5: Color Sampling
- For each Voronoi cell, sample colors from original image
- Three modes:
  - **Exact**: Use color at cell center point
  - **Average**: Average all pixels within cell bounds
  - **Palette**: Reduce to N colors using k-means clustering
- Apply saturation and brightness adjustments

### Step 6: SVG Generation
- Convert each cell polygon to SVG `<path>` element
- Apply fill color from sampling step
- Add stroke (lead lines) with configurable width and color
- Output complete SVG document

---

## Control Panel (Shadcn/ui)

### Cell Generation

| Control | Component | Range | Default | Description |
|---------|-----------|-------|---------|-------------|
| Cell Count | Slider | 50 - 2000 | 500 | Number of glass pieces |
| Point Distribution | Select | Uniform / Poisson / Edge-weighted | Edge-weighted | How seed points are distributed |
| Edge Influence | Slider | 0 - 100% | 30% | How much edges affect point placement |

### Lead Lines (Borders)

| Control | Component | Range | Default | Description |
|---------|-----------|-------|---------|-------------|
| Line Width | Slider | 0.5 - 10px | 2px | Thickness of black borders |
| Line Color | Color Input | Any | #000000 | Color of borders between cells |

### Color

| Control | Component | Range | Default | Description |
|---------|-----------|-------|---------|-------------|
| Color Mode | Select | Exact / Average / Palette | Average | How cell colors are determined |
| Palette Size | Slider | 4 - 64 | 16 | Number of colors (Palette mode only) |
| Saturation | Slider | 0 - 200% | 100% | Color saturation adjustment |
| Brightness | Slider | 0 - 200% | 100% | Color brightness adjustment |

### View & Export

| Control | Component | Options | Default | Description |
|---------|-----------|---------|---------|-------------|
| Show Original | Switch | On / Off | Off | Toggle original image overlay |
| Export Format | Select | SVG / PNG | SVG | Output file format |
| Export Button | Button | - | - | Download the result |

---

## File Structure

```
glass-and-light/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main application page
│   │   └── globals.css             # Global styles
│   │
│   ├── components/
│   │   ├── ui/                     # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── select.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── card.tsx
│   │   │   ├── label.tsx
│   │   │   └── input.tsx
│   │   │
│   │   ├── DropZone.tsx            # Image upload component
│   │   ├── Preview.tsx             # Main canvas preview
│   │   └── ControlPanel.tsx        # All user controls
│   │
│   ├── lib/
│   │   ├── voronoi/
│   │   │   ├── generator.ts        # Voronoi diagram creation
│   │   │   └── points.ts           # Point sampling strategies
│   │   │
│   │   ├── image/
│   │   │   ├── loader.ts           # Load image to canvas
│   │   │   ├── sampler.ts          # Color sampling
│   │   │   └── edge-detection.ts   # Sobel filter
│   │   │
│   │   └── svg/
│   │       ├── generator.ts        # SVG creation
│   │       └── exporter.ts         # Download handling
│   │
│   ├── hooks/
│   │   └── useStainedGlass.ts      # Main orchestration hook
│   │
│   └── types/
│       └── index.ts                # TypeScript interfaces
│
├── public/
│   └── examples/                   # Example images
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── spec.md
```

---

## Dependencies

### NPM Packages

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "d3-delaunay": "^6.0.4",
    "react-dropzone": "^14.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/d3-delaunay": "^6.0.4",
    "tailwindcss": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

### Shadcn/ui Components

```bash
npx shadcn@latest add slider select switch button card label input
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Glass & Light - Stained Glass Generator                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐  │
│  │                          │  │                             │  │
│  │      DROP ZONE           │  │     CONTROL PANEL           │  │
│  │   (drag & drop image)    │  │                             │  │
│  │                          │  │  Cell Generation            │  │
│  │   - or -                 │  │  ├─ Cell Count [----●---]   │  │
│  │                          │  │  ├─ Distribution [▼]        │  │
│  │   [Click to upload]      │  │  └─ Edge Influence [--●--]  │  │
│  │                          │  │                             │  │
│  └──────────────────────────┘  │  Lead Lines                 │  │
│                                │  ├─ Width [--●----]         │  │
│  ┌──────────────────────────┐  │  └─ Color [■]               │  │
│  │                          │  │                             │  │
│  │                          │  │  Color                      │  │
│  │    PREVIEW CANVAS        │  │  ├─ Mode [▼]                │  │
│  │                          │  │  ├─ Saturation [----●-]     │  │
│  │  (stained glass result)  │  │  └─ Brightness [----●-]     │  │
│  │                          │  │                             │  │
│  │                          │  │  ─────────────────────────  │  │
│  │                          │  │  [ ] Show Original          │  │
│  │                          │  │  Format: [SVG ▼]            │  │
│  │                          │  │  [    Export    ]           │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Project Setup
- [ ] Initialize Next.js 15 with TypeScript
- [ ] Set up Tailwind CSS 4
- [ ] Initialize Shadcn/ui
- [ ] Install d3-delaunay and react-dropzone

### Phase 2: Core Algorithm
- [ ] Image loading to canvas (`lib/image/loader.ts`)
- [ ] Sobel edge detection (`lib/image/edge-detection.ts`)
- [ ] Poisson disk sampling (`lib/voronoi/points.ts`)
- [ ] Edge-weighted point distribution (`lib/voronoi/points.ts`)
- [ ] Voronoi generation with d3-delaunay (`lib/voronoi/generator.ts`)
- [ ] Color sampling from image (`lib/image/sampler.ts`)

### Phase 3: SVG Generation
- [ ] Polygon to SVG path conversion (`lib/svg/generator.ts`)
- [ ] Lead line rendering
- [ ] SVG document assembly
- [ ] Export/download functionality (`lib/svg/exporter.ts`)

### Phase 4: UI Components
- [ ] DropZone for image upload
- [ ] Preview canvas with live rendering
- [ ] Control panel with all controls
- [ ] Export button and format selection

### Phase 5: Polish
- [ ] Loading states during processing
- [ ] Debounced control updates (300ms)
- [ ] Error handling for invalid images
- [ ] Desktop-first layout (mobile works but not optimized)

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transparent PNGs | Treat as white | Simplest approach, avoids complexity |
| Mobile support | Desktop-first | Primary use case is desktop |
| Presets | None | Keep UI simple, manual controls only |
| Performance | Main thread first | Add Web Worker later if needed |
| Max image size | 2048px | Balance quality vs processing time |

---

## Verification Checklist

1. **Upload Test** - Upload jpg, png, webp images and verify they load correctly
2. **Transparency Test** - Upload PNG with transparency, verify transparent areas become white
3. **Algorithm Test** - Verify Voronoi cells cover entire image without gaps
4. **Edge Detection Test** - Confirm cells follow image edges when Edge Influence > 0
5. **Color Test** - Compare cell colors to original image regions
6. **Control Test** - Adjust each control and verify real-time preview updates
7. **Export Test** - Download SVG and open in vector editor (Figma, Illustrator, Inkscape)
8. **PNG Export Test** - Download PNG and verify resolution
