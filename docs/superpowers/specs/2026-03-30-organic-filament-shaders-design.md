# Organic Filament Shader Redesign

## Summary

Replace all 7 custom GLSL shaders with a unified "organic filament" aesthetic: line-based, geometric, lively, organic, dream-state. Pure neutral monochrome (white/gray on black). No fills, no color hue.

## Context

The current shaders (sacredGeometry, tribalMask, glitchScan, particleField, voidPulse, ritualFire, paisleyFlow) use a neon palette (hot pink, gold, lime green, bright blue) and produce mostly filled/solid shapes. The user finds them too psychedelic and visually harsh.

## Design Direction

**Aesthetic**: Organic Filament -- flowing curves that drift and intersect like silk threads in water. Nodes glow softly at intersections. Biological feel: neural pathways, mycelium networks, bioluminescent organisms. Dreamy, breathing, alive.

**Color palette**: Neutral monochrome only.
- Primary lines: `rgba(255, 255, 255, 0.15-0.40)` -- opacity creates depth
- Node highlights: `rgba(255, 255, 255, 0.4-0.7)` -- brighter at intersections
- Ambient glow: `rgba(255, 255, 255, 0.02-0.06)` -- barely-there
- Background: `vec3(0.0)` to `vec3(0.02)` -- pure/near black

## Architecture

No engine changes. Same `CustomShaders.ts` registration via `setFunction()`. Same `HydraChainConfig` chain building. Same preset structure.

Changes confined to:
1. `src/visual/CustomShaders.ts` -- replace all 7 shader GLSL definitions
2. `src/presets/defaults/*.ts` -- update visual chain configs for new shader names/params
3. `src/App.tsx` -- update `SOURCE_ARG_KEYS` and `VISUAL_GROUP_TO_SOURCE` mappings

## The 7 Shaders

All shaders are `type: 'src'` (source generators, not color transforms).

### 1. drift (replaces voidPulse)
**Visual**: Slow horizontal filaments floating like seaweed in current. Minimal, meditative.
**Technique**: Horizontal sine waves with per-row phase offset, rendered as thin smoothstep lines.
**Inputs**: speed (float, default 0.5), density (float, default 8), amplitude (float, default 0.3)
**Used in preset**: void

### 2. dendrite (replaces sacredGeometry)
**Visual**: Branching tree structures growing outward from center. Neurons firing, frost on glass.
**Technique**: Polar coordinate branching via recursive angle splitting, distance-field line rendering.
**Inputs**: branches (float, default 5), depth (float, default 3), pulse (float, default 0.5)
**Used in preset**: ritual

### 3. web (replaces glitchScan)
**Visual**: Interconnected nodes with elastic threads. Living spider web, constellation map.
**Technique**: Hash-positioned grid nodes with distance-based connecting lines, breathing radius animation.
**Inputs**: connections (float, default 6), tension (float, default 0.5), breathe (float, default 0.3)
**Used in preset**: signal

### 4. pulse (replaces ritualFire)
**Visual**: Concentric ripples expanding from heartbeat center. Stones dropped in still water.
**Technique**: Expanding ring distance fields with organic deformation via sine-based noise.
**Inputs**: rings (float, default 5), speed (float, default 0.5), deform (float, default 0.3)
**Used in preset**: ember

### 5. spore (replaces particleField)
**Visual**: Floating particles trailing filament tails. Dandelion seeds, bioluminescent plankton.
**Technique**: Hash-positioned dots with trailing fade lines computed via velocity direction, drifting motion.
**Inputs**: count (float, default 40), drift (float, default 0.3), trail (float, default 0.5)
**Used in preset**: cosmos

### 6. weave (replaces tribalMask)
**Visual**: Overlapping sine curves crossing and tangling like threads on a loom. Moire interference.
**Technique**: Multiple parametric sine curves at different frequencies, brightness boost at intersections.
**Inputs**: layers (float, default 6), frequency (float, default 4), phase (float, default 0.5)
**Used in preset**: mask

### 7. mycelium (replaces paisleyFlow)
**Visual**: Underground root network. Thin lines crawl, branch, reconnect. Grows from edges inward.
**Technique**: Multi-origin branching paths with distance-field rendering, crawling animation.
**Inputs**: growth (float, default 0.5), branching (float, default 4), thickness (float, default 0.5)
**Used in preset**: none (available via simple mode "Flow" group)

## Preset Configurations

### void
```
source: { fn: 'drift', args: [0.5, 8, 0.3] }
transforms: [{ fn: 'brightness', args: [-0.05] }, { fn: 'scale', args: ['drift.scale'] }]
mappings: envelope -> drift.scale [0.8, 1.5]
```

### ritual
```
source: { fn: 'dendrite', args: [5, 3, 'dendrite.pulse'] }
transforms: [{ fn: 'kaleid', args: ['kaleid.nSides'] }, { fn: 'rotate', args: [0.1, 0.5] }]
mappings: fft[0] -> dendrite.pulse [0.1, 2], noteVelocity -> kaleid.nSides [3, 12]
```

### signal
```
source: { fn: 'web', args: [6, 0.5, 0.3] }
transforms: [{ fn: 'pixelate', args: [20, 20] }, { fn: 'rotate', args: [0.2, 1] }]
mappings: fft[3] -> web.connections [3, 12], sequencerStep -> web.tension [0.1, 1]
```

### ember
```
source: { fn: 'pulse', args: [5, 0.5, 0.3] }
transforms: [{ fn: 'scale', args: [1.01] }, { fn: 'brightness', args: [0.05] }]
mappings: mouse.x -> pulse.deform [0.1, 1], envelope -> pulse.speed [0.2, 2]
```

### cosmos
```
source: { fn: 'spore', args: [40, 0.3, 0.5] }
transforms: [{ fn: 'rotate', args: ['rotate.angle', 0.3] }, { fn: 'scale', args: [1.002] }]
mappings: fft[1] -> spore.count [10, 80], mouse.y -> rotate.angle [0, 6.28]
```

### mask
```
source: { fn: 'weave', args: [6, 4, 'weave.phase'] }
transforms: [{ fn: 'brightness', args: [-0.05] }]
mappings: noteFrequency -> weave.layers [3, 12], fft[2] -> weave.phase [0, 3]
```

## App.tsx Updates

### SOURCE_ARG_KEYS
```ts
drift: ['speed', 'density', 'amplitude'],
dendrite: ['branches', 'depth', 'pulse'],
web: ['connections', 'tension', 'breathe'],
pulse: ['rings', 'speed', 'deform'],
spore: ['count', 'drift', 'trail'],
weave: ['layers', 'frequency', 'phase'],
mycelium: ['growth', 'branching', 'thickness'],
```

### VISUAL_GROUP_TO_SOURCE
```ts
Geometry: 'dendrite',
Mask: 'weave',
Fire: 'pulse',
Particles: 'spore',
Flow: 'mycelium',
```

## Out of Scope

- HydraEngine.ts -- no changes
- MappingEngine -- no changes
- Audio system -- untouched
- UI components -- untouched (already monochrome)
- IntroGuide -- untouched

## Verification

After implementation, all 6 presets must render visible line-based visuals on load without requiring audio input. Each shader must animate (not be static) at default parameters.
