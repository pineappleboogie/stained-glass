# Glass & Light - Development Log

## Project Summary

A Next.js web app that transforms uploaded images into stained glass designs using edge-weighted Voronoi patterns, outputting SVG vectors.

---

## Key Concepts Learned

### 1. Voronoi Diagrams

**Named after:** Georgy Voronoi (1868-1908), Ukrainian mathematician

**What it is:** A way of dividing space into regions. Given a set of points (called "seeds"), each region contains all locations closest to one particular seed.

**Analogy:** If you dropped ink drops on paper and each drop spread until it met another drop's territory - that's a Voronoi diagram. The result is organic, irregular polygon shapes - exactly like real stained glass.

**Implementation:** We use the `d3-delaunay` package which handles the complex math. You give it points, it gives you polygons.

---

### 2. Sobel Edge Detection

**Named after:** Irwin Sobel (1940-present), American computer scientist who developed this in 1968

**What it is:** An algorithm that detects edges in images by calculating how quickly brightness changes between neighboring pixels. Sharp changes = edges.

**How it works:**
1. Convert image to grayscale
2. Apply two 3x3 "kernels" (small matrices) to detect horizontal and vertical changes
3. Combine them to get edge strength at each pixel

**Why it matters:** This lets us place more glass pieces in detailed areas (like a face) and fewer in flat areas (like sky).

**Implementation:** Custom code in `lib/image/edge-detection.ts` (~60 lines of math, no external package needed).

---

### 3. Point Generation Strategies

Three approaches for scattering the Voronoi seed points:

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Uniform** | Random scattered points (even distribution) | Abstract patterns |
| **Poisson Disk** | Points maintain minimum spacing (more natural) | Organic look |
| **Edge-Weighted** | More points cluster near edges/details | Preserving image detail |

The "Edge Influence" slider controls how much points favor detailed areas vs. spreading evenly.

---

### 4. The Processing Pipeline

```
Image → Edge Detection → Point Generation → Voronoi → Color Sampling → SVG
```

Each step transforms data for the next. This **pipeline pattern** is common in image processing - small, focused functions chained together.

---

### 5. Color Sampling Modes

| Mode | How it works |
|------|--------------|
| **Exact** | Sample color at cell's center point |
| **Average** | Average all pixels inside the polygon |
| **Palette** | Reduce to limited color set (more stylized) |

Additional adjustments: Saturation and Brightness sliders modify the sampled colors.

---

### 6. SVG Output

Each Voronoi polygon becomes an SVG `<path>` element with:
- **Fill color** (the glass)
- **Stroke** (the lead lines)

SVG is vector-based, so it scales infinitely and works in design tools like Figma/Illustrator.

---

### 7. React Architecture Patterns

**Hooks** (like `useStainedGlass`) manage state and logic - the "brain" that remembers settings, tracks processing state, and coordinates the pipeline.

**Components** (DropZone, Preview, ControlPanel) are the visual pieces. They receive data and call functions but don't contain business logic.

This separation means:
- Designers can restyle components without breaking the algorithm
- Developers can improve the algorithm without touching the UI

---

### 8. Debouncing

Waiting for the user to stop changing a slider before processing. Without this, every tiny slider movement would trigger expensive recalculation, causing lag.

Our implementation: 300ms delay after last change before regenerating.

---

## Vocabulary Reference

| Term | Meaning |
|------|---------|
| **Voronoi** | Mathematical division of space into regions based on nearest points |
| **Sobel** | Edge detection algorithm using gradient calculation |
| **SVG** | Scalable Vector Graphics - resolution-independent format |
| **Pipeline** | Chain of processing steps where output feeds the next input |
| **Debounce** | Delay processing until user stops interacting |
| **Hook** | React pattern for reusable stateful logic |
| **Kernel** | Small matrix used in image convolution operations |
| **Grayscale** | Single-channel image (brightness only, no color) |

---

## Feature: Portrait Mode (Added Later)

Uses `face-api.js` for face detection to:
1. Detect faces in uploaded images
2. Generate a "face region mask" showing where faces are
3. Create larger, smoother cells in face areas (Face Smoothness slider)
4. Optionally add "painted details" overlay for facial features

This demonstrates how the modular architecture allows adding new features without rewriting the core algorithm.

---

## File Structure

```
src/
├── app/
│   └── page.tsx          # Main page layout
├── components/
│   ├── ControlPanel.tsx  # Settings UI
│   ├── DropZone.tsx      # Image upload
│   └── Preview.tsx       # SVG display
├── hooks/
│   └── useStainedGlass.ts # Main orchestration hook
├── lib/
│   ├── image/
│   │   ├── loader.ts     # Image loading
│   │   ├── edge-detection.ts # Sobel filter
│   │   └── sampler.ts    # Color sampling
│   ├── voronoi/
│   │   ├── points.ts     # Point generation
│   │   └── generator.ts  # Voronoi diagram
│   ├── svg/
│   │   ├── generator.ts  # SVG creation
│   │   └── exporter.ts   # Download handling
│   └── face/             # Face detection (portrait mode)
└── types/
    └── index.ts          # TypeScript definitions
```

---

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Shadcn/ui** - UI components
- **d3-delaunay** - Voronoi calculation
- **react-dropzone** - File upload
- **face-api.js** - Face detection (portrait mode)

---

## Design Decisions You Can Influence (Without Code)

- Default values (cell count, line width, etc.)
- Slider ranges and step increments
- Color mode options and names
- Layout and responsive breakpoints
- Export formats to support

The algorithm parameters translate directly to visual outcomes you can predict.
