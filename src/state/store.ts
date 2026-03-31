import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type UIMode = 'simple' | 'pro'
export type MacroName = 'tone' | 'space' | 'intensity'
export type CurveType = 'linear' | 'exponential' | 'step'

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

  octave: number
  noteVelocity: number
  noteFrequency: number
  setOctave: (octave: number) => void
  setNoteInfo: (velocity: number, frequency: number) => void

  analysis: AnalysisState
  setAnalysis: (fftBands: number[], envelope: number) => void
  setNumBands: (n: number) => void

  mappings: Mapping[]
  addMapping: (mapping: Mapping) => void
  removeMapping: (id: string) => void
  updateMapping: (id: string, updates: Partial<Mapping>) => void

  mouse: { x: number; y: number }
  setMouse: (x: number, y: number) => void
  scroll: number
  setScroll: (value: number) => void

  ui: UIState
  togglePanel: () => void
  setActiveSection: (section: UIState['activeSection']) => void

  uiMode: UIMode
  setUIMode: (mode: UIMode) => void
  toggleUIMode: () => void

  // Strudel audio state
  patternCode: string
  patternPlaying: boolean
  macros: { tone: number; space: number; intensity: number }
  setPatternCode: (code: string) => void
  setPatternPlaying: (playing: boolean) => void
  setMacro: (name: MacroName, value: number) => void

  // Pattern bridge data (for visual mapping)
  cycle: number
  density: number
  onset: number
  patternNote: number
  setPatternData: (cycle: number, density: number, onset: number, patternNote: number) => void

  bpm: number
  setBpm: (bpm: number) => void

  patternError: string | null
  setPatternError: (error: string | null) => void

  synthType: string
  setSynthType: (type: string) => void
}

const initialState = {
  audioStarted: false,

  octave: 3,
  noteVelocity: 0,
  noteFrequency: 0,

  analysis: { fftBands: new Array(8).fill(0) as number[], envelope: 0, numBands: 8 },

  mappings: [] as Mapping[],

  mouse: { x: 0, y: 0 },
  scroll: 0.5,

  ui: { panelOpen: true, activeSection: 'audio' as UIState['activeSection'] },

  uiMode: 'simple' as UIMode,

  // Strudel audio state
  patternCode: '',
  patternPlaying: false,
  macros: { tone: 0.5, space: 0.3, intensity: 0.5 },

  // Pattern bridge data
  cycle: 0,
  density: 0,
  onset: 0,
  patternNote: 0,

  bpm: 120,

  patternError: null as string | null,

  synthType: 'sine',
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    startAudio: () => set({ audioStarted: true }),

    setOctave: (octave) => set({ octave: Math.max(0, Math.min(8, octave)) }),
    setNoteInfo: (velocity, frequency) => set({ noteVelocity: velocity, noteFrequency: frequency }),

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
    setScroll: (value) => set({ scroll: Math.max(0, Math.min(1, value)) }),

    togglePanel: () => set((s) => ({ ui: { ...s.ui, panelOpen: !s.ui.panelOpen } })),
    setActiveSection: (section) => set((s) => ({ ui: { ...s.ui, activeSection: section } })),

    setUIMode: (mode) => set({ uiMode: mode }),
    toggleUIMode: () => set((s) => ({ uiMode: s.uiMode === 'simple' ? 'pro' : 'simple' })),

    setPatternCode: (code) => set({ patternCode: code }),
    setPatternPlaying: (playing) => set({ patternPlaying: playing }),
    setMacro: (name, value) =>
      set((s) => ({ macros: { ...s.macros, [name]: value } })),
    setPatternData: (cycle, density, onset, patternNote) =>
      set({ cycle, density, onset, patternNote }),
    setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),
    setPatternError: (error) => set({ patternError: error }),
    setSynthType: (type) => set({ synthType: type }),
  }))
)

export function getInitialState() {
  return {
    ...initialState,
    analysis: { ...initialState.analysis, fftBands: new Array(8).fill(0) as number[] },
    mappings: [] as Mapping[],
    mouse: { ...initialState.mouse },
    scroll: 0.5,
    ui: { ...initialState.ui },
    uiMode: 'simple' as UIMode,
    macros: { ...initialState.macros },
    synthType: 'sine',
  }
}
