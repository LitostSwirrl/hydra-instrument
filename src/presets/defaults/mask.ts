import { Preset } from '../types'

export const maskPreset: Preset = {
  name: 'mask',
  audio: {
    synthType: 'FMSynth',
    synthParams: {
      attack: 0.05,
      decay: 0.4,
      sustain: 0.3,
      release: 0.9,
      modulationIndex: 6,
      harmonicity: 2,
    },
    effects: [
      { type: 'filter', bypass: false, wet: 1, params: { frequency: 500, Q: 3 } },
      { type: 'reverb', bypass: false, wet: 0.55, params: { decay: 3.5 } },
      { type: 'delay', bypass: false, wet: 0.4, params: { delayTime: 0.35, feedback: 0.5 } },
      { type: 'distortion', bypass: false, wet: 0.2, params: { distortion: 0.3 } },
      { type: 'compressor', bypass: false, wet: 1, params: { threshold: -24, ratio: 4 } },
    ],
    sequencer: null,
  },
  visual: {
    chain: {
      source: { fn: 'tribalMask', args: ['tribalMask.symmetry', 3, 'tribalMask.glow'] },
      transforms: [
        { fn: 'colorama', args: [0.3] },
        { fn: 'brightness', args: [-0.05] },
      ],
      output: 'o0',
    },
    customShaders: [],
  },
  mappings: [
    {
      id: 'mask-map-0',
      source: 'noteFrequency',
      target: 'tribalMask.symmetry',
      range: [2, 8],
      smooth: 0,
      curve: 'step',
    },
    {
      id: 'mask-map-1',
      source: 'fft[2]',
      target: 'tribalMask.glow',
      range: [0.1, 2],
      smooth: 0.1,
      curve: 'linear',
    },
  ],
  meta: {
    createdAt: '2026-03-27T00:00:00.000Z',
    description: 'Ancient and eerie. FMSynth through bandpass 500Hz, reverb, delay and slight distortion driving a tribal mask shader.',
  },
}
