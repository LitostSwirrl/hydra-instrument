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
