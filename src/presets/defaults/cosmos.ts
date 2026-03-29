import { Preset } from '../types'

export const cosmosPreset: Preset = {
  name: 'cosmos',
  audio: {
    synthType: 'FMSynth',
    synthParams: {
      attack: 1.2,
      decay: 0.8,
      sustain: 0.6,
      release: 2.5,
      modulationIndex: 1,
      harmonicity: 1,
    },
    effects: [
      { type: 'filter', bypass: true, wet: 1, params: { frequency: 2000, Q: 1 } },
      { type: 'reverb', bypass: false, wet: 0.9, params: { decay: 8 } },
      { type: 'delay', bypass: false, wet: 0.5, params: { delayTime: 0.5, feedback: 0.55 } },
      { type: 'distortion', bypass: true, wet: 0.5, params: { distortion: 0.4 } },
      { type: 'compressor', bypass: false, wet: 1, params: { threshold: -24, ratio: 4 } },
    ],
    sequencer: null,
  },
  visual: {
    chain: {
      source: { fn: 'particleField', args: [50, 0.3, 2] },
      transforms: [
        { fn: 'rotate', args: ['rotate.angle', 0.3] },
        { fn: 'scale', args: [1.002] },
        { fn: 'brightness', args: [0.1] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'cosmos-map-0',
      source: 'fft[1]',
      target: 'particleField.density',
      range: [20, 100],
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
    createdAt: '2026-03-27T00:00:00.000Z',
    description: 'Infinite drift. Sine-like FMSynth with heavy reverb and long delay mapped to a rotating particle field.',
  },
}
