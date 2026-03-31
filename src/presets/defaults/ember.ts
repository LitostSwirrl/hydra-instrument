import { Preset } from '../types'

export const emberPreset: Preset = {
  name: 'ember',
  audio: {
    pattern:
      'note("<c3 eb3 g3>/2").s("triangle").lpf(tone * 1200).room(space * 0.5).delay(space * 0.35).gain(intensity * 0.7)',
    keyboard: { s: 'triangle', effects: 'lpf(tone * 1200).room(space * 0.5)' },
    macros: { tone: 0.6, space: 0.5, intensity: 0.5 },
  },
  visual: {
    chain: {
      source: { fn: 'voronoi', args: [50, 1] },
      transforms: [
        { fn: 'luma', args: [0.5] },
        {
          fn: 'modulate',
          args: [
            {
              fn: 'osc',
              args: [-1000, -1],
              transforms: [
                {
                  fn: 'modulate',
                  args: [
                    {
                      fn: 'osc',
                      args: [],
                      transforms: [{ fn: 'luma', args: [] }],
                    },
                  ],
                },
              ],
            },
            'ember.mod',
          ],
        },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }] },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }] },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }] },
        { fn: 'brightness', args: [0.05] },
        { fn: 'scale', args: [1.01] },
      ],
      output: 'o0',
    },
  },
  mappings: [
    {
      id: 'ember-map-0',
      source: 'envelope',
      target: 'ember.mod',
      range: [0.01, 0.1],
      smooth: 0.1,
      curve: 'exponential',
    },
    {
      id: 'ember-map-1',
      source: 'macro.tone',
      target: 'luma.threshold',
      range: [0.2, 0.8],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ember-map-2',
      source: 'macro.intensity',
      target: 'scale.amount',
      range: [0.99, 1.04],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-30T00:00:00.000Z',
    description: 'Organic cells. Voronoi smearing with triple feedback.',
  },
}
