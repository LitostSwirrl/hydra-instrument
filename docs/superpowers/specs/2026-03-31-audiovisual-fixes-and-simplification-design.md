# Audiovisual Fixes and Pro Mode Simplification

**Date:** 2026-03-31
**Status:** Approved

## Problem

The hydra audiovisual instrument has several broken features and UX issues:
1. Keyboard notes (A-L keys) don't play or kill the running sequencer
2. Visual output doesn't respond to audio/macro changes as expected
3. Sidebar is hidden by default, making it hard for new users to discover controls
4. Pro mode is cluttered with too many visible sections

## Inspiration

From the Hydra Garden (https://hydra.ojack.xyz/garden/), curated aesthetic techniques:
- **Monochrome organic filaments**: `osc().diff(osc().rotate(pi/2)).modulate(noise(), 0.15).blend(o0, 0.94)` (Malitzin Cortes)
- **Bioluminescent cells**: `shape(20).repeat(dynamic).modulateRotate(o0).modulate(noise())` (Mahalia H-R)
- **Topographic contours**: `osc(4).pixelate(2, 20).modulate(noise(2.5), breathing)` (Olivia Jack)
- **Deep organic flow**: double-nested `modulate(noise().modulate(noise()))` (Rangga Purnama Aji)
- **Bokeh trails**: `shape(200, 0.5, 1.5).add(o0, 0.5).scale(0.9)` (Flor de Fuego)

Key takeaway: audio reactivity works best with smooth parameter modulation of a few key params (scale, modulate amount, scroll speed) rather than many mapped params.

## Design

### A. Fix keyboard notes -- use superdough directly

**Root cause:** `StrudelEngine.noteOn()` calls `evaluate(pattern, true)` which replaces the current pattern in the Strudel repl scheduler, killing the running sequencer pattern.

**Fix:** Import and use superdough's `superdough()` function directly for one-shot notes. This triggers audio without touching the scheduler.

```typescript
// In StrudelEngine.noteOn():
const { superdough } = await import('@strudel/superdough')
superdough({ note, s: this.keyboardConfig.s, gain,
             lpf: globalRef.tone * 2000 + 200,
             room: globalRef.space * 0.8 })
```

If `superdough` isn't directly importable from `@strudel/web`, fall back to `getAudioContext().resume()` + raw Web Audio oscillator. But superdough is the preferred path since it handles synth types, effects, and routing.

**Alternative considered:** Use a separate repl instance for keyboard notes. Rejected because it doubles the audio engine overhead and complicates routing.

### B. Bridge macros to visual reactivity

**Root cause:** Macro sliders (Filter/Reverb/Volume) only set `globalThis` variables for Strudel pattern code. They don't affect visual parameters.

The MappingEngine already maps analysis sources (envelope, FFT, cycle) to visual targets. The fix is two-fold:

1. **Register macros as mapping sources** in `MappingTypes.ts`:
   ```typescript
   case 'macro.tone': return state.macros.tone
   case 'macro.space': return state.macros.space
   case 'macro.intensity': return state.macros.intensity
   ```

2. **Add macro-to-visual mappings in presets** so slider movement immediately affects visuals. Example for void preset:
   ```typescript
   { source: 'macro.tone', target: 'osc.frequency', range: [20, 100], smooth: 0.1 }
   ```

This keeps the existing mapping architecture intact while making macros drive visuals.

### C. Sidebar open by default + Tab hint

1. Change `panelOpen: false` to `panelOpen: true` in `store.ts` initial state
2. When panel is closed, show a persistent "Tab" pill anchored to the right edge of the screen:
   - Small, translucent, vertical text or icon
   - Clicking it also opens the panel
   - Positioned at vertical center-right

The existing HUD "tab" hint (bottom-right, fades after 3s) can be removed since the persistent pill replaces it.

### D. Simplify pro mode

Current pro mode sections (top to bottom):
1. Mode toggle
2. Rhythm (BPM + play/stop)
3. Pattern editor (textarea)
4. Instrument (synth type, octave)
5. Macros (filter, reverb, volume)
6. PresetBar (6 slots + export/import/URL)
7. VisualPanel (source + transforms editor)
8. MappingPanel (source-to-target mappings)

**Simplified layout:**
1. Mode toggle (keep)
2. Rhythm (keep -- always visible, primary control)
3. PresetBar (move up -- presets are the main navigation)
4. Macros (keep always visible -- primary performance controls)
5. Pattern editor (make collapsible, collapsed by default, label "Pattern Code")
6. Instrument (merge into pattern section or keep as small row)
7. Visual (collapsible, collapsed by default, label "Visual Chain")
8. Mappings (collapsible, collapsed by default, label "Mappings")

Key changes:
- PresetBar moves to top (before macros) since presets are the primary way to change the experience
- Pattern/Visual/Mappings become collapsible sections so they don't overwhelm
- Macros stay always-visible because they're the main performance knobs
- Remove duplicate synth/octave controls (they appear in both ControlPanel pro mode and SimplePanel) -- keep only in a compact instrument row

### E. Garden-inspired preset improvements

Update existing presets with techniques from the garden research:

- **void**: Keep current filament aesthetic, add `luma()` threshold for crisper edges
- **signal**: Add `modulateKaleid` for more interesting moire patterns
- **cosmos**: Use `shape(20).modulateRotate(o0)` for bioluminescent feel
- **ember**: Use double-nested `modulate(noise().modulate(noise()))` for deeper organic flow

Add macro-to-visual mappings to all presets so sliders always affect both audio and visuals.

## Files to Modify

| File | Changes |
|------|---------|
| `src/audio/StrudelEngine.ts` | Replace `evaluate()` in noteOn with superdough |
| `src/mapping/MappingTypes.ts` | Add macro.tone/space/intensity as sources |
| `src/state/store.ts` | Set `panelOpen: true` |
| `src/ui/ControlPanel.tsx` | Add collapsible sections, reorder pro mode |
| `src/ui/HUD.tsx` | Add persistent Tab pill when panel closed, remove fading hint |
| `src/ui/MappingPanel.tsx` | Wrap in collapsible section |
| `src/ui/VisualPanel.tsx` | Wrap in collapsible section |
| `src/presets/defaults/*.ts` | Add macro-to-visual mappings, improve visual chains |
| `src/types/strudel-web.d.ts` | Add superdough type if needed |

## Out of Scope

- New presets (only improve existing 6)
- Mouse input implementation
- Note sustain/release (remains one-shot)
- Pattern editor syntax highlighting
