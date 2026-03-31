# Audiovisual Fixes and Pro Mode Simplification

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix keyboard note playback, bridge macros to visual reactivity, simplify pro mode UI, open sidebar by default, and improve presets with hydra garden techniques.

**Architecture:** Six independent tasks: (1) fix noteOn to not kill sequencer, (2) add macro mapping sources, (3) sidebar default-open with Tab pill, (4) simplify pro mode collapsibles, (5) add macro-to-visual mappings in presets, (6) garden-inspired visual improvements. Tasks 1-4 are fully independent. Task 5 depends on Task 2. Task 6 depends on Task 5.

**Tech Stack:** TypeScript, React, @strudel/web (superdough), hydra-synth, Zustand, Vitest

---

### Task 1: Fix keyboard note playback

The `noteOn` method in StrudelEngine uses `evaluate(pattern, true)` which replaces the main scheduler pattern, killing the sequencer. Fix: use `evaluate(pattern, false)` so `.play()` runs as a standalone one-shot without disrupting the scheduler. Also lowercase note names for Strudel compatibility.

**Files:**
- Modify: `src/audio/StrudelEngine.ts:95-110`
- Test: `src/audio/__tests__/StrudelEngine.test.ts` (if exists, otherwise skip)

- [ ] **Step 1: Fix noteOn to use evaluate with autoplay=false and lowercase notes**

In `src/audio/StrudelEngine.ts`, replace the `noteOn` method:

```typescript
/**
 * Inject a one-shot note using the current keyboard config synth and effects.
 * Uses evaluate(code, false) so .play() runs standalone without replacing
 * the main scheduler pattern. Note names are lowercased for Strudel compatibility.
 */
noteOn(note: string, vel: number): void {
  this.ensureInitialized()
  this.activeNotes.set(note, true)

  const gain = Math.max(0, Math.min(1, vel))
  const { s, effects } = this.keyboardConfig
  const lowerNote = note.toLowerCase()
  let pattern = `note("${lowerNote}").s("${s}").gain(${gain})`
  if (effects) {
    pattern += `.${effects}`
  }
  pattern += '.play()'

  // autoplay=false: .play() triggers the note independently,
  // without replacing the main sequencer pattern
  this.strudelModule!.evaluate(pattern, false).catch((err: unknown) => {
    console.error('[StrudelEngine] noteOn failed:', err)
  })
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run`
Expected: All existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/audio/StrudelEngine.ts
git commit -m "fix: keyboard notes use standalone playback, don't kill sequencer"
```

---

### Task 2: Add macro mapping sources

Allow `macro.tone`, `macro.space`, and `macro.intensity` as mapping sources so preset mappings can drive visuals from slider values.

**Files:**
- Modify: `src/mapping/MappingTypes.ts:3-17`
- Modify: `src/ui/MappingPanel.tsx:21-39`
- Test: `src/mapping/__tests__/MappingTypes.test.ts`

- [ ] **Step 1: Write test for macro source resolution**

Create or append to `src/mapping/__tests__/MappingTypes.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { resolveSource } from '../MappingTypes'
import { useAppStore, getInitialState } from '../../state/store'

describe('resolveSource', () => {
  beforeEach(() => {
    useAppStore.setState(getInitialState())
  })

  it('resolves macro.tone from store', () => {
    useAppStore.getState().setMacro('tone', 0.7)
    const state = useAppStore.getState()
    expect(resolveSource('macro.tone', state)).toBe(0.7)
  })

  it('resolves macro.space from store', () => {
    useAppStore.getState().setMacro('space', 0.4)
    const state = useAppStore.getState()
    expect(resolveSource('macro.space', state)).toBe(0.4)
  })

  it('resolves macro.intensity from store', () => {
    useAppStore.getState().setMacro('intensity', 0.9)
    const state = useAppStore.getState()
    expect(resolveSource('macro.intensity', state)).toBe(0.9)
  })

  it('resolves envelope from store', () => {
    useAppStore.getState().setAnalysis([0, 0, 0, 0, 0, 0, 0, 0], 0.65)
    const state = useAppStore.getState()
    expect(resolveSource('envelope', state)).toBe(0.65)
  })

  it('resolves fft bands from store', () => {
    useAppStore.getState().setAnalysis([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], 0.5)
    const state = useAppStore.getState()
    expect(resolveSource('fft[2]', state)).toBe(0.3)
  })

  it('returns 0 for unknown source', () => {
    const state = useAppStore.getState()
    expect(resolveSource('nonexistent', state)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/mapping/__tests__/MappingTypes.test.ts`
Expected: macro.tone/space/intensity tests FAIL (resolveSource returns 0 for these).

- [ ] **Step 3: Add macro sources to resolveSource**

In `src/mapping/MappingTypes.ts`, add three cases to the switch in `resolveSource`:

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
    case 'macro.tone': return state.macros.tone
    case 'macro.space': return state.macros.space
    case 'macro.intensity': return state.macros.intensity
    default: return 0
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/mapping/__tests__/MappingTypes.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Add macro sources to MappingPanel dropdown**

In `src/ui/MappingPanel.tsx`, add three entries to `SOURCE_OPTIONS` array after the existing `patternNote` entry:

```typescript
  { value: 'patternNote', label: 'patternNote' },
  { value: 'macro.tone', label: 'macro.tone' },
  { value: 'macro.space', label: 'macro.space' },
  { value: 'macro.intensity', label: 'macro.intensity' },
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/mapping/MappingTypes.ts src/mapping/__tests__/MappingTypes.test.ts src/ui/MappingPanel.tsx
git commit -m "feat: add macro.tone/space/intensity as mapping sources"
```

---

### Task 3: Sidebar open by default + Tab pill

Open the control panel by default. When closed, show a persistent "Tab" pill on the right edge so users know how to reopen it.

**Files:**
- Modify: `src/state/store.ts:96`
- Modify: `src/ui/HUD.tsx`

- [ ] **Step 1: Set panelOpen default to true**

In `src/state/store.ts`, change line 96:

```typescript
  ui: { panelOpen: true, activeSection: 'audio' as UIState['activeSection'] },
```

- [ ] **Step 2: Add persistent Tab pill to HUD**

Replace the entire `src/ui/HUD.tsx` content with:

```typescript
import { useEffect, useState } from 'react'

interface HUDProps {
  bpm: number
  presetName: string
  audioLevel: number
  panelOpen: boolean
  sequencerPlaying: boolean
  uiMode: 'simple' | 'pro'
  onToggleMode: () => void
  onShowHelp: () => void
  onTogglePanel: () => void
}

export function HUD({
  bpm,
  presetName,
  audioLevel,
  panelOpen,
  sequencerPlaying,
  uiMode,
  onToggleMode,
  onShowHelp,
  onTogglePanel,
}: HUDProps) {
  const [hovered, setHovered] = useState(false)

  const modeColor = '#B0B8C4'

  return (
    <>
      {/* Bottom-left info */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          zIndex: 30,
          opacity: panelOpen ? 0 : hovered ? 1 : 0.4,
          transition: 'opacity 300ms ease',
          pointerEvents: panelOpen ? 'none' : 'auto',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#cccccc', letterSpacing: '0.05em' }}>
            {bpm} bpm{sequencerPlaying ? ' \u25b6' : ''}
          </span>
          <span style={{ fontSize: '10px', color: '#999999', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {presetName || 'untitled'}
          </span>
          <div style={{ width: '80px', height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(1, Math.max(0, audioLevel)) * 100}%`, backgroundColor: modeColor, borderRadius: '2px', transition: 'width 60ms linear' }} />
          </div>
          <button
            onClick={onToggleMode}
            tabIndex={-1}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div style={{ width: '28px', height: '14px', borderRadius: '7px', backgroundColor: `${modeColor}44`, position: 'relative', transition: 'background-color 150ms' }}>
              <div style={{ position: 'absolute', top: '2px', left: uiMode === 'simple' ? '2px' : '14px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: modeColor, transition: 'left 150ms' }} />
            </div>
            <span style={{ fontSize: '9px', color: modeColor, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {uiMode}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom-right help button */}
      <div style={{ position: 'fixed', bottom: '16px', right: panelOpen ? '396px' : '16px', zIndex: 30, transition: 'right 300ms ease-in-out' }}>
        <button
          onClick={onShowHelp}
          tabIndex={-1}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#999999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            opacity: hovered || !panelOpen ? 0.6 : 0.3,
            transition: 'opacity 300ms ease',
          }}
        >
          ?
        </button>
      </div>

      {/* Tab pill -- visible only when panel is closed */}
      {!panelOpen && (
        <button
          onClick={onTogglePanel}
          tabIndex={-1}
          style={{
            position: 'fixed',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 45,
            background: 'rgba(10,10,15,0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRight: 'none',
            borderRadius: '4px 0 0 4px',
            padding: '8px 5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
            transition: 'opacity 200ms ease',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.9' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.5' }}
        >
          <span style={{
            writingMode: 'vertical-rl',
            fontSize: '9px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#B0B8C4',
            fontFamily: 'sans-serif',
          }}>
            tab
          </span>
        </button>
      )}
    </>
  )
}
```

- [ ] **Step 3: Wire onTogglePanel in App.tsx**

In `src/App.tsx`, add the `onTogglePanel` prop to the HUD component. Find the `<HUD` JSX and add:

```typescript
            onTogglePanel={() => useAppStore.getState().togglePanel()}
```

Add it after the existing `onShowHelp={handleShowHelp}` prop.

- [ ] **Step 4: Update store test for panelOpen default**

In `src/state/__tests__/store.test.ts`, if there's a test checking the initial panelOpen value, update it to expect `true` instead of `false`.

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 6: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 7: Commit**

```bash
git add src/state/store.ts src/ui/HUD.tsx src/App.tsx
git commit -m "feat: sidebar open by default, add Tab pill to reopen"
```

---

### Task 4: Simplify pro mode layout

Make VisualPanel and MappingPanel collapsed by default. Wrap PatternEditor section in a collapsible. Reorder so presets appear before code/visuals/mappings.

**Files:**
- Modify: `src/ui/VisualPanel.tsx:138`
- Modify: `src/ui/MappingPanel.tsx:98`
- Modify: `src/ui/ControlPanel.tsx`

- [ ] **Step 1: Default VisualPanel collapsed**

In `src/ui/VisualPanel.tsx`, change line 138:

```typescript
  const [collapsed, setCollapsed] = useState(true)
```

- [ ] **Step 2: Default MappingPanel collapsed**

In `src/ui/MappingPanel.tsx`, change line 98:

```typescript
  const [collapsed, setCollapsed] = useState(true)
```

- [ ] **Step 3: Restructure ControlPanel pro mode**

In `src/ui/ControlPanel.tsx`, restructure so that:
1. Children (PresetBar, VisualPanel, MappingPanel) render BEFORE the pattern/instrument/macros sections
2. PatternEditor, Instrument, and Macros are wrapped in a collapsible "Sound" section (collapsed by default)

Replace the ControlPanel component body (the content inside the panel div, after the mode toggle) with:

```typescript
export function ControlPanel({
  open,
  uiMode,
  onToggleMode,
  children,
  patternCode,
  onPatternChange,
  onEvaluatePattern,
  onStopPattern,
  patternPlaying,
  patternError,
  macros,
  onMacroChange,
  synthType,
  onSynthTypeChange,
  octave,
  onOctaveChange,
  bpm,
  onBpmChange,
  onTogglePattern,
}: ControlPanelProps) {
  const [soundOpen, setSoundOpen] = useState(false)
  const modeColor = '#B0B8C4'

  const showPatternEditor =
    uiMode === 'pro' &&
    patternCode !== undefined &&
    onPatternChange &&
    onEvaluatePattern &&
    onStopPattern &&
    patternPlaying !== undefined &&
    macros &&
    onMacroChange

  return (
    <>
      <style>{`
        .hydra-panel::-webkit-scrollbar {
          width: 3px;
        }
        .hydra-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .hydra-panel::-webkit-scrollbar-thumb {
          background: rgba(176, 184, 196, 0.3);
          border-radius: 2px;
        }
        .hydra-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(176, 184, 196, 0.5);
        }
      `}</style>
      <div
        className="hydra-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '380px',
          zIndex: 40,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-in-out',
          backgroundColor: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          overflowY: 'auto',
          padding: '16px',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            onClick={onToggleMode}
            tabIndex={-1}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            <span style={{ fontSize: '9px', color: modeColor, textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'sans-serif' }}>
              {uiMode}
            </span>
            <div style={{ width: '28px', height: '14px', borderRadius: '7px', backgroundColor: `${modeColor}44`, position: 'relative', transition: 'background-color 150ms' }}>
              <div style={{ position: 'absolute', top: '2px', left: uiMode === 'simple' ? '2px' : '14px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: modeColor, transition: 'left 150ms' }} />
            </div>
          </button>
        </div>

        {/* Rhythm (always visible) */}
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

        {/* Macros (always visible -- primary performance controls) */}
        {macros && onMacroChange && (
          <div style={{ marginBottom: '16px' }}>
            <p style={sectionHeaderStyle}>Macros</p>
            <Slider label="Filter" value={macros.tone} onChange={(v) => onMacroChange('tone', v)} min={0} max={1} step={0.01} accentColor="#B0B8C4" />
            <Slider label="Reverb" value={macros.space} onChange={(v) => onMacroChange('space', v)} min={0} max={1} step={0.01} accentColor="#B0B8C4" />
            <Slider label="Volume" value={macros.intensity} onChange={(v) => onMacroChange('intensity', v)} min={0} max={1} step={0.01} accentColor="#B0B8C4" />
          </div>
        )}

        {/* Children: in simple mode = SimplePanel, in pro mode = PresetBar + VisualPanel + MappingPanel */}
        {children}

        {/* Pro mode: collapsible Sound section (pattern editor + instrument) */}
        {showPatternEditor && (
          <div style={{ marginBottom: '16px' }}>
            <p
              style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setSoundOpen((o) => !o)}
            >
              Sound {soundOpen ? '\u25b2' : '\u25bc'}
            </p>
            {soundOpen && (
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
                  <div style={{ marginBottom: '8px' }}>
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
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
```

Note: The `useState` import needs to be added at the top of ControlPanel.tsx:

```typescript
import { ReactNode, useState } from 'react'
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/VisualPanel.tsx src/ui/MappingPanel.tsx src/ui/ControlPanel.tsx
git commit -m "feat: simplify pro mode with collapsible sections, macros always visible"
```

---

### Task 5: Add macro-to-visual mappings in all presets

Add `macro.tone`, `macro.space`, or `macro.intensity` mappings to each preset so slider movement directly affects visuals. Choose mapping targets that make aesthetic sense for each preset's visual style.

**Files:**
- Modify: `src/presets/defaults/void.ts`
- Modify: `src/presets/defaults/ritual.ts`
- Modify: `src/presets/defaults/signal.ts`
- Modify: `src/presets/defaults/ember.ts`
- Modify: `src/presets/defaults/cosmos.ts`
- Modify: `src/presets/defaults/mask.ts`

- [ ] **Step 1: Add macro mappings to void preset**

In `src/presets/defaults/void.ts`, add to the `mappings` array:

```typescript
  mappings: [
    {
      id: 'void-map-0',
      source: 'envelope',
      target: 'drift.scale',
      range: [0.98, 1.02],
      smooth: 0.15,
      curve: 'linear',
    },
    {
      id: 'void-map-1',
      source: 'macro.tone',
      target: 'osc.frequency',
      range: [20, 100],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'void-map-2',
      source: 'macro.space',
      target: 'modulate.amount',
      range: [0.05, 0.3],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
```

- [ ] **Step 2: Add macro mappings to ritual preset**

In `src/presets/defaults/ritual.ts`, replace `mappings` with:

```typescript
  mappings: [
    {
      id: 'ritual-map-0',
      source: 'onset',
      target: 'kaleid.sides',
      range: [3, 12],
      smooth: 0,
      curve: 'step',
    },
    {
      id: 'ritual-map-1',
      source: 'fft[0]',
      target: 'osc.freq',
      range: [30, 60],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ritual-map-2',
      source: 'macro.tone',
      target: 'modulateScale.multiple',
      range: [-0.06, 0.01],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ritual-map-3',
      source: 'macro.intensity',
      target: 'scale.amount',
      range: [0.7, 0.95],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
```

- [ ] **Step 3: Add macro mappings to signal preset**

In `src/presets/defaults/signal.ts`, replace `mappings` with:

```typescript
  mappings: [
    {
      id: 'signal-map-0',
      source: 'fft[3]',
      target: 'signal.scroll',
      range: [0.001, 0.05],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'signal-map-1',
      source: 'cycle',
      target: 'rotate.speed',
      range: [0.5, 2],
      smooth: 0,
      curve: 'linear',
    },
    {
      id: 'signal-map-2',
      source: 'macro.tone',
      target: 'osc.frequency',
      range: [100, 400],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'signal-map-3',
      source: 'macro.space',
      target: 'kaleid.nSides',
      range: [100, 300],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
```

- [ ] **Step 4: Add macro mappings to ember preset**

In `src/presets/defaults/ember.ts`, replace `mappings` with:

```typescript
  mappings: [
    {
      id: 'ember-map-0',
      source: 'envelope',
      target: 'ember.mod',
      range: [0.01, 0.1],
      smooth: 0.1,
      curve: 'exponential',
    },
    {
      id: 'ember-map-1',
      source: 'macro.tone',
      target: 'luma.threshold',
      range: [0.2, 0.8],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ember-map-2',
      source: 'macro.intensity',
      target: 'scale.amount',
      range: [0.99, 1.04],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
```

- [ ] **Step 5: Add macro mappings to cosmos preset**

In `src/presets/defaults/cosmos.ts`, replace `mappings` with:

```typescript
  mappings: [
    {
      id: 'cosmos-map-0',
      source: 'fft[1]',
      target: 'noise.speed',
      range: [0.1, 0.5],
      smooth: 0.2,
      curve: 'exponential',
    },
    {
      id: 'cosmos-map-1',
      source: 'macro.tone',
      target: 'osc.frequency',
      range: [30, 90],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'cosmos-map-2',
      source: 'macro.space',
      target: 'modulateScale.multiple',
      range: [0.2, 1.0],
      smooth: 0.15,
      curve: 'linear',
    },
    {
      id: 'cosmos-map-3',
      source: 'macro.intensity',
      target: 'brightness.amount',
      range: [-0.1, 0.2],
      smooth: 0.1,
      curve: 'linear',
    },
  ],
```

- [ ] **Step 6: Add macro mappings to mask preset**

In `src/presets/defaults/mask.ts`, replace `mappings` with:

```typescript
  mappings: [
    {
      id: 'mask-map-0',
      source: 'fft[2]',
      target: 'mask.rotate',
      range: [-0.05, 0.05],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'mask-map-1',
      source: 'macro.tone',
      target: 'shape.sides',
      range: [3, 8],
      smooth: 0.1,
      curve: 'step',
    },
    {
      id: 'mask-map-2',
      source: 'macro.space',
      target: 'modulate.amount',
      range: [0.05, 0.2],
      smooth: 0.15,
      curve: 'linear',
    },
    {
      id: 'mask-map-3',
      source: 'macro.intensity',
      target: 'mask.grid',
      range: [3, 10],
      smooth: 0.1,
      curve: 'step',
    },
  ],
```

- [ ] **Step 7: Run tests and build**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All tests pass, no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/presets/defaults/
git commit -m "feat: add macro-to-visual mappings in all presets"
```

---

### Task 6: Garden-inspired visual chain improvements

Improve preset visual chains with techniques discovered from the Hydra Garden. Focus on organic, monochrome aesthetics: feedback loops, luma thresholds, nested noise modulation, and smooth animation.

**Files:**
- Modify: `src/presets/defaults/cosmos.ts`
- Modify: `src/presets/defaults/ember.ts`
- Modify: `src/presets/defaults/ritual.ts`

- [ ] **Step 1: Improve cosmos with bioluminescent cells technique**

Replace the visual chain in `src/presets/defaults/cosmos.ts`. Uses `shape(20).modulateRotate(o0)` for organic cell-like forms (inspired by Mahalia H-R):

```typescript
  visual: {
    chain: {
      source: { fn: 'shape', args: [20, 0.2, 0.3] },
      transforms: [
        {
          fn: 'modulate',
          args: [{ fn: 'noise', args: [2, 0.3] }, 0.15],
        },
        {
          fn: 'modulateScale',
          args: [{ fn: 'osc', args: [3, 0.5] }, -0.6],
        },
        { fn: 'invert', args: [] },
        { fn: 'brightness', args: [0.1] },
        { fn: 'contrast', args: [1.3] },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.92] },
        { fn: 'scale', args: [0.999] },
      ],
      output: 'o0',
    },
  },
```

- [ ] **Step 2: Improve ember with double-nested noise modulation**

Replace the visual chain in `src/presets/defaults/ember.ts`. Uses double-nested `modulate(noise().modulate(noise()))` for deep organic flow (inspired by Rangga Purnama Aji):

```typescript
  visual: {
    chain: {
      source: { fn: 'voronoi', args: [50, 1] },
      transforms: [
        { fn: 'luma', args: [0.5] },
        {
          fn: 'modulate',
          args: [
            {
              fn: 'noise',
              args: [3, 0.5],
              transforms: [
                {
                  fn: 'modulate',
                  args: [{ fn: 'noise', args: [2, 0.3] }, 0.2],
                },
              ],
            },
            'ember.mod',
          ],
        },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.93] },
        { fn: 'brightness', args: [0.03] },
        { fn: 'scale', args: [1.01] },
      ],
      output: 'o0',
    },
  },
```

- [ ] **Step 3: Improve ritual with topographic contour technique**

Replace the visual chain in `src/presets/defaults/ritual.ts`. Uses `pixelate(2, 20)` for asymmetric contour banding (inspired by Olivia Jack):

```typescript
  visual: {
    chain: {
      source: { fn: 'osc', args: [40, 0.03, 1.7] },
      transforms: [
        { fn: 'kaleid', args: ['kaleid.sides'] },
        {
          fn: 'mult',
          args: [
            {
              fn: 'osc',
              args: [40, 0.001, 0],
              transforms: [{ fn: 'rotate', args: [1.58] }],
            },
          ],
        },
        { fn: 'pixelate', args: [2, 20] },
        {
          fn: 'modulate',
          args: [{ fn: 'noise', args: [2.5] }, 0.08],
        },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.92] },
        {
          fn: 'modulateScale',
          args: [{ fn: 'osc', args: [10, 0] }, -0.03],
        },
        { fn: 'scale', args: [0.8] },
        { fn: 'rotate', args: [0.1, 0.5] },
      ],
      output: 'o0',
    },
  },
```

- [ ] **Step 4: Run tests and build**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All tests pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/presets/defaults/
git commit -m "feat: garden-inspired visual chains for cosmos, ember, ritual"
```

---

## Task Dependency Order

```
Task 1 (keyboard notes) ──── independent
Task 2 (macro sources)  ──── independent
Task 3 (sidebar + tab)  ──── independent
Task 4 (simplify pro)   ──── independent
Task 5 (preset mappings) ─── depends on Task 2
Task 6 (visual chains)  ──── depends on Task 5
```

Tasks 1-4 can run in parallel. Tasks 5-6 are sequential after Task 2.

## Verification After All Tasks

After all tasks are complete, run:
1. `npx vitest run` -- all tests pass
2. `npx tsc --noEmit` -- no type errors
3. `npm run build` -- production build succeeds
4. Manual test: open in browser, verify:
   - Sidebar opens by default, Tab pill appears when closed
   - Keyboard A-L plays notes without killing sequencer
   - Moving macro sliders (Filter/Reverb/Volume) changes visuals
   - Pro mode has collapsible sections, macros always visible
   - Presets load with audio-reactive visuals
