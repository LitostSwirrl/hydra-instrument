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
