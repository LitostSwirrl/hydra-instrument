import { Preset } from '../types'

export const ritualPreset: Preset = {
  name: 'ritual',
  audio: {
    synthType: 'MembraneSynth',
    synthParams: {
      attack: 0.01,
      decay: 0.4,
      sustain: 0.1,
      release: 0.6,
      pitchDecay: 0.05,
      octaves: 4,
    },
    effects: [
      { type: 'filter', bypass: true, wet: 1, params: { frequency: 2000, Q: 1 } },
      { type: 'reverb', bypass: false, wet: 0.6, params: { decay: 3 } },
      { type: 'delay', bypass: false, wet: 0.4, params: { delayTime: 0.3, feedback: 0.5 } },
      { type: 'distortion', bypass: true, wet: 0.5, params: { distortion: 0.4 } },
      { type: 'compressor', bypass: false, wet: 1, params: { threshold: -24, ratio: 4 } },
    ],
    sequencer: null,
  },
  visual: {
    chain: {
      source: { fn: 'dendrite', args: [5, 3, 'dendrite.pulse'] },
      transforms: [
        { fn: 'kaleid', args: ['kaleid.nSides'] },
        { fn: 'rotate', args: [0.1, 0.5] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'ritual-map-0',
      source: 'fft[0]',
      target: 'dendrite.pulse',
      range: [0.1, 2],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'ritual-map-1',
      source: 'noteVelocity',
      target: 'kaleid.nSides',
      range: [3, 12],
      smooth: 0,
      curve: 'step',
    },
  ],
  meta: {
    createdAt: '2026-03-27T00:00:00.000Z',
    description: 'Branching dendrites. MembraneSynth percussion driving fractal neural patterns with kaleidoscope symmetry.',
  },
}
