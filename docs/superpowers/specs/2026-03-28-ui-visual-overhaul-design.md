# Hydra UI + Visual Overhaul Design

## Summary

Overhaul the Hydra audiovisual instrument in two areas:

1. **UI**: Add Simple/Pro mode toggle with macro knobs for beginners, fix readability of all controls
2. **Visuals**: Replace dark purple shader palette with vivid neon psychedelic colors, add a new paisley-flow shader

The overall dark UI style is kept -- dark backgrounds with neon accents on top.

## 1. Color Palette

### Theme Colors (replaces current purple-only scheme)

| Token | Current | New | Usage |
|-------|---------|-----|-------|
| `accent` | `#5a28b4` | `#FF1493` | Primary UI accent (hot pink) |
| `accentAudio` | -- | `#FFD700` | Audio section headers, sliders |
| `accentVisual` | -- | `#00E676` | Visual section headers, sliders |
| `accentMapping` | -- | `#4488FF` | Mapping section headers, sliders |
| `accentSecondary` | -- | `#FF6600` | Secondary warm accent |
| `text` | `#c8c8d0` | `#cccccc` | Primary text (slightly brighter) |
| `textDim` | `#6a6a78` | `#999999` | Secondary text (much brighter) |
| `bg` | `#0a0a0f` | `#0a0a0f` | **Unchanged** - dark background stays |
| `bgPanel` | `rgba(10,10,15,0.92)` | `rgba(10,10,15,0.92)` | **Unchanged** |
| `bgWidget` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.06)` | Slightly more visible |

### Shader Palette

Full neon rainbow for shader pattern colors. Black/very-dark backgrounds stay for contrast.

```
Hot Pink:    #FF1493
Vivid Red:   #FF3333
Gold:        #FFD700
Neon Green:  #00E676
Mint Teal:   #00BFA5
Electric Blue: #4488FF
Orange:      #FF6600
```

All shader `vec3` base colors remain dark (background areas). Pattern/foreground elements use the neon palette at full saturation.

## 2. UI Readability Fixes

Applied to both Simple and Pro modes.

### Typography

| Element | Current | New |
|---------|---------|-----|
| Section headers | 8px, `rgba(90,40,180,0.6)` | **11px bold**, section accent color |
| Sub-labels | 8px, `rgba(90,40,180,0.4)` | **10px**, section accent at 70% opacity |
| Slider labels | 10px, `#6a6a78` | **11px**, `#ccc` |
| Slider values | 12px, `#7c4ddb` | 11px, section accent color |
| Button text | 9px | **10px** |

### Slider Widget

- Track height: 3px -> **6px**
- Track fill: solid `#5a28b4` -> **gradient using section accent color** (e.g., `linear-gradient(90deg, #FFD700, #FF6600)` for audio)
- Track background: `rgba(255,255,255,0.1)` -> `rgba(255,255,255,0.08)` (slightly softer)
- Slider thumb: add visible thumb via CSS (currently relies on browser default which is invisible on dark backgrounds)

### Toggle Widget

- Switch color: `#5a28b4` -> section accent color
- Label color: `#6a6a78` -> `#ccc`

### Section Headers

Each section gets its own accent color for visual hierarchy:
- Audio/Sound: `#FFD700` (gold)
- Visuals: `#00E676` (green)
- Mappings: `#4488FF` (blue)
- Presets: `#FF1493` (pink)

## 3. Simple/Pro Mode Toggle

### State

Add to Zustand store:
```typescript
uiMode: 'simple' | 'pro'  // default: 'simple'
setUIMode: (mode: 'simple' | 'pro') => void
```

Persisted to `localStorage['hydra-instrument-mode']`.

### HUD Toggle

Add a clickable toggle to the HUD component (bottom-left corner):
- Small pill switch (28x14px) with "simple" / "pro" label
- Green (`#00E676`) when simple, pink (`#FF1493`) when pro
- Also toggleable via **M** key (add to KeyboardHandler)
- Shown at 40% opacity (matching existing HUD) when panel is closed, full opacity when hovered
- When panel is open: HUD hides (existing behavior), but a **duplicate mode toggle** appears at the top of the ControlPanel so users can switch modes while the panel is visible
- M key works regardless of panel state

### Simple Mode Panel

When `uiMode === 'simple'`, the ControlPanel renders:

1. **Preset pills** -- 6 named preset buttons as rounded pills (not numbered squares)
2. **Sound section** (gold accent):
   - Synth type as pill selector row (FM / AM / Drum / Mono)
   - **Tone** macro slider (0-1)
   - **Space** macro slider (0-1)
3. **Visuals section** (green accent):
   - Visual source as pill selector row (Geometry / Mask / Fire / Particles / Flow)
   - **Intensity** macro slider (0-1)
   - **Morph** macro slider (0-1)
4. **Rhythm section** (blue accent):
   - Play/Stop circle button + BPM slider

Total: ~8 controls. No scrolling needed.

### Pro Mode Panel

When `uiMode === 'pro'`, renders the existing full panel (PresetBar + AudioPanel + VisualPanel + MappingPanel) with the readability fixes applied. No structural changes to pro mode.

## 4. Macro Knob Mappings

Each macro maps 0-1 to multiple underlying parameters:

### Tone (0-1)
- Filter frequency: 200 -> 8000 Hz (exponential curve)
- Filter Q: 1 -> 3
- Envelope decay: 0.5 -> 0.1 (inverted -- higher tone = snappier)

### Space (0-1)
- Reverb bypass: off when > 0.05, on when 0
- Reverb wet: 0 -> 0.8
- Delay bypass: off when > 0.3, on when <= 0.3
- Delay wet: 0 -> 0.6
- Delay feedback: 0.1 -> 0.6

### Intensity (0-1)
- Source primary param: maps to first param of current source
  - osc: frequency 10 -> 80
  - noise: scale 1 -> 15
  - sacredGeometry: pulse 0.1 -> 3
  - tribalMask: glow 0.1 -> 1.5
  - particleField: density 0.1 -> 0.8
  - voidPulse: depth 0.3 -> 1.8
  - ritualFire: turbulence 0.5 -> 2.5
  - paisleyFlow: density 0.3 -> 1.0
- Brightness transform amount: -0.2 -> 0.5 (adds brightness if not present)

### Morph (0-1)
- Hue shift: 0 -> 0.8 (adds hue transform if not present)
- Colorama: 0 -> 0.3
- Rotate speed: 0 -> 0.5 (adds rotate if not present)

Implementation: a `MacroEngine` class that takes a macro name + value (0-1) and calls the appropriate store setters and chain rebuild functions.

## 5. Shader Overhaul

### Recolored (keep geometry, change palette)

**sacredGeometry**: Replace `mix(vec3(0.15, 0.05, 0.3), vec3(0.9, 0.75, 0.3), pattern)` with neon palette:
- Background: `vec3(0.03, 0.01, 0.05)` (near-black)
- Ring pattern: cycle through hot pink, gold, green based on ring index
- Seed pattern: electric blue glow
- Inner glow: teal

**tribalMask**: Replace `mix(vec3(0.05, 0.02, 0.08), vec3(0.85, 0.75, 0.6), mask)` with:
- Background: `vec3(0.02, 0.02, 0.03)` (near-black)
- Bands: neon teal / green
- Eyes: hot pink glow
- Crown: gold
- Inner glow: magenta

**particleField**: Replace single-hue particles with multi-color:
- Use `sin` offset on cell ID to vary particle color across the full neon palette
- Keep dark background

**voidPulse**: Brighten significantly:
- Ring colors: cycle neon pink -> gold -> green -> blue per ring
- Base glow: replace dark purple with subtle teal
- Keep dark void center

**ritualFire**: Shift to neon:
- Core: `vec3(1.0, 0.9, 0.3)` stays (gold core)
- Outer: shift from dark red to neon orange/pink
- Embers: multi-color (gold, pink, green sparks)

### New Shader: paisleyFlow

A new `src` type shader with flowing organic curves inspired by the reference image:
- **Inputs**: `density` (float, default 3), `speed` (float, default 0.5), `colorShift` (float, default 0)
- **Visual**: Layered `sin/cos` curves creating paisley-like swirling patterns. Dense fill with no empty space. Multiple color bands cycling through the full neon palette.
- **Pattern**: Use polar coordinates with nested sinusoidal distortion to create teardrop/comma shapes. Layer 3-4 scales of pattern. Apply `fract` for tiling density.
- **Color**: Rainbow cycling based on pattern value + `colorShift` offset. High saturation throughout. Black only at pattern boundaries (thin outline effect).

### Source Grouping for Simple Mode

Simple mode groups sources by visual character:
- **Geometry**: sacredGeometry (default), shape, voronoi
- **Mask**: tribalMask
- **Fire**: ritualFire
- **Particles**: particleField
- **Flow**: paisleyFlow (new), osc, noise, gradient, voidPulse

Selecting a group in simple mode picks the primary source. Pro mode shows all 12 sources individually.

## 6. Files Changed

### New Files
- `src/ui/SimplePanel.tsx` -- Simple mode panel with macro knobs
- `src/ui/MacroEngine.ts` -- Macro-to-parameter mapping logic
- `src/ui/widgets/PillSelector.tsx` -- Pill-style selector row widget

### Modified Files
- `src/ui/theme.ts` -- New palette tokens
- `src/ui/widgets/Slider.tsx` -- Larger track, gradient fill, section color prop
- `src/ui/widgets/Toggle.tsx` -- Section color prop, brighter label
- `src/ui/HUD.tsx` -- Add mode toggle, update accent color
- `src/ui/ControlPanel.tsx` -- Render SimplePanel or full panels based on mode
- `src/ui/AudioPanel.tsx` -- Apply readability fixes (sizes, colors)
- `src/ui/VisualPanel.tsx` -- Apply readability fixes, add paisleyFlow to sources
- `src/ui/MappingPanel.tsx` -- Apply readability fixes
- `src/ui/PresetBar.tsx` -- Apply readability fixes, pink accent
- `src/state/store.ts` -- Add `uiMode` state + persistence
- `src/visual/CustomShaders.ts` -- Recolor all shaders, add paisleyFlow
- `src/input/KeyboardHandler.ts` -- Add M key for mode toggle
- `src/App.tsx` -- Wire mode toggle, MacroEngine, new visual source

## 7. What Does NOT Change

- Audio engine architecture (Tone.js, effects chain, sequencer)
- Mapping engine (source/target/range/smooth/curve)
- Preset format and storage (localStorage + URL hash)
- Panel width (380px)
- Tab key to open/close panel
- Canvas rendering pipeline (Hydra synth)
- Keyboard note input (Z-M keys)
- Pro mode control structure (same panels, just restyled)
