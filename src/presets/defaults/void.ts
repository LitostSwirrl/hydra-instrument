import { Preset } from '../types'

export const voidPreset: Preset = {
  name: 'void',
  audio: {
    synthType: 'MonoSynth',
    synthParams: {
      attack: 0.8,
      decay: 0.5,
      sustain: 0.7,
      release: 1.2,
    },
    effects: [
      { type: 'filter', bypass: false, wet: 1, params: { frequency: 200, Q: 1 } },
      { type: 'reverb', bypass: false, wet: 0.85, params: { decay: 6 } },
      { type: 'delay', bypass: true, wet: 0.3, params: { delayTime: 0.25, feedback: 0.4 } },
      { type: 'distortion', bypass: true, wet: 0.5, params: { distortion: 0.4 } },
      { type: 'compressor', bypass: false, wet: 1, params: { threshold: -24, ratio: 4 } },
    ],
    sequencer: null,
  },
  visual: {
    chain: {
      source: { fn: 'voronoi', args: [5, 0.1, 0.3] },
      transforms: [
        { fn: 'color', args: [0.3, 0.1, 0.5] },
        { fn: 'scale', args: ['voronoi.scale'] },
        { fn: 'brightness', args: [-0.1] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'void-map-0',
      source: 'envelope',
      target: 'voronoi.scale',
      range: [2, 15],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'void-map-1',
      source: 'fft[0]',
      target: 'scale.amount',
      range: [0.8, 1.5],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-27T00:00:00.000Z',
    description: 'Solemn drone. Slow attack MonoSynth through deep reverb and low filter, mapped to voronoi geometry.',
  },
}
