# UX Audit Fixes Design

Date: 2026-03-31
Status: Draft

## Problem Statement

Three user-reported issues confirmed by code audit:
1. First-time user intro is a blocking text wall that teaches nothing
2. No meaningful music controls -- only abstract 0-1 macro sliders
3. Multiple broken sliders across both UI modes

## Scope

Three layers, ordered by priority. Each layer is independently shippable.

---

## Layer 1: Fix Broken Sliders & UI Bugs

### Bug A: Visual group pills destroy preset chain

**Location:** `App.tsx:436-448` (`handleSourceChange`)

**Root cause:** `handleSourceChange` builds a new chain with ALL args set to 0 and no transforms. Selecting "Geometry" produces `shape(0, 0, 0)` -- invisible.

**Fix:** Remove the visual group pills from SimplePanel entirely. They're a broken abstraction -- they pretend to switch "visual styles" but actually destroy the preset's carefully designed chain. Presets already handle visual identity. The visual group concept adds nothing useful.

### Bug B: Sliders show 0 for mapping-target string args

**Location:** `App.tsx:74-87` (`positionalToNamed`)

**Root cause:** When a transform arg is a string mapping target (e.g., `'drift.scale'`), `positionalToNamed` converts it to `0` in the UI. The slider renders at 0 but dragging it does nothing because `namedToPositional` preserves the original string.

**Fix:** In the VisualPanel transform UI, detect when an arg is a string (mapping target). Instead of rendering a broken slider, render an inline indicator:

```
scale
  Amount  [mapped: drift.scale]      <- replaces the slider
```

The indicator is a small pill/badge in `rgba(136,144,160,0.2)` with the target name in monospace. Non-interactive -- the mapping is controlled in MappingPanel.

Implementation: Pass the raw chain config args alongside the named args so the UI can detect string args. Add a `rawArgs` field to the VisualPanel transform type: `rawArgs?: (number | string | object)[]`. When rendering a param slider, check if `rawArgs[paramIndex]` is a string -- if so, render the mapped indicator instead.

### Bug C: Missing transforms in UI

**Location:** `App.tsx:41-51`, `VisualPanel.tsx:101-109`

**Root cause:** `TRANSFORM_ARG_KEYS` and `TRANSFORM_PARAMS` only define 8 transforms, but presets use 17+.

**Fix:** Add all missing transforms used by presets:

| Transform | Args |
|-----------|------|
| `diff` | (no numeric args -- takes source) |
| `blend` | `amount` (0-1) |
| `mult` | (no numeric args -- takes source) |
| `modulateScale` | `multiple` (-1 to 2) |
| `luma` | `threshold` (0-1), `tolerance` (0-1) |
| `scrollX` | `scrollX` (0-1), `speed` (0-1) |
| `repeat` | `repeatX` (1-20), `repeatY` (1-20) |
| `invert` | `amount` (0-1) |
| `contrast` | `amount` (0-4) |
| `color` | `r` (0-1), `g` (0-1), `b` (0-1) |

Transforms that take a ChainNode as first arg (`diff`, `mult`, `modulate`, `blend`, `modulateScale`): show the ChainNode arg as "[source]" label (non-editable), and only show sliders for the remaining numeric args (e.g., `blend` amount, `modulateScale` multiple).

### Bug D: Deleted shader sources in VisualPanel dropdown

**Location:** `VisualPanel.tsx:28-33`

**Root cause:** SOURCE_OPTIONS still lists `sacredGeometry`, `tribalMask`, `particleField`, `voidPulse`, `ritualFire`, `paisleyFlow`. These custom shaders were removed during the organic filament redesign. Selecting them calls `s[fn]()` which is undefined, producing a blank screen via `s.solid()`.

**Fix:** Remove all 6 deleted entries from SOURCE_OPTIONS. The sources actually available in hydra-synth are: `osc`, `noise`, `voronoi`, `shape`, `gradient`, `solid`, `src`.

### Bug E: BPM + play/pause missing from Pro mode

**Location:** `ControlPanel.tsx`

**Root cause:** BPM slider and play/pause button exist only in `SimplePanel`. Pro mode's `ControlPanel` shell has no rhythm controls.

**Fix:** Add a rhythm section to `ControlPanel` that renders in BOTH modes, below the mode toggle and above `children`. Contains: play/pause button + BPM slider. Remove the rhythm section from `SimplePanel` to avoid duplication.

---

## Layer 2: Music Controls in SimplePanel

### Current state

SimplePanel has:
- Preset pills
- "Sound" section: Tone (0-1), Space (0-1) sliders
- "Visuals" section: visual group pills, Intensity (0-1) slider
- "Rhythm" section: play/pause, BPM

The macro names (Tone, Space, Intensity) are abstract. Users don't know what they control. The Intensity slider is under "Visuals" but only affects audio gain.

### New SimplePanel layout

```
[Preset pills: void | ritual | signal | ember | cosmos | mask]

SOUND
  Synth   [sine] [triangle] [square] [saw]
  Octave  [v] 3 [^]
  Filter  |========---------|  0.50
  Reverb  |=====------------|  0.30
  Volume  |========---------|  0.50

(Rhythm section is now in ControlPanel shell -- shared with pro mode)
```

### Changes

**Rename macros in UI only** (mechanism unchanged):
- "Tone" -> "Filter" (tooltip: "filter cutoff")
- "Space" -> "Reverb" (tooltip: "reverb amount")
- "Intensity" -> "Volume" (tooltip: "output level")
- Move all three under "Sound" section

**Add synth type selector:**
- PillSelector with options: sine, triangle, square, sawtooth
- State: new `synthType` field in store (default: from preset's `keyboard.s`)
- On change: call `engine.setKeyboardConfig({ s: newType, effects: currentEffects })`
- On preset load: sync from `preset.audio.keyboard.s`

**Add octave display:**
- Shows current `store.octave` value (already exists in store, keyboard Z/X changes it)
- Two small buttons: down (v) and up (^), calling `store.setOctave(oct +/- 1)`
- Range: 1-7 (already clamped 0-8 in store)

**Remove visual group pills and Intensity from SimplePanel.** Visuals are preset-driven in simple mode. Users who want visual tweaking use pro mode.

### Store changes

Add to `AppState`:
```typescript
synthType: string  // 'sine' | 'triangle' | 'square' | 'sawtooth'
setSynthType: (type: string) => void
```

### Pro mode audio section

Pro mode already has PatternEditor + Macro sliders. Changes:
- Rename macro labels same as simple mode (Filter, Reverb, Volume)
- Add synth type selector above macros (same PillSelector)
- Add octave display

---

## Layer 3: Interactive Intro

### Current state

`IntroGuide.tsx`: 5 text-only modal cards behind z-200 blocking backdrop. User can't interact during tutorial. Teaches nothing.

### New design: Non-blocking floating hints

Replace the entire IntroGuide with action-triggered floating hints:

**Step 1 -- "Play"** (shows after StartOverlay dismissed)
- Floating card at bottom-center, semi-transparent background (no backdrop)
- Text: "Press keys A-L to play notes"
- Small keyboard diagram: `A S D F G H J K L` with note labels below
- Auto-advances when: `onNoteOn` fires (user played a note)
- Fallback: "Skip" button, auto-dismiss after 15 seconds

**Step 2 -- "Explore"** (shows after first note played)
- Floating card at bottom-right, pointing toward panel area
- Text: "Press Tab to open controls"
- Auto-advances when: `store.ui.panelOpen` becomes true
- Fallback: skip/auto-dismiss

**Step 3 -- "Presets"** (shows after panel opened)
- Floating card at top-center
- Text: "Try presets 1-6 on your keyboard"
- Auto-advances when: preset changes (activeSlot changes)
- Fades out after completion. Done.

### Component: `InteractiveIntro.tsx`

Replaces `IntroGuide.tsx`. Props:
```typescript
interface InteractiveIntroProps {
  visible: boolean
  onComplete: () => void
}
```

Internal state: `step` (0-2), advances via store subscriptions and callbacks.

Each hint card:
- Position: fixed, semi-transparent bg (`rgba(10,10,15,0.85)`), border, rounded
- No backdrop overlay -- user can interact freely
- Animates in/out with opacity transition
- Max-width 360px

### Wiring in App.tsx

- Replace `<IntroGuide>` with `<InteractiveIntro>`
- Pass same `visible` and `onComplete` props
- InteractiveIntro subscribes to store internally for auto-advance triggers
- `onNoteOn` callback: InteractiveIntro exposes a `notePlayed()` method via ref, App calls it from keyboard handler

### localStorage

Same key: `hydra-intro-seen`. Same "?" button re-trigger.

---

## Files Modified

### Layer 1
- `src/ui/VisualPanel.tsx` -- remove deleted sources, add missing transforms, show mapped indicators
- `src/ui/SimplePanel.tsx` -- remove visual group pills, remove rhythm section
- `src/ui/ControlPanel.tsx` -- add shared rhythm section (BPM + play/pause)
- `src/App.tsx` -- update TRANSFORM_ARG_KEYS, pass raw args for mapped detection, remove visual group handlers, pass rhythm props to ControlPanel

### Layer 2
- `src/ui/SimplePanel.tsx` -- rename labels, add synth selector + octave display
- `src/ui/ControlPanel.tsx` -- rename macro labels, add synth/octave in pro mode
- `src/state/store.ts` -- add `synthType` + `setSynthType`
- `src/App.tsx` -- wire synth type changes to engine, sync on preset load

### Layer 3
- `src/ui/InteractiveIntro.tsx` -- new file replacing IntroGuide
- `src/ui/IntroGuide.tsx` -- deleted
- `src/App.tsx` -- swap IntroGuide for InteractiveIntro, wire notePlayed callback

## Out of Scope

- Custom filter/reverb knobs (beyond macro relabeling) -- would require Strudel pattern rewriting
- XY pad for sound control
- Visual preset editing in simple mode
- On-screen keyboard visualization (beyond intro hint)
- Mobile/touch optimization
