# UI + Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark purple theme with a neon psychedelic palette, fix control readability, add Simple/Pro mode toggle with macro knobs, recolor all shaders, and add a new paisleyFlow shader.

**Architecture:** The overhaul is layered: theme first (foundation), then widgets (consume theme), then panels (consume widgets), then shaders (independent), then the new SimplePanel + MacroEngine (consumes everything). Each layer builds on the previous one.

**Tech Stack:** React 19, TypeScript, Zustand, Hydra Synth (GLSL), Vitest

**Spec:** `docs/superpowers/specs/2026-03-28-ui-visual-overhaul-design.md`

---

### Task 1: Update Theme Palette

**Files:**
- Modify: `src/ui/theme.ts`

- [ ] **Step 1: Replace theme tokens**

```typescript
export const theme = {
  bg: '#0a0a0f',
  bgPanel: 'rgba(10, 10, 15, 0.92)',
  bgWidget: 'rgba(255, 255, 255, 0.06)',
  bgWidgetHover: 'rgba(255, 255, 255, 0.10)',
  accent: '#FF1493',
  accentLight: '#FF69B4',
  accentDim: 'rgba(255, 20, 147, 0.15)',
  accentAudio: '#FFD700',
  accentVisual: '#00E676',
  accentMapping: '#4488FF',
  accentSecondary: '#FF6600',
  text: '#cccccc',
  textDim: '#999999',
  textBright: '#eeeef2',
} as const
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors (same shape as before plus new tokens)

- [ ] **Step 3: Commit**

```bash
git add src/ui/theme.ts
git commit -m "feat: update theme palette to neon psychedelic colors"
```

---

### Task 2: Update Slider Widget

**Files:**
- Modify: `src/ui/widgets/Slider.tsx`

- [ ] **Step 1: Add accentColor prop and update styling**

Replace the entire file content:

```tsx
interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  accentColor?: string
  accentGradient?: string
  onChange: (value: number) => void
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  accentColor = '#FF1493',
  accentGradient,
  onChange,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  const displayValue = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2)
  const thumbId = `slider-thumb-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="flex items-center gap-2 w-full">
      <style>{`
        .${thumbId}::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${accentColor};
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        }
        .${thumbId}::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${accentColor};
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        }
      `}</style>
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
        {label}
      </span>

      <div className="flex-1 relative flex items-center" style={{ height: '20px' }}>
        <input
          type="range"
          className={thumbId}
          tabIndex={-1}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer',
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
          }}
        />
      </div>

      <span
        className="shrink-0 font-mono"
        style={{
          fontSize: '11px',
          color: accentColor,
          minWidth: '40px',
          textAlign: 'right',
        }}
      >
        {displayValue}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors. Existing callers still work (new props are optional with defaults).

- [ ] **Step 3: Commit**

```bash
git add src/ui/widgets/Slider.tsx
git commit -m "feat: update Slider widget with accent color props and readability fixes"
```

---

### Task 3: Update Toggle Widget

**Files:**
- Modify: `src/ui/widgets/Toggle.tsx`

- [ ] **Step 1: Add accentColor prop and update styling**

Replace the entire file content:

```tsx
interface ToggleProps {
  label: string
  value: boolean
  accentColor?: string
  onChange: (value: boolean) => void
}

export function Toggle({ label, value, accentColor = '#FF1493', onChange }: ToggleProps) {
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
        {label}
      </span>

      <button
        role="switch"
        aria-checked={value}
        tabIndex={-1}
        onClick={() => onChange(!value)}
        style={{
          position: 'relative',
          width: '32px',
          height: '16px',
          borderRadius: '9999px',
          backgroundColor: value ? accentColor : 'rgba(255,255,255,0.10)',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
          transition: 'background-color 150ms',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: value ? 'calc(100% - 14px)' : '2px',
            transform: 'translateY(-50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.80)',
            transition: 'left 150ms',
          }}
        />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/widgets/Toggle.tsx
git commit -m "feat: update Toggle widget with accent color prop and readability fixes"
```

---

### Task 4: Update Dropdown Widget

**Files:**
- Modify: `src/ui/widgets/Dropdown.tsx`

- [ ] **Step 1: Add accentColor prop and update colors**

Replace hardcoded purple values with the `accentColor` prop:

Add `accentColor?: string` to `DropdownProps` interface (default `'#FF1493'`).

Changes to make:
- Label `color: '#6a6a78'` -> `color: '#cccccc'`
- Label `fontSize: '10px'` -> `fontSize: '11px'`
- Button `color: '#7c4ddb'` -> `color: accentColor`
- Arrow `color: '#6a6a78'` -> `color: '#999999'`
- Selected option `backgroundColor: 'rgba(90,40,180,0.15)'` -> `backgroundColor: 'rgba(255,20,147,0.15)'` (or derive from accentColor)
- Selected option `color: '#7c4ddb'` -> `color: accentColor`

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/widgets/Dropdown.tsx
git commit -m "feat: update Dropdown widget with accent color prop and readability fixes"
```

---

### Task 5: Create PillSelector Widget

**Files:**
- Create: `src/ui/widgets/PillSelector.tsx`

- [ ] **Step 1: Create PillSelector component**

```tsx
interface PillSelectorProps {
  options: { value: string; label: string }[]
  value: string
  accentColor?: string
  onChange: (value: string) => void
}

export function PillSelector({
  options,
  value,
  accentColor = '#FF1493',
  onChange,
}: PillSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            tabIndex={-1}
            onClick={() => onChange(option.value)}
            style={{
              padding: '4px 12px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: 'sans-serif',
              fontWeight: isActive ? 600 : 400,
              transition: 'background-color 150ms, color 150ms',
              backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.06)',
              color: isActive ? '#000' : '#999999',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/widgets/PillSelector.tsx
git commit -m "feat: add PillSelector widget for Simple mode"
```

---

### Task 6: Apply Readability Fixes to AudioPanel

**Files:**
- Modify: `src/ui/AudioPanel.tsx`

- [ ] **Step 1: Update all style constants and pass accent colors to widgets**

Replace `sectionHeaderStyle`:
```typescript
const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#FFD700',
  fontFamily: 'sans-serif',
  margin: 0,
  cursor: 'pointer',
  userSelect: 'none',
}
```

Replace `subLabelStyle`:
```typescript
const subLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'rgba(255, 215, 0, 0.7)',
  marginBottom: '4px',
  marginTop: '8px',
}
```

Pass `accentColor="#FFD700"` to all `<Slider>` and `<Toggle>` components in this panel.

Pass `accentColor="#FFD700"` to the `<Dropdown>` component.

Update the sequencer Play/Stop button colors:
- Active background: `'rgba(255,215,0,0.3)'` (was `'rgba(90,40,180,0.3)'`)
- Active color: `'#FFD700'` (was `'#7c4ddb'`)

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/AudioPanel.tsx
git commit -m "feat: apply readability fixes to AudioPanel with gold accent"
```

---

### Task 7: Apply Readability Fixes to VisualPanel

**Files:**
- Modify: `src/ui/VisualPanel.tsx`

- [ ] **Step 1: Update style constants and add paisleyFlow to source options**

Replace `sectionHeaderStyle`:
```typescript
const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#00E676',
  fontFamily: 'sans-serif',
  margin: 0,
  cursor: 'pointer',
  userSelect: 'none',
}
```

Replace `subLabelStyle`:
```typescript
const subLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'rgba(0, 230, 118, 0.7)',
  marginBottom: '4px',
  marginTop: '8px',
}
```

Add to `SOURCE_OPTIONS`:
```typescript
{ value: 'paisleyFlow', label: 'paisleyFlow' },
```

Add to `SOURCE_PARAMS`:
```typescript
paisleyFlow: [
  { key: 'density', label: 'Density', min: 1, max: 8, step: 0.1 },
  { key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.01 },
  { key: 'colorShift', label: 'Color', min: 0, max: 6.28, step: 0.01 },
],
```

Pass `accentColor="#00E676"` to all `<Slider>` and `<Dropdown>` components.

Update transform name color from `'#7c4ddb'` to `'#00E676'`.
Update remove button color from `'#6a6a78'` to `'#999999'`.
Update Add button from `'rgba(90,40,180,0.2)'` / `'#7c4ddb'` to `'rgba(0,230,118,0.2)'` / `'#00E676'`.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/VisualPanel.tsx
git commit -m "feat: apply readability fixes to VisualPanel with green accent, add paisleyFlow source"
```

---

### Task 8: Apply Readability Fixes to MappingPanel and PresetBar

**Files:**
- Modify: `src/ui/MappingPanel.tsx`
- Modify: `src/ui/PresetBar.tsx`

- [ ] **Step 1: Update MappingPanel colors**

Replace `sectionHeaderStyle` color to `'#4488FF'`.
Replace `subLabelStyle` (the inline labels) color to `'rgba(68, 136, 255, 0.7)'`.
Update `inputStyle` color from `'#7c4ddb'` to `'#4488FF'`.
Update arrow `color: '#6a6a78'` to `'#999999'`.
Update remove button `color: '#6a6a78'` to `'#999999'`.
Update Add Mapping button from `'rgba(90,40,180,0.2)'` / `'#7c4ddb'` to `'rgba(68,136,255,0.2)'` / `'#4488FF'`.
Pass `accentColor="#4488FF"` to `<Slider>` and `<Dropdown>` components.

- [ ] **Step 2: Update PresetBar colors**

Update active slot `backgroundColor: '#5a28b4'` to `'#FF1493'`.
Update action button `color: '#6a6a78'` to `'#999999'`.
Update action button hover color from `'#c8c8d0'` to `'#cccccc'`.
Update separator `color: '#3a3a42'` to `'#444444'`.
Update occupied slot text color from `'#c8c8d0'` to `'#cccccc'`.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/ui/MappingPanel.tsx src/ui/PresetBar.tsx
git commit -m "feat: apply readability fixes to MappingPanel (blue) and PresetBar (pink)"
```

---

### Task 9: Update HUD with Mode Toggle

**Files:**
- Modify: `src/ui/HUD.tsx`

- [ ] **Step 1: Add mode toggle props and update HUD colors**

Replace the full file:

```tsx
import { useEffect, useState } from 'react'

interface HUDProps {
  bpm: number
  presetName: string
  audioLevel: number
  panelOpen: boolean
  sequencerPlaying: boolean
  uiMode: 'simple' | 'pro'
  onToggleMode: () => void
}

export function HUD({
  bpm,
  presetName,
  audioLevel,
  panelOpen,
  sequencerPlaying,
  uiMode,
  onToggleMode,
}: HUDProps) {
  const [hintVisible, setHintVisible] = useState(true)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const modeColor = uiMode === 'simple' ? '#00E676' : '#FF1493'

  return (
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#cccccc',
            letterSpacing: '0.05em',
          }}
        >
          {bpm} bpm{sequencerPlaying ? ' \u25b6' : ''}
        </span>

        <span
          style={{
            fontSize: '10px',
            color: '#999999',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {presetName || 'untitled'}
        </span>

        <div
          style={{
            width: '80px',
            height: '3px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(1, Math.max(0, audioLevel)) * 100}%`,
              backgroundColor: '#FF1493',
              borderRadius: '2px',
              transition: 'width 60ms linear',
            }}
          />
        </div>

        <button
          onClick={onToggleMode}
          tabIndex={-1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              width: '28px',
              height: '14px',
              borderRadius: '7px',
              backgroundColor: `${modeColor}44`,
              position: 'relative',
              transition: 'background-color 150ms',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: uiMode === 'simple' ? '2px' : '14px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: modeColor,
                transition: 'left 150ms',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '9px',
              color: modeColor,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}
          >
            {uiMode}
          </span>
        </button>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          opacity: hintVisible ? 1 : 0,
          transition: 'opacity 600ms ease',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#999999',
            fontFamily: 'monospace',
          }}
        >
          tab
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: Type error in App.tsx (new props not yet wired). That's fine -- we'll fix in Task 13.

- [ ] **Step 3: Commit**

```bash
git add src/ui/HUD.tsx
git commit -m "feat: add mode toggle to HUD with neon accent colors"
```

---

### Task 10: Add uiMode to Store

**Files:**
- Modify: `src/state/store.ts`
- Modify: `src/state/__tests__/store.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/state/__tests__/store.test.ts`:

```typescript
it('has default uiMode simple', () => {
  expect(useAppStore.getState().uiMode).toBe('simple')
})

it('setUIMode changes mode', () => {
  useAppStore.getState().setUIMode('pro')
  expect(useAppStore.getState().uiMode).toBe('pro')
  useAppStore.getState().setUIMode('simple')
  expect(useAppStore.getState().uiMode).toBe('simple')
})

it('toggleUIMode flips mode', () => {
  expect(useAppStore.getState().uiMode).toBe('simple')
  useAppStore.getState().toggleUIMode()
  expect(useAppStore.getState().uiMode).toBe('pro')
  useAppStore.getState().toggleUIMode()
  expect(useAppStore.getState().uiMode).toBe('simple')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/__tests__/store.test.ts`
Expected: FAIL -- `uiMode` property does not exist.

- [ ] **Step 3: Add uiMode state to store**

In `src/state/store.ts`:

Add `UIMode` type and update `AppState` interface:
```typescript
export type UIMode = 'simple' | 'pro'
```

Add to `AppState` interface (top-level, not nested in `ui`):
```typescript
uiMode: UIMode
setUIMode: (mode: UIMode) => void
toggleUIMode: () => void
```

Add to `initialState`:
```typescript
uiMode: 'simple' as UIMode,
```

Add setters to the store creator:
```typescript
setUIMode: (mode) => set({ uiMode: mode }),
toggleUIMode: () => set((s) => ({ uiMode: s.uiMode === 'simple' ? 'pro' : 'simple' })),
```

Update `getInitialState` to include `uiMode: 'simple'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/__tests__/store.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/store.ts src/state/__tests__/store.test.ts
git commit -m "feat: add uiMode state with simple/pro toggle"
```

---

### Task 11: Add M Key to KeyboardHandler

**Files:**
- Modify: `src/input/KeyboardHandler.ts`

- [ ] **Step 1: Add onToggleMode callback and M key handler**

Add `onToggleMode: () => void` to the `KeyboardCallbacks` interface.

In the `handleKeyDown` method, add before the note keys section (after the Z/X octave shift block):

```typescript
// M: toggle UI mode
if (key === 'm') {
  this.callbacks.onToggleMode()
  return
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: Type error in App.tsx where KeyboardHandler is constructed (missing `onToggleMode`). That's expected -- fixed in Task 13.

- [ ] **Step 3: Commit**

```bash
git add src/input/KeyboardHandler.ts
git commit -m "feat: add M key shortcut for mode toggle"
```

---

### Task 12: Update ControlPanel with Mode Toggle Header

**Files:**
- Modify: `src/ui/ControlPanel.tsx`

- [ ] **Step 1: Add mode toggle at top of panel**

Replace the file:

```tsx
import { ReactNode } from 'react'

interface ControlPanelProps {
  open: boolean
  uiMode: 'simple' | 'pro'
  onToggleMode: () => void
  children: ReactNode
}

export function ControlPanel({ open, uiMode, onToggleMode, children }: ControlPanelProps) {
  const modeColor = uiMode === 'simple' ? '#00E676' : '#FF1493'

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
          background: rgba(255, 20, 147, 0.3);
          border-radius: 2px;
        }
        .hydra-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 20, 147, 0.5);
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginBottom: '12px',
          }}
        >
          <button
            onClick={onToggleMode}
            tabIndex={-1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <span
              style={{
                fontSize: '9px',
                color: modeColor,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontFamily: 'sans-serif',
              }}
            >
              {uiMode}
            </span>
            <div
              style={{
                width: '28px',
                height: '14px',
                borderRadius: '7px',
                backgroundColor: `${modeColor}44`,
                position: 'relative',
                transition: 'background-color 150ms',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: uiMode === 'simple' ? '2px' : '14px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: modeColor,
                  transition: 'left 150ms',
                }}
              />
            </div>
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: Type error in App.tsx (new required props). Expected -- fixed in Task 13.

- [ ] **Step 3: Commit**

```bash
git add src/ui/ControlPanel.tsx
git commit -m "feat: add mode toggle to ControlPanel header"
```

---

### Task 13: Create MacroEngine

**Files:**
- Create: `src/ui/MacroEngine.ts`
- Create: `src/ui/__tests__/MacroEngine.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/ui/__tests__/MacroEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { MacroEngine } from '../MacroEngine'

describe('MacroEngine', () => {
  it('computeTone returns filter and decay params', () => {
    const result = MacroEngine.computeTone(0.5)
    expect(result.filterFrequency).toBeGreaterThan(200)
    expect(result.filterFrequency).toBeLessThan(8000)
    expect(result.filterQ).toBeGreaterThanOrEqual(1)
    expect(result.filterQ).toBeLessThanOrEqual(3)
    expect(result.decay).toBeGreaterThan(0.1)
    expect(result.decay).toBeLessThan(0.5)
  })

  it('computeTone at 0 returns minimum values', () => {
    const result = MacroEngine.computeTone(0)
    expect(result.filterFrequency).toBeCloseTo(200, 0)
    expect(result.filterQ).toBeCloseTo(1, 1)
    expect(result.decay).toBeCloseTo(0.5, 1)
  })

  it('computeTone at 1 returns maximum values', () => {
    const result = MacroEngine.computeTone(1)
    expect(result.filterFrequency).toBeCloseTo(8000, 0)
    expect(result.filterQ).toBeCloseTo(3, 1)
    expect(result.decay).toBeCloseTo(0.1, 1)
  })

  it('computeSpace returns reverb and delay params', () => {
    const result = MacroEngine.computeSpace(0.5)
    expect(result.reverbBypass).toBe(false)
    expect(result.reverbWet).toBeGreaterThan(0)
    expect(result.delayBypass).toBe(false)
  })

  it('computeSpace at 0 bypasses reverb and delay', () => {
    const result = MacroEngine.computeSpace(0)
    expect(result.reverbBypass).toBe(true)
    expect(result.delayBypass).toBe(true)
  })

  it('computeIntensity returns source param and brightness', () => {
    const result = MacroEngine.computeIntensity(0.5, 'osc')
    expect(result.sourcePrimary).toBeGreaterThan(10)
    expect(result.sourcePrimary).toBeLessThan(80)
    expect(result.brightness).toBeGreaterThan(-0.2)
  })

  it('computeMorph returns hue, colorama, rotate', () => {
    const result = MacroEngine.computeMorph(0.5)
    expect(result.hue).toBeGreaterThan(0)
    expect(result.hue).toBeLessThan(0.8)
    expect(result.colorama).toBeGreaterThan(0)
    expect(result.rotate).toBeGreaterThan(0)
  })

  it('getSourcePrimaryKey returns correct key per source', () => {
    expect(MacroEngine.getSourcePrimaryKey('osc')).toBe('frequency')
    expect(MacroEngine.getSourcePrimaryKey('sacredGeometry')).toBe('pulse')
    expect(MacroEngine.getSourcePrimaryKey('tribalMask')).toBe('glow')
    expect(MacroEngine.getSourcePrimaryKey('paisleyFlow')).toBe('density')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ui/__tests__/MacroEngine.test.ts`
Expected: FAIL -- module not found.

- [ ] **Step 3: Implement MacroEngine**

Create `src/ui/MacroEngine.ts`:

```typescript
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function expLerp(a: number, b: number, t: number): number {
  return a * Math.pow(b / a, t)
}

const SOURCE_PRIMARY_RANGES: Record<string, { key: string; min: number; max: number }> = {
  osc: { key: 'frequency', min: 10, max: 80 },
  noise: { key: 'scale', min: 1, max: 15 },
  voronoi: { key: 'scale', min: 1, max: 15 },
  shape: { key: 'sides', min: 3, max: 12 },
  gradient: { key: 'speed', min: 0, max: 3 },
  solid: { key: 'r', min: 0, max: 1 },
  sacredGeometry: { key: 'pulse', min: 0.1, max: 3 },
  tribalMask: { key: 'glow', min: 0.1, max: 1.5 },
  particleField: { key: 'density', min: 0.1, max: 0.8 },
  voidPulse: { key: 'depth', min: 0.3, max: 1.8 },
  ritualFire: { key: 'turbulence', min: 0.5, max: 2.5 },
  paisleyFlow: { key: 'density', min: 0.3, max: 1.0 },
}

export const MacroEngine = {
  computeTone(t: number) {
    return {
      filterFrequency: expLerp(200, 8000, t),
      filterQ: lerp(1, 3, t),
      decay: lerp(0.5, 0.1, t),
    }
  },

  computeSpace(t: number) {
    return {
      reverbBypass: t <= 0.05,
      reverbWet: lerp(0, 0.8, t),
      delayBypass: t <= 0.3,
      delayWet: lerp(0, 0.6, t),
      delayFeedback: lerp(0.1, 0.6, t),
    }
  },

  computeIntensity(t: number, source: string) {
    const range = SOURCE_PRIMARY_RANGES[source] ?? { key: 'frequency', min: 0, max: 1 }
    return {
      sourcePrimary: lerp(range.min, range.max, t),
      brightness: lerp(-0.2, 0.5, t),
    }
  },

  computeMorph(t: number) {
    return {
      hue: lerp(0, 0.8, t),
      colorama: lerp(0, 0.3, t),
      rotate: lerp(0, 0.5, t),
    }
  },

  getSourcePrimaryKey(source: string): string {
    return SOURCE_PRIMARY_RANGES[source]?.key ?? 'frequency'
  },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/ui/__tests__/MacroEngine.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/MacroEngine.ts src/ui/__tests__/MacroEngine.test.ts
git commit -m "feat: add MacroEngine for Simple mode parameter mapping"
```

---

### Task 14: Create SimplePanel

**Files:**
- Create: `src/ui/SimplePanel.tsx`

- [ ] **Step 1: Create SimplePanel component**

```tsx
import { PillSelector } from './widgets/PillSelector'
import { Slider } from './widgets/Slider'

interface SimplePanelProps {
  // Presets
  presetNames: string[]
  activePresetIndex: number
  onPresetSelect: (index: number) => void
  // Sound
  synthType: string
  onSynthTypeChange: (type: string) => void
  tone: number
  onToneChange: (value: number) => void
  space: number
  onSpaceChange: (value: number) => void
  // Visuals
  visualGroup: string
  onVisualGroupChange: (group: string) => void
  intensity: number
  onIntensityChange: (value: number) => void
  morph: number
  onMorphChange: (value: number) => void
  // Rhythm
  bpm: number
  onBpmChange: (bpm: number) => void
  sequencerPlaying: boolean
  onToggleSequencer: () => void
}

const SYNTH_OPTIONS = [
  { value: 'FMSynth', label: 'FM' },
  { value: 'AMSynth', label: 'AM' },
  { value: 'MembraneSynth', label: 'Drum' },
  { value: 'MonoSynth', label: 'Mono' },
]

const VISUAL_GROUP_OPTIONS = [
  { value: 'Geometry', label: 'Geometry' },
  { value: 'Mask', label: 'Mask' },
  { value: 'Fire', label: 'Fire' },
  { value: 'Particles', label: 'Particles' },
  { value: 'Flow', label: 'Flow' },
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
  tone,
  onToneChange,
  space,
  onSpaceChange,
  visualGroup,
  onVisualGroupChange,
  intensity,
  onIntensityChange,
  morph,
  onMorphChange,
  bpm,
  onBpmChange,
  sequencerPlaying,
  onToggleSequencer,
}: SimplePanelProps) {
  const presetPills = presetNames.map((name, i) => ({
    value: String(i),
    label: name || `Slot ${i + 1}`,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Presets */}
      <div>
        <PillSelector
          options={presetPills}
          value={String(activePresetIndex)}
          accentColor="#FF1493"
          onChange={(v) => onPresetSelect(parseInt(v, 10))}
        />
      </div>

      {/* Sound */}
      <div>
        <p style={sectionStyle('#FFD700')}>Sound</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <PillSelector
            options={SYNTH_OPTIONS}
            value={synthType}
            accentColor="#FFD700"
            onChange={onSynthTypeChange}
          />
          <Slider
            label="Tone"
            value={tone}
            min={0}
            max={1}
            step={0.01}
            accentColor="#FFD700"
            onChange={onToneChange}
          />
          <Slider
            label="Space"
            value={space}
            min={0}
            max={1}
            step={0.01}
            accentColor="#FFD700"
            onChange={onSpaceChange}
          />
        </div>
      </div>

      {/* Visuals */}
      <div>
        <p style={sectionStyle('#00E676')}>Visuals</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <PillSelector
            options={VISUAL_GROUP_OPTIONS}
            value={visualGroup}
            accentColor="#00E676"
            onChange={onVisualGroupChange}
          />
          <Slider
            label="Intensity"
            value={intensity}
            min={0}
            max={1}
            step={0.01}
            accentColor="#00E676"
            onChange={onIntensityChange}
          />
          <Slider
            label="Morph"
            value={morph}
            min={0}
            max={1}
            step={0.01}
            accentColor="#00E676"
            onChange={onMorphChange}
          />
        </div>
      </div>

      {/* Rhythm */}
      <div>
        <p style={sectionStyle('#4488FF')}>Rhythm</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onToggleSequencer}
            tabIndex={-1}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: sequencerPlaying ? '#4488FF' : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: sequencerPlaying ? '#fff' : '#999999',
              transition: 'background-color 150ms',
              flexShrink: 0,
            }}
          >
            {sequencerPlaying ? '\u25a0' : '\u25b6'}
          </button>
          <div style={{ flex: 1 }}>
            <Slider
              label="BPM"
              value={bpm}
              min={60}
              max={200}
              step={1}
              accentColor="#4488FF"
              onChange={onBpmChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors (SimplePanel is not yet imported anywhere).

- [ ] **Step 3: Commit**

```bash
git add src/ui/SimplePanel.tsx
git commit -m "feat: add SimplePanel with macro knobs for beginner mode"
```

---

### Task 15: Recolor Shaders + Add paisleyFlow

**Files:**
- Modify: `src/visual/CustomShaders.ts`

- [ ] **Step 1: Replace all shader definitions with recolored versions and add paisleyFlow**

Replace the entire file content:

```typescript
const sacredGeometry = {
  name: 'sacredGeometry',
  type: 'src',
  inputs: [
    { type: 'float', name: 'sides', default: 6 },
    { type: 'float', name: 'rings', default: 5 },
    { type: 'float', name: 'pulse', default: 0.5 },
  ],
  glsl: `
    vec2 st = _st - 0.5;
    float r = length(st);
    float a = atan(st.y, st.x);
    float ringPattern = sin(r * rings * 6.2832 - time * pulse * 2.0) * 0.5 + 0.5;
    float petalAngle = mod(a, 6.2832 / sides) - 3.1416 / sides;
    float petals = cos(petalAngle * sides) * 0.5 + 0.5;
    float seedPattern = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
      float sa = i * 6.2832 / 6.0 + time * pulse * 0.3;
      vec2 center = vec2(cos(sa), sin(sa)) * 0.18;
      float d = length(st - center);
      seedPattern += smoothstep(0.15 + pulse * 0.02, 0.14 + pulse * 0.02, d);
    }
    seedPattern = clamp(seedPattern, 0.0, 1.0);
    float pattern = ringPattern * petals + seedPattern * 0.4;
    float glow = smoothstep(0.5, 0.0, r) * 0.3;
    pattern += glow;
    vec3 pink = vec3(1.0, 0.078, 0.576);
    vec3 gold = vec3(1.0, 0.843, 0.0);
    vec3 green = vec3(0.0, 0.902, 0.463);
    vec3 blue = vec3(0.267, 0.533, 1.0);
    vec3 ringCol = mix(pink, gold, ringPattern);
    ringCol = mix(ringCol, green, petals * 0.5);
    vec3 col = mix(vec3(0.03, 0.01, 0.05), ringCol, pattern);
    col += blue * seedPattern * 0.6;
    col += vec3(0.0, 0.749, 0.647) * glow;
    return vec4(col, 1.0);
  `,
}

const tribalMask = {
  name: 'tribalMask',
  type: 'src',
  inputs: [
    { type: 'float', name: 'symmetry', default: 4 },
    { type: 'float', name: 'complexity', default: 3 },
    { type: 'float', name: 'glow', default: 0.5 },
  ],
  glsl: `
    vec2 st = _st - 0.5;
    st.x = abs(st.x);
    float r = length(st);
    float a = atan(st.y, st.x);
    float eyeL = length((st - vec2(0.12, 0.06)) * vec2(1.8, 3.0));
    float eyeR = length((st - vec2(0.12, -0.06)) * vec2(1.8, 3.0));
    float eyes = smoothstep(0.12, 0.08, eyeL) + smoothstep(0.12, 0.08, eyeR);
    float bands = sin(st.y * complexity * 20.0 + time * 0.5) * 0.5 + 0.5;
    bands *= smoothstep(0.35, 0.15, r);
    float crown = smoothstep(0.02, 0.0, abs(r - 0.3 - sin(a * symmetry + time) * 0.05));
    crown *= step(0.0, st.y);
    float innerGlow = exp(-r * 4.0) * glow;
    float mask = bands * 0.5 + eyes * 0.8 + crown * 0.6 + innerGlow;
    vec3 teal = vec3(0.0, 0.749, 0.647);
    vec3 green = vec3(0.0, 0.902, 0.463);
    vec3 pink = vec3(1.0, 0.078, 0.576);
    vec3 gold = vec3(1.0, 0.843, 0.0);
    vec3 bandCol = mix(teal, green, bands);
    vec3 col = mix(vec3(0.02, 0.02, 0.03), bandCol, mask * 0.7);
    col += pink * eyes * 0.8;
    col += gold * crown * 0.9;
    col += vec3(1.0, 0.078, 0.576) * innerGlow * 1.5;
    return vec4(col, 1.0);
  `,
}

const glitchScan = {
  name: 'glitchScan',
  type: 'color',
  inputs: [
    { type: 'float', name: 'speed', default: 1 },
    { type: 'float', name: 'intensity', default: 0.5 },
    { type: 'float', name: 'bands', default: 50 },
  ],
  glsl: `
    vec2 st = _st;
    float scanLine = sin(st.y * bands * 3.1416) * 0.5 + 0.5;
    scanLine = pow(scanLine, 2.0 - intensity);
    float trackNoise = fract(sin(floor(st.y * 40.0) * 43758.5453 + time * speed) * 0.5);
    float tracking = step(1.0 - intensity * 0.15, trackNoise);
    float hShift = tracking * (fract(sin(time * 137.0 + st.y * 500.0) * 43758.5453) - 0.5) * intensity * 0.1;
    vec4 col = _c0;
    col.r = _c0.r + hShift * 2.0;
    col.b = _c0.b - hShift * 2.0;
    col.rgb *= mix(1.0, scanLine, intensity * 0.6);
    float blockY = floor(st.y * 12.0);
    float blockGlitch = step(0.97 - intensity * 0.05, fract(sin(blockY * 78.233 + floor(time * speed * 4.0) * 45.164) * 43758.5453));
    col.rgb = mix(col.rgb, col.gbr, blockGlitch * intensity);
    float flicker = 1.0 - fract(sin(time * speed * 13.0) * 43758.5453) * intensity * 0.1;
    col.rgb *= flicker;
    return vec4(col.rgb, _c0.a);
  `,
}

const particleField = {
  name: 'particleField',
  type: 'src',
  inputs: [
    { type: 'float', name: 'density', default: 50 },
    { type: 'float', name: 'drift', default: 0.3 },
    { type: 'float', name: 'size', default: 0.5 },
  ],
  glsl: `
    vec2 st = _st;
    vec3 col = vec3(0.0);
    vec2 grid = st * density;
    vec2 iGrid = floor(grid);
    vec2 fGrid = fract(grid);
    float brightness = 0.0;
    vec3 particleCol = vec3(0.0);
    for (float y = -1.0; y <= 1.0; y++) {
      for (float x = -1.0; x <= 1.0; x++) {
        vec2 neighbor = vec2(x, y);
        vec2 cellId = iGrid + neighbor;
        float h1 = fract(sin(dot(cellId, vec2(127.1, 311.7))) * 43758.5453);
        float h2 = fract(sin(dot(cellId + vec2(37.0, 17.0), vec2(127.1, 311.7))) * 43758.5453);
        vec2 randPos = vec2(h1, h2);
        float h3 = fract(sin(dot(cellId + vec2(53.0, 7.0), vec2(127.1, 311.7))) * 43758.5453);
        float h4 = fract(sin(dot(cellId + vec2(11.0, 91.0), vec2(127.1, 311.7))) * 43758.5453);
        randPos += vec2(
          sin(time * drift * (h3 * 2.0 - 1.0) + h1 * 6.28),
          cos(time * drift * (h4 * 2.0 - 1.0) + h2 * 6.28)
        ) * 0.3;
        float d = length(neighbor + randPos - fGrid);
        float h5 = fract(sin(dot(cellId + vec2(71.0, 31.0), vec2(127.1, 311.7))) * 43758.5453);
        float pSize = (0.01 + h5 * 0.03) * size;
        float particle = smoothstep(pSize, pSize * 0.1, d);
        float twinkle = sin(time * 2.0 + h1 * 100.0) * 0.5 + 0.5;
        particle *= 0.5 + twinkle * 0.5;
        float hue = fract(h1 * 3.0 + time * 0.05);
        vec3 pCol = vec3(0.0);
        if (hue < 0.166) pCol = vec3(1.0, 0.078, 0.576);
        else if (hue < 0.333) pCol = vec3(1.0, 0.2, 0.2);
        else if (hue < 0.5) pCol = vec3(1.0, 0.843, 0.0);
        else if (hue < 0.666) pCol = vec3(0.0, 0.902, 0.463);
        else if (hue < 0.833) pCol = vec3(0.0, 0.749, 0.647);
        else pCol = vec3(0.267, 0.533, 1.0);
        particleCol += pCol * particle;
        brightness += particle;
      }
    }
    col = particleCol;
    col += vec3(0.02, 0.01, 0.03) * (1.0 - length(st - 0.5));
    return vec4(col, 1.0);
  `,
}

const voidPulse = {
  name: 'voidPulse',
  type: 'src',
  inputs: [
    { type: 'float', name: 'depth', default: 3 },
    { type: 'float', name: 'rate', default: 0.5 },
    { type: 'float', name: 'spread', default: 1 },
  ],
  glsl: `
    vec2 st = _st - 0.5;
    float r = length(st);
    float a = atan(st.y, st.x);
    float breathPhase = time * rate;
    float ringWave = 0.0;
    vec3 ringColor = vec3(0.0);
    for (float i = 0.0; i < 5.0; i++) {
      float ringR = fract(breathPhase * 0.2 + i * 0.2) * spread;
      float ringWidth = 0.01 + 0.02 * depth;
      float ring = smoothstep(ringWidth, 0.0, abs(r - ringR)) * (1.0 - fract(breathPhase * 0.2 + i * 0.2));
      ringWave += ring;
      vec3 rCol = vec3(0.0);
      if (i < 1.0) rCol = vec3(1.0, 0.078, 0.576);
      else if (i < 2.0) rCol = vec3(1.0, 0.843, 0.0);
      else if (i < 3.0) rCol = vec3(0.0, 0.902, 0.463);
      else if (i < 4.0) rCol = vec3(0.267, 0.533, 1.0);
      else rCol = vec3(1.0, 0.4, 0.0);
      ringColor += rCol * ring;
    }
    float voidGlow = exp(-r * (4.0 + depth)) * 0.5;
    float angularNoise = sin(a * 6.0 + time * rate * 0.7) * 0.02 * depth;
    ringWave += smoothstep(0.01, 0.0, abs(r - 0.1 - angularNoise)) * 0.3;
    float tendril = sin(a * 3.0 + r * 10.0 - time * rate) * 0.5 + 0.5;
    tendril *= smoothstep(0.5, 0.1, r) * depth * 0.1;
    vec3 col = vec3(0.03, 0.02, 0.05) * (1.0 + (ringWave + voidGlow + tendril) * 1.5);
    col += ringColor;
    col += vec3(0.0, 0.749, 0.647) * voidGlow;
    col += vec3(1.0, 0.078, 0.576) * tendril;
    return vec4(col, 1.0);
  `,
}

const ritualFire = {
  name: 'ritualFire',
  type: 'src',
  inputs: [
    { type: 'float', name: 'turbulence', default: 3 },
    { type: 'float', name: 'height', default: 1 },
    { type: 'float', name: 'warmth', default: 0.7 },
  ],
  glsl: `
    vec2 st = _st;
    st.x -= 0.5;
    st.y = 1.0 - st.y;
    float noiseVal = sin(st.x * turbulence * 4.0 + time * 2.0 + sin(st.y * 5.0)) * 0.5
                   + sin(st.x * turbulence * 8.0 - time * 3.0 + cos(st.y * 8.0)) * 0.25
                   + sin(st.x * turbulence * 16.0 + time * 5.0) * 0.125;
    float flameWidth = 0.2 + st.y * 0.3;
    float flameMask = smoothstep(flameWidth, flameWidth * 0.3, abs(st.x + noiseVal * 0.1));
    float heightFade = smoothstep(height * 0.8, 0.0, st.y);
    float flame = flameMask * heightFade;
    float emberY = fract(st.y * 3.0 - time * 1.5);
    float emberX = fract(sin(floor(st.y * 3.0 - time * 1.5) * 73.156) * 43758.5453) - 0.5;
    float ember = smoothstep(0.02, 0.0, length(vec2(st.x - emberX * 0.3, emberY - 0.5)));
    ember *= step(0.7, fract(sin(floor(st.y * 3.0 - time * 1.5) * 41.0) * 43758.5453));
    vec3 col = vec3(0.0);
    col += vec3(1.0, 0.843, 0.0) * flame * warmth;
    col += vec3(1.0, 0.078, 0.576) * flame * (1.0 - warmth) * 2.0;
    col += vec3(1.0, 0.4, 0.0) * flameMask * 0.4;
    float emberPhase = fract(sin(floor(st.y * 3.0 - time * 1.5) * 23.0) * 43758.5453);
    vec3 emberCol = emberPhase < 0.33 ? vec3(1.0, 0.843, 0.0)
                  : emberPhase < 0.66 ? vec3(1.0, 0.078, 0.576)
                  : vec3(0.0, 0.902, 0.463);
    col += emberCol * ember * 0.7;
    float haze = smoothstep(0.6, 0.0, st.y) * 0.05 * turbulence;
    col += vec3(1.0, 0.4, 0.0) * haze;
    return vec4(col, 1.0);
  `,
}

const paisleyFlow = {
  name: 'paisleyFlow',
  type: 'src',
  inputs: [
    { type: 'float', name: 'density', default: 3 },
    { type: 'float', name: 'speed', default: 0.5 },
    { type: 'float', name: 'colorShift', default: 0 },
  ],
  glsl: `
    vec2 st = _st;
    float pattern = 0.0;
    for (float i = 1.0; i <= 4.0; i++) {
      float scale = density * i * 1.5;
      vec2 p = st * scale;
      float t = time * speed * (0.5 + i * 0.2);
      p.x += sin(p.y * 2.0 + t) * 0.5;
      p.y += cos(p.x * 1.5 - t * 0.7) * 0.4;
      float a = atan(fract(p.y) - 0.5, fract(p.x) - 0.5);
      float r = length(fract(p) - 0.5);
      float tear = smoothstep(0.4, 0.1, r + sin(a * 2.0 + t) * 0.15);
      float swirl = sin(a * 3.0 + r * 8.0 - t * 2.0) * 0.5 + 0.5;
      tear *= swirl;
      pattern += tear / i;
    }
    pattern = clamp(pattern, 0.0, 1.0);
    float hue = fract(pattern * 1.5 + colorShift + time * speed * 0.05);
    vec3 col = vec3(0.0);
    float h = hue * 6.0;
    if (h < 1.0) col = mix(vec3(1.0, 0.078, 0.576), vec3(1.0, 0.2, 0.2), h);
    else if (h < 2.0) col = mix(vec3(1.0, 0.2, 0.2), vec3(1.0, 0.843, 0.0), h - 1.0);
    else if (h < 3.0) col = mix(vec3(1.0, 0.843, 0.0), vec3(0.0, 0.902, 0.463), h - 2.0);
    else if (h < 4.0) col = mix(vec3(0.0, 0.902, 0.463), vec3(0.0, 0.749, 0.647), h - 3.0);
    else if (h < 5.0) col = mix(vec3(0.0, 0.749, 0.647), vec3(0.267, 0.533, 1.0), h - 4.0);
    else col = mix(vec3(0.267, 0.533, 1.0), vec3(1.0, 0.078, 0.576), h - 5.0);
    col *= pattern;
    float outline = smoothstep(0.02, 0.0, abs(pattern - 0.5)) * 0.3;
    col = mix(col, vec3(0.0), outline);
    col += vec3(0.01, 0.005, 0.02) * (1.0 - pattern);
    return vec4(col, 1.0);
  `,
}

export function registerCustomShaders(synth: Record<string, any>): void {
  const setFn = synth.setFunction as (def: Record<string, unknown>) => void
  if (typeof setFn !== 'function') return
  setFn(sacredGeometry)
  setFn(tribalMask)
  setFn(glitchScan)
  setFn(particleField)
  setFn(voidPulse)
  setFn(ritualFire)
  setFn(paisleyFlow)
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/visual/CustomShaders.ts
git commit -m "feat: recolor all shaders to neon palette, add paisleyFlow shader"
```

---

### Task 16: Wire Everything in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add paisleyFlow to SOURCE_ARG_KEYS**

Add to `SOURCE_ARG_KEYS`:
```typescript
paisleyFlow: ['density', 'speed', 'colorShift'],
```

- [ ] **Step 2: Import new components and add macro state**

Add imports:
```typescript
import { SimplePanel } from './ui/SimplePanel'
import { MacroEngine } from './ui/MacroEngine'
```

Add local state for macro values (after the visual UI state declarations):
```typescript
const [macroTone, setMacroTone] = useState(0.5)
const [macroSpace, setMacroSpace] = useState(0.3)
const [macroIntensity, setMacroIntensity] = useState(0.5)
const [macroMorph, setMacroMorph] = useState(0)
const [visualGroup, setVisualGroup] = useState('Geometry')
```

Add store selectors:
```typescript
const uiMode = useAppStore((s) => s.uiMode)
```

- [ ] **Step 3: Add visual group mapping**

```typescript
const VISUAL_GROUP_TO_SOURCE: Record<string, string> = {
  Geometry: 'sacredGeometry',
  Mask: 'tribalMask',
  Fire: 'ritualFire',
  Particles: 'particleField',
  Flow: 'paisleyFlow',
}
```

- [ ] **Step 4: Add macro handlers**

```typescript
const handleToneChange = useCallback((value: number) => {
  setMacroTone(value)
  const params = MacroEngine.computeTone(value)
  const store = useAppStore.getState()
  store.setEffectParam(0, 'frequency', params.filterFrequency)
  store.setEffectParam(0, 'Q', params.filterQ)
  store.setSynthParams({ decay: params.decay })
}, [])

const handleSpaceChange = useCallback((value: number) => {
  setMacroSpace(value)
  const params = MacroEngine.computeSpace(value)
  const store = useAppStore.getState()
  store.setEffectBypass(1, params.reverbBypass)
  store.setEffectWet(1, params.reverbWet)
  store.setEffectBypass(2, params.delayBypass)
  store.setEffectWet(2, params.delayWet)
  store.setEffectParam(2, 'feedback', params.delayFeedback)
}, [])

const handleIntensityChange = useCallback((value: number) => {
  setMacroIntensity(value)
  const params = MacroEngine.computeIntensity(value, visualSource)
  const key = MacroEngine.getSourcePrimaryKey(visualSource)
  handleSourceArgChange(key, params.sourcePrimary)
}, [visualSource, handleSourceArgChange])

const handleMorphChange = useCallback((value: number) => {
  setMacroMorph(value)
  const params = MacroEngine.computeMorph(value)
  // Update transforms: ensure hue, colorama, rotate exist
  setVisualTransforms((prev) => {
    let next = [...prev]
    const updateOrAdd = (fn: string, key: string, val: number) => {
      const idx = next.findIndex((t) => t.fn === fn)
      if (idx >= 0) {
        next[idx] = { ...next[idx], args: { ...next[idx].args, [key]: val } }
      } else if (val > 0.01) {
        next.push({ fn, args: { [key]: val } })
      }
    }
    updateOrAdd('hue', 'amount', params.hue)
    updateOrAdd('colorama', 'amount', params.colorama)
    updateOrAdd('rotate', 'angle', params.rotate)
    rebuildChain(visualSource, visualSourceArgs, next)
    return next
  })
}, [visualSource, visualSourceArgs, rebuildChain])

const handleVisualGroupChange = useCallback((group: string) => {
  setVisualGroup(group)
  const source = VISUAL_GROUP_TO_SOURCE[group] ?? 'osc'
  handleSourceChange(source)
}, [handleSourceChange])

const handleToggleMode = useCallback(() => {
  useAppStore.getState().toggleUIMode()
}, [])
```

- [ ] **Step 5: Update KeyboardHandler constructor**

Add `onToggleMode` to the KeyboardHandler callbacks:
```typescript
onToggleMode: () => {
  useAppStore.getState().toggleUIMode()
},
```

- [ ] **Step 6: Update HUD props**

```tsx
<HUD
  bpm={sequencer.bpm}
  presetName={currentPreset?.name ?? ''}
  audioLevel={analysis.envelope}
  panelOpen={panelOpen}
  sequencerPlaying={sequencer.playing}
  uiMode={uiMode}
  onToggleMode={handleToggleMode}
/>
```

- [ ] **Step 7: Update ControlPanel with mode toggle and conditional rendering**

```tsx
<ControlPanel open={panelOpen} uiMode={uiMode} onToggleMode={handleToggleMode}>
  {uiMode === 'simple' ? (
    <SimplePanel
      presetNames={presetSlots.map((name, i) => name ?? `Slot ${i + 1}`)}
      activePresetIndex={activeSlot}
      onPresetSelect={handlePresetSelect}
      synthType={synthType}
      onSynthTypeChange={handleSynthTypeChange}
      tone={macroTone}
      onToneChange={handleToneChange}
      space={macroSpace}
      onSpaceChange={handleSpaceChange}
      visualGroup={visualGroup}
      onVisualGroupChange={handleVisualGroupChange}
      intensity={macroIntensity}
      onIntensityChange={handleIntensityChange}
      morph={macroMorph}
      onMorphChange={handleMorphChange}
      bpm={sequencer.bpm}
      onBpmChange={handleBpmChange}
      sequencerPlaying={sequencer.playing}
      onToggleSequencer={handleToggleSequencer}
    />
  ) : (
    <>
      <PresetBar
        activeSlot={activeSlot}
        slots={presetSlots}
        onSelect={handlePresetSelect}
        onExport={handleExport}
        onImport={handleImport}
        onCopyURL={handleCopyURL}
      />
      <AudioPanel
        synthType={synthType}
        onSynthTypeChange={handleSynthTypeChange}
        synthParams={synthParams}
        onSynthParamChange={handleSynthParamChange}
        effects={effects.map((e) => ({ type: e.type, bypass: e.bypass, wet: e.wet }))}
        onEffectToggle={handleEffectToggle}
        onEffectWetChange={handleEffectWetChange}
        bpm={sequencer.bpm}
        onBpmChange={handleBpmChange}
        sequencerPlaying={sequencer.playing}
        onToggleSequencer={handleToggleSequencer}
        micEnabled={micEnabled}
        onToggleMic={handleToggleMic}
      />
      <VisualPanel
        source={visualSource}
        sourceArgs={visualSourceArgs}
        onSourceChange={handleSourceChange}
        onSourceArgChange={handleSourceArgChange}
        transforms={visualTransforms}
        onTransformArgChange={handleTransformArgChange}
        onAddTransform={handleAddTransform}
        onRemoveTransform={handleRemoveTransform}
      />
      <MappingPanel
        mappings={mappings}
        onAdd={handleAddMapping}
        onRemove={handleRemoveMapping}
        onUpdate={handleUpdateMapping}
      />
    </>
  )}
</ControlPanel>
```

- [ ] **Step 8: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 9: Verify all tests pass**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire mode toggle, macro engine, and simple panel in App"
```

---

### Task 17: Add uiMode localStorage Persistence

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add persistence effect**

Add after the `handleStart` function, inside the component:

```typescript
// Persist uiMode to localStorage
useEffect(() => {
  const saved = localStorage.getItem('hydra-instrument-mode')
  if (saved === 'simple' || saved === 'pro') {
    useAppStore.getState().setUIMode(saved)
  }
  return useAppStore.subscribe(
    (s) => s.uiMode,
    (mode) => localStorage.setItem('hydra-instrument-mode', mode)
  )
}, [])
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: persist uiMode to localStorage"
```

---

### Task 18: Manual Smoke Test

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the following in browser**

1. Click to start -- canvas renders
2. Press Tab -- panel opens with **mode toggle at top-right**
3. Panel shows Simple mode by default (presets, Sound, Visuals, Rhythm)
4. Macro sliders (Tone, Space, Intensity, Morph) affect audio/visuals in real time
5. Pill selectors for synth type and visual group work
6. Click mode toggle or press M -- panel switches to Pro mode (full controls)
7. Pro mode shows all controls with new colors (gold/green/blue/pink headers, brighter labels)
8. Select different visual sources -- sacredGeometry shows neon pink/gold/green, not dark purple
9. Select paisleyFlow -- shows flowing psychedelic pattern with neon rainbow
10. HUD (bottom-left) shows mode toggle when panel is closed
11. Presets still load/save correctly
12. Keyboard notes still work (A-L keys)

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 4: Final commit if any tweaks were needed**

```bash
git add -A
git commit -m "fix: smoke test tweaks"
```
