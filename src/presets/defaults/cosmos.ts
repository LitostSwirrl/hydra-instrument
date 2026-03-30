import { Preset } from '../types'

export const cosmosPreset: Preset = {
  name: 'cosmos',
  audio: {
    pattern:
      'note("<c3 g3 e3 b3>/8").s("sine").room(space * 0.9).delay(space * 0.5).gain(intensity * 0.6)',
    keyboard: { s: 'sine', effects: 'room(space * 0.9).delay(space * 0.5)' },
    macros: { tone: 0.5, space: 0.9, intensity: 0.4 },
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
          fn: 'modulateScale',
          args: [{ fn: 'noise', args: [3.5, 0.25] }, 0.6],
        },
        { fn: 'invert', args: [] },
        { fn: 'brightness', args: [0.1] },
        { fn: 'contrast', args: [1.2] },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.92] },
        { fn: 'scale', args: [0.999] },
      ],
      output: 'o0',
    },
  },
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
      source: 'mouse.y',
      target: 'rotate.angle',
      range: [0, 6.28],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-30T00:00:00.000Z',
    description: 'Organic web. Noise-warped structures with edge detection.',
  },
}
