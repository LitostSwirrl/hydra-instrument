import { Preset } from '../types'

export const voidPreset: Preset = {
  name: 'void',
  audio: {
    pattern:
      'note("<c3 e3 g3>/4").s("sine").lpf(tone * 2000 + 200).room(space * 0.8).gain(intensity * 0.7)',
    keyboard: { s: 'sine', effects: 'lpf(tone * 2000 + 200).room(space * 0.8)' },
    macros: { tone: 0.5, space: 0.85, intensity: 0.5 },
  },
  visual: {
    chain: {
      source: { fn: 'osc', args: [60, -0.015, 0.3] },
      transforms: [
        {
          fn: 'diff',
          args: [
            {
              fn: 'osc',
              args: [60, 0.08],
              transforms: [{ fn: 'rotate', args: [1.5708] }],
            },
          ],
        },
        {
          fn: 'modulate',
          args: [{ fn: 'noise', args: [3.5, 0.25] }, 0.15],
        },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.94] },
        { fn: 'brightness', args: [-0.05] },
        { fn: 'scale', args: ['drift.scale'] },
      ],
      output: 'o0',
    },
  },
  mappings: [
    {
      id: 'void-map-0',
      source: 'envelope',
      target: 'drift.scale',
      range: [0.98, 1.02],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-30T00:00:00.000Z',
    description: 'Drifting filaments. Edge detection feedback with organic warping.',
  },
}
