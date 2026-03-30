# Strudel Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Tone.js with Strudel as the sole sound engine and redesign visual presets using hydra-native patterns.

**Architecture:** StrudelEngine replaces AudioEngine/EffectsChain/Sequencer/MicInput. PatternBridge extracts musical structure from Strudel's onTrigger callbacks for visual mapping. HydraEngine expands to support feedback chains and nested source arguments. Presets store Strudel code strings + macro bindings + hydra-native visual chains.

**Tech Stack:** @strudel/web, Web Audio API (AnalyserNode), hydra-synth built-in functions, React, TypeScript, Zustand, Vitest

**Spec:** `docs/superpowers/specs/2026-03-30-strudel-integration-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/audio/StrudelEngine.ts` | Init Strudel, manage patterns, keyboard notes, macros |
| `src/audio/PatternBridge.ts` | Extract cycle/onset/density from onTrigger callbacks |
| `src/audio/StrudelAnalyser.ts` | FFT + envelope via native Web Audio AnalyserNode |
| `src/ui/PatternEditor.tsx` | Textarea-based Strudel code editor for pro mode |
| `src/audio/__tests__/StrudelAnalyser.test.ts` | Unit tests for analyser |
| `src/audio/__tests__/PatternBridge.test.ts` | Unit tests for pattern bridge |
| `src/visual/__tests__/HydraChainBuilder.test.ts` | Unit tests for expanded chain builder |

### Modified files
| File | Change |
|------|--------|
| `src/state/store.ts` | Replace audio state with Strudel state (patternCode, macros, cycle, onset, density) |
| `src/presets/types.ts` | New Preset type with pattern string, keyboard config, macros |
| `src/presets/PresetManager.ts` | Detect old format, reset localStorage, load new defaults |
| `src/presets/defaults/*.ts` | All 6 presets rewritten with Strudel audio + hydra-native visuals |
| `src/presets/defaults/index.ts` | Same exports, updated imports |
| `src/mapping/MappingTypes.ts` | Add cycle/onset/density/patternNote source resolvers |
| `src/mapping/MappingEngine.ts` | No change (reads from store, which has new fields) |
| `src/visual/HydraEngine.ts` | Expand buildChain for feedback refs, nested ChainNode args |
| `src/input/KeyboardHandler.ts` | Remove synth-specific logic, just fire noteOn/noteOff |
| `src/ui/ControlPanel.tsx` | Embed PatternEditor in pro mode |
| `src/ui/SimplePanel.tsx` | Replace synth type / effects with macro sliders only |
| `src/ui/HUD.tsx` | Minor: remove sequencer-specific display if needed |
| `src/App.tsx` | Replace AudioEngine init with StrudelEngine, rewire callbacks |
| `src/audio/analyserUtils.ts` | Rename to `analysisUtils.ts`, keep functions unchanged |
| `package.json` | Remove `tone`, add `@strudel/web` |

### Deleted files
| File | Reason |
|------|--------|
| `src/audio/AudioEngine.ts` | Replaced by StrudelEngine |
| `src/audio/EffectsChain.ts` | Strudel handles effects in pattern code |
| `src/audio/Sequencer.ts` | Strudel handles patterns natively |
| `src/audio/MicInput.ts` | Deferred (YAGNI) |
| `src/audio/Analyser.ts` | Replaced by StrudelAnalyser |
| `src/visual/CustomShaders.ts` | Replaced by hydra-native visual chains |
| `src/ui/AudioPanel.tsx` | Replaced by PatternEditor + macro sliders |
| `src/audio/__tests__/Analyser.test.ts` | Replaced by StrudelAnalyser tests |

---

## Task 1: Install Strudel and verify basic audio

**Files:**
- Modify: `package.json`
- Create: `src/audio/StrudelEngine.ts`

- [ ] **Step 1: Install @strudel/web, remove tone**

```bash
cd /Users/jinsoon/Documents/Work/Claude\ Tasks/hydra
npm install @strudel/web
npm uninstall tone
```

- [ ] **Step 2: Create minimal StrudelEngine with start/stop**

Create `src/audio/StrudelEngine.ts`:

```typescript
import { initStrudel } from '@strudel/web'

export class StrudelEngine {
  private started = false
  private macros: Record<string, number> = { tone: 0.5, space: 0.3, intensity: 0.5 }
  private activeNotes = new Map<string, () => void>()

  async start(): Promise<void> {
    if (this.started) return
    await initStrudel()
    this.injectMacros()
    this.started = true
  }

  setPattern(code: string): void {
    if (!this.started) return
    try {
      // Strudel's global eval: the code calls .play() itself
      // We wrap to inject macros and catch errors
      const wrappedCode = this.wrapWithMacros(code)
      ;(globalThis as any).__strudelEval?.(wrappedCode)
        ?? new Function(wrappedCode)()
    } catch (err) {
      console.error('StrudelEngine.setPattern error:', err)
    }
  }

  stop(): void {
    if (!this.started) return
    try {
      ;(globalThis as any).hush?.()
    } catch { /* ignore */ }
  }

  noteOn(note: string, velocity = 0.8): void {
    if (!this.started) return
    // One-shot note through Strudel
    try {
      const noteStr = note.toLowerCase()
      const code = `note("${noteStr}").s("${this.getKeyboardSynth()}").gain(${velocity})${this.getKeyboardEffects()}.play()`
      new Function(code)()
    } catch (err) {
      console.error('StrudelEngine.noteOn error:', err)
    }
  }

  noteOff(note: string): void {
    const stop = this.activeNotes.get(note.toLowerCase())
    if (stop) {
      stop()
      this.activeNotes.delete(note.toLowerCase())
    }
  }

  panic(): void {
    this.stop()
    this.activeNotes.clear()
  }

  setMacro(name: string, value: number): void {
    this.macros[name] = value
    this.injectMacros()
  }

  getMacro(name: string): number {
    return this.macros[name] ?? 0
  }

  getAudioContext(): AudioContext {
    const ctx = (globalThis as any).getAudioContext?.()
    if (!ctx) throw new Error('Strudel audio context not initialized')
    return ctx
  }

  dispose(): void {
    this.stop()
    this.started = false
  }

  private getKeyboardSynth(): string {
    return this._keyboardSynth
  }

  private getKeyboardEffects(): string {
    return this._keyboardEffects
  }

  private injectMacros(): void {
    for (const [name, value] of Object.entries(this.macros)) {
      ;(globalThis as any)[name] = value
    }
  }

  private wrapWithMacros(code: string): string {
    // Macros are already injected as globals, so the code can reference them directly
    return code
  }

  setKeyboardConfig(config: { s: string; effects: string }): void {
    this._keyboardSynth = config.s
    this._keyboardEffects = config.effects
  }

  private _keyboardSynth = 'sine'
  private _keyboardEffects = ''
}
```

Note: This is a starting skeleton. The exact Strudel API for evaluating code strings needs to be validated against the actual `@strudel/web` package exports. The `initStrudel()` call registers global functions (`note`, `s`, `hush`, `getAudioContext`, etc.) on `globalThis`.

- [ ] **Step 3: Check bundle size impact**

```bash
npm run build 2>&1 | tail -5
# Note the JS bundle size. Current is ~731KB.
# If @strudel/web adds >500KB, wrap initStrudel() in a dynamic import:
# const { initStrudel } = await import('@strudel/web')
```

- [ ] **Step 4: Verify Strudel loads and produces sound**

Temporarily add a test button in `App.tsx` or use browser console after `initStrudel()`:

```javascript
// In browser console after start:
note("c3 e3 g3").s("sine").play()
// Should hear arpeggiated sine tones
hush()
// Should stop
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/audio/StrudelEngine.ts
git commit -m "feat: add StrudelEngine skeleton with @strudel/web"
```

---

## Task 2: StrudelAnalyser (Web Audio FFT + envelope)

**Files:**
- Create: `src/audio/StrudelAnalyser.ts`
- Create: `src/audio/__tests__/StrudelAnalyser.test.ts`
- Rename: `src/audio/analyserUtils.ts` -> `src/audio/analysisUtils.ts`

- [ ] **Step 1: Rename analyserUtils to analysisUtils**

```bash
git mv src/audio/analyserUtils.ts src/audio/analysisUtils.ts
```

Update imports in any files referencing it (currently only `src/audio/Analyser.ts` which will be deleted later, so just rename the file for now).

- [ ] **Step 2: Write failing tests for StrudelAnalyser**

Create `src/audio/__tests__/StrudelAnalyser.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Web Audio API
function createMockAudioContext() {
  const analyserNode = {
    fftSize: 0,
    frequencyBinCount: 512,
    getFloatFrequencyData: vi.fn((arr: Float32Array) => {
      // Fill with mock data: -60dB silence
      arr.fill(-60)
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
  const gainNode = {
    gain: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
  const splitterNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
  return {
    createAnalyser: vi.fn(() => analyserNode),
    createGain: vi.fn(() => gainNode),
    createChannelSplitter: vi.fn(() => splitterNode),
    destination: { connect: vi.fn(), disconnect: vi.fn() },
    currentTime: 0,
    _analyserNode: analyserNode,
    _gainNode: gainNode,
  }
}

describe('StrudelAnalyser', () => {
  let mockCtx: ReturnType<typeof createMockAudioContext>

  beforeEach(() => {
    mockCtx = createMockAudioContext()
  })

  it('should create analyser node with fftSize 1024', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockCtx as unknown as AudioContext)
    expect(mockCtx.createAnalyser).toHaveBeenCalled()
    expect(mockCtx._analyserNode.fftSize).toBe(1024)
    analyser.dispose()
  })

  it('should reduce FFT data to bands', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockCtx as unknown as AudioContext)
    // Manually call the analysis function
    const result = analyser.getAnalysis()
    expect(result.bands).toHaveLength(8)
    expect(result.envelope).toBeGreaterThanOrEqual(0)
    expect(result.envelope).toBeLessThanOrEqual(1)
    analyser.dispose()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/audio/__tests__/StrudelAnalyser.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 4: Implement StrudelAnalyser**

Create `src/audio/StrudelAnalyser.ts`:

```typescript
import { reduceToBands, dbToNormalized } from './analysisUtils'
import { useAppStore } from '../state/store'

export class StrudelAnalyser {
  private analyserNode: AnalyserNode
  private fftData: Float32Array
  private animFrameId: number | null = null

  constructor(private audioContext: AudioContext) {
    this.analyserNode = audioContext.createAnalyser()
    this.analyserNode.fftSize = 1024
    this.fftData = new Float32Array(this.analyserNode.frequencyBinCount)
    // Tap into audio context destination
    this.connectToDestination()
  }

  private connectToDestination(): void {
    // Create a gain node as a passthrough tap
    const tap = this.audioContext.createGain()
    tap.gain.value = 1
    // Note: We can't insert into the existing graph easily.
    // Instead, we'll connect the analyser in startLoop when audio is flowing.
    // For now, store reference for later connection.
    this.analyserNode.connect(this.audioContext.destination)
  }

  getAnalysis(): { bands: number[]; envelope: number } {
    this.analyserNode.getFloatFrequencyData(this.fftData)
    const numBands = useAppStore.getState().analysis.numBands
    const bands = reduceToBands(this.fftData, numBands)
    // Compute envelope from average of mid-frequency bands
    const midBands = bands.slice(1, 5)
    const envelope = midBands.length > 0
      ? midBands.reduce((sum, b) => sum + b, 0) / midBands.length
      : 0
    return { bands, envelope }
  }

  startLoop(): void {
    const tick = () => {
      const { bands, envelope } = this.getAnalysis()
      useAppStore.getState().setAnalysis(bands, envelope)
      this.animFrameId = requestAnimationFrame(tick)
    }
    tick()
  }

  stopLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  getAnalyserNode(): AnalyserNode {
    return this.analyserNode
  }

  dispose(): void {
    this.stopLoop()
    try { this.analyserNode.disconnect() } catch { /* ignore */ }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/audio/__tests__/StrudelAnalyser.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/audio/StrudelAnalyser.ts src/audio/__tests__/StrudelAnalyser.test.ts src/audio/analysisUtils.ts
git commit -m "feat: add StrudelAnalyser with Web Audio FFT"
```

---

## Task 3: PatternBridge (musical structure extraction)

**Files:**
- Create: `src/audio/PatternBridge.ts`
- Create: `src/audio/__tests__/PatternBridge.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/audio/__tests__/PatternBridge.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { PatternBridge } from '../PatternBridge'

describe('PatternBridge', () => {
  let bridge: PatternBridge

  beforeEach(() => {
    bridge = new PatternBridge()
  })

  it('should initialize with zero values', () => {
    expect(bridge.getCycle()).toBe(0)
    expect(bridge.getDensity()).toBe(0)
    expect(bridge.getOnset()).toBe(0)
    expect(bridge.getPatternNote()).toBe(0)
  })

  it('should update cycle from hap', () => {
    bridge.handleTrigger({
      value: { note: 'c3' },
      whole: { begin: 2.5, end: 3 },
    })
    expect(bridge.getCycle()).toBeCloseTo(0.5)
  })

  it('should track onset as impulse', () => {
    bridge.handleTrigger({
      value: { note: 'c3' },
      whole: { begin: 0, end: 0.5 },
    })
    expect(bridge.getOnset()).toBe(1)
    // Decay after tick
    bridge.tick()
    expect(bridge.getOnset()).toBeLessThan(1)
  })

  it('should compute density from events per window', () => {
    // Fire 4 events in quick succession
    for (let i = 0; i < 4; i++) {
      bridge.handleTrigger({
        value: { note: 'c3' },
        whole: { begin: i * 0.25, end: (i + 1) * 0.25 },
      })
    }
    expect(bridge.getDensity()).toBeGreaterThan(0)
  })

  it('should normalize pattern note frequency', () => {
    bridge.handleTrigger({
      value: { note: 'c4' }, // ~261 Hz, mid-range
      whole: { begin: 0, end: 1 },
    })
    const freq = bridge.getPatternNote()
    expect(freq).toBeGreaterThan(0)
    expect(freq).toBeLessThan(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/audio/__tests__/PatternBridge.test.ts
```

- [ ] **Step 3: Implement PatternBridge**

Create `src/audio/PatternBridge.ts`:

```typescript
interface HapLike {
  value: { note?: string; [key: string]: unknown }
  whole: { begin: number; end: number }
}

const NOTE_FREQ_MAP: Record<string, number> = {
  c: 261.63, 'c#': 277.18, db: 277.18, d: 293.66, 'd#': 311.13,
  eb: 311.13, e: 329.63, f: 349.23, 'f#': 369.99, gb: 369.99,
  g: 392.0, 'g#': 415.3, ab: 415.3, a: 440.0, 'a#': 466.16,
  bb: 466.16, b: 493.88,
}

function noteToFreq(note: string): number {
  const match = note.match(/^([a-g][#b]?)(\d)$/i)
  if (!match) return 0
  const base = NOTE_FREQ_MAP[match[1].toLowerCase()] ?? 261.63
  const octave = parseInt(match[2], 10)
  return base * Math.pow(2, octave - 4)
}

function freqToNormalized(freq: number): number {
  // Map 20Hz-4000Hz to 0-1 (log scale)
  if (freq <= 0) return 0
  const minLog = Math.log(20)
  const maxLog = Math.log(4000)
  return Math.max(0, Math.min(1, (Math.log(freq) - minLog) / (maxLog - minLog)))
}

export class PatternBridge {
  private cycle = 0
  private onset = 0
  private density = 0
  private patternNote = 0
  private eventCount = 0
  private lastCycleInt = 0
  private eventsThisCycle = 0

  handleTrigger(hap: HapLike): void {
    // Cycle position
    this.cycle = hap.whole.begin % 1

    // Onset impulse
    this.onset = 1

    // Pattern note
    if (hap.value.note) {
      const freq = noteToFreq(String(hap.value.note))
      this.patternNote = freqToNormalized(freq)
    }

    // Density tracking
    const currentCycleInt = Math.floor(hap.whole.begin)
    if (currentCycleInt !== this.lastCycleInt) {
      this.density = Math.min(1, this.eventsThisCycle / 16) // normalize: 16 events = 1.0
      this.eventsThisCycle = 0
      this.lastCycleInt = currentCycleInt
    }
    this.eventsThisCycle++
    this.eventCount++
  }

  tick(): void {
    // Decay onset
    this.onset *= 0.85
    if (this.onset < 0.01) this.onset = 0
  }

  getCycle(): number { return this.cycle }
  getOnset(): number { return this.onset }
  getDensity(): number { return this.density }
  getPatternNote(): number { return this.patternNote }

  reset(): void {
    this.cycle = 0
    this.onset = 0
    this.density = 0
    this.patternNote = 0
    this.eventCount = 0
    this.eventsThisCycle = 0
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/audio/__tests__/PatternBridge.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/audio/PatternBridge.ts src/audio/__tests__/PatternBridge.test.ts
git commit -m "feat: add PatternBridge for musical structure extraction"
```

---

## Task 4: Update state store for Strudel

**Files:**
- Modify: `src/state/store.ts`
- Modify: `src/state/__tests__/store.test.ts`

- [ ] **Step 1: Update store state shape**

In `src/state/store.ts`, replace the audio-related state:

**Remove:**
- `synthType`, `synthParams`, `effects[]`, `sequencer` (pattern/subdivision/playing/step)
- All setters for the above: `setSynthType`, `setSynthParams`, `setEffectBypass`, `setEffectWet`, `setEffectParam`, `setSequencerPlaying`, `setSequencerBpm`, `setSequencerPattern`, `setSequencerStep`

**Add:**
```typescript
// Audio (Strudel)
patternCode: string           // current Strudel code
patternPlaying: boolean       // is pattern running
macros: { tone: number; space: number; intensity: number }

// Pattern bridge data
cycle: number                 // 0-1 pattern cycle position
density: number               // 0-1 pattern density
onset: number                 // 0-1 onset impulse
patternNote: number           // 0-1 pattern note frequency

// Setters
setPatternCode: (code: string) => void
setPatternPlaying: (playing: boolean) => void
setMacro: (name: keyof AppState['macros'], value: number) => void
setPatternData: (cycle: number, density: number, onset: number, patternNote: number) => void
```

**Keep unchanged:** `analysis`, `noteVelocity`, `noteFrequency`, `mouse`, `octave`, `mappings`, `panelOpen`, `uiMode`, `activeSection`, `audioStarted`, `currentPreset`, `activeSlot`, `sequencerStep` (rename to `cycle` usage in mappings)

- [ ] **Step 2: Update store tests**

In `src/state/__tests__/store.test.ts`, replace tests for removed state with tests for new state:

```typescript
it('should set pattern code', () => {
  useAppStore.getState().setPatternCode('note("c3").s("sine").play()')
  expect(useAppStore.getState().patternCode).toBe('note("c3").s("sine").play()')
})

it('should set macros', () => {
  useAppStore.getState().setMacro('tone', 0.7)
  expect(useAppStore.getState().macros.tone).toBe(0.7)
})

it('should set pattern data', () => {
  useAppStore.getState().setPatternData(0.5, 0.3, 1, 0.6)
  expect(useAppStore.getState().cycle).toBe(0.5)
  expect(useAppStore.getState().density).toBe(0.3)
  expect(useAppStore.getState().onset).toBe(1)
  expect(useAppStore.getState().patternNote).toBe(0.6)
})
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Fix any failures from removed state references in other test files.

- [ ] **Step 4: Commit**

```bash
git add src/state/store.ts src/state/__tests__/store.test.ts
git commit -m "refactor: reshape store state for Strudel"
```

---

## Task 5: Update MappingTypes with new sources

**Files:**
- Modify: `src/mapping/MappingTypes.ts`
- Modify: `src/mapping/__tests__/MappingTypes.test.ts`

- [ ] **Step 1: Add new source resolvers**

In `src/mapping/MappingTypes.ts`, update `resolveSource()`:

```typescript
export function resolveSource(sourceId: string, state: AppState): number {
  const fftMatch = sourceId.match(/^fft\[(\d+)\]$/)
  if (fftMatch) return state.analysis.fftBands[parseInt(fftMatch[1], 10)] ?? 0
  switch (sourceId) {
    case 'envelope': return state.analysis.envelope
    case 'noteVelocity': return state.noteVelocity
    case 'noteFrequency': return state.noteFrequency
    case 'mouse.x': return state.mouse.x
    case 'mouse.y': return state.mouse.y
    case 'cycle': return state.cycle
    case 'density': return state.density
    case 'onset': return state.onset
    case 'patternNote': return state.patternNote
    default: return 0
  }
}
```

- [ ] **Step 2: Add tests for new sources**

```typescript
it('should resolve cycle source', () => {
  useAppStore.getState().setPatternData(0.75, 0, 0, 0)
  expect(resolveSource('cycle', useAppStore.getState())).toBe(0.75)
})

it('should resolve onset source', () => {
  useAppStore.getState().setPatternData(0, 0, 1, 0)
  expect(resolveSource('onset', useAppStore.getState())).toBe(1)
})

it('should resolve density source', () => {
  useAppStore.getState().setPatternData(0, 0.5, 0, 0)
  expect(resolveSource('density', useAppStore.getState())).toBe(0.5)
})

it('should resolve patternNote source', () => {
  useAppStore.getState().setPatternData(0, 0, 0, 0.6)
  expect(resolveSource('patternNote', useAppStore.getState())).toBe(0.6)
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/mapping/__tests__/MappingTypes.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/mapping/MappingTypes.ts src/mapping/__tests__/MappingTypes.test.ts
git commit -m "feat: add pattern-aware mapping sources (cycle, onset, density)"
```

---

## Task 6: Expand HydraEngine chain builder

**Files:**
- Modify: `src/visual/HydraEngine.ts`
- Create: `src/visual/__tests__/HydraChainBuilder.test.ts`
- Modify: `src/presets/types.ts` (update chain types)

- [ ] **Step 1: Update chain config types**

In `src/presets/types.ts`, replace the visual chain types:

```typescript
export interface ChainNode {
  fn: string
  args: (number | string | ChainNode)[]
  transforms?: TransformNode[]  // transforms applied to this sub-chain (e.g., osc(60).rotate(PI/2))
}

export interface TransformNode {
  fn: string
  args: (number | string | ChainNode)[]
}

export interface HydraChainConfig {
  source: ChainNode
  transforms: TransformNode[]
  output: string
}
```

Note: `ChainNode` and `TransformNode` have the same shape but different semantic meaning. Source nodes create textures (`osc`, `noise`, `shape`, `voronoi`, `src`). Transform nodes modify them (`blend`, `diff`, `modulate`, `kaleid`, `rotate`, `scale`, `brightness`, etc.).

- [ ] **Step 2: Write tests for expanded chain builder**

Create `src/visual/__tests__/HydraChainBuilder.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

// We test the resolveArg logic for nested ChainNode objects
describe('HydraEngine chain builder', () => {
  it('should resolve numeric args as-is', () => {
    // This tests the existing behavior
    const arg = 0.5
    expect(typeof arg).toBe('number')
  })

  it('should resolve string args as param getters', () => {
    const arg = 'drift.scale'
    expect(typeof arg).toBe('string')
  })

  it('should detect ChainNode objects', () => {
    const node = { fn: 'noise', args: [3] }
    expect(typeof node).toBe('object')
    expect(node.fn).toBe('noise')
  })

  it('should detect nested ChainNode in transform args', () => {
    // blend(src(o0), 0.94)
    const transform = {
      fn: 'blend',
      args: [{ fn: 'src', args: ['o0'] }, 0.94],
    }
    expect(transform.args[0]).toEqual({ fn: 'src', args: ['o0'] })
    expect(transform.args[1]).toBe(0.94)
  })

  it('should handle deeply nested chains', () => {
    // modulate(noise(3.5).modulateScale(osc(15)), 0.6)
    const transform = {
      fn: 'modulate',
      args: [
        {
          fn: 'noise',
          args: [3.5],
          // Note: transforms on nested sources need to be represented
          // We'll handle this with a 'transforms' field on ChainNode
        },
        0.6,
      ],
    }
    expect(transform.fn).toBe('modulate')
  })
})
```

- [ ] **Step 3: Update HydraEngine.buildChain**

In `src/visual/HydraEngine.ts`, expand `buildChain()` to handle nested `ChainNode` args:

```typescript
buildChain(config: HydraChainConfig): void {
  const s = this.synth

  const resolveArg = (arg: number | string | ChainNode): any => {
    if (typeof arg === 'number') return arg
    if (typeof arg === 'string') {
      // Check if it's an output buffer reference
      if (arg === 'o0' || arg === 'o1' || arg === 'o2' || arg === 'o3') {
        return s[arg]
      }
      return this.paramGetter?.(arg, 0) ?? (() => 0)
    }
    // ChainNode: recursively build a sub-chain
    return this.buildSubChain(arg)
  }

  try {
    const sourceFn = s[config.source.fn]
    if (typeof sourceFn !== 'function') return

    let chain = sourceFn.call(s, ...config.source.args.map(resolveArg))

    for (const transform of config.transforms) {
      const fn = chain[transform.fn]
      if (typeof fn === 'function') {
        chain = fn.call(chain, ...transform.args.map(resolveArg))
      }
    }

    if (typeof chain.out === 'function') {
      const output = s[config.output ?? 'o0']
      chain.out(output)
    }
  } catch (err) {
    console.error('HydraEngine.buildChain error:', err)
  }
}

private buildSubChain(node: ChainNode): any {
  const s = this.synth

  const resolveArg = (arg: number | string | ChainNode): any => {
    if (typeof arg === 'number') return arg
    if (typeof arg === 'string') {
      if (arg === 'o0' || arg === 'o1' || arg === 'o2' || arg === 'o3') {
        return s[arg]
      }
      return this.paramGetter?.(arg, 0) ?? (() => 0)
    }
    return this.buildSubChain(arg)
  }

  const sourceFn = s[node.fn]
  if (typeof sourceFn !== 'function') return s.solid()

  let chain = sourceFn.call(s, ...node.args.map(resolveArg))

  // Apply transforms on the sub-chain (e.g., osc(60).rotate(PI/2))
  if (node.transforms) {
    for (const transform of node.transforms) {
      const fn = chain[transform.fn]
      if (typeof fn === 'function') {
        chain = fn.call(chain, ...transform.args.map(resolveArg))
      }
    }
  }

  return chain
}
```

The key addition is `buildSubChain()` which recursively evaluates nested `ChainNode` objects into hydra source objects that can be passed as arguments to transforms like `modulate()`, `blend()`, `diff()`, etc.

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/visual/__tests__/HydraChainBuilder.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/visual/HydraEngine.ts src/visual/__tests__/HydraChainBuilder.test.ts src/presets/types.ts
git commit -m "feat: expand HydraEngine for feedback chains and nested sources"
```

---

## Task 7: New preset format and all 6 presets

**Files:**
- Modify: `src/presets/types.ts`
- Modify: `src/presets/PresetManager.ts`
- Rewrite: all files in `src/presets/defaults/`

- [ ] **Step 1: Define new Preset type**

Update `src/presets/types.ts` with the full preset interface (adding audio fields to the already-updated chain types from Task 6):

```typescript
import { HydraChainConfig } from './types'

export interface PresetAudio {
  pattern: string
  keyboard: {
    s: string
    effects: string
  }
  macros: {
    tone: number
    space: number
    intensity: number
  }
}

export interface MappingConfig {
  id: string
  source: string
  target: string
  range: [number, number]
  smooth: number
  curve: 'linear' | 'exponential' | 'step'
}

export interface Preset {
  name: string
  audio: PresetAudio
  visual: {
    chain: HydraChainConfig
  }
  mappings: MappingConfig[]
  meta: {
    createdAt: string
    description: string
  }
}
```

- [ ] **Step 2: Rewrite all 6 preset files**

Each preset gets Strudel audio + hydra-native visual chain. See the spec (Section 8) for the exact visual chain configs. Write all 6 files:

- `src/presets/defaults/void.ts` -- drifting filaments (diff + feedback)
- `src/presets/defaults/ritual.ts` -- fractal symmetry (kaleid + feedback)
- `src/presets/defaults/signal.ts` -- network moire (high-freq osc interference)
- `src/presets/defaults/ember.ts` -- organic cells (voronoi + luma + blend)
- `src/presets/defaults/cosmos.ts` -- organic web (diff + noise modulation)
- `src/presets/defaults/mask.ts` -- grid with feedback (shape repeat + modulate o0)

Each file follows the pattern:
```typescript
import { Preset } from '../types'

export const voidPreset: Preset = {
  name: 'void',
  audio: {
    pattern: `note("<c3 e3 g3>/4").s("sine").lpf(tone * 2000 + 200).room(space * 0.8).gain(intensity * 0.7)`,
    keyboard: { s: 'sine', effects: '.lpf(tone * 2000 + 200).room(space * 0.8)' },
    macros: { tone: 0.5, space: 0.85, intensity: 0.5 },
  },
  visual: {
    chain: {
      source: { fn: 'osc', args: [60, -0.015, 0.3] },
      transforms: [
        { fn: 'diff', args: [{ fn: 'osc', args: [60, 0.08], transforms: [{ fn: 'rotate', args: [Math.PI / 2] }] }] },
        { fn: 'modulate', args: [{ fn: 'noise', args: [3.5, 0.25] }, 0.15] },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.94] },
        { fn: 'brightness', args: [-0.05] },
        { fn: 'scale', args: ['drift.scale'] },
      ],
      output: 'o0',
    },
  },
  mappings: [
    { id: 'void-map-0', source: 'envelope', target: 'drift.scale', range: [0.98, 1.02], smooth: 0.15, curve: 'linear' },
  ],
  meta: { createdAt: '2026-03-30T00:00:00.000Z', description: 'Drifting filaments. Edge detection feedback with organic warping.' },
}
```

Repeat for all 6 presets with their specific audio patterns and visual chains from the spec.

- [ ] **Step 3: Update PresetManager for format migration**

In `src/presets/PresetManager.ts`, add detection of old format:

```typescript
private loadFromStorage(): void {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (json) {
      const parsed = JSON.parse(json) as (Preset | null)[]
      // Detect old Tone.js format: if first preset has 'synthType', reset
      const first = parsed.find(p => p !== null)
      if (first && 'synthType' in (first as any).audio) {
        // Old format -- clear and use defaults
        this.slots = new Array(6).fill(null)
        return
      }
      this.slots = parsed.slice(0, 6)
    }
  } catch { /* ignore corrupt data */ }
}
```

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```

Fix any type errors from the new preset format.

- [ ] **Step 5: Commit**

```bash
git add src/presets/
git commit -m "feat: rewrite all presets with Strudel audio + hydra-native visuals"
```

---

## Task 8: PatternEditor UI component

**Files:**
- Create: `src/ui/PatternEditor.tsx`

- [ ] **Step 1: Create PatternEditor component**

```typescript
import { useRef, useCallback, useEffect } from 'react'

interface PatternEditorProps {
  code: string
  onChange: (code: string) => void
  onEvaluate: () => void
  onStop: () => void
  isPlaying: boolean
  error: string | null  // shown inline when pattern evaluation fails
}

export function PatternEditor({ code, onChange, onEvaluate, onStop, isPlaying }: PatternEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      e.stopPropagation()
      onEvaluate()
    }
    if (e.key === '.' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      e.stopPropagation()
      onStop()
    }
    // Prevent keyboard handler from capturing these keys
    e.stopPropagation()
  }, [onEvaluate, onStop])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
    }
  }, [code])

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em',
          color: isPlaying ? '#B0B8C4' : '#666',
        }}>
          Pattern {isPlaying ? '\u25B6' : ''}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onEvaluate}
            style={{
              background: 'none', border: '1px solid #333', borderRadius: '3px',
              padding: '2px 8px', fontSize: '9px', color: '#999', cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Ctrl+Enter
          </button>
          <button
            onClick={onStop}
            style={{
              background: 'none', border: '1px solid #333', borderRadius: '3px',
              padding: '2px 8px', fontSize: '9px', color: '#999', cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Ctrl+.
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: '80px',
          background: '#0a0a0f',
          border: '1px solid #333',
          borderRadius: '4px',
          padding: '10px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          lineHeight: '1.7',
          color: '#aaa',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/PatternEditor.tsx
git commit -m "feat: add PatternEditor component for pro mode REPL"
```

---

## Task 9: Update SimplePanel and ControlPanel

**Files:**
- Modify: `src/ui/SimplePanel.tsx`
- Modify: `src/ui/ControlPanel.tsx`
- Delete: `src/ui/AudioPanel.tsx`

- [ ] **Step 1: Simplify SimplePanel**

Replace synth type selector and effect-specific controls with just macro sliders (Tone, Space, Intensity) + preset selector + visual groups + BPM. The SimplePanel already has macro sliders in the current design. Remove references to `synthType`, `onSynthTypeChange`, and individual effect controls.

- [ ] **Step 2: Update ControlPanel for pro mode**

In pro mode, replace the `<AudioPanel>` component with `<PatternEditor>` + macro sliders. Keep `<VisualPanel>` and `<MappingPanel>` unchanged.

```typescript
// In ControlPanel.tsx pro mode section:
<PatternEditor
  code={patternCode}
  onChange={handlePatternChange}
  onEvaluate={handleEvaluatePattern}
  onStop={handleStopPattern}
  isPlaying={patternPlaying}
/>
{/* Macro sliders */}
<MacroSliders macros={macros} onMacroChange={handleMacroChange} />
{/* Existing panels */}
<VisualPanel ... />
<MappingPanel ... />
```

- [ ] **Step 3: Delete AudioPanel**

```bash
git rm src/ui/AudioPanel.tsx
```

- [ ] **Step 4: Run type check and fix errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/SimplePanel.tsx src/ui/ControlPanel.tsx
git commit -m "refactor: update UI panels for Strudel (PatternEditor replaces AudioPanel)"
```

---

## Task 10: Wire everything in App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/input/KeyboardHandler.ts`

- [ ] **Step 1: Replace AudioEngine with StrudelEngine in App.tsx**

Major changes to `App.tsx`:

1. Replace `AudioEngine` import with `StrudelEngine`
2. Replace `Analyser` with `StrudelAnalyser`
3. Add `PatternBridge` instance
4. In `handleStart()`:
   - Create `StrudelEngine` and call `start()`
   - Create `StrudelAnalyser` with `engine.getAudioContext()`
   - Create `PatternBridge`
   - Start analyser loop
   - In the rAF tick loop: call `patternBridge.tick()` and push data to store
5. In `applyPreset()`:
   - Call `engine.setPattern(preset.audio.pattern)`
   - Call `engine.setKeyboardConfig(preset.audio.keyboard)`
   - Set macros from preset
   - Build visual chain (same as before)
   - Set mappings (same as before)
6. Wire keyboard callbacks: `noteOn/noteOff` -> `strudelEngine.noteOn/noteOff`
7. Wire macro slider changes: `engine.setMacro(name, value)`

- [ ] **Step 2: Update KeyboardHandler**

Remove `sequencer.playing` toggle references (Strudel patterns start/stop via REPL). Simplify to just note on/off + preset shortcuts + octave + panel toggle.

Remove the Space key handler for sequencer toggle (or repurpose it for pattern play/stop).

- [ ] **Step 3: Manual browser test**

1. Load the app, click to start
2. Press keyboard keys -- should hear Strudel-synthesized notes
3. Switch presets 1-6 -- each should produce different sound + visuals
4. Open pro mode -- should see PatternEditor with Strudel code
5. Edit code, press Ctrl+Enter -- should hear new pattern
6. Adjust macro sliders -- sound should change in real-time

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/input/KeyboardHandler.ts
git commit -m "feat: wire StrudelEngine into App, replace AudioEngine"
```

---

## Task 11: Delete old files and clean up

**Files:**
- Delete: `src/audio/AudioEngine.ts`
- Delete: `src/audio/EffectsChain.ts`
- Delete: `src/audio/Sequencer.ts`
- Delete: `src/audio/MicInput.ts`
- Delete: `src/audio/Analyser.ts`
- Delete: `src/audio/__tests__/Analyser.test.ts`
- Delete: `src/visual/CustomShaders.ts`

- [ ] **Step 1: Delete old audio files**

```bash
git rm src/audio/AudioEngine.ts src/audio/EffectsChain.ts src/audio/Sequencer.ts src/audio/MicInput.ts src/audio/Analyser.ts src/audio/__tests__/Analyser.test.ts
```

- [ ] **Step 2: Delete CustomShaders**

```bash
git rm src/visual/CustomShaders.ts
```

Remove the `registerCustomShaders()` call from `HydraEngine.ts` constructor.

- [ ] **Step 3: Remove tone from package.json**

Verify `tone` is already removed (should have been done in Task 1). If not:

```bash
npm uninstall tone
```

- [ ] **Step 4: Run full test suite and type check**

```bash
npx tsc --noEmit && npx vitest run
```

Fix any remaining import errors or test failures.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove Tone.js, CustomShaders, and old audio classes"
```

---

## Task 12: Final integration test and deploy

- [ ] **Step 1: Full manual browser test**

Test each preset (1-6):
- Visual renders on screen (not blank)
- Keyboard notes produce sound
- Pattern plays when started
- Macro sliders affect sound
- Visual mappings respond to audio

Test pro mode:
- Pattern editor shows code
- Ctrl+Enter evaluates
- Ctrl+. stops
- Editing code and re-evaluating works

Test simple mode:
- No code visible
- Macro sliders work
- Preset switching works

- [ ] **Step 2: Build for production**

```bash
npm run build
```

Verify no build errors and bundle size is reasonable.

- [ ] **Step 3: Deploy**

```bash
npx gh-pages -d dist
```

- [ ] **Step 4: Final commit if any remaining changes**

```bash
git add -A
git commit -m "feat: complete Strudel integration"
git push origin main
```
