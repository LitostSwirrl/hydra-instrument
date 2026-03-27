import { describe, it, expect } from 'vitest'
import { dbToNormalized, reduceToBands } from '../analyserUtils'

describe('dbToNormalized', () => {
  it('maps min to 0', () => expect(dbToNormalized(-100, -100, -10)).toBe(0))
  it('maps max to 1', () => expect(dbToNormalized(-10, -100, -10)).toBe(1))
  it('maps midpoint', () => expect(dbToNormalized(-55, -100, -10)).toBeCloseTo(0.5))
  it('clamps below min', () => expect(dbToNormalized(-200, -100, -10)).toBe(0))
  it('clamps above max', () => expect(dbToNormalized(0, -100, -10)).toBe(1))
})

describe('reduceToBands', () => {
  it('returns correct number of bands', () => {
    const data = new Float32Array(512).fill(-55)
    expect(reduceToBands(data, 8)).toHaveLength(8)
  })
  it('silence returns zeros', () => {
    const data = new Float32Array(512).fill(-100)
    const bands = reduceToBands(data, 4)
    bands.forEach(b => expect(b).toBe(0))
  })
  it('full signal returns ones', () => {
    const data = new Float32Array(512).fill(-10)
    const bands = reduceToBands(data, 4)
    bands.forEach(b => expect(b).toBeCloseTo(1, 1))
  })
})
