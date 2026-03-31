import { Preset } from '../types'

export const cosmosPreset: Preset = {
  name: 'cosmos',
  audio: {
    pattern:
      'note("<c3 g3 e3 b3>/8").s("sine").room(space * 0.9).delay(space * 0.5).gain(intensity * 0.6)',
    keyboard: {
      s: 'sine',
      effects: 'room(space * 0.9).delay(space * 0.5)',
      effectParams: [
        { key: 'room', value: 0, macro: 'space', scale: 0.9 },
        { key: 'delay', value: 0, macro: 'space', scale: 0.5 },
      ],
    },
    macros: { tone: 0.5, space: 0.9, intensity: 0.4 },
  },
  visual: {
    chain: {
      source: { fn: 'shape', args: [20, 0.2, 0.3] },
      transforms: [
        {
          fn: 'modulate',
          args: [{ fn: 'noise', args: [2, 0.3] }, 0.15],
        },
        {
          fn: 'modulateScale',
          args: [{ fn: 'osc', args: [3, 0.5] }, -0.6],
        },
        { fn: 'invert', args: [] },
        { fn: 'brightness', args: [0.1] },
        { fn: 'contrast', args: [1.3] },
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
      source: 'macro.tone',
      target: 'osc.frequency',
      range: [30, 90],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'cosmos-map-2',
      source: 'macro.space',
      target: 'modulateScale.multiple',
      range: [0.2, 1.0],
      smooth: 0.15,
      curve: 'linear',
    },
    {
      id: 'cosmos-map-3',
      source: 'macro.intensity',
      target: 'brightness.amount',
      range: [-0.1, 0.2],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'cosmos-map-4',
      source: 'mouse.y',
      target: 'rotate.angle',
      range: [0, 6.28],
      smooth: 0.15,
      curve: 'linear',
    },
    {
      id: 'cosmos-map-5',
      source: 'scroll',
      target: 'scale.amount',
      range: [0.8, 1.5],
      smooth: 0.1,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-30T00:00:00.000Z',
    description: 'Organic web. Noise-warped structures with edge detection.',
  },
}
