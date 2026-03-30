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
      col += smoothstep(thickness * 2.0, 0.0, dist) * (0.08 + 0.04 * sin(time * 0.3 + i * 2.0));
    }
    return vec4(vec3(min(col, 1.0)), 1.0);
  `,
}

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
      float branchDist = abs(branchAngle * r * freq * 0.12);
      float rMin = (d - 1.0) * 0.07 + 0.01;
      float rMax = d * 0.14 + 0.06;
      float radialMask = smoothstep(rMin, rMin + 0.03, r) * smoothstep(rMax + 0.03, rMax, r);
      float thickness = 0.012 / d;
      float line = smoothstep(thickness * 2.5, 0.0, branchDist) * radialMask;
      col += line * (0.6 / d);
    }
    float centerGlow = exp(-r * 6.0) * 0.25 * (0.8 + 0.2 * sin(time * pulse));
    col += centerGlow;
    float nodeRing = smoothstep(0.004, 0.0, abs(r - 0.02));
    col += nodeRing * 0.6;
    for (float i = 0.0; i < 5.0; i++) {
      if (i >= branches) break;
      float na = i * 6.2832 / branches + time * pulse * 0.1;
      for (float d = 1.0; d <= 3.0; d++) {
        float nr = d * 0.14;
        vec2 np = vec2(cos(na), sin(na)) * nr;
        float nd = length(st - np);
        col += smoothstep(0.008, 0.0, nd) * (0.5 / d);
      }
    }
    return vec4(vec3(min(col, 1.0)), 1.0);
  `,
}

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
    float gs = connections;
    for (float i = 0.0; i < 8.0; i++) {
      if (i >= gs) break;
      for (float j = 0.0; j < 8.0; j++) {
        if (j >= gs) break;
        vec2 id = vec2(i, j);
        float h1 = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
        float h2 = fract(sin(dot(id, vec2(269.5, 183.3))) * 43758.5453);
        vec2 np = (id + 0.5) / gs + vec2(
          sin(time * breathe * (h1 - 0.5) + h1 * 6.28),
          cos(time * breathe * (h2 - 0.5) + h2 * 6.28)
        ) * 0.04 * tension;
        float nd = length(st - np);
        col += smoothstep(0.008, 0.0, nd) * 0.5;
        col += exp(-nd * 60.0) * 0.05;
        // Right neighbor
        if (i + 1.0 < gs) {
          vec2 rid = vec2(i + 1.0, j);
          float rh1 = fract(sin(dot(rid, vec2(127.1, 311.7))) * 43758.5453);
          float rh2 = fract(sin(dot(rid, vec2(269.5, 183.3))) * 43758.5453);
          vec2 rp = (rid + 0.5) / gs + vec2(
            sin(time * breathe * (rh1 - 0.5) + rh1 * 6.28),
            cos(time * breathe * (rh2 - 0.5) + rh2 * 6.28)
          ) * 0.04 * tension;
          vec2 pa = st - np;
          vec2 ba = rp - np;
          float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          col += smoothstep(0.003, 0.0, length(pa - ba * t)) * 0.15;
        }
        // Bottom neighbor
        if (j + 1.0 < gs) {
          vec2 bid = vec2(i, j + 1.0);
          float bh1 = fract(sin(dot(bid, vec2(127.1, 311.7))) * 43758.5453);
          float bh2 = fract(sin(dot(bid, vec2(269.5, 183.3))) * 43758.5453);
          vec2 bp = (bid + 0.5) / gs + vec2(
            sin(time * breathe * (bh1 - 0.5) + bh1 * 6.28),
            cos(time * breathe * (bh2 - 0.5) + bh2 * 6.28)
          ) * 0.04 * tension;
          vec2 pa = st - np;
          vec2 ba = bp - np;
          float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          col += smoothstep(0.003, 0.0, length(pa - ba * t)) * 0.15;
        }
        // Diagonal neighbor (tension-gated)
        if (i + 1.0 < gs && j + 1.0 < gs) {
          float ch = fract(sin(dot(id, vec2(41.7, 89.3))) * 43758.5453);
          if (ch < tension) {
            vec2 did = vec2(i + 1.0, j + 1.0);
            float dh1 = fract(sin(dot(did, vec2(127.1, 311.7))) * 43758.5453);
            float dh2 = fract(sin(dot(did, vec2(269.5, 183.3))) * 43758.5453);
            vec2 dp = (did + 0.5) / gs + vec2(
              sin(time * breathe * (dh1 - 0.5) + dh1 * 6.28),
              cos(time * breathe * (dh2 - 0.5) + dh2 * 6.28)
            ) * 0.04 * tension;
            vec2 pa = st - np;
            vec2 ba = dp - np;
            float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            col += smoothstep(0.003, 0.0, length(pa - ba * t)) * 0.1;
          }
        }
      }
    }
    return vec4(vec3(min(col, 1.0)), 1.0);
  `,
}

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
      float size = 0.005 + h3 * 0.006;
      col += smoothstep(size, 0.0, d) * 0.6;
      col += exp(-d * 60.0) * 0.08;
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
    float ambient = exp(-length(st - 0.5) * 2.5) * 0.025;
    col += ambient;
    return vec4(vec3(min(col, 1.0)), 1.0);
  `,
}

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
