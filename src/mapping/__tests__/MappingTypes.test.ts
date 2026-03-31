import { describe, it, expect, beforeEach } from 'vitest'
import { resolveSource, applyCurve, smoothValue } from '../MappingTypes'
import { useAppStore } from '../../state/store'

beforeEach(() => { useAppStore.setState(useAppStore.getInitialState()) })

describe('resolveSource', () => {
  it('resolves fft[0]', () => {
    useAppStore.getState().setAnalysis([0.75, 0.5, 0.25, 0], 0)
    expect(resolveSource('fft[0]', useAppStore.getState())).toBe(0.75)
  })
  it('returns 0 for out-of-range fft', () => {
    expect(resolveSource('fft[15]', useAppStore.getState())).toBe(0)
  })
  it('resolves envelope', () => {
    useAppStore.getState().setAnalysis([], 0.6)
    expect(resolveSource('envelope', useAppStore.getState())).toBe(0.6)
  })
  it('resolves mouse.x', () => {
    useAppStore.getState().setMouse(0.3, 0.7)
    expect(resolveSource('mouse.x', useAppStore.getState())).toBe(0.3)
  })
  it('returns 0 for unknown', () => {
    expect(resolveSource('unknown', useAppStore.getState())).toBe(0)
  })
  it('should resolve cycle source', () => {
    useAppStore.getState().setPatternData(0.75, 0, 0, 0)
    expect(resolveSource('cycle', useAppStore.getState())).toBe(0.75)
  })
  it('should resolve onset source', () => {
    useAppStore.getState().setPatternData(0, 0, 1, 0)
    expect(resolveSource('onset', useAppStore.getState())).toBe(1)
  })
  it('should resolve density source', () => {
    useAppStore.getState().setPatternData(0, 0.5, 0, 0)
    expect(resolveSource('density', useAppStore.getState())).toBe(0.5)
  })
  it('should resolve patternNote source', () => {
    useAppStore.getState().setPatternData(0, 0, 0, 0.6)
    expect(resolveSource('patternNote', useAppStore.getState())).toBe(0.6)
  })
  it('resolves macro.tone', () => {
    useAppStore.getState().setMacro('tone', 0.7)
    expect(resolveSource('macro.tone', useAppStore.getState())).toBe(0.7)
  })
  it('resolves macro.space', () => {
    useAppStore.getState().setMacro('space', 0.4)
    expect(resolveSource('macro.space', useAppStore.getState())).toBe(0.4)
  })
  it('resolves macro.intensity', () => {
    useAppStore.getState().setMacro('intensity', 0.9)
    expect(resolveSource('macro.intensity', useAppStore.getState())).toBe(0.9)
  })
})

describe('applyCurve', () => {
  it('linear midpoint', () => expect(applyCurve(0.5, [0, 100], 'linear')).toBe(50))
  it('exponential midpoint', () => expect(applyCurve(0.5, [0, 100], 'exponential')).toBe(25))
  it('step quantizes', () => {
    const result = applyCurve(0.3, [0, 1], 'step')
    expect(result).toBeCloseTo(0.25) // 0.3 rounds to 2/8 = 0.25
  })
  it('clamps above 1', () => expect(applyCurve(1.5, [0, 100], 'linear')).toBe(100))
  it('clamps below 0', () => expect(applyCurve(-0.5, [0, 100], 'linear')).toBe(0))
})

describe('smoothValue', () => {
  it('smooth=0 returns target', () => expect(smoothValue(0, 1, 0)).toBe(1))
  it('smooth=0.9 stays near current', () => {
    const result = smoothValue(0, 1, 0.9)
    expect(result).toBeLessThan(0.15)
  })
  it('converges over iterations', () => {
    let val = 0
    for (let i = 0; i < 100; i++) val = smoothValue(val, 1, 0.5)
    expect(val).toBeGreaterThan(0.99)
  })
})
