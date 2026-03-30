# UX Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken sliders, add music controls, and replace the blocking intro with interactive hints.

**Architecture:** Three independent layers applied sequentially to the existing React/Zustand app. Layer 1 fixes bugs in the visual transform bridge and removes dead UI. Layer 2 adds synth/octave controls and renames abstract macros. Layer 3 replaces IntroGuide with a non-blocking action-triggered InteractiveIntro.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Tailwind 4, hydra-synth, @strudel/web

**Spec:** `docs/superpowers/specs/2026-03-31-ux-audit-fixes-design.md`

---

## File Structure

### Modified Files
- `src/App.tsx` -- Transform bridge constants, offset handling, visual group removal, rhythm/synth/octave/intro wiring
- `src/ui/VisualPanel.tsx` -- Remove deleted sources, add missing transforms, render mapped indicators
- `src/ui/SimplePanel.tsx` -- Remove visual groups + rhythm, rename macros, add synth/octave
- `src/ui/ControlPanel.tsx` -- Add shared rhythm section, synth/octave in pro mode, rename macros
- `src/state/store.ts` -- Add `synthType` + `setSynthType`

### New Files
- `src/ui/widgets/OctaveControl.tsx` -- Shared octave +/- display widget
- `src/ui/InteractiveIntro.tsx` -- Non-blocking action-triggered intro (replaces IntroGuide)

### Deleted Files
- `src/ui/IntroGuide.tsx` -- Replaced by InteractiveIntro

---

## Task 1: Remove deleted shader sources from VisualPanel

**Files:**
- Modify: `src/ui/VisualPanel.tsx:21-98`

- [ ] **Step 1: Remove deleted SOURCE_OPTIONS entries**

In `src/ui/VisualPanel.tsx`, replace the SOURCE_OPTIONS array:

```typescript
const SOURCE_OPTIONS = [
  { value: 'osc', label: 'osc' },
  { value: 'noise', label: 'noise' },
  { value: 'voronoi', label: 'voronoi' },
  { value: 'shape', label: 'shape' },
  { value: 'gradient', label: 'gradient' },
  { value: 'solid', label: 'solid' },
  { value: 'src', label: 'src' },
]
```

- [ ] **Step 2: Remove deleted SOURCE_PARAMS entries**

In `src/ui/VisualPanel.tsx`, delete the following keys from `SOURCE_PARAMS`: `sacredGeometry`, `tribalMask`, `particleField`, `voidPulse`, `ritualFire`, `paisleyFlow`. Keep: `osc`, `noise`, `voronoi`, `shape`, `gradient`, `solid`.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/ui/VisualPanel.tsx
git commit -m "fix: remove deleted shader sources from VisualPanel dropdown"
```

---

## Task 2: Fix transform offset handling + add missing transforms

**Files:**
- Modify: `src/App.tsx:26-117` (constants + conversion functions)
- Modify: `src/ui/VisualPanel.tsx:36-110` (TRANSFORM_OPTIONS, TRANSFORM_PARAMS)

- [ ] **Step 1: Add TRANSFORM_SOURCE_COUNT and update conversion functions in App.tsx**

After the existing `TRANSFORM_ARG_DEFAULTS` block (~line 62), add:

```typescript
const TRANSFORM_SOURCE_COUNT: Record<string, number> = {
  diff: 1,
  blend: 1,
  mult: 1,
  modulate: 1,
  modulateScale: 1,
}
```

Update `positionalToNamed` to accept an offset parameter:

```typescript
function positionalToNamed(
  fn: string,
  args: ChainArg[],
  keyMap: Record<string, string[]>,
  argOffset = 0
): Record<string, number> {
  const keys = keyMap[fn] ?? []
  const result: Record<string, number> = {}
  keys.forEach((key, i) => {
    const val = args[i + argOffset]
    result[key] = typeof val === 'number' ? val : 0
  })
  return result
}
```

Update `namedToPositional` to accept and use offset:

```typescript
function namedToPositional(
  fn: string,
  named: Record<string, number>,
  original: ChainArg[],
  keyMap: Record<string, string[]>,
  argOffset = 0
): ChainArg[] {
  const keys = keyMap[fn] ?? []
  const result = original.slice(0, argOffset)
  keys.forEach((key, i) => {
    const origVal = original[i + argOffset]
    if (typeof origVal === 'string' || (typeof origVal === 'object' && origVal !== null)) {
      result.push(origVal)
    } else {
      result.push(named[key] ?? (typeof origVal === 'number' ? origVal : 0))
    }
  })
  return result
}
```

Update `chainToVisualUI` to pass offset for transforms:

```typescript
function chainToVisualUI(chain: HydraChainConfig): {
  source: string
  sourceArgs: Record<string, number>
  transforms: VisualTransformUI[]
} {
  return {
    source: chain.source.fn,
    sourceArgs: positionalToNamed(chain.source.fn, chain.source.args, SOURCE_ARG_KEYS),
    transforms: chain.transforms.map((t) => ({
      fn: t.fn,
      args: positionalToNamed(t.fn, t.args, TRANSFORM_ARG_KEYS, TRANSFORM_SOURCE_COUNT[t.fn] ?? 0),
    })),
  }
}
```

Update `rebuildChain` to pass offset:

```typescript
const rebuildChain = useCallback(
  (
    source: string,
    sourceArgs: Record<string, number>,
    transforms: VisualTransformUI[]
  ) => {
    const newChain: HydraChainConfig = {
      source: {
        fn: source,
        args: namedToPositional(
          source,
          sourceArgs,
          chainRef.current.source.fn === source ? chainRef.current.source.args : [],
          SOURCE_ARG_KEYS
        ),
      },
      transforms: transforms.map((t, i) => {
        const existingTransform = chainRef.current.transforms[i]
        const offset = TRANSFORM_SOURCE_COUNT[t.fn] ?? 0
        return {
          fn: t.fn,
          args: namedToPositional(
            t.fn,
            t.args,
            existingTransform?.fn === t.fn ? existingTransform.args : [],
            TRANSFORM_ARG_KEYS,
            offset
          ),
        }
      }),
      output: chainRef.current.output,
    }
    chainRef.current = newChain
    hydraEngineRef.current?.buildChain(newChain)
  },
  []
)
```

- [ ] **Step 2: Add missing transforms to TRANSFORM_ARG_KEYS and TRANSFORM_ARG_DEFAULTS in App.tsx**

Update `TRANSFORM_ARG_KEYS`:

```typescript
const TRANSFORM_ARG_KEYS: Record<string, string[]> = {
  rotate: ['angle'],
  scale: ['amount'],
  kaleid: ['nSides'],
  pixelate: ['x'],
  colorama: ['amount'],
  hue: ['amount'],
  brightness: ['amount'],
  modulate: ['amount'],
  color: ['r', 'g', 'b'],
  diff: [],
  blend: ['amount'],
  mult: [],
  modulateScale: ['multiple'],
  luma: ['threshold', 'tolerance'],
  scrollX: ['scrollX', 'speed'],
  repeat: ['repeatX', 'repeatY'],
  invert: ['amount'],
  contrast: ['amount'],
}
```

Update `TRANSFORM_ARG_DEFAULTS`:

```typescript
const TRANSFORM_ARG_DEFAULTS: Record<string, Record<string, number>> = {
  rotate: { angle: 0 },
  scale: { amount: 1 },
  kaleid: { nSides: 4 },
  pixelate: { x: 20 },
  colorama: { amount: 0.005 },
  hue: { amount: 0 },
  brightness: { amount: 0 },
  modulate: { amount: 0.1 },
  diff: {},
  blend: { amount: 0.5 },
  mult: {},
  modulateScale: { multiple: 1 },
  luma: { threshold: 0.5, tolerance: 0.1 },
  scrollX: { scrollX: 0.5, speed: 0 },
  repeat: { repeatX: 3, repeatY: 3 },
  invert: { amount: 1 },
  contrast: { amount: 1.5 },
}
```

- [ ] **Step 3: Add missing transforms to VisualPanel.tsx**

Update `TRANSFORM_OPTIONS`:

```typescript
const TRANSFORM_OPTIONS = [
  { value: 'rotate', label: 'rotate' },
  { value: 'scale', label: 'scale' },
  { value: 'kaleid', label: 'kaleid' },
  { value: 'pixelate', label: 'pixelate' },
  { value: 'colorama', label: 'colorama' },
  { value: 'hue', label: 'hue' },
  { value: 'brightness', label: 'brightness' },
  { value: 'luma', label: 'luma' },
  { value: 'scrollX', label: 'scrollX' },
  { value: 'repeat', label: 'repeat' },
  { value: 'invert', label: 'invert' },
  { value: 'contrast', label: 'contrast' },
]
```

Note: `diff`, `mult`, `blend`, `modulate`, `modulateScale` excluded from the "add" dropdown since they require a ChainNode source arg. They still appear in the transform list when loaded from presets.

Add to `TRANSFORM_PARAMS`:

```typescript
const TRANSFORM_PARAMS: Record<string, { key: string; label: string; min: number; max: number; step: number }[]> = {
  rotate: [{ key: 'angle', label: 'Angle', min: -6.28, max: 6.28, step: 0.01 }],
  scale: [{ key: 'amount', label: 'Amount', min: 0, max: 4, step: 0.01 }],
  kaleid: [{ key: 'nSides', label: 'Sides', min: 2, max: 12, step: 1 }],
  pixelate: [{ key: 'x', label: 'X', min: 1, max: 100, step: 1 }],
  colorama: [{ key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01 }],
  hue: [{ key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01 }],
  brightness: [{ key: 'amount', label: 'Amount', min: -1, max: 2, step: 0.01 }],
  modulate: [{ key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01 }],
  diff: [],
  blend: [{ key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01 }],
  mult: [],
  modulateScale: [{ key: 'multiple', label: 'Multiple', min: -1, max: 2, step: 0.01 }],
  luma: [
    { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.01 },
    { key: 'tolerance', label: 'Tolerance', min: 0, max: 1, step: 0.01 },
  ],
  scrollX: [
    { key: 'scrollX', label: 'Amount', min: -1, max: 1, step: 0.01 },
    { key: 'speed', label: 'Speed', min: -1, max: 1, step: 0.01 },
  ],
  repeat: [
    { key: 'repeatX', label: 'X', min: 1, max: 20, step: 1 },
    { key: 'repeatY', label: 'Y', min: 1, max: 20, step: 1 },
  ],
  invert: [{ key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01 }],
  contrast: [{ key: 'amount', label: 'Amount', min: 0, max: 4, step: 0.01 }],
}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/ui/VisualPanel.tsx
git commit -m "fix: add missing transforms and fix source-arg offset in bridge"
```

---

## Task 3: Show mapped indicators for string args in VisualPanel

**Files:**
- Modify: `src/App.tsx` (VisualTransformUI type, chainToVisualUI)
- Modify: `src/ui/VisualPanel.tsx` (Transform interface, render logic)

- [ ] **Step 1: Add mappedTargets to VisualTransformUI in App.tsx**

Update the interface:

```typescript
interface VisualTransformUI {
  fn: string
  args: Record<string, number>
  mappedTargets: Record<string, string>
}
```

Update `chainToVisualUI` to populate mappedTargets:

```typescript
function chainToVisualUI(chain: HydraChainConfig): {
  source: string
  sourceArgs: Record<string, number>
  transforms: VisualTransformUI[]
} {
  return {
    source: chain.source.fn,
    sourceArgs: positionalToNamed(chain.source.fn, chain.source.args, SOURCE_ARG_KEYS),
    transforms: chain.transforms.map((t) => {
      const keys = TRANSFORM_ARG_KEYS[t.fn] ?? []
      const offset = TRANSFORM_SOURCE_COUNT[t.fn] ?? 0
      const mappedTargets: Record<string, string> = {}
      keys.forEach((key, i) => {
        const arg = t.args[i + offset]
        if (typeof arg === 'string') {
          mappedTargets[key] = arg
        }
      })
      return {
        fn: t.fn,
        args: positionalToNamed(t.fn, t.args, TRANSFORM_ARG_KEYS, TRANSFORM_SOURCE_COUNT[t.fn] ?? 0),
        mappedTargets,
      }
    }),
  }
}
```

Update `setVisualTransforms` call in `handleAddTransform` to include empty mappedTargets:

```typescript
const handleAddTransform = useCallback(
  (fn: string) => {
    setVisualTransforms((prev) => {
      const next = [...prev, { fn, args: { ...(TRANSFORM_ARG_DEFAULTS[fn] ?? {}) }, mappedTargets: {} }]
      rebuildChain(visualSource, visualSourceArgs, next)
      return next
    })
  },
  [visualSource, visualSourceArgs, rebuildChain]
)
```

Also update `handleTransformArgChange` to preserve mappedTargets:

```typescript
const handleTransformArgChange = useCallback(
  (index: number, key: string, value: number) => {
    setVisualTransforms((prev) => {
      const next = prev.map((t, i) =>
        i === index ? { ...t, args: { ...t.args, [key]: value } } : t
      )
      rebuildChain(visualSource, visualSourceArgs, next)
      return next
    })
  },
  [visualSource, visualSourceArgs, rebuildChain]
)
```

(This already works since spread preserves `mappedTargets`.)

- [ ] **Step 2: Update VisualPanel Transform interface and render mapped indicators**

Update the interface in `src/ui/VisualPanel.tsx`:

```typescript
interface Transform {
  fn: string
  args: Record<string, number>
  mappedTargets?: Record<string, string>
}
```

In the transform rendering section, replace the `tParams.map` block with:

```typescript
{tParams.map((param) => {
  const mappedTarget = transform.mappedTargets?.[param.key]
  if (mappedTarget) {
    return (
      <div
        key={param.key}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#cccccc',
            fontFamily: 'sans-serif',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {param.label}
        </span>
        <span
          style={{
            padding: '2px 8px',
            backgroundColor: 'rgba(136,144,160,0.2)',
            borderRadius: '3px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#8890A0',
            whiteSpace: 'nowrap',
          }}
        >
          mapped: {mappedTarget}
        </span>
      </div>
    )
  }
  return (
    <Slider
      key={param.key}
      label={param.label}
      value={transform.args[param.key] ?? 0}
      min={param.min}
      max={param.max}
      step={param.step}
      onChange={(v) => onTransformArgChange(i, param.key, v)}
      accentColor="#B0B8C4"
    />
  )
})}
```

Note: The variable `i` comes from the outer `transforms.map((transform, i) => ...)` -- ensure this variable name is consistent with the existing code.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/ui/VisualPanel.tsx
git commit -m "fix: show mapped indicators instead of broken sliders for string args"
```

---

## Task 4: Remove visual group pills from SimplePanel

**Files:**
- Modify: `src/ui/SimplePanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Remove visual group props and UI from SimplePanel**

Update the `SimplePanelProps` interface to remove visual group and intensity:

```typescript
interface SimplePanelProps {
  presetNames: string[]
  activePresetIndex: number
  onPresetSelect: (index: number) => void
  tone: number
  onToneChange: (value: number) => void
  space: number
  onSpaceChange: (value: number) => void
  bpm: number
  onBpmChange: (bpm: number) => void
  patternPlaying: boolean
  onTogglePattern: () => void
}
```

Remove `VISUAL_GROUP_OPTIONS` constant.

Update the component function signature to remove: `visualGroup`, `onVisualGroupChange`, `intensity`, `onIntensityChange`.

Remove the entire "Visuals" section `<div>` (the one containing the visual group `PillSelector` and Intensity slider).

- [ ] **Step 2: Remove visual group state and handlers from App.tsx**

Remove state: `const [visualGroup, setVisualGroup] = useState('Geometry')`

Remove constant: `VISUAL_GROUP_TO_SOURCE`

Remove handler: `handleVisualGroupChange`

Update the SimplePanel JSX to remove the deleted props:

```typescript
<SimplePanel
  presetNames={presetSlots.map((name, i) => name ?? `Slot ${i + 1}`)}
  activePresetIndex={activeSlot}
  onPresetSelect={handlePresetSelect}
  tone={macros.tone}
  onToneChange={(v) => handleMacroChange('tone', v)}
  space={macros.space}
  onSpaceChange={(v) => handleMacroChange('space', v)}
  bpm={bpm}
  onBpmChange={handleBpmChange}
  patternPlaying={patternPlaying}
  onTogglePattern={handleTogglePattern}
/>
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/ui/SimplePanel.tsx src/App.tsx
git commit -m "fix: remove broken visual group pills from SimplePanel"
```

---

## Task 5: Move rhythm section to ControlPanel shell

**Files:**
- Modify: `src/ui/ControlPanel.tsx`
- Modify: `src/ui/SimplePanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add rhythm props to ControlPanel and render shared rhythm section**

Update `ControlPanelProps` in `src/ui/ControlPanel.tsx`:

```typescript
interface ControlPanelProps {
  open: boolean
  uiMode: 'simple' | 'pro'
  onToggleMode: () => void
  children: ReactNode
  patternCode?: string
  onPatternChange?: (code: string) => void
  onEvaluatePattern?: () => void
  onStopPattern?: () => void
  patternPlaying?: boolean
  patternError?: string | null
  macros?: { tone: number; space: number; intensity: number }
  onMacroChange?: (name: 'tone' | 'space' | 'intensity', value: number) => void
  bpm?: number
  onBpmChange?: (bpm: number) => void
  onTogglePattern?: () => void
}
```

Add the rhythm section to the render, AFTER the mode toggle button and BEFORE `{showPatternEditor && ...}`:

```typescript
{bpm !== undefined && onBpmChange && patternPlaying !== undefined && onTogglePattern && (
  <div style={{ marginBottom: '16px' }}>
    <p style={sectionHeaderStyle}>Rhythm</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button
        onClick={onTogglePattern}
        tabIndex={-1}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: patternPlaying ? '#B0B8C4' : 'rgba(255,255,255,0.06)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: patternPlaying ? '#0a0a0f' : '#999999',
          transition: 'background-color 150ms',
          flexShrink: 0,
        }}
      >
        {patternPlaying ? '\u25a0' : '\u25b6'}
      </button>
      <div style={{ flex: 1 }}>
        <Slider label="BPM" value={bpm} min={60} max={200} step={1} accentColor="#B0B8C4" onChange={onBpmChange} />
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Remove rhythm section from SimplePanel**

In `src/ui/SimplePanel.tsx`, remove `bpm`, `onBpmChange`, `patternPlaying`, `onTogglePattern` from props interface and function parameters. Remove the entire "Rhythm" `<div>` section.

- [ ] **Step 3: Pass rhythm props to ControlPanel in App.tsx**

Update the `<ControlPanel>` JSX in App.tsx to pass the new props:

```typescript
<ControlPanel
  open={panelOpen}
  uiMode={uiMode}
  onToggleMode={handleToggleMode}
  patternCode={patternCode}
  onPatternChange={handlePatternChange}
  onEvaluatePattern={handleEvaluatePattern}
  onStopPattern={handleStopPattern}
  patternPlaying={patternPlaying}
  patternError={patternError}
  macros={macros}
  onMacroChange={handleMacroChange}
  bpm={bpm}
  onBpmChange={handleBpmChange}
  onTogglePattern={handleTogglePattern}
>
```

Remove `bpm`, `onBpmChange`, `patternPlaying`, `onTogglePattern` from the SimplePanel JSX since they're no longer props.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/ui/ControlPanel.tsx src/ui/SimplePanel.tsx src/App.tsx
git commit -m "fix: move rhythm controls to ControlPanel shell for both modes"
```

---

## Task 6: Add synthType to store and create OctaveControl widget

**Files:**
- Modify: `src/state/store.ts`
- Create: `src/ui/widgets/OctaveControl.tsx`

- [ ] **Step 1: Write store test for synthType**

In `src/state/__tests__/store.test.ts`, add (at end of file):

```typescript
describe('synthType', () => {
  it('defaults to sine', () => {
    const state = useAppStore.getState()
    expect(state.synthType).toBe('sine')
  })

  it('setSynthType updates the value', () => {
    useAppStore.getState().setSynthType('triangle')
    expect(useAppStore.getState().synthType).toBe('triangle')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/__tests__/store.test.ts --reporter=verbose`
Expected: FAIL -- `synthType` and `setSynthType` do not exist on state

- [ ] **Step 3: Add synthType to store**

In `src/state/store.ts`, add to the `AppState` interface:

```typescript
synthType: string
setSynthType: (type: string) => void
```

Add to `initialState`:

```typescript
synthType: 'sine',
```

Add to the create block:

```typescript
setSynthType: (type) => set({ synthType: type }),
```

Add to `getInitialState`:

```typescript
synthType: 'sine',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/__tests__/store.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Create OctaveControl widget**

Create `src/ui/widgets/OctaveControl.tsx`:

```typescript
interface OctaveControlProps {
  octave: number
  onChange: (octave: number) => void
  accentColor?: string
}

export function OctaveControl({ octave, onChange, accentColor = '#B0B8C4' }: OctaveControlProps) {
  const btnStyle: React.CSSProperties = {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: 'none',
    cursor: 'pointer',
    color: accentColor,
    fontSize: '13px',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <span
        className="shrink-0"
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#cccccc',
          fontFamily: 'sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        Octave
      </span>
      <div className="flex-1" />
      <button onClick={() => onChange(octave - 1)} style={btnStyle} tabIndex={-1}>
        -
      </button>
      <span
        style={{
          fontSize: '13px',
          fontFamily: 'monospace',
          color: accentColor,
          minWidth: '24px',
          textAlign: 'center',
        }}
      >
        {octave}
      </span>
      <button onClick={() => onChange(octave + 1)} style={btnStyle} tabIndex={-1}>
        +
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/state/store.ts src/state/__tests__/store.test.ts src/ui/widgets/OctaveControl.tsx
git commit -m "feat: add synthType to store and OctaveControl widget"
```

---

## Task 7: Rename macros and add synth/octave to SimplePanel

**Files:**
- Modify: `src/ui/SimplePanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update SimplePanel with new props and layout**

Replace the full `SimplePanel` component in `src/ui/SimplePanel.tsx`:

```typescript
import { PillSelector } from './widgets/PillSelector'
import { Slider } from './widgets/Slider'
import { OctaveControl } from './widgets/OctaveControl'

interface SimplePanelProps {
  presetNames: string[]
  activePresetIndex: number
  onPresetSelect: (index: number) => void
  synthType: string
  onSynthTypeChange: (type: string) => void
  octave: number
  onOctaveChange: (octave: number) => void
  tone: number
  onToneChange: (value: number) => void
  space: number
  onSpaceChange: (value: number) => void
  intensity: number
  onIntensityChange: (value: number) => void
}

const SYNTH_OPTIONS = [
  { value: 'sine', label: 'sine' },
  { value: 'triangle', label: 'tri' },
  { value: 'square', label: 'square' },
  { value: 'sawtooth', label: 'saw' },
]

const sectionStyle = (color: string): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color,
  fontFamily: 'sans-serif',
  margin: '0 0 10px 0',
})

export function SimplePanel({
  presetNames,
  activePresetIndex,
  onPresetSelect,
  synthType,
  onSynthTypeChange,
  octave,
  onOctaveChange,
  tone,
  onToneChange,
  space,
  onSpaceChange,
  intensity,
  onIntensityChange,
}: SimplePanelProps) {
  const presetPills = presetNames.map((name, i) => ({
    value: String(i),
    label: name || `Slot ${i + 1}`,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <PillSelector
          options={presetPills}
          value={String(activePresetIndex)}
          accentColor="#B0B8C4"
          onChange={(v) => onPresetSelect(parseInt(v, 10))}
        />
      </div>

      <div>
        <p style={sectionStyle('#B0B8C4')}>Sound</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <PillSelector
            options={SYNTH_OPTIONS}
            value={synthType}
            accentColor="#B0B8C4"
            onChange={onSynthTypeChange}
          />
          <OctaveControl octave={octave} onChange={onOctaveChange} accentColor="#B0B8C4" />
          <Slider label="Filter" value={tone} min={0} max={1} step={0.01} accentColor="#B0B8C4" onChange={onToneChange} />
          <Slider label="Reverb" value={space} min={0} max={1} step={0.01} accentColor="#B0B8C4" onChange={onSpaceChange} />
          <Slider label="Volume" value={intensity} min={0} max={1} step={0.01} accentColor="#B0B8C4" onChange={onIntensityChange} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Pass new props from App.tsx**

Add store selectors in App.tsx:

```typescript
const synthType = useAppStore((s) => s.synthType)
const octave = useAppStore((s) => s.octave)
```

Add handlers:

```typescript
const handleSynthTypeChange = useCallback((type: string) => {
  useAppStore.getState().setSynthType(type)
  const engine = strudelEngineRef.current
  if (engine) {
    const currentEffects = currentPresetRef.current?.audio.keyboard.effects ?? ''
    engine.setKeyboardConfig({ s: type, effects: currentEffects })
  }
}, [])

const handleOctaveChange = useCallback((oct: number) => {
  useAppStore.getState().setOctave(oct)
}, [])
```

Update the SimplePanel JSX:

```typescript
<SimplePanel
  presetNames={presetSlots.map((name, i) => name ?? `Slot ${i + 1}`)}
  activePresetIndex={activeSlot}
  onPresetSelect={handlePresetSelect}
  synthType={synthType}
  onSynthTypeChange={handleSynthTypeChange}
  octave={octave}
  onOctaveChange={handleOctaveChange}
  tone={macros.tone}
  onToneChange={(v) => handleMacroChange('tone', v)}
  space={macros.space}
  onSpaceChange={(v) => handleMacroChange('space', v)}
  intensity={macros.intensity}
  onIntensityChange={(v) => handleMacroChange('intensity', v)}
/>
```

- [ ] **Step 3: Sync synthType on preset load**

In `applyPreset`, after the existing macro sync, add:

```typescript
// Sync synth type from preset keyboard config
store.setSynthType(preset.audio.keyboard.s)
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/ui/SimplePanel.tsx src/App.tsx
git commit -m "feat: add synth selector, octave, rename macros in SimplePanel"
```

---

## Task 8: Add synth/octave and rename macros in ControlPanel pro mode

**Files:**
- Modify: `src/ui/ControlPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update ControlPanel props and render**

Add imports to `src/ui/ControlPanel.tsx`:

```typescript
import { PillSelector } from './widgets/PillSelector'
import { OctaveControl } from './widgets/OctaveControl'
```

Add new props to `ControlPanelProps`:

```typescript
synthType?: string
onSynthTypeChange?: (type: string) => void
octave?: number
onOctaveChange?: (octave: number) => void
```

Add `SYNTH_OPTIONS` constant (same as SimplePanel):

```typescript
const SYNTH_OPTIONS = [
  { value: 'sine', label: 'sine' },
  { value: 'triangle', label: 'tri' },
  { value: 'square', label: 'square' },
  { value: 'sawtooth', label: 'saw' },
]
```

Update the pro mode section. Replace the `{showPatternEditor && (...)}` block:

```typescript
{showPatternEditor && (
  <>
    <PatternEditor
      code={patternCode}
      onChange={onPatternChange}
      onEvaluate={onEvaluatePattern}
      onStop={onStopPattern}
      isPlaying={patternPlaying}
      error={patternError ?? null}
    />
    {synthType !== undefined && onSynthTypeChange && octave !== undefined && onOctaveChange && (
      <div style={{ marginBottom: '16px' }}>
        <p style={sectionHeaderStyle}>Instrument</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <PillSelector
            options={SYNTH_OPTIONS}
            value={synthType}
            accentColor="#B0B8C4"
            onChange={onSynthTypeChange}
          />
          <OctaveControl octave={octave} onChange={onOctaveChange} accentColor="#B0B8C4" />
        </div>
      </div>
    )}
    <div style={{ marginBottom: '16px' }}>
      <p style={sectionHeaderStyle}>MACROS</p>
      <Slider label="Filter" value={macros.tone} onChange={(v) => onMacroChange('tone', v)} min={0} max={1} step={0.01} />
      <Slider label="Reverb" value={macros.space} onChange={(v) => onMacroChange('space', v)} min={0} max={1} step={0.01} />
      <Slider label="Volume" value={macros.intensity} onChange={(v) => onMacroChange('intensity', v)} min={0} max={1} step={0.01} />
    </div>
  </>
)}
```

- [ ] **Step 2: Pass synth/octave props from App.tsx**

Update the `<ControlPanel>` JSX in App.tsx to pass the new props:

```typescript
<ControlPanel
  open={panelOpen}
  uiMode={uiMode}
  onToggleMode={handleToggleMode}
  patternCode={patternCode}
  onPatternChange={handlePatternChange}
  onEvaluatePattern={handleEvaluatePattern}
  onStopPattern={handleStopPattern}
  patternPlaying={patternPlaying}
  patternError={patternError}
  macros={macros}
  onMacroChange={handleMacroChange}
  bpm={bpm}
  onBpmChange={handleBpmChange}
  onTogglePattern={handleTogglePattern}
  synthType={synthType}
  onSynthTypeChange={handleSynthTypeChange}
  octave={octave}
  onOctaveChange={handleOctaveChange}
>
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/ui/ControlPanel.tsx src/App.tsx
git commit -m "feat: add synth/octave controls and rename macros in pro mode"
```

---

## Task 9: Create InteractiveIntro component

**Files:**
- Create: `src/ui/InteractiveIntro.tsx`

- [ ] **Step 1: Create the InteractiveIntro component**

Create `src/ui/InteractiveIntro.tsx`:

```typescript
import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useAppStore } from '../state/store'
import { theme } from './theme'

interface InteractiveIntroProps {
  visible: boolean
  onComplete: () => void
}

export interface InteractiveIntroRef {
  notePlayed: () => void
  presetChanged: () => void
}

const HINT_BASE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 200,
  backgroundColor: 'rgba(10, 10, 15, 0.88)',
  border: `1px solid ${theme.accentVisual}33`,
  borderRadius: '8px',
  padding: '16px 20px',
  maxWidth: '360px',
  width: '90vw',
  color: theme.text,
  fontFamily: "'IBM Plex Mono', monospace",
  userSelect: 'none',
  pointerEvents: 'auto',
}

const SKIP_STYLE: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: theme.textDim,
  cursor: 'pointer',
  fontSize: '10px',
  fontFamily: "'IBM Plex Mono', monospace",
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '4px 0',
}

const KEY_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  backgroundColor: 'rgba(176, 184, 196, 0.15)',
  border: `1px solid ${theme.accentVisual}44`,
  fontSize: '11px',
  fontFamily: 'monospace',
  color: theme.accentVisual,
}

const STEP_POSITIONS: React.CSSProperties[] = [
  { bottom: '80px', left: '50%', transform: 'translateX(-50%)' },
  { bottom: '80px', right: '40px' },
  { top: '80px', left: '50%', transform: 'translateX(-50%)' },
]

const KEYS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D']

export const InteractiveIntro = forwardRef<InteractiveIntroRef, InteractiveIntroProps>(
  function InteractiveIntro({ visible, onComplete }, ref) {
    const [step, setStep] = useState(0)
    const [opacity, setOpacity] = useState(1)

    useEffect(() => {
      if (visible) {
        setStep(0)
        setOpacity(1)
      }
    }, [visible])

    const dismiss = useCallback(() => {
      setOpacity(0)
      setTimeout(onComplete, 400)
    }, [onComplete])

    const advance = useCallback(() => {
      setOpacity(0)
      setTimeout(() => {
        setStep((s) => {
          const next = s + 1
          if (next > 2) {
            onComplete()
            return s
          }
          return next
        })
        setOpacity(1)
      }, 300)
    }, [onComplete])

    useImperativeHandle(ref, () => ({
      notePlayed: () => {
        if (step === 0) advance()
      },
      presetChanged: () => {
        if (step === 2) dismiss()
      },
    }), [step, advance, dismiss])

    // Step 2: auto-advance when panel opens
    useEffect(() => {
      if (!visible || step !== 1) return
      return useAppStore.subscribe(
        (s) => s.ui.panelOpen,
        (open) => { if (open) advance() }
      )
    }, [visible, step, advance])

    // Auto-dismiss timeout per step (15s)
    useEffect(() => {
      if (!visible) return
      const timer = setTimeout(dismiss, 15000)
      return () => clearTimeout(timer)
    }, [visible, step, dismiss])

    if (!visible) return null

    return (
      <div
        style={{
          ...HINT_BASE,
          ...STEP_POSITIONS[step],
          opacity,
          transition: 'opacity 400ms ease',
        }}
      >
        {step === 0 && (
          <>
            <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: 1.6, color: theme.textBright }}>
              Press keys to play notes
            </p>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {KEYS.map((key) => (
                <span key={key} style={KEY_STYLE}>{key}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
              {NOTES.map((note, i) => (
                <span key={i} style={{ width: '24px', textAlign: 'center', fontSize: '9px', color: theme.textDim, fontFamily: 'monospace' }}>
                  {note}
                </span>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: 1.6, color: theme.textBright }}>
            Press <span style={{ ...KEY_STYLE, display: 'inline-flex', width: 'auto', padding: '0 6px', verticalAlign: 'middle', margin: '0 2px' }}>Tab</span> to open controls
          </p>
        )}

        {step === 2 && (
          <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: 1.6, color: theme.textBright }}>
            Try presets <span style={{ fontFamily: 'monospace', color: theme.accentVisual }}>1-6</span> on your keyboard
          </p>
        )}

        <button onClick={dismiss} style={SKIP_STYLE}>skip</button>
      </div>
    )
  }
)
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/InteractiveIntro.tsx
git commit -m "feat: create InteractiveIntro component with action-triggered hints"
```

---

## Task 10: Wire InteractiveIntro in App.tsx and delete IntroGuide

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/ui/IntroGuide.tsx`

- [ ] **Step 1: Replace IntroGuide import with InteractiveIntro**

In `src/App.tsx`, replace:

```typescript
import { IntroGuide } from './ui/IntroGuide'
```

with:

```typescript
import { InteractiveIntro, InteractiveIntroRef } from './ui/InteractiveIntro'
```

- [ ] **Step 2: Add introRef and wire callbacks**

Add ref after the other refs:

```typescript
const introRef = useRef<InteractiveIntroRef>(null)
```

In the keyboard handler's `onNoteOn` callback (inside `handleStart`), add `introRef.current?.notePlayed()`:

```typescript
const keyboard = new KeyboardHandler({
  onNoteOn: (note, velocity) => {
    engine.noteOn(note, velocity)
    introRef.current?.notePlayed()
  },
  onNoteOff: (note) => engine.noteOff(note),
  // ... rest unchanged
})
```

In `handlePresetSelect`, add:

```typescript
const handlePresetSelect = useCallback(
  (slotIndex: number) => {
    const pm = presetManagerRef.current
    if (!pm) return
    const preset = pm.loadPreset(slotIndex + 1)
    if (preset) {
      applyPreset(preset)
      setActiveSlot(slotIndex)
      introRef.current?.presetChanged()
    }
  },
  [applyPreset]
)
```

- [ ] **Step 3: Replace IntroGuide JSX with InteractiveIntro**

Replace:

```typescript
<IntroGuide visible={started && showIntro} onComplete={handleIntroDone} />
```

with:

```typescript
<InteractiveIntro ref={introRef} visible={started && showIntro} onComplete={handleIntroDone} />
```

- [ ] **Step 4: Delete IntroGuide.tsx**

```bash
rm src/ui/IntroGuide.tsx
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git rm src/ui/IntroGuide.tsx
git commit -m "feat: wire InteractiveIntro, remove blocking IntroGuide"
```
