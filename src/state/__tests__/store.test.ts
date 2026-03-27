import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store'

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState())
})

describe('store', () => {
  it('has default synth type FMSynth', () => {
    expect(useAppStore.getState().synthType).toBe('FMSynth')
  })

  it('has 5 effects in chain', () => {
    expect(useAppStore.getState().effects).toHaveLength(5)
  })

  it('setSynthType changes synth', () => {
    useAppStore.getState().setSynthType('AMSynth')
    expect(useAppStore.getState().synthType).toBe('AMSynth')
  })

  it('setEffectBypass toggles bypass', () => {
    useAppStore.getState().setEffectBypass(1, true)
    expect(useAppStore.getState().effects[1].bypass).toBe(true)
  })

  it('setEffectWet clamps to 0-1', () => {
    useAppStore.getState().setEffectWet(0, 1.5)
    expect(useAppStore.getState().effects[0].wet).toBe(1)
    useAppStore.getState().setEffectWet(0, -0.5)
    expect(useAppStore.getState().effects[0].wet).toBe(0)
  })

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
    expect(useAppStore.getState().ui.panelOpen).toBe(false)
    useAppStore.getState().togglePanel()
    expect(useAppStore.getState().ui.panelOpen).toBe(true)
    useAppStore.getState().togglePanel()
    expect(useAppStore.getState().ui.panelOpen).toBe(false)
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
})
