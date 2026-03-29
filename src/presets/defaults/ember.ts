import { Preset } from '../types'

export const emberPreset: Preset = {
  name: 'ember',
  audio: {
    synthType: 'AMSynth',
    synthParams: {
      attack: 0.3,
      decay: 0.6,
      sustain: 0.5,
      release: 1.5,
      harmonicity: 2,
    },
    effects: [
      { type: 'filter', bypass: false, wet: 1, params: { frequency: 1200, Q: 1 } },
      { type: 'reverb', bypass: false, wet: 0.5, params: { decay: 4 } },
      { type: 'delay', bypass: false, wet: 0.35, params: { delayTime: 0.4, feedback: 0.45 } },
      { type: 'distortion', bypass: true, wet: 0.5, params: { distortion: 0.4 } },
      { type: 'compressor', bypass: false, wet: 1, params: { threshold: -24, ratio: 4 } },
    ],
    sequencer: null,
  },
  visual: {
    chain: {
      source: { fn: 'ritualFire', args: [4, 1, 0.7] },
      transforms: [
        { fn: 'scale', args: [1.01] },
        { fn: 'brightness', args: [0.05] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'ember-map-0',
      source: 'mouse.x',
      target: 'ritualFire.turbulence',
      range: [1, 8],
      smooth: 0.2,
      curve: 'linear',
    },
    {
      id: 'ember-map-1',
      source: 'envelope',
      target: 'ritualFire.height',
      range: [0.3, 2],
      smooth: 0.1,
      curve: 'exponential',
    },
  ],
  meta: {
    createdAt: '2026-03-27T00:00:00.000Z',
    description: 'Tribal warmth. AMSynth warm pad through reverb and delay driving a ritual fire shader.',
  },
}
