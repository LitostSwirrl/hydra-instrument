import { describe, it, expect, beforeEach } from 'vitest'
import { PatternBridge } from '../PatternBridge'

describe('PatternBridge', () => {
  let bridge: PatternBridge

  beforeEach(() => {
    bridge = new PatternBridge()
  })

  it('should initialize with zero values', () => {
    expect(bridge.getCycle()).toBe(0)
    expect(bridge.getDensity()).toBe(0)
    expect(bridge.getOnset()).toBe(0)
    expect(bridge.getPatternNote()).toBe(0)
  })

  it('should update cycle from hap', () => {
    bridge.handleTrigger({
      value: { note: 'c3' },
      whole: { begin: 2.5, end: 3 },
    })
    expect(bridge.getCycle()).toBeCloseTo(0.5)
  })

  it('should track onset as impulse', () => {
    bridge.handleTrigger({
      value: { note: 'c3' },
      whole: { begin: 0, end: 0.5 },
    })
    expect(bridge.getOnset()).toBe(1)
    bridge.tick()
    expect(bridge.getOnset()).toBeLessThan(1)
  })

  it('should compute density from events per window', () => {
    for (let i = 0; i < 4; i++) {
      bridge.handleTrigger({
        value: { note: 'c3' },
        whole: { begin: i * 0.25, end: (i + 1) * 0.25 },
      })
    }
    expect(bridge.getDensity()).toBeGreaterThan(0)
  })

  it('should normalize pattern note frequency', () => {
    bridge.handleTrigger({
      value: { note: 'c4' },
      whole: { begin: 0, end: 1 },
    })
    const freq = bridge.getPatternNote()
    expect(freq).toBeGreaterThan(0)
    expect(freq).toBeLessThan(1)
  })
})
