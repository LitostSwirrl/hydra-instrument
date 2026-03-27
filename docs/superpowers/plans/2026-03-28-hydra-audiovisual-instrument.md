# Hydra Audiovisual Instrument Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based audiovisual instrument where sound and visuals interplay in real time -- an open sandbox with a solemn, futuristic, tribal aesthetic.

**Architecture:** Split-pane instrument with full-screen Hydra canvas and collapsible control panel. Three audio sources (keyboard synth, sequencer, mic) feed through a shared Tone.js effects chain into dual analysis (FFT + envelope), which drives Hydra visual parameters via a configurable mapping system. Users build patches by wiring audio signals to visual params.

**Tech Stack:** React 19 + TypeScript (strict) + Vite, Tone.js, hydra-synth (npm), custom GLSL shaders, Tailwind CSS, Zustand, localStorage + URL hash for persistence. Deploy to GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-03-28-hydra-audiovisual-instrument-design.md`
**Hydra Reference:** `hydra-reference.md`, `hydra-examples-collection.md`

---

## File Structure

```
src/
  main.tsx                          # React root mount
  App.tsx                           # Top-level orchestrator, canvas, initialization
  state/
    store.ts                        # Zustand store (all app state)
  audio/
    AudioEngine.ts                  # Tone.js lifecycle, synth management, note trigger
    EffectsChain.ts                 # Serial effects pipeline with bypass/wet
    Analyser.ts                     # FFT band reduction + envelope follower + rAF loop
    MicInput.ts                     # getUserMedia wrapper
    Sequencer.ts                    # Step sequencer via Tone.Transport
  visual/
    HydraEngine.ts                  # hydra-synth init, chain builder, reactive params
    CustomShaders.ts                # 6 custom GLSL shader definitions
  mapping/
    MappingTypes.ts                 # Interfaces + pure functions (resolveSource, applyCurve, smoothValue)
    MappingEngine.ts                # rAF loop: read audio -> transform -> write to Hydra params
  presets/
    PresetManager.ts                # Load/save/export/import/URL hash
    defaults/                       # 6 starter preset JSON files (void, ritual, signal, ember, cosmos, mask)
  input/
    KeyboardHandler.ts              # Musical keyboard + modifier keys
    MouseHandler.ts                 # Mouse/touch position, XY pad, scroll
  ui/
    HUD.tsx                         # Minimal overlay (BPM, preset name, levels)
    ControlPanel.tsx                # Right-side sliding panel container
    AudioPanel.tsx                  # Audio engine controls section
    VisualPanel.tsx                 # Visual engine controls section
    MappingPanel.tsx                # Mapping editor section
    PresetBar.tsx                   # 9 preset slot selector + export/import
    StartOverlay.tsx                # "Click to begin" overlay for AudioContext init
    theme.ts                        # Design system constants
    widgets/
      Slider.tsx                    # Custom range slider (tabIndex=-1)
      Toggle.tsx                    # Pill-shaped toggle switch
      Dropdown.tsx                  # Custom dropdown menu
      XYPad.tsx                     # 2D touch/mouse control pad
  types/
    hydra-synth.d.ts                # Type declarations for hydra-synth (no shipped types)
  setupTests.ts                     # Web Audio API mocks for Vitest
```

---

## Dependency Graph

```
Task 1: Scaffolding
  |
  v
Task 2: Zustand Store            <-- everything depends on this
  |
  +---> Task 3: Audio Engine     <-- depends on store
  |       |
  |       +-> Task 4: Effects Chain
  |       +-> Task 5: Analyser
  |       +-> Task 6: Mic Input
  |       +-> Task 7: Sequencer
  |
  +---> Task 8: Mapping Types    <-- depends on store types only
  |       |
  |       +-> Task 9: Mapping Engine
  |
  +---> Task 10: Hydra Engine    <-- depends on store
  |       |
  |       +-> Task 11: Custom Shaders
  |
  +---> Task 12: Input Handlers  <-- depends on store
  |
  +---> Task 13: UI Theme + Widgets
  |
  v
Task 14: Preset System           <-- depends on store types
  |
  v
Task 15: UI Panels               <-- depends on store, widgets, presets
  |
  v
Task 16: App.tsx Integration     <-- wires everything together
  |
  v
Task 17: Verification & Deploy
```

**Parallelizable groups:**
- Tasks 3-7 (audio) can run in parallel after Task 2
- Tasks 8-9 (mapping) can run in parallel with audio tasks
- Tasks 10-11 (visual) can run in parallel with audio tasks
- Task 12 (input) can run in parallel with audio tasks
- Task 13 (widgets) can run in parallel with audio tasks

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `vitest.config.ts`, `src/setupTests.ts`, `src/types/hydra-synth.d.ts`

- [ ] **Step 1: Create Vite project**

```bash
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
npm install tone hydra-synth zustand
npm install -D tailwindcss @tailwindcss/vite postcss vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vite with hydra-synth global fix**

hydra-synth references Node's `global` which doesn't exist in browsers. Add `define: { global: {} }` to vite.config.ts.

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: {},
  },
})
```

- [ ] **Step 4: Configure Vitest**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
```

- [ ] **Step 5: Create Web Audio mocks for tests**

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom'

class MockAudioContext {
  state = 'suspended'
  sampleRate = 44100
  currentTime = 0
  destination = { channelCount: 2 }
  createGain() { return { connect: () => {}, gain: { value: 1 } } }
  createAnalyser() {
    return {
      connect: () => {},
      fftSize: 2048,
      frequencyBinCount: 1024,
      getFloatFrequencyData: (arr: Float32Array) => arr.fill(-100),
      getFloatTimeDomainData: (arr: Float32Array) => arr.fill(0),
    }
  }
  createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 440 } } }
  createBiquadFilter() { return { connect: () => {}, frequency: { value: 350 }, Q: { value: 1 }, type: 'lowpass' } }
  createDynamicsCompressor() { return { connect: () => {} } }
  resume() { this.state = 'running'; return Promise.resolve() }
  close() { return Promise.resolve() }
}

Object.defineProperty(globalThis, 'AudioContext', { value: MockAudioContext, writable: true })
Object.defineProperty(globalThis, 'webkitAudioContext', { value: MockAudioContext, writable: true })
```

- [ ] **Step 6: Create hydra-synth type declarations**

```typescript
// src/types/hydra-synth.d.ts
declare module 'hydra-synth' {
  interface HydraOptions {
    canvas?: HTMLCanvasElement | null
    width?: number
    height?: number
    autoLoop?: boolean
    makeGlobal?: boolean
    detectAudio?: boolean
    numSources?: number
    numOutputs?: number
    precision?: string | null
  }
  export default class Hydra {
    synth: Record<string, unknown>
    constructor(options?: HydraOptions)
    tick(dt: number): void
  }
}
```

- [ ] **Step 7: Set up dark base styles**

```css
/* src/index.css */
@import "tailwindcss";

html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0f;
  color: #c8c8d0;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 8: Create placeholder App.tsx**

```tsx
// src/App.tsx
export default function App() {
  return (
    <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center">
      <p className="text-[#6a6a78] text-sm tracking-widest uppercase">hydra instrument</p>
    </div>
  )
}
```

- [ ] **Step 9: Verify**

```bash
npm run dev          # Dark screen with "hydra instrument" text, no console errors
npx vitest run       # 0 tests, no crashes
npm run build        # Production build succeeds
```

- [ ] **Step 10: Commit**

```bash
git init && git add -A
git commit -m "feat: scaffold Vite + React + TS project with Tone.js, hydra-synth, Zustand, Tailwind"
```

---

### Task 2: Zustand Store

**Files:**
- Create: `src/state/store.ts`, `src/state/__tests__/store.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/state/__tests__/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store'

beforeEach(() => {
  // Reset store between tests
  useAppStore.setState(useAppStore.getInitialState())
})

describe('store', () => {
  it('has default synth type FMSynth', () => {
    expect(useAppStore.getState().synthType).toBe('FMSynth')
  })

  it('has 5 effects in chain', () => {
    expect(useAppStore.getState().effects).toHaveLength(5)
  })

  it('setSynthType changes synth', () => {
    useAppStore.getState().setSynthType('AMSynth')
    expect(useAppStore.getState().synthType).toBe('AMSynth')
  })

  it('setEffectBypass toggles bypass', () => {
    useAppStore.getState().setEffectBypass(1, true)
    expect(useAppStore.getState().effects[1].bypass).toBe(true)
  })

  it('addMapping and removeMapping', () => {
    const mapping = {
      id: 'test-1', source: 'envelope' as const,
      target: 'osc.frequency', range: [0, 1] as [number, number],
      smooth: 0.5, curve: 'linear' as const,
    }
    useAppStore.getState().addMapping(mapping)
    expect(useAppStore.getState().mappings).toHaveLength(1)
    useAppStore.getState().removeMapping('test-1')
    expect(useAppStore.getState().mappings).toHaveLength(0)
  })

  it('setAnalysis updates fftBands and envelope', () => {
    useAppStore.getState().setAnalysis([0.1, 0.2, 0.3, 0.4], 0.75)
    expect(useAppStore.getState().analysis.fftBands).toEqual([0.1, 0.2, 0.3, 0.4])
    expect(useAppStore.getState().analysis.envelope).toBe(0.75)
  })

  it('togglePanel flips panelOpen', () => {
    expect(useAppStore.getState().ui.panelOpen).toBe(false)
    useAppStore.getState().togglePanel()
    expect(useAppStore.getState().ui.panelOpen).toBe(true)
  })

  it('setNoteInfo updates velocity and frequency', () => {
    useAppStore.getState().setNoteInfo(0.7, 0.13)
    expect(useAppStore.getState().noteVelocity).toBe(0.7)
    expect(useAppStore.getState().noteFrequency).toBe(0.13)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/__tests__/store.test.ts`
Expected: FAIL -- module not found

- [ ] **Step 3: Implement store**

```typescript
// src/state/store.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type SynthType = 'FMSynth' | 'AMSynth' | 'MembraneSynth' | 'MonoSynth'
export type CurveType = 'linear' | 'exponential' | 'step'

export interface EffectConfig {
  type: 'filter' | 'reverb' | 'delay' | 'distortion' | 'compressor'
  bypass: boolean
  wet: number
  params: Record<string, number>
}

export interface SequencerConfig {
  pattern: (string | null)[]
  subdivision: string
  bpm: number
  playing: boolean
}

export interface Mapping {
  id: string
  source: string
  target: string
  range: [number, number]
  smooth: number
  curve: CurveType
}

export interface AnalysisState {
  fftBands: number[]
  envelope: number
  numBands: number
}

export interface UIState {
  panelOpen: boolean
  activeSection: 'audio' | 'visual' | 'mappings'
}

export interface AppState {
  audioStarted: boolean
  startAudio: () => void

  synthType: SynthType
  synthParams: Record<string, number>
  octave: number
  noteVelocity: number
  noteFrequency: number
  setSynthType: (type: SynthType) => void
  setSynthParams: (params: Record<string, number>) => void
  setOctave: (octave: number) => void
  setNoteInfo: (velocity: number, frequency: number) => void

  effects: EffectConfig[]
  setEffectBypass: (index: number, bypass: boolean) => void
  setEffectWet: (index: number, wet: number) => void
  setEffectParam: (index: number, key: string, value: number) => void

  sequencer: SequencerConfig
  setSequencerPlaying: (playing: boolean) => void
  setSequencerBpm: (bpm: number) => void
  setSequencerPattern: (pattern: (string | null)[]) => void

  micEnabled: boolean
  setMicEnabled: (enabled: boolean) => void

  analysis: AnalysisState
  setAnalysis: (fftBands: number[], envelope: number) => void
  setNumBands: (n: number) => void

  mappings: Mapping[]
  addMapping: (mapping: Mapping) => void
  removeMapping: (id: string) => void
  updateMapping: (id: string, updates: Partial<Mapping>) => void

  mouse: { x: number; y: number }
  setMouse: (x: number, y: number) => void

  sequencerStep: number
  setSequencerStep: (step: number) => void

  ui: UIState
  togglePanel: () => void
  setActiveSection: (section: UIState['activeSection']) => void
}

const defaultEffects: EffectConfig[] = [
  { type: 'filter', bypass: false, wet: 1, params: { frequency: 2000, Q: 1 } },
  { type: 'reverb', bypass: true, wet: 0.3, params: { decay: 2.5 } },
  { type: 'delay', bypass: true, wet: 0.3, params: { delayTime: 0.25, feedback: 0.4 } },
  { type: 'distortion', bypass: true, wet: 0.5, params: { distortion: 0.4 } },
  { type: 'compressor', bypass: false, wet: 1, params: { threshold: -24, ratio: 4 } },
]

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    audioStarted: false,
    startAudio: () => set({ audioStarted: true }),

    synthType: 'FMSynth',
    synthParams: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
    octave: 3,
    noteVelocity: 0,
    noteFrequency: 0,
    setSynthType: (type) => set({ synthType: type }),
    setSynthParams: (params) => set((s) => ({ synthParams: { ...s.synthParams, ...params } })),
    setOctave: (octave) => set({ octave: Math.max(0, Math.min(8, octave)) }),
    setNoteInfo: (velocity, frequency) => set({ noteVelocity: velocity, noteFrequency: frequency }),

    effects: defaultEffects,
    setEffectBypass: (i, bypass) => set((s) => ({
      effects: s.effects.map((e, idx) => idx === i ? { ...e, bypass } : e),
    })),
    setEffectWet: (i, wet) => set((s) => ({
      effects: s.effects.map((e, idx) => idx === i ? { ...e, wet: Math.max(0, Math.min(1, wet)) } : e),
    })),
    setEffectParam: (i, key, value) => set((s) => ({
      effects: s.effects.map((e, idx) => idx === i ? { ...e, params: { ...e.params, [key]: value } } : e),
    })),

    sequencer: { pattern: ['C4', 'E4', 'G4', 'B4', null, 'G4', 'E4', 'C4'], subdivision: '8n', bpm: 120, playing: false },
    setSequencerPlaying: (playing) => set((s) => ({ sequencer: { ...s.sequencer, playing } })),
    setSequencerBpm: (bpm) => set((s) => ({ sequencer: { ...s.sequencer, bpm } })),
    setSequencerPattern: (pattern) => set((s) => ({ sequencer: { ...s.sequencer, pattern } })),

    micEnabled: false,
    setMicEnabled: (enabled) => set({ micEnabled: enabled }),

    analysis: { fftBands: new Array(8).fill(0), envelope: 0, numBands: 8 },
    setAnalysis: (fftBands, envelope) => set((s) => ({ analysis: { ...s.analysis, fftBands, envelope } })),
    setNumBands: (n) => set((s) => ({ analysis: { ...s.analysis, numBands: n, fftBands: new Array(n).fill(0) } })),

    mappings: [],
    addMapping: (m) => set((s) => ({ mappings: [...s.mappings, m] })),
    removeMapping: (id) => set((s) => ({ mappings: s.mappings.filter((m) => m.id !== id) })),
    updateMapping: (id, updates) => set((s) => ({
      mappings: s.mappings.map((m) => m.id === id ? { ...m, ...updates } : m),
    })),

    mouse: { x: 0, y: 0 },
    setMouse: (x, y) => set({ mouse: { x, y } }),

    sequencerStep: 0,
    setSequencerStep: (step) => set({ sequencerStep: step }),

    ui: { panelOpen: false, activeSection: 'audio' },
    togglePanel: () => set((s) => ({ ui: { ...s.ui, panelOpen: !s.ui.panelOpen } })),
    setActiveSection: (section) => set((s) => ({ ui: { ...s.ui, activeSection: section } })),
  }))
)
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/state/__tests__/store.test.ts`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add src/state/
git commit -m "feat(state): add Zustand store with audio, mapping, analysis, and UI slices"
```

---

### Task 3: Audio Engine

**Files:**
- Create: `src/audio/AudioEngine.ts`, `src/audio/__tests__/AudioEngine.test.ts`

- [ ] **Step 1: Write tests** -- verify `start()` calls `Tone.start()`, `noteOn` writes to store, `setSynthType` disposes old synth, `panic` releases all notes

- [ ] **Step 2: Implement AudioEngine** -- class that manages Tone.js lifecycle: `start()` calls `Tone.start()` (user gesture gated), creates PolySynth, connects to EffectsChain. `noteOn(note, velocity)` triggers attack + writes noteVelocity/noteFrequency to store. `setSynthType()` disposes old synth, creates new one. `panic()` releases all.

Key: synth type map `{ FMSynth: Tone.FMSynth, AMSynth: Tone.AMSynth, MembraneSynth: Tone.MembraneSynth, MonoSynth: Tone.MonoSynth }`

- [ ] **Step 3: Run tests, verify pass**

Run: `npx vitest run src/audio/__tests__/AudioEngine.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/audio/AudioEngine.ts src/audio/__tests__/
git commit -m "feat(audio): add AudioEngine with synth lifecycle, note trigger, and Tone.start gating"
```

---

### Task 4: Effects Chain

**Files:**
- Create: `src/audio/EffectsChain.ts`, `src/audio/__tests__/EffectsChain.test.ts`

- [ ] **Step 1: Write tests** -- verify chain creates 5 effects in order, bypass sets `wet.value = 0`, un-bypass restores wet, param updates apply to nodes

- [ ] **Step 2: Implement EffectsChain** -- creates Filter -> Reverb -> FeedbackDelay -> Distortion -> Compressor in series. Input `Tone.Gain` node at start. Subscribes to store `effects` slice. Bypass = set `wet.value = 0` (no node reconnection). Each effect's params map to Tone.js node properties.

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/audio/EffectsChain.ts src/audio/__tests__/
git commit -m "feat(audio): add EffectsChain with bypass, wet/dry, and store subscription"
```

---

### Task 5: Analyser

**Files:**
- Create: `src/audio/Analyser.ts`, `src/audio/__tests__/Analyser.test.ts`

- [ ] **Step 1: Write tests for pure functions** -- `dbToNormalized` maps correctly and clamps. `reduceToBands` returns correct count, silence = zeros, full signal = ones, logarithmic distribution.

- [ ] **Step 2: Implement Analyser** -- uses `Tone.FFT` + `Tone.Meter`. rAF loop reads FFT data, reduces to N bands (logarithmic bin distribution), computes envelope from Meter dBFS, normalizes all to 0-1, writes to store via `setAnalysis()`.

Normalization: FFT dB [-100, -10] -> [0, 1]. Meter dBFS [-60, 0] -> [0, 1].

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/audio/Analyser.ts src/audio/__tests__/
git commit -m "feat(audio): add Analyser with FFT band reduction, envelope follower, and rAF loop"
```

---

### Task 6: Mic Input

**Files:**
- Create: `src/audio/MicInput.ts`, `src/audio/__tests__/MicInput.test.ts`

- [ ] **Step 1: Write tests** -- verify open calls `Tone.UserMedia.open()`, connects to destination, failure sets `micEnabled = false` in store

- [ ] **Step 2: Implement MicInput** -- wraps `Tone.UserMedia`. Subscribes to store `micEnabled`. When enabled, opens mic and connects to effects chain input. On permission denied, resets `micEnabled` to false.

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/audio/MicInput.ts src/audio/__tests__/
git commit -m "feat(audio): add MicInput with getUserMedia, store subscription, and error handling"
```

---

### Task 7: Sequencer

**Files:**
- Create: `src/audio/Sequencer.ts`, `src/audio/__tests__/Sequencer.test.ts`

- [ ] **Step 1: Write tests** -- verify buildSequence creates Tone.Sequence, start/stop toggle Transport, BPM changes apply, step callback writes normalized step to store

- [ ] **Step 2: Implement Sequencer** -- uses `Tone.Sequence` on `Tone.Transport`. Subscribes to store `sequencer.playing` and `sequencer.bpm`. Note callback fires `audioEngine.noteOn()`. Step index normalized as `step / totalSteps` written to store as `sequencerStep`.

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/audio/Sequencer.ts src/audio/__tests__/
git commit -m "feat(audio): add Sequencer with Tone.Sequence, Transport sync, and step tracking"
```

---

### Task 8: Mapping Types

**Files:**
- Create: `src/mapping/MappingTypes.ts`, `src/mapping/__tests__/MappingTypes.test.ts`

- [ ] **Step 1: Write tests for pure functions**

```typescript
// Key tests:
// resolveSource('fft[0]', state) with fftBands[0]=0.75 -> 0.75
// resolveSource('fft[15]', state) with only 8 bands -> 0
// resolveSource('envelope', state) -> state.analysis.envelope
// resolveSource('mouse.x', state) -> state.mouse.x
// applyCurve(0.5, [0, 100], 'linear') -> 50
// applyCurve(0.5, [0, 100], 'exponential') -> 25 (0.5^2 * 100)
// applyCurve(0.3, [0, 1], 'step') -> quantized to nearest 1/8
// applyCurve(1.5, [0, 100], 'linear') -> 100 (clamped)
// smoothValue(0, 1, 0) -> 1 (instant)
// smoothValue(0, 1, 0.9) -> close to 0 (glacial)
```

- [ ] **Step 2: Implement pure functions**

```typescript
// src/mapping/MappingTypes.ts
export function resolveSource(sourceId: string, state: AppState): number {
  const fftMatch = sourceId.match(/^fft\[(\d+)\]$/)
  if (fftMatch) return state.analysis.fftBands[parseInt(fftMatch[1], 10)] ?? 0
  switch (sourceId) {
    case 'envelope': return state.analysis.envelope
    case 'noteVelocity': return state.noteVelocity
    case 'noteFrequency': return state.noteFrequency
    case 'mouse.x': return state.mouse.x
    case 'mouse.y': return state.mouse.y
    case 'sequencerStep': return state.sequencerStep
    default: return 0
  }
}

export function applyCurve(value: number, range: [number, number], curve: CurveType): number {
  const [min, max] = range
  const clamped = Math.max(0, Math.min(1, value))
  switch (curve) {
    case 'linear': return min + clamped * (max - min)
    case 'exponential': return min + Math.pow(clamped, 2) * (max - min)
    case 'step': return min + (Math.round(clamped * 8) / 8) * (max - min)
  }
}

export function smoothValue(current: number, target: number, smooth: number): number {
  if (smooth <= 0) return target
  const factor = Math.pow(smooth, 0.5)
  return current * factor + target * (1 - factor)
}
```

- [ ] **Step 3: Run tests, verify all pass**

- [ ] **Step 4: Commit**

```bash
git add src/mapping/
git commit -m "feat(mapping): add MappingTypes with source resolver, curve applicator, and smoothing"
```

---

### Task 9: Mapping Engine

**Files:**
- Create: `src/mapping/MappingEngine.ts`, `src/mapping/__tests__/MappingEngine.test.ts`

- [ ] **Step 1: Write tests** -- getValue returns default when no mapping. Single mapping resolves correctly (envelope=0.5, range [20,200], linear -> 110). Smoothing converges over multiple ticks. `param()` returns callable arrow function. `reset()` clears all values.

- [ ] **Step 2: Implement MappingEngine**

Core: rAF loop that on each frame reads all mappings from store, resolves each source, applies curve, smooths, stores output. Exposes `getValue(target, default)` and `param(target, default)` for Hydra arrow function closures.

```typescript
export class MappingEngine {
  private smoothedValues = new Map<string, number>()
  private outputValues = new Map<string, number>()

  getValue(target: string, defaultValue = 0): number {
    return this.outputValues.get(target) ?? defaultValue
  }

  param(target: string, defaultValue: number): () => number {
    return () => this.getValue(target, defaultValue)
  }

  tick(): void {
    const state = useAppStore.getState()
    for (const mapping of state.mappings) {
      const raw = resolveSource(mapping.source, state)
      const curved = applyCurve(raw, mapping.range, mapping.curve)
      const current = this.smoothedValues.get(mapping.id) ?? curved
      const smoothed = smoothValue(current, curved, mapping.smooth)
      this.smoothedValues.set(mapping.id, smoothed)
      this.outputValues.set(mapping.target, smoothed)
    }
  }

  reset(): void {
    this.smoothedValues.clear()
    this.outputValues.clear()
  }
}
```

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git add src/mapping/MappingEngine.ts src/mapping/__tests__/
git commit -m "feat(mapping): add MappingEngine with rAF loop, smoothing, and Hydra param bridge"
```

---

### Task 10: Hydra Engine

**Files:**
- Create: `src/visual/HydraEngine.ts`

- [ ] **Step 1: Implement HydraEngine**

Initialize hydra-synth in non-global mode (`makeGlobal: false`). Expose `synth` reference. Provide `buildChain(config)` that walks a declarative chain config and calls synth methods. Dynamic params via arrow function closures that read from MappingEngine.

```typescript
import Hydra from 'hydra-synth'
import { registerCustomShaders } from './CustomShaders'

export interface HydraChainConfig {
  source: { fn: string; args: (number | string)[] }
  transforms: { fn: string; args: (number | string)[] }[]
  output: string
}

export class HydraEngine {
  private hydra: Hydra
  synth: Record<string, unknown>
  private paramGetter: ((target: string, defaultValue: number) => () => number) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.hydra = new Hydra({
      canvas,
      detectAudio: false,
      makeGlobal: false,
      width: canvas.width,
      height: canvas.height,
    })
    this.synth = (this.hydra as Record<string, unknown>).synth as Record<string, unknown>
    registerCustomShaders(this.synth)
  }

  setParamGetter(getter: (target: string, defaultValue: number) => () => number): void {
    this.paramGetter = getter
  }

  buildChain(config: HydraChainConfig): void {
    // Resolve args: strings become arrow functions via paramGetter, numbers stay as-is
    const resolveArg = (arg: number | string, fnName: string, argIndex: number): number | (() => number) => {
      if (typeof arg === 'string') {
        return this.paramGetter?.(arg, 0) ?? (() => 0)
      }
      return arg
    }

    const s = this.synth as Record<string, (...args: unknown[]) => unknown>
    const sourceFn = s[config.source.fn]
    if (!sourceFn) return

    let chain = sourceFn(...config.source.args.map((a, i) => resolveArg(a, config.source.fn, i)))

    for (const transform of config.transforms) {
      const transformFn = (chain as Record<string, (...args: unknown[]) => unknown>)[transform.fn]
      if (transformFn) {
        chain = transformFn.call(chain, ...transform.args.map((a, i) => resolveArg(a, transform.fn, i)))
      }
    }

    const outFn = (chain as Record<string, (...args: unknown[]) => unknown>).out
    if (outFn) {
      const output = s[config.output ?? 'o0']
      outFn.call(chain, output)
    }
  }

  resize(width: number, height: number): void {
    (this.hydra as Record<string, unknown>).width = width;
    (this.hydra as Record<string, unknown>).height = height
  }
}
```

- [ ] **Step 2: Visual verification** -- render `osc(20, 0.1, 0.8).out(o0)` via buildChain, confirm canvas shows oscillator pattern

- [ ] **Step 3: Commit**

```bash
git add src/visual/HydraEngine.ts
git commit -m "feat(visual): add HydraEngine with non-global hydra-synth init and chain builder"
```

---

### Task 11: Custom GLSL Shaders

**Files:**
- Create: `src/visual/CustomShaders.ts`

- [ ] **Step 1: Implement all 6 shaders via setFunction()**

Each shader definition: `{ name, type, inputs: [{type, name, default}], glsl }`.

**sacredGeometry** (src): Concentric rings + flower-of-life petals + seed-of-life circles. Color: deep purple to gold.

**tribalMask** (src): Bilateral symmetry (`abs(st.x)`), eye shapes, horizontal bands, crown arc, inner glow. Color: bone white to burnt umber.

**glitchScan** (color): Scan lines, VHS tracking offset, chromatic aberration, block glitch, brightness flicker. Takes `_c0` input color.

**particleField** (src): Grid-based pseudo-random particles with drift animation and twinkle. Color: warm white to cool blue. NOTE: GLSL nested function definitions not allowed in Hydra -- inline the hash expression `fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453)`.

**voidPulse** (src): Expanding rings from center with breath rhythm, central void glow, angular distortion, dark matter tendrils. Color: ultra-dark purple/indigo.

**ritualFire** (src): Layered sin-based fBm, flame shape (narrow top, wide bottom), vertical fade, ember particles, fire palette (yellow core, orange mid, red outer).

```typescript
export function registerCustomShaders(synth: Record<string, unknown>): void {
  const setFn = synth.setFunction as (def: Record<string, unknown>) => void
  setFn(sacredGeometry)
  setFn(tribalMask)
  setFn(glitchScan)
  setFn(particleField)
  setFn(voidPulse)
  setFn(ritualFire)
}
```

- [ ] **Step 2: Visual verification** -- render each shader individually: `synth.sacredGeometry(6, 5, 0.5).out(synth.o0)`, confirm each renders without GLSL errors. Check browser console for shader compilation errors.

- [ ] **Step 3: Test composability** -- chain with built-in transforms: `synth.sacredGeometry(6,5,0.5).kaleid(4).rotate(0,0.1).out(synth.o0)`. Test glitchScan as color: `synth.osc(10).glitchScan(1,0.5,50).out(synth.o0)`.

- [ ] **Step 4: Commit**

```bash
git add src/visual/CustomShaders.ts
git commit -m "feat(visual): add 6 custom GLSL shaders -- sacredGeometry, tribalMask, glitchScan, particleField, voidPulse, ritualFire"
```

---

### Task 12: Input Handlers

**Files:**
- Create: `src/input/KeyboardHandler.ts`, `src/input/MouseHandler.ts`, `src/input/__tests__/KeyboardHandler.test.ts`

- [ ] **Step 1: Write keyboard handler tests** -- verify note mapping (A key -> C + octaveOffset 0), Z/X shift octave, Tab fires toggle, Space fires sequencer toggle, 1-9 load presets, Shift+1-9 save presets, Esc fires panic, keys ignored when typing in input

- [ ] **Step 2: Implement KeyboardHandler**

Standard two-row piano layout:
```typescript
const KEY_TO_NOTE: Record<string, { note: string; octaveOffset: number }> = {
  'a': { note: 'C', octaveOffset: 0 },
  'w': { note: 'C#', octaveOffset: 0 },
  's': { note: 'D', octaveOffset: 0 },
  'e': { note: 'D#', octaveOffset: 0 },
  'd': { note: 'E', octaveOffset: 0 },
  'f': { note: 'F', octaveOffset: 0 },
  't': { note: 'F#', octaveOffset: 0 },
  'g': { note: 'G', octaveOffset: 0 },
  'y': { note: 'G#', octaveOffset: 0 },
  'h': { note: 'A', octaveOffset: 0 },
  'u': { note: 'A#', octaveOffset: 0 },
  'j': { note: 'B', octaveOffset: 0 },
  'k': { note: 'C', octaveOffset: 1 },
  'o': { note: 'C#', octaveOffset: 1 },
  'l': { note: 'D', octaveOffset: 1 },
  'p': { note: 'D#', octaveOffset: 1 },
  ';': { note: 'E', octaveOffset: 1 },
}
```

Attaches to `window` keydown/keyup. Checks `isTyping()` to skip when text input focused. Tracks held keys for polyphonic note-off.

- [ ] **Step 3: Implement MouseHandler** -- attaches to canvas element. Normalizes position to 0-1. Click+drag for XY pad. Scroll for zoom. Writes to store via `setMouse()`.

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/input/
git commit -m "feat(input): add KeyboardHandler with piano layout and MouseHandler with normalized coords"
```

---

### Task 13: UI Theme + Widgets

**Files:**
- Create: `src/ui/theme.ts`, `src/ui/widgets/Slider.tsx`, `src/ui/widgets/Toggle.tsx`, `src/ui/widgets/Dropdown.tsx`, `src/ui/widgets/XYPad.tsx`

- [ ] **Step 1: Create theme constants**

```typescript
// src/ui/theme.ts
export const theme = {
  bg: '#0a0a0f',
  bgPanel: 'rgba(10, 10, 15, 0.92)',
  accent: '#5a28b4',
  accentLight: '#7c4ddb',
  text: '#c8c8d0',
  textDim: '#6a6a78',
} as const
```

- [ ] **Step 2: Implement Slider** -- native `<input type="range">` with `appearance-none`, custom track/thumb via Tailwind arbitrary selectors, `tabIndex={-1}` to prevent keyboard capture. Label above, value display right.

- [ ] **Step 3: Implement Toggle** -- `<button role="switch">` with pill track, sliding knob via `translate-x`. Off = dim, on = accent purple.

- [ ] **Step 4: Implement Dropdown** -- custom dropdown (not native select). Button shows current value, click opens positioned list. Close on outside click or Escape.

- [ ] **Step 5: Implement XYPad** -- div with pointer events, crosshair at current position, grid lines. Normalizes coords from bounding rect.

- [ ] **Step 6: Visual verification** -- render all widgets in App.tsx temporarily, confirm styling matches dark theme

- [ ] **Step 7: Commit**

```bash
git add src/ui/theme.ts src/ui/widgets/
git commit -m "feat(ui): add theme constants and widget components -- Slider, Toggle, Dropdown, XYPad"
```

---

### Task 14: Preset System

**Files:**
- Create: `src/presets/PresetManager.ts`, `src/presets/defaults/void.ts`, `src/presets/defaults/ritual.ts`, `src/presets/defaults/signal.ts`, `src/presets/defaults/ember.ts`, `src/presets/defaults/cosmos.ts`, `src/presets/defaults/mask.ts`, `src/presets/defaults/index.ts`, `src/presets/__tests__/PresetManager.test.ts`

- [ ] **Step 1: Write tests** -- loadPreset returns correct preset, save to slot 7 persists (mock localStorage), exportJSON returns valid JSON, importJSON parses back to identical object, encodeToURL/decodeFromURL round-trip, ensureDefaults fills slots 1-6

- [ ] **Step 2: Define Preset interface and implement PresetManager**

9 slots. localStorage key `hydra-instrument-presets`. URL hash: `#preset=<base64>`.

- [ ] **Step 3: Create 6 default presets** with curated audio configs, visual chain configs, and mappings per the spec table (void, ritual, signal, ember, cosmos, mask)

- [ ] **Step 4: Run tests, verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/presets/
git commit -m "feat(presets): add PresetManager with 6 starter presets, localStorage, and URL hash sharing"
```

---

### Task 15: UI Panels

**Files:**
- Create: `src/ui/StartOverlay.tsx`, `src/ui/HUD.tsx`, `src/ui/ControlPanel.tsx`, `src/ui/AudioPanel.tsx`, `src/ui/VisualPanel.tsx`, `src/ui/MappingPanel.tsx`, `src/ui/PresetBar.tsx`

- [ ] **Step 1: StartOverlay** -- centered "Click to begin" text. On click, calls `audioEngine.start()`. Fades out when `audioStarted` is true. Required because Web Audio needs user gesture.

- [ ] **Step 2: HUD** -- fixed bottom-left overlay. BPM, preset name, audio level bar (thin div with width%). Fades out when control panel is open. Low opacity, small text.

- [ ] **Step 3: ControlPanel** -- fixed right, full height, 380px wide. `translate-x-full` when closed, `translate-x-0` when open. `transition-transform duration-300`. Background: near-black with backdrop blur. `overflow-y-auto`.

- [ ] **Step 4: AudioPanel** -- collapsible section. Synth type dropdown, ADSR sliders, effects list (toggle + wet slider each), sequencer BPM slider + start/stop, mic toggle.

- [ ] **Step 5: VisualPanel** -- collapsible section. Source dropdown (osc, noise, voronoi, shape, gradient, solid + 6 custom). Dynamic source parameter sliders. Transform list with add/remove.

- [ ] **Step 6: MappingPanel** -- collapsible section. List of mapping rows: source dropdown, target dropdown, range inputs, smooth slider, curve dropdown, delete button. "Add Mapping" button.

- [ ] **Step 7: PresetBar** -- horizontal row of 9 numbered buttons at panel top. Active = accent color. Below: Export, Import, Copy URL buttons.

- [ ] **Step 8: Visual verification** -- open app, toggle panel, interact with all controls

- [ ] **Step 9: Commit**

```bash
git add src/ui/
git commit -m "feat(ui): add StartOverlay, HUD, ControlPanel, AudioPanel, VisualPanel, MappingPanel, PresetBar"
```

---

### Task 16: App.tsx Integration

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Wire initialization sequence**

```
1. Render canvas ref + StartOverlay
2. On "Click to begin": audioEngine.start(), create HydraEngine(canvas),
   create MappingEngine, wire paramGetter, start analyser loop
3. Load preset from URL hash or slot 1
4. Wire KeyboardHandler to window (noteOn/noteOff -> audioEngine, Tab -> togglePanel, etc.)
5. Wire MouseHandler to canvas
6. Start rAF loop: mappingEngine.tick() every frame
```

- [ ] **Step 2: Wire preset loading** -- when preset changes: `hydraEngine.buildChain(preset.visual.chain)`, apply audio config to AudioEngine, set mappings in store

- [ ] **Step 3: Wire canvas resize** -- `window.addEventListener('resize')` updates canvas dimensions and Hydra

- [ ] **Step 4: Render UI tree** -- canvas (absolute, full screen) + HUD + ControlPanel containing AudioPanel, VisualPanel, MappingPanel, PresetBar

- [ ] **Step 5: End-to-end verification** -- run `npm run dev`, click to start, press keyboard keys (hear notes + see visuals react), open panel with Tab, change synth type, add mapping, switch presets, mouse movement affects visuals

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate all systems in App.tsx -- audio, visual, mapping, input, presets, UI"
```

---

### Task 17: Verification & Deploy

**Files:**
- Modify: `package.json` (add deploy script), `vite.config.ts` (add base path)

- [ ] **Step 1: Full verification checklist**

```
Audio:
- [ ] Press A key -> hear C3 note
- [ ] Press multiple keys -> polyphonic chords
- [ ] Switch synth to Membrane -> hear drum sound
- [ ] Toggle reverb on -> hear reverb tail
- [ ] Start sequencer (Space) -> hear looping pattern
- [ ] Toggle mic -> hear mic input through effects

Visuals:
- [ ] Canvas shows Hydra visuals on load
- [ ] Play loud note -> see visual pulse/reaction
- [ ] Switch presets -> visuals change immediately
- [ ] All 6 custom shaders render without GLSL errors

Mapping:
- [ ] Open panel, add mapping fft[0] -> rotate.angle
- [ ] Play bass note -> see rotation respond
- [ ] Remove mapping -> rotation stops

Presets:
- [ ] Keys 1-6 load distinct presets
- [ ] Shift+7 saves current state
- [ ] Reload page -> slot 7 persists
- [ ] Export JSON -> valid file
- [ ] Copy URL -> paste in new tab -> same preset loads

Interaction:
- [ ] Mouse movement affects visuals per mapping
- [ ] Tab toggles panel without interrupting audio
- [ ] Esc silences everything
- [ ] Z/X shift octaves
- [ ] Scroll wheel zooms visual
```

- [ ] **Step 2: Build and deploy**

```bash
npm run build                    # Verify production build
npx vite preview                 # Test production build locally
```

- [ ] **Step 3: Commit and finalize**

```bash
git add -A
git commit -m "feat: complete Hydra audiovisual instrument with verification"
```
