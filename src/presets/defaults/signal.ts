import { Preset } from '../types'

export const signalPreset: Preset = {
  name: 'signal',
  audio: {
    synthType: 'FMSynth',
    synthParams: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.2,
      release: 0.3,
      modulationIndex: 10,
      harmonicity: 3,
    },
    effects: [
      { type: 'filter', bypass: false, wet: 1, params: { frequency: 4000, Q: 2 } },
      { type: 'reverb', bypass: true, wet: 0.2, params: { decay: 1.5 } },
      { type: 'delay', bypass: false, wet: 0.45, params: { delayTime: 0.125, feedback: 0.6 } },
      { type: 'distortion', bypass: false, wet: 0.4, params: { distortion: 0.6 } },
      { type: 'compressor', bypass: false, wet: 1, params: { threshold: -18, ratio: 6 } },
    ],
    sequencer: {
      pattern: ['C4', 'E4', 'G4', 'B4', 'C5', 'B4', 'G4', 'E4'],
      subdivision: '16n',
      bpm: 128,
    },
  },
  visual: {
    chain: {
      source: { fn: 'web', args: [6, 0.5, 0.3] },
      transforms: [
        { fn: 'rotate', args: [0.2, 1] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'signal-map-0',
      source: 'fft[3]',
      target: 'web.connections',
      range: [3, 12],
      smooth: 0.1,
      curve: 'linear',
    },
    {
      id: 'signal-map-1',
      source: 'sequencerStep',
      target: 'web.tension',
      range: [0.1, 1],
      smooth: 0,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-27T00:00:00.000Z',
    description: 'Network grid. FMSynth at 128bpm with delay and distortion driving an interconnected web of nodes.',
  },
}
