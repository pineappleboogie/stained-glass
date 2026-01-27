# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stained glass image converter - a Next.js web app that transforms uploaded images into stained glass designs using edge-weighted Voronoi patterns, outputting SVG vectors.

## Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000

# Build & Lint
npm run build        # Production build
npm run lint         # Run ESLint

# Add Shadcn components
npx shadcn@latest add <component>   # e.g., slider, select, button
```

## Architecture

### Processing Pipeline
```
Image → Canvas → Edge Detection (Sobel) → Point Sampling → Voronoi (d3-delaunay) → Color Sampling → SVG
```

### Key Modules

- **`lib/image/`** - Image processing: loading to canvas, Sobel edge detection, color sampling from pixels
- **`lib/voronoi/`** - Point generation (uniform, Poisson disk, edge-weighted) and Voronoi diagram generation via d3-delaunay
- **`lib/svg/`** - Convert Voronoi cells to SVG paths, handle export/download
- **`hooks/useStainedGlass.ts`** - Main orchestration hook that connects the full pipeline with debounced updates

### Core Algorithm Flow

1. Load image to hidden canvas, extract `ImageData`
2. Run Sobel filter to create edge magnitude map
3. Generate seed points using Poisson disk sampling, weighted by edge map
4. Create Voronoi diagram with d3-delaunay, clip to image bounds
5. Sample color for each cell (center point, average, or reduced palette)
6. Convert cells to SVG `<path>` elements with lead line strokes

## Tech Stack

- Next.js 15 / React 19 / TypeScript
- Tailwind CSS 4
- Shadcn/ui (slider, select, switch, button, card, label, input)
- d3-delaunay for Voronoi generation
- react-dropzone for file upload

## Teaching Mode

After completing each development phase, proactively offer to explain what was built using the `teach-coding` skill. This helps users understand key concepts, code patterns, file relationships, and developer vocabulary. Invoke it automatically when a phase is complete, or when the user asks to learn about what was built.
