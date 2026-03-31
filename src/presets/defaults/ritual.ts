import { Preset } from '../types'

export const ritualPreset: Preset = {
  name: 'ritual',
  audio: {
    pattern:
      's("bd:4 ~ cp bd:4").bank("RolandTR808").room(space * 0.6).gain(intensity)',
    keyboard: { s: 'triangle', effects: 'room(space * 0.6).delay(0.3)' },
    macros: { tone: 0.5, space: 0.6, intensity: 0.7 },
  },
  visual: {
    chain: {
      source: { fn: 'osc', args: [40, 0.03, 1.7] },
      transforms: [
        { fn: 'kaleid', args: ['kaleid.sides'] },
        {
          fn: 'mult',
          args: [
            {
              fn: 'osc',
              args: [40, 0.001, 0],
              transforms: [{ fn: 'rotate', args: [1.58] }],
            },
          ],
        },
        { fn: 'pixelate', args: [2, 20] },
        {
          fn: 'modulate',
          args: [{ fn: 'noise', args: [2.5] }, 0.08],
        },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.92] },
        {
          fn: 'modulateScale',
          args: [{ fn: 'osc', args: [10, 0] }, -0.03],
        },
        { fn: 'scale', args: [0.8] },
        { fn: 'rotate', args: [0.1, 0.5] },
      ],
      output: 'o0',
    },
  },
  mappings: [
    {
      id: 'ritual-map-0',
      source: 'onset',
      target: 'kaleid.sides',
      range: [3, 12],
      smooth: 0,
      curve: 'step',
    },
    {
      id: 'ritual-map-1',
      source: 'fft[0]',
      target: 'osc.freq',
      range: [30, 60],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ritual-map-2',
      source: 'macro.tone',
      target: 'modulateScale.multiple',
      range: [-0.06, 0.01],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ritual-map-3',
      source: 'macro.intensity',
      target: 'scale.amount',
      range: [0.7, 0.95],
      smooth: 0.15,
      curve: 'linear',
    },
    {
      id: 'ritual-map-4',
      source: 'mouse.x',
      target: 'rotate.angle',
      range: [0, 3.14],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ritual-map-5',
      source: 'scroll',
      target: 'kaleid.sides',
      range: [3, 12],
      smooth: 0,
      curve: 'step',
    },
  ],
  meta: {
    createdAt: '2026-03-30T00:00:00.000Z',
    description: 'Fractal symmetry. Kaleidoscope with feedback spiral.',
  },
}
