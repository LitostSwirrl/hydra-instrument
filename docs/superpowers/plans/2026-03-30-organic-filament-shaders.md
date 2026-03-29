# Organic Filament Shader Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 7 custom GLSL shaders with organic filament aesthetic -- line-based, neutral monochrome, dream-state visuals.

**Architecture:** Rewrite `CustomShaders.ts` with 7 new shader definitions, update 6 preset files with new source/transform/mapping configs, update App.tsx source-arg mappings. No engine changes.

**Tech Stack:** GLSL (WebGL), TypeScript, hydra-synth

---

### Task 1: Write drift shader (replaces voidPulse)

**Files:**
- Modify: `src/visual/CustomShaders.ts` (replace `voidPulse` const with `drift`)

- [ ] **Step 1: Write the drift shader definition**

Replace the `voidPulse` const in `CustomShaders.ts` with:

```ts
const drift = {
  name: 'drift',
  type: 'src',
  inputs: [
    { type: 'float', name: 'speed', default: 0.5 },
    { type: 'float', name: 'density', default: 8 },
    { type: 'float', name: 'amplitude', default: 0.3 },
  ],
  glsl: `
    vec2 st = _st;
    float col = 0.0;
    for (float i = 0.0; i < 12.0; i++) {
      float y = (i + 0.5) / density;
      float phase = i * 1.618 + time * speed * (0.3 + fract(i * 0.7) * 0.4);
      float wave = y + sin(st.x * 3.0 + phase) * amplitude * (0.5 + fract(i * 0.37) * 0.5)
                     + sin(st.x * 7.0 - phase * 0.7) * amplitude * 0.3;
      float dist = abs(st.y - wave);
      float thickness = 0.002 + 0.003 * sin(time * speed * 0.5 + i);
      col += smoothstep(thickness * 2.0, 0.0, dist) * (0.15 + 0.1 * sin(time * 0.3 + i * 2.0));
    }
    float glow = exp(-length(st - 0.5) * 2.0) * 0.03;
    col += glow;
    return vec4(vec3(col), 1.0);
  `,
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 2: Write dendrite shader (replaces sacredGeometry)

**Files:**
- Modify: `src/visual/CustomShaders.ts` (replace `sacredGeometry` const with `dendrite`)

- [ ] **Step 1: Write the dendrite shader definition**

Replace the `sacredGeometry` const with:

```ts
const dendrite = {
  name: 'dendrite',
  type: 'src',
  inputs: [
    { type: 'float', name: 'branches', default: 5 },
    { type: 'float', name: 'depth', default: 3 },
    { type: 'float', name: 'pulse', default: 0.5 },
  ],
  glsl: `
    vec2 st = _st - 0.5;
    float r = length(st);
    float a = atan(st.y, st.x);
    float col = 0.0;
    for (float d = 1.0; d <= 5.0; d++) {
      if (d > depth) break;
      float freq = branches * pow(2.0, d - 1.0);
      float branchAngle = mod(a + time * pulse * 0.1 / d, 6.2832 / freq) - 3.1416 / freq;
      float branchDist = abs(branchAngle * r * freq * 0.15);
      float rMin = (d - 1.0) * 0.08 + 0.02;
      float rMax = d * 0.12 + 0.05;
      float radialMask = smoothstep(rMin, rMin + 0.02, r) * smoothstep(rMax + 0.02, rMax, r);
      float thickness = 0.008 / d;
      float line = smoothstep(thickness * 2.0, 0.0, branchDist) * radialMask;
      col += line * (0.35 / d);
    }
    float centerGlow = exp(-r * 8.0) * 0.15 * (0.8 + 0.2 * sin(time * pulse));
    col += centerGlow;
    float nodeRing = smoothstep(0.003, 0.0, abs(r - 0.02));
    col += nodeRing * 0.4;
    for (float i = 0.0; i < 5.0; i++) {
      if (i >= branches) break;
      float na = i * 6.2832 / branches + time * pulse * 0.1;
      for (float d = 1.0; d <= 3.0; d++) {
        float nr = d * 0.12;
        vec2 np = vec2(cos(na), sin(na)) * nr;
        float nd = length(st - np);
        col += smoothstep(0.006, 0.0, nd) * (0.3 / d);
      }
    }
    return vec4(vec3(col), 1.0);
  `,
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 3: Write web shader (replaces glitchScan)

**Files:**
- Modify: `src/visual/CustomShaders.ts` (replace `glitchScan` const with `web`)

- [ ] **Step 1: Write the web shader definition**

Replace the `glitchScan` const with:

```ts
const web = {
  name: 'web',
  type: 'src',
  inputs: [
    { type: 'float', name: 'connections', default: 6 },
    { type: 'float', name: 'tension', default: 0.5 },
    { type: 'float', name: 'breathe', default: 0.3 },
  ],
  glsl: `
    vec2 st = _st;
    float col = 0.0;
    float gridSize = connections;
    for (float i = 0.0; i < 8.0; i++) {
      if (i >= gridSize) break;
      for (float j = 0.0; j < 8.0; j++) {
        if (j >= gridSize) break;
        vec2 cellId = vec2(i, j);
        float h1 = fract(sin(dot(cellId, vec2(127.1, 311.7))) * 43758.5453);
        float h2 = fract(sin(dot(cellId, vec2(269.5, 183.3))) * 43758.5453);
        vec2 nodePos = (cellId + 0.5) / gridSize;
        nodePos += vec2(
          sin(time * breathe * (h1 - 0.5) + h1 * 6.28),
          cos(time * breathe * (h2 - 0.5) + h2 * 6.28)
        ) * 0.04 * tension;
        float nd = length(st - nodePos);
        col += smoothstep(0.008, 0.0, nd) * 0.5;
        col += exp(-nd * 60.0) * 0.05;
        for (float ni = i; ni < 8.0; ni++) {
          if (ni >= gridSize) break;
          for (float nj = 0.0; nj < 8.0; nj++) {
            if (nj >= gridSize) break;
            if (ni == i && nj <= j) continue;
            vec2 nCellId = vec2(ni, nj);
            float nh1 = fract(sin(dot(nCellId, vec2(127.1, 311.7))) * 43758.5453);
            float nh2 = fract(sin(dot(nCellId, vec2(269.5, 183.3))) * 43758.5453);
            float connHash = fract(sin(dot(cellId + nCellId, vec2(41.7, 89.3))) * 43758.5453);
            if (connHash > tension) continue;
            vec2 nNodePos = (nCellId + 0.5) / gridSize;
            nNodePos += vec2(
              sin(time * breathe * (nh1 - 0.5) + nh1 * 6.28),
              cos(time * breathe * (nh2 - 0.5) + nh2 * 6.28)
            ) * 0.04 * tension;
            vec2 pa = st - nodePos;
            vec2 ba = nNodePos - nodePos;
            float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            float lineDist = length(pa - ba * t);
            float edgeDist = length(nNodePos - nodePos);
            if (edgeDist < 0.5) {
              col += smoothstep(0.003, 0.0, lineDist) * 0.15 * (1.0 - edgeDist * 2.0);
            }
          }
        }
      }
    }
    return vec4(vec3(min(col, 1.0)), 1.0);
  `,
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 4: Write pulse shader (replaces ritualFire)

**Files:**
- Modify: `src/visual/CustomShaders.ts` (replace `ritualFire` const with `pulse`)

- [ ] **Step 1: Write the pulse shader definition**

Replace the `ritualFire` const with:

```ts
const pulse = {
  name: 'pulse',
  type: 'src',
  inputs: [
    { type: 'float', name: 'rings', default: 5 },
    { type: 'float', name: 'speed', default: 0.5 },
    { type: 'float', name: 'deform', default: 0.3 },
  ],
  glsl: `
    vec2 st = _st - 0.5;
    float a = atan(st.y, st.x);
    float r = length(st);
    float col = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
      if (i >= rings) break;
      float ringR = fract(time * speed * 0.15 + i / rings) * 0.6;
      float deformation = sin(a * 3.0 + time * speed * 0.5 + i) * deform * 0.05
                        + sin(a * 5.0 - time * speed * 0.3 + i * 2.0) * deform * 0.03;
      float ringDist = abs(r - ringR - deformation);
      float thickness = 0.002 + 0.002 * (1.0 - ringR / 0.6);
      float fade = 1.0 - fract(time * speed * 0.15 + i / rings);
      float ring = smoothstep(thickness * 2.5, 0.0, ringDist) * fade * 0.3;
      col += ring;
    }
    float centerPulse = exp(-r * 12.0) * 0.12 * (0.7 + 0.3 * sin(time * speed * 2.0));
    col += centerPulse;
    float outerGlow = smoothstep(0.5, 0.3, r) * 0.02;
    col += outerGlow;
    return vec4(vec3(col), 1.0);
  `,
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 5: Write spore shader (replaces particleField)

**Files:**
- Modify: `src/visual/CustomShaders.ts` (replace `particleField` const with `spore`)

- [ ] **Step 1: Write the spore shader definition**

Replace the `particleField` const with:

```ts
const spore = {
  name: 'spore',
  type: 'src',
  inputs: [
    { type: 'float', name: 'count', default: 40 },
    { type: 'float', name: 'drift', default: 0.3 },
    { type: 'float', name: 'trail', default: 0.5 },
  ],
  glsl: `
    vec2 st = _st;
    float col = 0.0;
    for (float i = 0.0; i < 60.0; i++) {
      if (i >= count) break;
      float h1 = fract(sin(i * 127.1) * 43758.5453);
      float h2 = fract(sin(i * 269.5) * 43758.5453);
      float h3 = fract(sin(i * 419.2) * 43758.5453);
      vec2 pos = vec2(h1, h2);
      pos.x += sin(time * drift * (h3 - 0.5) * 2.0 + h1 * 6.28) * 0.15;
      pos.y += cos(time * drift * (h1 - 0.5) * 2.0 + h2 * 6.28) * 0.15;
      pos = fract(pos);
      float d = length(st - pos);
      float size = 0.003 + h3 * 0.004;
      col += smoothstep(size, 0.0, d) * 0.5;
      col += exp(-d * 100.0) * 0.04;
      vec2 vel = vec2(
        cos(time * drift * (h3 - 0.5) * 2.0 + h1 * 6.28),
        -sin(time * drift * (h1 - 0.5) * 2.0 + h2 * 6.28)
      ) * 0.15;
      for (float t = 1.0; t <= 6.0; t++) {
        vec2 trailPos = pos - vel * t * 0.012 * trail;
        trailPos = fract(trailPos);
        float td = length(st - trailPos);
        float trailSize = size * (1.0 - t / 8.0);
        col += smoothstep(trailSize, 0.0, td) * 0.08 * (1.0 - t / 7.0);
      }
    }
    float ambient = exp(-length(st - 0.5) * 3.0) * 0.015;
    col += ambient;
    return vec4(vec3(min(col, 1.0)), 1.0);
  `,
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 6: Write weave shader (replaces tribalMask)

**Files:**
- Modify: `src/visual/CustomShaders.ts` (replace `tribalMask` const with `weave`)

- [ ] **Step 1: Write the weave shader definition**

Replace the `tribalMask` const with:

```ts
const weave = {
  name: 'weave',
  type: 'src',
  inputs: [
    { type: 'float', name: 'layers', default: 6 },
    { type: 'float', name: 'frequency', default: 4 },
    { type: 'float', name: 'phase', default: 0.5 },
  ],
  glsl: `
    vec2 st = _st;
    float col = 0.0;
    float accumDensity = 0.0;
    for (float i = 0.0; i < 10.0; i++) {
      if (i >= layers) break;
      float angle = i * 3.1416 / layers;
      float s = sin(angle);
      float c = cos(angle);
      float projected = st.x * c + st.y * s;
      float wave = sin(projected * frequency * 6.2832 + time * phase + i * 1.2) * 0.5 + 0.5;
      float line = smoothstep(0.48, 0.5, wave) - smoothstep(0.5, 0.52, wave);
      line *= 0.25;
      float line2 = smoothstep(0.47, 0.5, wave) - smoothstep(0.5, 0.53, wave);
      accumDensity += line2;
      col += line;
    }
    float moire = accumDensity * accumDensity * 0.03;
    col += moire;
    float centerFade = 1.0 - smoothstep(0.3, 0.6, length(st - 0.5));
    col *= 0.7 + centerFade * 0.3;
    return vec4(vec3(col), 1.0);
  `,
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 7: Write mycelium shader (replaces paisleyFlow)

**Files:**
- Modify: `src/visual/CustomShaders.ts` (replace `paisleyFlow` const with `mycelium`)

- [ ] **Step 1: Write the mycelium shader definition**

Replace the `paisleyFlow` const with:

```ts
const mycelium = {
  name: 'mycelium',
  type: 'src',
  inputs: [
    { type: 'float', name: 'growth', default: 0.5 },
    { type: 'float', name: 'branching', default: 4 },
    { type: 'float', name: 'thickness', default: 0.5 },
  ],
  glsl: `
    vec2 st = _st;
    float col = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
      if (i >= branching * 2.0) break;
      float h = fract(sin(i * 73.156) * 43758.5453);
      float startEdge = floor(h * 4.0);
      vec2 origin;
      if (startEdge < 1.0) origin = vec2(0.0, h);
      else if (startEdge < 2.0) origin = vec2(1.0, h);
      else if (startEdge < 3.0) origin = vec2(h, 0.0);
      else origin = vec2(h, 1.0);
      vec2 pos = origin;
      vec2 dir = normalize(vec2(0.5) - origin + vec2(sin(i * 3.0), cos(i * 5.0)) * 0.3);
      float pathLen = 0.3 + h * 0.5;
      float segments = 20.0;
      vec2 prevPos = pos;
      for (float s = 0.0; s < 20.0; s++) {
        float t = s / segments;
        if (t > growth) break;
        float turnNoise = sin(s * 2.0 + i * 7.0 + time * growth * 0.5) * 0.3
                        + sin(s * 5.0 + i * 3.0 - time * 0.3) * 0.15;
        dir = normalize(dir + vec2(-dir.y, dir.x) * turnNoise * 0.3);
        pos = prevPos + dir * pathLen / segments;
        vec2 pa = st - prevPos;
        vec2 ba = pos - prevPos;
        float segT = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float segDist = length(pa - ba * segT);
        float lineW = (0.002 + 0.003 * thickness) * (1.0 - t * 0.5);
        col += smoothstep(lineW * 2.0, 0.0, segDist) * 0.2 * (1.0 - t * 0.7);
        if (fract(sin(s * 41.0 + i * 17.0) * 43758.5453) > 0.6 && s > 2.0) {
          float nd = length(st - pos);
          col += smoothstep(0.005, 0.0, nd) * 0.25;
        }
        prevPos = pos;
      }
    }
    return vec4(vec3(min(col, 1.0)), 1.0);
  `,
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 8: Update registerCustomShaders and remove old shaders

**Files:**
- Modify: `src/visual/CustomShaders.ts` (update `registerCustomShaders` function, delete all old shader consts)

- [ ] **Step 1: Replace the registerCustomShaders function**

Replace the existing `registerCustomShaders` function with:

```ts
export function registerCustomShaders(synth: Record<string, any>): void {
  const setFn = synth.setFunction as (def: Record<string, unknown>) => void
  if (typeof setFn !== 'function') return
  setFn(drift)
  setFn(dendrite)
  setFn(web)
  setFn(pulse)
  setFn(spore)
  setFn(weave)
  setFn(mycelium)
}
```

- [ ] **Step 2: Delete all old shader consts that haven't been replaced yet**

Ensure no old shader consts remain (sacredGeometry, tribalMask, glitchScan, particleField, voidPulse, ritualFire, paisleyFlow should all be gone, replaced by drift, dendrite, web, pulse, spore, weave, mycelium).

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/visual/CustomShaders.ts
git commit -m "feat: replace all shaders with organic filament aesthetic"
```

---

### Task 9: Update all 6 preset files

**Files:**
- Modify: `src/presets/defaults/void.ts`
- Modify: `src/presets/defaults/ritual.ts`
- Modify: `src/presets/defaults/signal.ts`
- Modify: `src/presets/defaults/ember.ts`
- Modify: `src/presets/defaults/cosmos.ts`
- Modify: `src/presets/defaults/mask.ts`

- [ ] **Step 1: Update void.ts**

Replace the `visual` and `mappings` sections:

```ts
  visual: {
    chain: {
      source: { fn: 'drift', args: [0.5, 8, 0.3] },
      transforms: [
        { fn: 'brightness', args: [-0.05] },
        { fn: 'scale', args: ['drift.scale'] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'void-map-0',
      source: 'envelope',
      target: 'drift.scale',
      range: [0.8, 1.5],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
```

Update `meta.description` to: `'Drifting filaments. Slow MonoSynth through deep reverb driving gentle floating lines.'`

- [ ] **Step 2: Update ritual.ts**

Replace the `visual` and `mappings` sections:

```ts
  visual: {
    chain: {
      source: { fn: 'dendrite', args: [5, 3, 'dendrite.pulse'] },
      transforms: [
        { fn: 'kaleid', args: ['kaleid.nSides'] },
        { fn: 'rotate', args: [0.1, 0.5] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'ritual-map-0',
      source: 'fft[0]',
      target: 'dendrite.pulse',
      range: [0.1, 2],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ritual-map-1',
      source: 'noteVelocity',
      target: 'kaleid.nSides',
      range: [3, 12],
      smooth: 0,
      curve: 'step',
    },
  ],
```

Update `meta.description` to: `'Branching dendrites. MembraneSynth percussion driving fractal neural patterns with kaleidoscope symmetry.'`

- [ ] **Step 3: Update signal.ts**

Replace the `visual` and `mappings` sections:

```ts
  visual: {
    chain: {
      source: { fn: 'web', args: [6, 0.5, 0.3] },
      transforms: [
        { fn: 'pixelate', args: [20, 20] },
        { fn: 'rotate', args: [0.2, 1] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'signal-map-0',
      source: 'fft[3]',
      target: 'web.connections',
      range: [3, 12],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'signal-map-1',
      source: 'sequencerStep',
      target: 'web.tension',
      range: [0.1, 1],
      smooth: 0,
      curve: 'linear',
    },
  ],
```

Update `meta.description` to: `'Network grid. FMSynth at 128bpm with delay and distortion driving an interconnected web of nodes.'`

- [ ] **Step 4: Update ember.ts**

Replace the `visual` and `mappings` sections:

```ts
  visual: {
    chain: {
      source: { fn: 'pulse', args: [5, 0.5, 0.3] },
      transforms: [
        { fn: 'scale', args: [1.01] },
        { fn: 'brightness', args: [0.05] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'ember-map-0',
      source: 'mouse.x',
      target: 'pulse.deform',
      range: [0.1, 1],
      smooth: 0.2,
      curve: 'linear',
    },
    {
      id: 'ember-map-1',
      source: 'envelope',
      target: 'pulse.speed',
      range: [0.2, 2],
      smooth: 0.1,
      curve: 'exponential',
    },
  ],
```

Update `meta.description` to: `'Ripple pulse. AMSynth warm pad through reverb and delay driving expanding concentric rings.'`

- [ ] **Step 5: Update cosmos.ts**

Replace the `visual` and `mappings` sections:

```ts
  visual: {
    chain: {
      source: { fn: 'spore', args: [40, 0.3, 0.5] },
      transforms: [
        { fn: 'rotate', args: ['rotate.angle', 0.3] },
        { fn: 'scale', args: [1.002] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'cosmos-map-0',
      source: 'fft[1]',
      target: 'spore.count',
      range: [10, 80],
      smooth: 0.2,
      curve: 'exponential',
    },
    {
      id: 'cosmos-map-1',
      source: 'mouse.y',
      target: 'rotate.angle',
      range: [0, 6.28],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
```

Update `meta.description` to: `'Floating spores. FMSynth with heavy reverb and long delay mapped to drifting particles with trailing filaments.'`

- [ ] **Step 6: Update mask.ts**

Replace the `visual` and `mappings` sections:

```ts
  visual: {
    chain: {
      source: { fn: 'weave', args: [6, 4, 'weave.phase'] },
      transforms: [
        { fn: 'brightness', args: [-0.05] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'mask-map-0',
      source: 'noteFrequency',
      target: 'weave.layers',
      range: [3, 12],
      smooth: 0,
      curve: 'step',
    },
    {
      id: 'mask-map-1',
      source: 'fft[2]',
      target: 'weave.phase',
      range: [0, 3],
      smooth: 0.1,
      curve: 'linear',
    },
  ],
```

Update `meta.description` to: `'Woven threads. FMSynth through bandpass, reverb, and delay driving overlapping sine filaments with moire patterns.'`

- [ ] **Step 7: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/presets/defaults/
git commit -m "feat: update all presets for organic filament shaders"
```

---

### Task 10: Update App.tsx mappings

**Files:**
- Modify: `src/App.tsx:33-46` (SOURCE_ARG_KEYS)
- Modify: `src/App.tsx:58` (TRANSFORM_ARG_KEYS -- remove glitchScan)
- Modify: `src/App.tsx:72-78` (VISUAL_GROUP_TO_SOURCE)

- [ ] **Step 1: Replace old SOURCE_ARG_KEYS entries**

In `SOURCE_ARG_KEYS`, replace the 6 old custom shader entries with:

```ts
  drift: ['speed', 'density', 'amplitude'],
  dendrite: ['branches', 'depth', 'pulse'],
  web: ['connections', 'tension', 'breathe'],
  pulse: ['rings', 'speed', 'deform'],
  spore: ['count', 'drift', 'trail'],
  weave: ['layers', 'frequency', 'phase'],
  mycelium: ['growth', 'branching', 'thickness'],
```

Remove the old entries: `sacredGeometry`, `tribalMask`, `particleField`, `voidPulse`, `ritualFire`, `paisleyFlow`.

- [ ] **Step 2: Remove glitchScan from TRANSFORM_ARG_KEYS**

Remove the line `glitchScan: ['amount'],` from `TRANSFORM_ARG_KEYS`.

- [ ] **Step 3: Replace VISUAL_GROUP_TO_SOURCE entries**

Replace the object with:

```ts
const VISUAL_GROUP_TO_SOURCE: Record<string, string> = {
  Geometry: 'dendrite',
  Mask: 'weave',
  Fire: 'pulse',
  Particles: 'spore',
  Flow: 'mycelium',
}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: update source arg keys and visual groups for new shaders"
```

---

### Task 11: Visual verification in browser

**Files:** None (manual testing)

- [ ] **Step 1: Start dev server and open in browser**

Run: `npm run dev` (or use existing dev server)
Navigate to the app, click "CLICK TO BEGIN"

- [ ] **Step 2: Check each preset renders visible visuals**

Click through all 6 presets (void, ritual, signal, ember, cosmos, mask). Each must:
- Show visible white/gray lines on dark background
- Animate (not be static)
- Not be black/empty

- [ ] **Step 3: Check simple mode visual groups**

Open control panel (Tab), verify Geometry/Mask/Fire/Particles/Flow buttons switch to the correct shader.

- [ ] **Step 4: Final commit and push**

```bash
git push origin main
```

- [ ] **Step 5: Build and deploy**

```bash
npm run build
npx gh-pages -d dist
```
