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
      source: { fn: 'drift', args: [0.5, 8, 0.3] },
      transforms: [
        { fn: 'brightness', args: [-0.05] },
        { fn: 'scale', args: ['drift.scale'] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'void-map-0',
      source: 'envelope',
      target: 'drift.scale',
      range: [0.8, 1.5],
      smooth: 0.15,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-27T00:00:00.000Z',
    description: 'Drifting filaments. Slow MonoSynth through deep reverb driving gentle floating lines.',
  },
}
