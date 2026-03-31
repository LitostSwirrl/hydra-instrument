import { Preset } from '../types'

export const maskPreset: Preset = {
  name: 'mask',
  audio: {
    pattern:
      'note("c3 [e3 g3] c3 [a3 c4]").s("square").lpf(tone * 500).room(space * 0.55).dist("0.3:.2").gain(intensity * 0.8)',
    keyboard: { s: 'square', effects: 'lpf(tone * 500).room(space * 0.55)' },
    macros: { tone: 0.5, space: 0.55, intensity: 0.6 },
  },
  visual: {
    chain: {
      source: { fn: 'shape', args: [4, 0.25, 0.009] },
      transforms: [
        { fn: 'rotate', args: ['mask.rotate'] },
        { fn: 'repeat', args: ['mask.grid', 'mask.grid'] },
        { fn: 'modulate', args: [{ fn: 'src', args: ['o0'] }, 0.1] },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.9] },
        { fn: 'brightness', args: [-0.05] },
      ],
      output: 'o0',
    },
  },
  mappings: [
    {
      id: 'mask-map-0',
      source: 'fft[2]',
      target: 'mask.rotate',
      range: [-0.05, 0.05],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'mask-map-1',
      source: 'macro.tone',
      target: 'shape.sides',
      range: [3, 8],
      smooth: 0.1,
      curve: 'step',
    },
    {
      id: 'mask-map-2',
      source: 'macro.space',
      target: 'modulate.amount',
      range: [0.05, 0.2],
      smooth: 0.15,
      curve: 'linear',
    },
    {
      id: 'mask-map-3',
      source: 'macro.intensity',
      target: 'mask.grid',
      range: [3, 10],
      smooth: 0.1,
      curve: 'step',
    },
    {
      id: 'mask-map-4',
      source: 'mouse.x',
      target: 'shape.sides',
      range: [3, 8],
      smooth: 0.1,
      curve: 'step',
    },
    {
      id: 'mask-map-5',
      source: 'scroll',
      target: 'modulate.amount',
      range: [0.02, 0.25],
      smooth: 0.1,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-30T00:00:00.000Z',
    description: 'Grid with feedback. Repeated shapes with self-modulation.',
  },
}
