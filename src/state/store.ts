import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type SynthType = 'FMSynth' | 'AMSynth' | 'MembraneSynth' | 'MonoSynth'
export type UIMode = 'simple' | 'pro'
export type CurveType = 'linear' | 'exponential' | 'step'

export interface EffectConfig {
  type: 'filter' | 'reverb' | 'delay' | 'distortion' | 'compressor'
  bypass: boolean
  wet: number
  params: Record<string, number>
}

export interface SequencerConfig {
  pattern: (string | null)[]
  subdivision: string
  bpm: number
  playing: boolean
}

export interface Mapping {
  id: string
  source: string
  target: string
  range: [number, number]
  smooth: number
  curve: CurveType
}

export interface AnalysisState {
  fftBands: number[]
  envelope: number
  numBands: number
}

export interface UIState {
  panelOpen: boolean
  activeSection: 'audio' | 'visual' | 'mappings'
}

export interface AppState {
  audioStarted: boolean
  startAudio: () => void

  synthType: SynthType
  synthParams: Record<string, number>
  octave: number
  noteVelocity: number
  noteFrequency: number
  setSynthType: (type: SynthType) => void
  setSynthParams: (params: Record<string, number>) => void
  setOctave: (octave: number) => void
  setNoteInfo: (velocity: number, frequency: number) => void

  effects: EffectConfig[]
  setEffectBypass: (index: number, bypass: boolean) => void
  setEffectWet: (index: number, wet: number) => void
  setEffectParam: (index: number, key: string, value: number) => void

  sequencer: SequencerConfig
  setSequencerPlaying: (playing: boolean) => void
  setSequencerBpm: (bpm: number) => void
  setSequencerPattern: (pattern: (string | null)[]) => void

  micEnabled: boolean
  setMicEnabled: (enabled: boolean) => void

  analysis: AnalysisState
  setAnalysis: (fftBands: number[], envelope: number) => void
  setNumBands: (n: number) => void

  mappings: Mapping[]
  addMapping: (mapping: Mapping) => void
  removeMapping: (id: string) => void
  updateMapping: (id: string, updates: Partial<Mapping>) => void

  mouse: { x: number; y: number }
  setMouse: (x: number, y: number) => void

  sequencerStep: number
  setSequencerStep: (step: number) => void

  ui: UIState
  togglePanel: () => void
  setActiveSection: (section: UIState['activeSection']) => void

  uiMode: UIMode
  setUIMode: (mode: UIMode) => void
  toggleUIMode: () => void
}

const defaultEffects: EffectConfig[] = [
  { type: 'filter', bypass: false, wet: 1, params: { frequency: 2000, Q: 1 } },
  { type: 'reverb', bypass: true, wet: 0.3, params: { decay: 2.5 } },
  { type: 'delay', bypass: true, wet: 0.3, params: { delayTime: 0.25, feedback: 0.4 } },
  { type: 'distortion', bypass: true, wet: 0.5, params: { distortion: 0.4 } },
  { type: 'compressor', bypass: false, wet: 1, params: { threshold: -24, ratio: 4 } },
]

const initialState = {
  audioStarted: false,

  synthType: 'FMSynth' as SynthType,
  synthParams: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
  octave: 3,
  noteVelocity: 0,
  noteFrequency: 0,

  effects: defaultEffects,

  sequencer: {
    pattern: ['C4', 'E4', 'G4', 'B4', null, 'G4', 'E4', 'C4'] as (string | null)[],
    subdivision: '8n',
    bpm: 120,
    playing: false,
  },

  micEnabled: false,

  analysis: { fftBands: new Array(8).fill(0) as number[], envelope: 0, numBands: 8 },

  mappings: [] as Mapping[],

  mouse: { x: 0, y: 0 },

  sequencerStep: 0,

  ui: { panelOpen: false, activeSection: 'audio' as UIState['activeSection'] },

  uiMode: 'simple' as UIMode,
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    startAudio: () => set({ audioStarted: true }),

    setSynthType: (type) => set({ synthType: type }),
    setSynthParams: (params) => set((s) => ({ synthParams: { ...s.synthParams, ...params } })),
    setOctave: (octave) => set({ octave: Math.max(0, Math.min(8, octave)) }),
    setNoteInfo: (velocity, frequency) => set({ noteVelocity: velocity, noteFrequency: frequency }),

    setEffectBypass: (i, bypass) =>
      set((s) => ({
        effects: s.effects.map((e, idx) => (idx === i ? { ...e, bypass } : e)),
      })),
    setEffectWet: (i, wet) =>
      set((s) => ({
        effects: s.effects.map((e, idx) =>
          idx === i ? { ...e, wet: Math.max(0, Math.min(1, wet)) } : e
        ),
      })),
    setEffectParam: (i, key, value) =>
      set((s) => ({
        effects: s.effects.map((e, idx) =>
          idx === i ? { ...e, params: { ...e.params, [key]: value } } : e
        ),
      })),

    setSequencerPlaying: (playing) => set((s) => ({ sequencer: { ...s.sequencer, playing } })),
    setSequencerBpm: (bpm) => set((s) => ({ sequencer: { ...s.sequencer, bpm } })),
    setSequencerPattern: (pattern) => set((s) => ({ sequencer: { ...s.sequencer, pattern } })),

    setMicEnabled: (enabled) => set({ micEnabled: enabled }),

    setAnalysis: (fftBands, envelope) =>
      set((s) => ({ analysis: { ...s.analysis, fftBands, envelope } })),
    setNumBands: (n) =>
      set((s) => ({
        analysis: { ...s.analysis, numBands: n, fftBands: new Array(n).fill(0) as number[] },
      })),

    addMapping: (m) => set((s) => ({ mappings: [...s.mappings, m] })),
    removeMapping: (id) => set((s) => ({ mappings: s.mappings.filter((m) => m.id !== id) })),
    updateMapping: (id, updates) =>
      set((s) => ({
        mappings: s.mappings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      })),

    setMouse: (x, y) => set({ mouse: { x, y } }),

    setSequencerStep: (step) => set({ sequencerStep: step }),

    togglePanel: () => set((s) => ({ ui: { ...s.ui, panelOpen: !s.ui.panelOpen } })),
    setActiveSection: (section) => set((s) => ({ ui: { ...s.ui, activeSection: section } })),

    setUIMode: (mode) => set({ uiMode: mode }),
    toggleUIMode: () => set((s) => ({ uiMode: s.uiMode === 'simple' ? 'pro' : 'simple' })),
  }))
)

// expose getInitialState for test resets
;(useAppStore as unknown as { getInitialState: () => typeof initialState }).getInitialState =
  () => ({ ...initialState, effects: defaultEffects.map((e) => ({ ...e, params: { ...e.params } })), analysis: { ...initialState.analysis, fftBands: new Array(8).fill(0) as number[] }, mappings: [], sequencer: { ...initialState.sequencer, pattern: [...initialState.sequencer.pattern] }, mouse: { ...initialState.mouse }, ui: { ...initialState.ui }, uiMode: 'simple' as UIMode })
