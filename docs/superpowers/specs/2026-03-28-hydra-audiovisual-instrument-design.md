# Hydra Audiovisual Instrument -- Design Spec

## Context

Create a browser-based audiovisual instrument -- an open sandbox where sound and visuals interplay in real time. The aesthetic is solemn, futuristic, and tribal. Every interaction (keyboard, mouse, touch) feeds both audio synthesis and visual generation simultaneously. The system should feel like an instrument with endless possibility: users build their own sonic-visual patches by configuring synths, effects, Hydra visual chains, and the mappings between them.

No backend. Entirely client-side. Deploy to GitHub Pages.

## Architecture: Split-Pane Instrument

### Layout

- **Full-screen Hydra canvas** as the primary experience
- **Collapsible control panel** slides in from the right (Tab key toggles)
- **Minimal HUD overlay** when controls hidden: BPM, preset name, audio level indicator, "TAB to open controls" hint
- **Dark, borderless aesthetic** -- the UI melts into the visuals. No borders, no chrome. Sans-serif throughout
- **Keyboard always active** for playing notes regardless of panel state

### Control Panel Sections

Three collapsible sections within the right panel:

1. **Audio Engine** -- synth type selector, frequency/envelope controls, effects chain toggles and wet/dry sliders
2. **Visual Engine** -- Hydra source selector, geometry/color/modulate parameter sliders, custom shader toggles
3. **Mappings** -- list of active audio-to-visual mappings, each with source/target/range/smooth/curve. Add/remove/edit freely

## Audio Architecture

### Three Input Sources

1. **Keyboard Synth** (Tone.js PolySynth)
   - Switchable types: FM, AM, Membrane, MonoSynth
   - Polyphonic -- play chords
   - ADSR envelope exposed as sliders
   - Keyboard layout: QWERTY row = upper octave (C4-C5), ASDF row = lower octave (C3-C4), sharps on the row above (W, E, T, Y, U and S, D, G, H, J)
   - Z/X keys shift octave down/up

2. **Step Sequencer** (Tone.js Transport + Sequence)
   - Pattern-based, BPM-synced loop
   - Programmable note sequence (editable in control panel)
   - Space bar starts/stops
   - BPM adjustable via slider

3. **Mic / Line Input** (getUserMedia)
   - Web Audio API microphone capture
   - Feeds through the same effects chain as synth sources
   - Toggle on/off in control panel

### Shared Effects Chain

All three sources mix into one signal path:

Filter -> Reverb -> Delay -> Distortion -> Compressor -> Output

- Each effect has a bypass toggle and wet/dry slider
- User can reorder effects (drag-and-drop in panel, stretch goal)

### Dual Analysis Output

The mixed signal splits to:

1. **Speakers** (Tone.Destination)
2. **FFT Analyser** -- configurable 4-16 bands, exposed as reactive values for Hydra
3. **Envelope Follower** -- overall loudness as a single reactive value for Hydra

## Visual Architecture

### Hydra Engine (hydra-synth npm package)

Embedded directly -- not in an iframe. Full API access.

**Standard Hydra chain**: source -> geometry -> color -> modulate -> blend -> output

- All 53 built-in Hydra GLSL functions available
- 4 output buffers (o0-o3) for layered compositions with blend/feedback between buffers
- Users select source function, add transforms, configure parameters via sliders in the Visual Engine panel

### Custom GLSL Shaders

Registered via `setFunction()` at startup. These extend Hydra's vocabulary with the project's aesthetic:

| Function | Type | Description |
|---|---|---|
| `sacredGeometry(sides, rings, pulse)` | src | Concentric rings, mandalas, flower-of-life patterns |
| `tribalMask(symmetry, complexity, glow)` | src | Symmetric face-like patterns, totemic geometry |
| `glitchScan(speed, intensity, bands)` | color | Horizontal scan lines, data corruption, VHS artifacts |
| `particleField(density, drift, size)` | src | Floating dust motes, star fields, ember drifts |
| `voidPulse(depth, rate, spread)` | src | Deep bass-reactive breathing, dark energy expansion |
| `ritualFire(turbulence, height, warmth)` | src | Flame-like turbulence, ember trails, heat distortion |

## Audio-Visual Mapping System

The mapping system is the core bridge. Each mapping is an object:

```typescript
interface Mapping {
  id: string
  source: MappingSource    // what drives it
  target: MappingTarget    // what it controls
  range: [number, number]  // output min/max
  smooth: number           // interpolation 0-1 (0=instant, 1=glacial)
  curve: 'linear' | 'exponential' | 'step'
}
```

### Available Sources

- `fft[0]` through `fft[15]` -- individual FFT band energy
- `envelope` -- overall loudness
- `noteVelocity` -- velocity of last played note (0-1)
- `noteFrequency` -- frequency of last played note (normalized)
- `mouse.x`, `mouse.y` -- mouse position (normalized 0-1)
- `sequencerStep` -- current step position in sequence (normalized)

### Available Targets

Any numeric Hydra parameter in the active visual chain:
- Source params: `osc.frequency`, `noise.scale`, `voronoi.scale`, `shape.sides`, etc.
- Geometry params: `rotate.angle`, `scale.amount`, `kaleid.nSides`, `pixelate.x`, etc.
- Color params: `colorama.amount`, `hue.amount`, `brightness.amount`, etc.
- Modulation params: `modulate.amount`, `modulateRotate.amount`, etc.
- Custom shader params: `sacredGeometry.pulse`, `voidPulse.depth`, etc.

### Default Mappings (per preset)

Each preset ships with curated mappings. Users can modify, add, or remove any mapping.

## Interaction Design

### Keyboard

| Key | Action |
|---|---|
| QWERTY / ASDF rows | Play notes (upper / lower octave) |
| Z / X | Octave down / up |
| Tab | Toggle control panel |
| Space | Start / stop sequencer |
| 1-9 | Load preset slot |
| Shift+1-9 | Save current state to preset slot |
| Esc | Panic -- silence all audio, reset visuals to current preset base |

### Mouse & Touch

| Input | Action |
|---|---|
| Mouse position | Mappable to any param (defaults vary by preset) |
| Click + drag on canvas | XY pad mode -- X = pitch bend, Y = filter cutoff (mappable) |
| Scroll wheel | Zoom visual scale |
| Multi-touch | Each finger is an independent XY source |

### Control Panel Widgets

- **Sliders** for continuous parameters
- **Dropdowns** for discrete choices (synth type, Hydra source function)
- **Toggles** for on/off (effect bypass, mic input)
- **XY pad** widget for 2D parameter control

## Preset System

### 6 Starter Presets

| Name | Mood | Audio | Visual | Key Mappings |
|---|---|---|---|---|
| void | Solemn | Sub bass drone (MonoSynth, heavy reverb) | Dark voronoi cells | envelope -> voronoi.scale, fft[0] -> scale.amount |
| ritual | Tribal | Membrane drum synth | sacredGeometry + kaleid | fft[0] -> sacredGeometry.pulse, noteVelocity -> kaleid.nSides |
| signal | Futuristic | FM synth arpeggios (sequencer) | glitchScan + osc | fft[3] -> colorama.amount, sequencerStep -> osc.frequency |
| ember | Tribal warmth | Warm pad synth (AM) | ritualFire + noise modulation | mouse.x -> ritualFire.turbulence, envelope -> ritualFire.height |
| cosmos | Infinite | Reverb-heavy sine tones | particleField + gradient | fft[1] -> particleField.density, mouse.y -> rotate.angle |
| mask | Ancient/eerie | Dissonant intervals (FM) | tribalMask + feedback | noteFrequency -> tribalMask.symmetry, fft[2] -> tribalMask.glow |

### Persistence

- **9 preset slots** (1-9 keys). First 6 pre-filled with starter presets
- **localStorage** for persistence across sessions
- **JSON export/import** via buttons in control panel
- **URL hash encoding** -- paste a URL to load a preset, copy URL to share

### Preset Data Shape

```typescript
interface Preset {
  name: string
  audio: {
    synthType: string
    synthParams: Record<string, number>
    effects: EffectConfig[]
    sequencer: SequencerConfig | null
  }
  visual: {
    chain: HydraChainConfig  // source + transforms in order
    customShaders: string[]  // which custom shaders are active
  }
  mappings: Mapping[]
  meta: {
    createdAt: string
    description: string
  }
}
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict mode) |
| Build | Vite |
| Audio | Tone.js |
| Visuals | hydra-synth (npm package) |
| Custom shaders | GLSL via Hydra's setFunction() |
| Styling | Tailwind CSS |
| Persistence | localStorage + URL hash |
| Deploy | GitHub Pages |

## File Structure

```
hydra/
  src/
    main.tsx
    App.tsx
    audio/
      AudioEngine.ts          # Tone.js setup, synth management
      EffectsChain.ts         # Effects pipeline
      Sequencer.ts            # Step sequencer
      MicInput.ts             # getUserMedia wrapper
      Analyser.ts             # FFT + envelope follower
    visual/
      HydraEngine.ts          # hydra-synth initialization + chain builder
      CustomShaders.ts        # setFunction() definitions for 6 custom shaders
      ShaderDefinitions.glsl  # GLSL source strings
    mapping/
      MappingEngine.ts        # Reads sources, applies transforms, writes to targets
      MappingTypes.ts         # TypeScript interfaces
    presets/
      PresetManager.ts        # Load/save/export/import logic
      defaults/               # 6 starter preset JSON files
    ui/
      HUD.tsx                 # Minimal overlay (BPM, preset name, levels)
      ControlPanel.tsx        # Right-side panel container
      AudioPanel.tsx          # Audio engine controls
      VisualPanel.tsx         # Visual engine controls
      MappingPanel.tsx        # Mapping editor
      PresetBar.tsx           # Preset slot selector
      widgets/
        Slider.tsx
        Toggle.tsx
        Dropdown.tsx
        XYPad.tsx
    input/
      KeyboardHandler.ts      # Musical keyboard + modifier keys
      MouseHandler.ts         # Mouse/touch position + XY pad
    hooks/
      useAudioEngine.ts
      useHydraEngine.ts
      useMappingEngine.ts
      usePresets.ts
      useKeyboard.ts
      useMouse.ts
    state/
      store.ts                # React context or Zustand store
  public/
    index.html
  tailwind.config.ts
  vite.config.ts
  tsconfig.json
  package.json
```

## Verification Plan

1. **Audio**: Open the app, press keyboard keys -- hear notes with correct pitch. Switch synth type -- hear different timbres. Toggle effects -- hear reverb, delay, etc. Start sequencer -- hear looping pattern
2. **Visuals**: Hydra canvas renders on load with default preset. Visuals respond to audio in real time (play loud note, see visual pulse). Switch presets -- visuals change immediately
3. **Mapping**: Open control panel, add a new mapping (e.g. fft[0] -> rotate.angle). Play audio -- see rotation respond to bass. Remove mapping -- rotation stops responding
4. **Presets**: Load preset 1-6 -- each has distinct audio + visual character. Save to slot 7, reload page -- slot 7 persists. Export JSON -- valid file. Import on another browser -- same state
5. **Interaction**: Mouse movement affects visuals per mapping. Tab toggles panel without interrupting audio. Esc silences everything. Z/X shift octaves
6. **Deploy**: `npm run build` produces static files. Deploy to GitHub Pages -- works without backend
