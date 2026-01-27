---
name: teach-coding
description: Explains coding concepts after completing a development phase. Use when asked to "explain phase X", "teach me about phase X", or "run teach-coding for phase X". Breaks down what was built, key concepts, code patterns, and developer vocabulary.
---

# Coding Concepts Guide

Explains what was built and why after each development phase of the stained glass project.

## Instructions

When the user asks about a specific phase (e.g., "explain phase 2" or "teach me about phase 3"):

1. Identify which phase they're asking about (1-5)
2. Present the relevant section with:
   - **What we built** - Plain English summary
   - **Key concepts** - Technical terms with analogies
   - **Code patterns** - Common structures they'll see again
   - **File relationships** - How pieces connect together
   - **Dev vocabulary** - Terms to use when talking to engineers
3. Offer to answer follow-up questions about specific concepts

If no phase is specified, ask which phase they want to learn about.

---

## Phase 1: Project Setup

### What We Built
The foundation - like setting up a kitchen before cooking. We installed tools and created the folder structure.

### Key Concepts

| Term | What It Means | Analogy |
|------|---------------|---------|
| **Dependencies** | Code libraries others wrote that we reuse | Pre-made ingredients vs growing your own |
| **package.json** | Shopping list of all dependencies | Recipe ingredient list |
| **TypeScript** | JavaScript with type checking | Spell-check for code |
| **Tailwind** | Utility classes for styling | Pre-labeled paint swatches vs mixing colors |
| **Component library (Shadcn)** | Pre-built UI pieces | IKEA furniture vs building from wood |

### Dev Vocabulary
- "Install the dependencies" = download the libraries we need
- "Initialize the project" = create the starting files
- "Scaffold" = generate boilerplate/starter code
- "Dev server" = local preview while building

---

## Phase 2: Core Algorithm

### What We Built
The brain - the actual logic that transforms an image into stained glass cells.

### Key Concepts

| Term | What It Means | Analogy |
|------|---------------|---------|
| **Canvas API** | Browser's drawing surface for pixel manipulation | Digital graph paper |
| **ImageData** | Raw pixel array (R,G,B,A for each pixel) | Spreadsheet of color values |
| **Algorithm** | Step-by-step instructions to solve a problem | A recipe |
| **Edge detection** | Finding where colors change sharply | Tracing outlines in a coloring book |
| **Voronoi diagram** | Dividing space into regions around seed points | Nearest coffee shop to each house |

### Code Patterns

**Function** - A reusable block of code
```typescript
function detectEdges(imageData: ImageData): Float32Array {
  // Input: raw pixels
  // Output: edge strength map
}
```

**Type definition** - Describing the shape of data
```typescript
interface Point {
  x: number;
  y: number;
}
```

### File Relationships
```
loader.ts (loads image)
    ↓
edge-detection.ts (finds edges)
    ↓
points.ts (generates seed points)
    ↓
generator.ts (creates Voronoi cells)
```

### Dev Vocabulary
- "Parse the image" = read and interpret pixel data
- "The algorithm runs in O(n)" = how speed scales with input size
- "Return value" = what a function outputs
- "Parameters/arguments" = inputs to a function

---

## Phase 3: SVG Generation

### What We Built
The output layer - converting our calculated cells into a downloadable vector file.

### Key Concepts

| Term | What It Means | Analogy |
|------|---------------|---------|
| **SVG** | Scalable Vector Graphics - math-based images | Instructions to draw vs a photo |
| **Path** | SVG element defined by drawing commands | "Start here, line to there, curve to here" |
| **Stroke** | The outline/border of a shape | Pen line |
| **Fill** | The inside color of a shape | Paint bucket |
| **viewBox** | The coordinate system of an SVG | Camera frame |

### Code Patterns

**SVG Path syntax**
```
M 10 20    = Move to (10, 20)
L 50 60    = Line to (50, 60)
Z          = Close path (back to start)
```

**Template literal** - String with embedded values
```typescript
const svg = `<path d="${pathData}" fill="${color}" />`
```

### Dev Vocabulary
- "Serialize to SVG" = convert data structures to SVG text
- "Rasterize" = convert vectors to pixels (for PNG export)
- "DOM element" = an HTML/SVG tag in the page

---

## Phase 4: UI Components

### What We Built
The interface - what users see and interact with.

### Key Concepts

| Term | What It Means | Analogy |
|------|---------------|---------|
| **Component** | Reusable UI building block | Lego brick |
| **Props** | Data passed into a component | Function parameters for UI |
| **State** | Data that changes over time | Current slider position |
| **Hook** | React function to add features (state, effects) | Plugin for components |
| **Re-render** | React updating the UI after state changes | Refreshing the screen |

### Code Patterns

**React component**
```typescript
function Slider({ value, onChange }: SliderProps) {
  return <input type="range" value={value} onChange={onChange} />
}
```

**useState hook** - Remember a value that can change
```typescript
const [cellCount, setCellCount] = useState(500)
// cellCount = current value
// setCellCount = function to update it
```

**Props drilling** - Passing data down through components
```
Page → ControlPanel → Slider
       (passes cellCount down the chain)
```

### File Relationships
```
page.tsx (main page, holds state)
    ├── DropZone.tsx (image upload)
    ├── Preview.tsx (shows result)
    └── ControlPanel.tsx (all controls)
            ├── Slider (shadcn)
            ├── Select (shadcn)
            └── Button (shadcn)
```

### Dev Vocabulary
- "Lift state up" = move state to a parent component so siblings can share it
- "The component re-rendered" = React updated the UI
- "Pass it as a prop" = send data to a child component
- "Event handler" = function that runs when user does something (click, type)

---

## Phase 5: Polish

### What We Built
Refinements - loading states, error handling, performance tweaks.

### Key Concepts

| Term | What It Means | Analogy |
|------|---------------|---------|
| **Debounce** | Wait for user to stop before acting | Waiting for someone to finish typing |
| **Loading state** | UI indicator while processing | Spinner or skeleton |
| **Error boundary** | Catch errors gracefully | Safety net |
| **Responsive** | Adapting to screen sizes | Liquid vs fixed container |

### Code Patterns

**Debounce** - Don't regenerate on every tiny slider move
```typescript
// Wait 300ms after last change before processing
const debouncedRegenerate = debounce(regenerate, 300)
```

**Conditional rendering** - Show different UI based on state
```typescript
{isLoading ? <Spinner /> : <Preview />}
```

### Dev Vocabulary
- "Debounce the input" = add delay before reacting to rapid changes
- "Handle the error" = deal with things going wrong gracefully
- "The UI is janky" = laggy, not smooth
- "Optimize for performance" = make it faster

---

## General Concepts (Reference)

### Project Structure
```
src/
├── app/          → Pages and routing
├── components/   → UI pieces
├── lib/          → Utility functions (business logic)
├── hooks/        → Custom React hooks
└── types/        → TypeScript type definitions
```

### Data Flow
```
User action → Event handler → Update state → Re-render UI
     ↓
[onChange] → [setCellCount()] → [React updates] → [New preview]
```

### Common File Types
| Extension | Purpose |
|-----------|---------|
| `.tsx` | React component with TypeScript |
| `.ts` | TypeScript (no JSX/UI) |
| `.css` | Styles |
| `.json` | Configuration or data |
| `.md` | Documentation (like this file) |

---

## Questions to Ask Developers

Good questions that show you understand the concepts:

- "Is this component stateful or does it just receive props?"
- "Where does this state live - in the component or lifted up?"
- "What triggers a re-render here?"
- "Is this function pure or does it have side effects?"
- "What's the data flow from user input to the output?"
- "Are we debouncing this to avoid performance issues?"
