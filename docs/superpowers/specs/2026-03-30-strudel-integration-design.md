# Strudel Integration Design Spec

**Date:** 2026-03-30
**Status:** Draft -- awaiting user review
**Scope:** Full replacement of Tone.js audio engine with Strudel, plus visual preset redesign using hydra-native patterns

---

## 1. Goals

Replace Tone.js with Strudel as the sole sound engine for the hydra-instrument. This gives us:

- Algorithmic pattern composition instead of fixed array sequencing
- Rich synthesis via SuperDirt-style parameters instead of 4 preset synth types
- Pattern-aware visual mapping (cycle position, onset, density) in addition to FFT/envelope
- A live-coding REPL in pro mode for power users
- Hydra-native visual presets leveraging community techniques (feedback, moire, diff edges)

## 2. Architecture Overview

### Current (Tone.js) -- 6 classes, ~800 lines

```
Keyboard -> AudioEngine (PolySynth) -> EffectsChain -> Analyser -> Speaker
Sequencer -> noteOn() -> AudioEngine
```

### New (Strudel) -- 3 new classes replacing 6

```
Keyboard -> StrudelEngine (synthesis + effects + patterns) -> StrudelAnalyser -> Speaker
                |
          PatternBridge (onTrigger callbacks) -> MappingEngine -> HydraEngine
```

### Files removed

- `src/audio/AudioEngine.ts`
- `src/audio/EffectsChain.ts`
- `src/audio/Sequencer.ts`
- `src/audio/MicInput.ts`
- `src/visual/CustomShaders.ts` (custom GLSL shaders replaced by hydra-native chains)

Note: `src/audio/analyserUtils.ts` contains `reduceToBands()` and `dbToNormalized()` which operate on raw Float32Arrays with no Tone.js dependency. These functions are kept and used by StrudelAnalyser. The file is renamed to `src/audio/analysisUtils.ts` to avoid confusion with the deleted Analyser class.
- `tone` npm package

### Files added

- `src/audio/StrudelEngine.ts`
- `src/audio/PatternBridge.ts`
- `src/audio/StrudelAnalyser.ts`
- `src/ui/PatternEditor.tsx` (REPL component for pro mode)
- `@strudel/web` npm package

### Files modified

- `src/state/store.ts` -- audio state reshaped for Strudel
- `src/mapping/MappingEngine.ts` -- new pattern-aware sources
- `src/mapping/MappingTypes.ts` -- new source resolvers
- `src/visual/HydraEngine.ts` -- expanded chain builder for feedback/modulation
- `src/input/KeyboardHandler.ts` -- notes route through StrudelEngine
- `src/presets/types.ts` -- new preset format
- `src/presets/PresetManager.ts` -- handles new format + migration
- `src/presets/defaults/*.ts` -- all 6 presets rewritten
- `src/ui/ControlPanel.tsx` -- embeds PatternEditor in pro mode
- `src/ui/SimplePanel.tsx` -- macros replace synth type / individual effect controls
- `src/ui/AudioPanel.tsx` -- removed (replaced by PatternEditor + macro sliders)
- `src/App.tsx` -- initialization uses StrudelEngine instead of AudioEngine

## 3. StrudelEngine

Central class replacing AudioEngine, EffectsChain, Sequencer, and MicInput.

### Responsibilities

- Initialize Strudel via `initStrudel()` from `@strudel/web`
- Manage the current pattern (evaluate code string, play, stop)
- Handle keyboard note injection as one-shot Strudel events
- Maintain macro variables (`tone`, `space`, `intensity`) as live globals
- Expose `getAudioContext()` for the analyser

### API

```typescript
class StrudelEngine {
  start(): Promise<void>
  setPattern(code: string): void
  stop(): void
  noteOn(note: string, velocity: number): void
  noteOff(note: string): void
  panic(): void
  setMacro(name: string, value: number): void
  getAudioContext(): AudioContext
  dispose(): void
}
```

### Keyboard note injection

When a user presses a key, `noteOn("C3", 0.8)` evaluates a one-shot Strudel pattern:

```javascript
note("c3").s(currentKeyboardSynth).gain(0.8).lpf(tone * 4000 + 200).room(space * 0.8)
```

The keyboard synth type and effect parameters come from the current preset's `keyboard` config. Notes inherit the preset's macro-controlled effects so keyboard play sounds consistent with the running pattern.

**Note-off handling:** Strudel one-shot patterns have a fixed duration. For keyboard play, `noteOn` creates a sustained note (long duration), and `noteOff` stops it by calling the sound's `stop` function returned by the `onTrigger` callback. StrudelEngine maintains a map of active notes to their stop functions.

### Macro system

Macros are JavaScript variables injected into Strudel's evaluation scope:

- `tone` (0-1): maps to filter cutoff. Pattern code references as `.lpf(tone * 4000 + 200)`
- `space` (0-1): maps to reverb/delay mix. `.room(space * 0.8).delay(space * 0.5)`
- `intensity` (0-1): maps to gain/distortion. `.gain(intensity).distort(intensity * 2)`

When a UI slider changes a macro value, the store updates, StrudelEngine re-injects the variable, and the next Strudel evaluation cycle picks up the new value. This is real-time with no re-evaluation needed because Strudel evaluates functions lazily each cycle.

### Integration with @strudel/web

Based on the official docs, initialization is:

```javascript
import { initStrudel } from '@strudel/web'

await initStrudel()
// Then: note("c3 e3").s("sine").play()
// Stop: hush()
```

`getAudioContext()` from Strudel gives us the Web Audio context. All Strudel audio routes through this context's destination node.

## 4. PatternBridge

New class that extracts musical structure from Strudel for visual mapping.

### Responsibilities

- Hook into Strudel's `onTrigger(hap, deadline, duration)` callbacks
- Track cycle position (0-1 within the current pattern loop)
- Compute pattern density (events per cycle, normalized)
- Detect note onsets as impulses for visual triggers
- Push data to the Zustand store each frame

### New mapping sources

```
cycle          -- 0-1 position within current pattern cycle
density        -- events per cycle, normalized 0-1
onset          -- 1 on note trigger, decays to 0 (impulse envelope)
patternNote    -- most recent pattern note frequency, normalized 0-1
```

These supplement existing sources (fft[0..7], envelope, mouse.x/y, noteVelocity, noteFrequency).

### How onTrigger works

Strudel's scheduler fires `onTrigger(hap, deadline, duration)` for every sound event. The `hap` (happening) object contains:

- `hap.value` -- `{ note, s, lpf, room, gain, ... }` all control parameters
- `hap.whole` -- `{ begin, end }` time span in cycles
- `hap.part` -- the portion of the event visible in the current query window

PatternBridge registers a custom `onTrigger` wrapper that:
1. Lets the default WebAudio output handle sound generation
2. Extracts `hap.value.note` for `patternNote`
3. Computes `cycle` from `hap.whole.begin % 1`
4. Increments an onset counter (decayed each frame in rAF loop)
5. Tracks events-per-cycle for `density`

## 5. StrudelAnalyser

Replaces the current Tone.js-based Analyser. Uses raw Web Audio API nodes.

### Responsibilities

- Create `AnalyserNode` (FFT) and gain-based envelope tracker on Strudel's `AudioContext`
- Connect to the audio context's destination via a splitter node
- Run 60fps rAF loop extracting FFT bands and envelope
- Push to store via `setAnalysis(bands, envelope)`

### API

```typescript
class StrudelAnalyser {
  constructor(audioContext: AudioContext)
  connectToOutput(destination: AudioNode): void
  startLoop(): void
  stopLoop(): void
  dispose(): void
}
```

### Implementation

Uses native `AnalyserNode` with `fftSize: 1024` and `getFloatFrequencyData()`. The existing `reduceToBands()` and `dbToNormalized()` utility functions are kept unchanged -- they operate on raw Float32Arrays and have no Tone.js dependency.

## 6. HydraEngine Expansion

The chain builder must support hydra-native patterns from the community gallery. The current builder only handles linear `source -> transform -> transform -> out` chains.

### New capabilities needed

1. **Feedback references** -- `src(o0)` to read the previous frame's output
2. **Blend with feedback** -- `.blend(o0, 0.94)` for trail effects
3. **Diff with feedback** -- `.diff(o0)` for edge detection
4. **Source as modulator** -- `.modulate(noise(3), 0.1)` where the modulator is a hydra source, not a number
5. **Multi-step source composition** -- `osc(60).diff(osc(60).rotate(Math.PI/2))` where transforms take source chains as arguments

### Expanded HydraChainConfig

```typescript
interface HydraChainConfig {
  source: ChainNode
  transforms: TransformNode[]
  output: string  // 'o0'
}

interface ChainNode {
  fn: string                              // 'osc', 'noise', 'voronoi', 'shape', 'src'
  args: (number | string | ChainNode)[]   // args can be nested source chains
}

interface TransformNode {
  fn: string                              // 'blend', 'diff', 'modulate', 'kaleid', etc.
  args: (number | string | ChainNode)[]   // can reference o0, nested sources, or params
}
```

The key change is that `args` can now contain `ChainNode` objects (nested source chains) in addition to numbers and string parameter references. The chain builder recursively evaluates nested chains before passing them as arguments.

### Feedback handling

`src(o0)` is represented as `{ fn: 'src', args: ['o0'] }`. The builder resolves `'o0'` to the actual hydra output buffer object `synth.o0`. This enables all feedback-based techniques:

```typescript
// blend(o0, 0.94) for trails
{ fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.94] }

// diff(o0) for edge detection
{ fn: 'diff', args: [{ fn: 'src', args: ['o0'] }] }

// modulate(noise(3), 0.1)
{ fn: 'modulate', args: [{ fn: 'noise', args: [3] }, 0.1] }
```

## 7. Preset Format

### New type definition

```typescript
interface Preset {
  name: string
  audio: {
    pattern: string          // Strudel code string
    keyboard: {
      s: string              // synth for keyboard notes (e.g., 'sine', 'sawtooth')
      effects: string        // effect chain expression (e.g., '.lpf(tone * 4000 + 200).room(space * 0.8)')
    }
    macros: {
      tone: number           // 0-1, default 0.5
      space: number          // 0-1, default 0.3
      intensity: number      // 0-1, default 0.5
    }
  }
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

### Migration

The PresetManager detects old-format presets (presence of `synthType` key) and clears them, loading new defaults. localStorage is reset on first load with new format.

## 8. Visual Presets (Hydra-Native)

All 6 presets redesigned using hydra's built-in functions and community techniques. Custom GLSL shaders (CustomShaders.ts) are deleted entirely.

### void -- Drifting filaments

**Inspiration:** Ritchse "disintegration" -- edge detection feedback
**Technique:** `diff(o0)` creates filament-like edges, `blend(o0, 0.94)` for long trails

```
source: osc(60, -0.015, 0.3)
transforms:
  diff(osc(60, 0.08).rotate(PI/2))        -- cross-hatch edge detection
  modulate(noise(3.5, 0.25), 0.15)         -- organic warping
  blend(o0, 0.94)                           -- feedback trails
  brightness(-0.05)
  scale(drift.scale)                        -- envelope-mapped zoom
```

**Mappings:** envelope -> drift.scale [0.98, 1.02]

### ritual -- Fractal symmetry

**Inspiration:** Olivia Jack kaleid spiral -- feedback + kaleidoscope
**Technique:** `kaleid()` for symmetry, `blend(o0)` for spiral trails

```
source: osc(40, 0.03, 1.7)
transforms:
  kaleid(kaleid.sides)                      -- velocity-controlled symmetry
  mult(osc(40, 0.001, 0).rotate(1.58))     -- cross pattern
  blend(o0, 0.92)                           -- spiral feedback
  modulateScale(osc(10, 0), -0.03)         -- breathing
  scale(0.8)
  rotate(0.1, 0.5)
```

**Mappings:** noteVelocity -> kaleid.sides [3, 12], fft[0] -> osc frequency offset

### signal -- Network moire

**Inspiration:** Olivia Jack "moire" -- high-frequency line interference
**Technique:** High-freq `osc(200)` + `kaleid(200)` for fine line patterns

```
source: osc(200, 0)
transforms:
  kaleid(200)
  scale(1, 0.4)
  scrollX(0.1, signal.scroll)              -- sequencer-driven scroll
  mult(osc(200, 0).kaleid(200).scale(1, 0.4))  -- moire interference
  rotate(0.2, 1)
```

**Mappings:** fft[3] -> signal.scroll [0.001, 0.05], cycle -> rotation speed

### ember -- Organic cells

**Inspiration:** Rangga "Monochrome Memoar" -- voronoi cell smearing
**Technique:** `voronoi` + `luma()` for monochrome cells, quadruple `blend` for smearing

```
source: voronoi(50, 1)
transforms:
  luma(0.5)
  modulate(osc(-1000, -1).modulate(osc().luma()), ember.mod)
  blend(o0)
  blend(o0)
  blend(o0)
  brightness(0.05)
  scale(1.01)
```

**Mappings:** envelope -> ember.mod [0.01, 0.1], mouse.x -> voronoi speed

### cosmos -- Organic web

**Inspiration:** Ritchse "trying to get closer" -- noise-warped organic structures
**Technique:** Dual oscillators + noise modulation + feedback for web-like structures

```
source: osc(60, -0.015, 0.3)
transforms:
  diff(osc(60, 0.08).rotate(PI/2))
  modulateScale(noise(3.5, 0.25).modulateScale(osc(15).rotate(sin(time/2))), 0.6)
  invert()
  brightness(0.1)
  contrast(1.2)
  blend(o0, 0.92)
  scale(0.999)
```

**Mappings:** fft[1] -> noise speed, mouse.y -> rotation

### mask -- Grid with feedback

**Inspiration:** eerie_ear "LINES" -- repeated shapes with feedback
**Technique:** `shape(4)` thin edges repeated in grid, feedback via `modulate(o0)`

```
source: shape(4, 0.25, 0.009)
transforms:
  rotate(time * -0.025)
  repeat(mask.grid, mask.grid)
  modulate(o0, 0.1)
  blend(o0, 0.9)
  brightness(-0.05)
```

**Mappings:** noteFrequency -> mask.grid [4, 12], fft[2] -> modulate amount

## 9. UI Changes

### Simple mode

No visible changes from the user's perspective:
- Preset pills at top
- Macro sliders: Tone, Space, Intensity (replace individual synth type + effect controls)
- Visual group selector
- BPM slider + play/stop

Under the hood, macro sliders set `tone`/`space`/`intensity` variables that Strudel evaluates.

### Pro mode

Replace the AudioPanel (synth selector, envelope sliders, effect toggles) with:

1. **PatternEditor** (new component) -- a code editor showing the Strudel pattern string
   - Syntax highlighting (basic: strings, numbers, function names)
   - Ctrl+Enter to evaluate
   - Ctrl+. to stop
   - Monospace font, dark theme consistent with existing UI
   - Collapsible section header: "PATTERN"

2. **Macro sliders** -- Tone, Space, Intensity (same as simple mode)

3. **Existing panels kept:** Visual Chain, Mappings (now with new source options)

### PatternEditor component

```typescript
interface PatternEditorProps {
  code: string
  onChange: (code: string) => void
  onEvaluate: () => void
  onStop: () => void
  isPlaying: boolean
}
```

A textarea-based editor with keyboard shortcuts. Not a full CodeMirror -- keep it minimal. Syntax highlighting via simple regex-based span coloring (strings green, numbers orange, function names blue).

## 10. State Changes (Zustand Store)

### Removed state

```
synthType, synthParams          -- replaced by pattern code
effects[]                       -- Strudel handles effects in code
sequencer.pattern/subdivision   -- Strudel patterns replace this
```

### New state

```
patternCode: string             -- current Strudel code
patternPlaying: boolean         -- is the pattern evaluating
macros: { tone, space, intensity }  -- macro values (0-1)
cycle: number                   -- current cycle position (0-1)
density: number                 -- pattern density (0-1)
onset: number                   -- onset impulse (decays to 0)
patternNote: number             -- last pattern note frequency (0-1)
```

### Kept state (unchanged)

```
analysis: { fftBands, envelope }
noteVelocity, noteFrequency
mouse: { x, y }
octave
mappings[]
currentPreset
activeSlot
panelOpen, uiMode
```

## 11. What We Don't Build (YAGNI)

- No sample loading UI (use built-in Strudel synths and sample banks)
- No multi-pattern layers (one pattern + keyboard)
- No collaborative/shared patterns
- No MIDI input
- No microphone input (can be re-added later)
- No undo/redo in pattern editor
- No pattern visualization/timeline

## 12. Risks and Mitigations

### Bundle size
**Risk:** `@strudel/web` may significantly increase the JS bundle.
**Mitigation:** Check the package size before committing. If too large, lazy-load via dynamic import after the start overlay click.

### Strudel API stability
**Risk:** `@strudel/web` is relatively new. API may change.
**Mitigation:** Pin to a specific version. Wrap all Strudel calls in StrudelEngine so changes are localized.

### Audio latency
**Risk:** Strudel's scheduler may introduce different latency characteristics than direct Tone.js note triggering.
**Mitigation:** Test keyboard responsiveness early. Strudel uses the same Web Audio API scheduling under the hood, so latency should be comparable.

### HydraChainConfig complexity
**Risk:** The expanded chain config with nested sources is significantly more complex to build and debug.
**Mitigation:** Build incrementally: start with simple chains, add feedback, then nested sources. Each preset tests a specific capability.

### Pattern errors
**Risk:** Users editing Strudel code in pro mode may write invalid patterns.
**Mitigation:** Wrap `eval` in try/catch. Show error inline in the editor. Invalid code doesn't stop the previous working pattern.

## 13. Testing Strategy

- Unit tests for PatternBridge (mock onTrigger events, verify store updates)
- Unit tests for StrudelAnalyser (mock AnalyserNode, verify band reduction)
- Unit tests for new HydraChainConfig builder (verify nested source resolution)
- Integration test: preset load -> pattern plays -> analyser receives data
- Manual browser testing: all 6 presets produce sound and visuals
- Manual testing: keyboard notes work alongside running patterns
- Manual testing: macro sliders affect sound in real-time
