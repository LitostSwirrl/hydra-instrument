import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore, getInitialState } from '../store'

beforeEach(() => {
  useAppStore.setState(getInitialState())
})

describe('store', () => {
  it('addMapping and removeMapping', () => {
    const mapping = {
      id: 'test-1', source: 'envelope',
      target: 'osc.frequency', range: [0, 1] as [number, number],
      smooth: 0.5, curve: 'linear' as const,
    }
    useAppStore.getState().addMapping(mapping)
    expect(useAppStore.getState().mappings).toHaveLength(1)
    useAppStore.getState().removeMapping('test-1')
    expect(useAppStore.getState().mappings).toHaveLength(0)
  })

  it('updateMapping merges partial updates', () => {
    const mapping = {
      id: 'test-1', source: 'envelope',
      target: 'osc.frequency', range: [0, 1] as [number, number],
      smooth: 0.5, curve: 'linear' as const,
    }
    useAppStore.getState().addMapping(mapping)
    useAppStore.getState().updateMapping('test-1', { smooth: 0.9 })
    expect(useAppStore.getState().mappings[0].smooth).toBe(0.9)
    expect(useAppStore.getState().mappings[0].target).toBe('osc.frequency')
  })

  it('setAnalysis updates fftBands and envelope', () => {
    useAppStore.getState().setAnalysis([0.1, 0.2, 0.3, 0.4], 0.75)
    expect(useAppStore.getState().analysis.fftBands).toEqual([0.1, 0.2, 0.3, 0.4])
    expect(useAppStore.getState().analysis.envelope).toBe(0.75)
  })

  it('togglePanel flips panelOpen', () => {
    expect(useAppStore.getState().ui.panelOpen).toBe(true)
    useAppStore.getState().togglePanel()
    expect(useAppStore.getState().ui.panelOpen).toBe(false)
    useAppStore.getState().togglePanel()
    expect(useAppStore.getState().ui.panelOpen).toBe(true)
  })

  it('setNoteInfo updates velocity and frequency', () => {
    useAppStore.getState().setNoteInfo(0.7, 0.13)
    expect(useAppStore.getState().noteVelocity).toBe(0.7)
    expect(useAppStore.getState().noteFrequency).toBe(0.13)
  })

  it('setOctave clamps to 0-8', () => {
    useAppStore.getState().setOctave(10)
    expect(useAppStore.getState().octave).toBe(8)
    useAppStore.getState().setOctave(-1)
    expect(useAppStore.getState().octave).toBe(0)
  })

  it('has default uiMode simple', () => {
    expect(useAppStore.getState().uiMode).toBe('simple')
  })

  it('setUIMode changes mode', () => {
    useAppStore.getState().setUIMode('pro')
    expect(useAppStore.getState().uiMode).toBe('pro')
    useAppStore.getState().setUIMode('simple')
    expect(useAppStore.getState().uiMode).toBe('simple')
  })

  it('toggleUIMode flips mode', () => {
    expect(useAppStore.getState().uiMode).toBe('simple')
    useAppStore.getState().toggleUIMode()
    expect(useAppStore.getState().uiMode).toBe('pro')
    useAppStore.getState().toggleUIMode()
    expect(useAppStore.getState().uiMode).toBe('simple')
  })

  it('should set pattern code', () => {
    useAppStore.getState().setPatternCode('note("c3").s("sine")')
    expect(useAppStore.getState().patternCode).toBe('note("c3").s("sine")')
  })

  it('should set pattern playing', () => {
    useAppStore.getState().setPatternPlaying(true)
    expect(useAppStore.getState().patternPlaying).toBe(true)
  })

  it('should set macros', () => {
    useAppStore.getState().setMacro('tone', 0.7)
    expect(useAppStore.getState().macros.tone).toBe(0.7)
    // Other macros unchanged
    expect(useAppStore.getState().macros.space).toBe(0.3)
  })

  it('should set pattern data', () => {
    useAppStore.getState().setPatternData(0.5, 0.3, 1, 0.6)
    expect(useAppStore.getState().cycle).toBe(0.5)
    expect(useAppStore.getState().density).toBe(0.3)
    expect(useAppStore.getState().onset).toBe(1)
    expect(useAppStore.getState().patternNote).toBe(0.6)
  })

  it('should set bpm with clamping', () => {
    const { setBpm } = useAppStore.getState()
    setBpm(140)
    expect(useAppStore.getState().bpm).toBe(140)
    setBpm(10)
    expect(useAppStore.getState().bpm).toBe(20)
    setBpm(999)
    expect(useAppStore.getState().bpm).toBe(300)
  })

  it('should set and clear pattern error', () => {
    const { setPatternError } = useAppStore.getState()
    setPatternError('syntax error at line 1')
    expect(useAppStore.getState().patternError).toBe('syntax error at line 1')
    setPatternError(null)
    expect(useAppStore.getState().patternError).toBeNull()
  })
})

describe('synthType', () => {
  it('defaults to sine', () => {
    const state = useAppStore.getState()
    expect(state.synthType).toBe('sine')
  })

  it('setSynthType updates the value', () => {
    useAppStore.getState().setSynthType('triangle')
    expect(useAppStore.getState().synthType).toBe('triangle')
  })
})
