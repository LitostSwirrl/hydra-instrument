import { describe, it, expect } from 'vitest'
import { MacroEngine } from '../MacroEngine'

describe('MacroEngine', () => {
  it('computeTone returns filter and decay params', () => {
    const result = MacroEngine.computeTone(0.5)
    expect(result.filterFrequency).toBeGreaterThan(200)
    expect(result.filterFrequency).toBeLessThan(8000)
    expect(result.filterQ).toBeGreaterThanOrEqual(1)
    expect(result.filterQ).toBeLessThanOrEqual(3)
    expect(result.decay).toBeGreaterThan(0.1)
    expect(result.decay).toBeLessThan(0.5)
  })

  it('computeTone at 0 returns minimum values', () => {
    const result = MacroEngine.computeTone(0)
    expect(result.filterFrequency).toBeCloseTo(200, 0)
    expect(result.filterQ).toBeCloseTo(1, 1)
    expect(result.decay).toBeCloseTo(0.5, 1)
  })

  it('computeTone at 1 returns maximum values', () => {
    const result = MacroEngine.computeTone(1)
    expect(result.filterFrequency).toBeCloseTo(8000, 0)
    expect(result.filterQ).toBeCloseTo(3, 1)
    expect(result.decay).toBeCloseTo(0.1, 1)
  })

  it('computeSpace returns reverb and delay params', () => {
    const result = MacroEngine.computeSpace(0.5)
    expect(result.reverbBypass).toBe(false)
    expect(result.reverbWet).toBeGreaterThan(0)
    expect(result.delayBypass).toBe(false)
  })

  it('computeSpace at 0 bypasses reverb and delay', () => {
    const result = MacroEngine.computeSpace(0)
    expect(result.reverbBypass).toBe(true)
    expect(result.delayBypass).toBe(true)
  })

  it('computeIntensity returns source param and brightness', () => {
    const result = MacroEngine.computeIntensity(0.5, 'osc')
    expect(result.sourcePrimary).toBeGreaterThan(10)
    expect(result.sourcePrimary).toBeLessThan(80)
    expect(result.brightness).toBeGreaterThan(-0.2)
  })

  it('computeMorph returns hue, colorama, rotate', () => {
    const result = MacroEngine.computeMorph(0.5)
    expect(result.hue).toBeGreaterThan(0)
    expect(result.hue).toBeLessThan(0.8)
    expect(result.colorama).toBeGreaterThan(0)
    expect(result.rotate).toBeGreaterThan(0)
  })

  it('getSourcePrimaryKey returns correct key per source', () => {
    expect(MacroEngine.getSourcePrimaryKey('osc')).toBe('frequency')
    expect(MacroEngine.getSourcePrimaryKey('sacredGeometry')).toBe('pulse')
    expect(MacroEngine.getSourcePrimaryKey('tribalMask')).toBe('glow')
    expect(MacroEngine.getSourcePrimaryKey('paisleyFlow')).toBe('density')
  })
})
