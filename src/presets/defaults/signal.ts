import { Preset } from '../types'

export const signalPreset: Preset = {
  name: 'signal',
  audio: {
    pattern:
      'note("c4 e4 g4 b4 c5 b4 g4 e4").fast(2).s("sawtooth").lpf(tone * 4000).delay(0.45).gain(intensity * 0.8)',
    keyboard: { s: 'sawtooth', effects: 'lpf(tone * 4000).delay(0.45)' },
    macros: { tone: 0.8, space: 0.3, intensity: 0.6 },
  },
  visual: {
    chain: {
      source: { fn: 'osc', args: [200, 0] },
      transforms: [
        { fn: 'kaleid', args: [200] },
        { fn: 'scale', args: [1, 0.4] },
        { fn: 'scrollX', args: [0.1, 'signal.scroll'] },
        {
          fn: 'mult',
          args: [
            {
              fn: 'osc',
              args: [200, 0],
              transforms: [
                { fn: 'kaleid', args: [200] },
                { fn: 'scale', args: [1, 0.4] },
              ],
            },
          ],
        },
        { fn: 'rotate', args: [0.2, 1] },
      ],
      output: 'o0',
    },
  },
  mappings: [
    {
      id: 'signal-map-0',
      source: 'fft[3]',
      target: 'signal.scroll',
      range: [0.001, 0.05],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'signal-map-1',
      source: 'cycle',
      target: 'rotate.speed',
      range: [0.5, 2],
      smooth: 0,
      curve: 'linear',
    },
    {
      id: 'signal-map-2',
      source: 'macro.tone',
      target: 'osc.frequency',
      range: [100, 400],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'signal-map-3',
      source: 'macro.space',
      target: 'kaleid.nSides',
      range: [100, 300],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-30T00:00:00.000Z',
    description: 'Network moire. High-frequency line interference patterns.',
  },
}
