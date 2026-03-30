import { describe, it, expect } from 'vitest'
import type { ChainNode, TransformNode } from '../../presets/types'
import type { HydraChainConfig } from '../HydraEngine'

describe('HydraChainConfig types', () => {
  it('should allow simple numeric args', () => {
    const node: ChainNode = { fn: 'osc', args: [60, 0.1, 0.3] }
    expect(node.args).toHaveLength(3)
  })

  it('should allow string param references', () => {
    const node: ChainNode = { fn: 'osc', args: [60, 'drift.speed', 0.3] }
    expect(node.args[1]).toBe('drift.speed')
  })

  it('should allow nested ChainNode args', () => {
    // modulate(noise(3), 0.1)
    const node: TransformNode = {
      fn: 'modulate',
      args: [{ fn: 'noise', args: [3] }, 0.1],
    }
    expect((node.args[0] as ChainNode).fn).toBe('noise')
  })

  it('should allow transforms on nested sources', () => {
    // diff(osc(60, 0.08).rotate(PI/2))
    const nested: ChainNode = {
      fn: 'osc',
      args: [60, 0.08],
      transforms: [{ fn: 'rotate', args: [Math.PI / 2] }],
    }
    const transform: TransformNode = { fn: 'diff', args: [nested] }
    expect((transform.args[0] as ChainNode).transforms).toHaveLength(1)
  })

  it('should allow feedback references as string args', () => {
    // blend(src(o0), 0.94)
    const config: HydraChainConfig = {
      source: { fn: 'osc', args: [60] },
      transforms: [
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.94] },
      ],
      output: 'o0',
    }
    const blendArg = config.transforms[0].args[0] as ChainNode
    expect(blendArg.fn).toBe('src')
    expect(blendArg.args[0]).toBe('o0')
  })

  it('should represent a full feedback chain', () => {
    // osc(60).diff(osc(60, 0.08).rotate(PI/2)).modulate(noise(3.5), 0.15).blend(src(o0), 0.94)
    const config: HydraChainConfig = {
      source: { fn: 'osc', args: [60, -0.015, 0.3] },
      transforms: [
        {
          fn: 'diff',
          args: [
            {
              fn: 'osc',
              args: [60, 0.08],
              transforms: [{ fn: 'rotate', args: [Math.PI / 2] }],
            },
          ],
        },
        { fn: 'modulate', args: [{ fn: 'noise', args: [3.5, 0.25] }, 0.15] },
        { fn: 'blend', args: [{ fn: 'src', args: ['o0'] }, 0.94] },
        { fn: 'brightness', args: [-0.05] },
      ],
      output: 'o0',
    }
    expect(config.transforms).toHaveLength(4)
    expect(config.source.fn).toBe('osc')
  })
})
