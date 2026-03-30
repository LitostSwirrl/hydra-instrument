import Hydra from 'hydra-synth'
import { registerCustomShaders } from './CustomShaders'
import type { ChainNode, TransformNode } from '../presets/types'

export interface HydraChainConfig {
  source: { fn: string; args: (number | string | ChainNode)[]; transforms?: TransformNode[] }
  transforms: { fn: string; args: (number | string | ChainNode)[] }[]
  output: string
}

const OUTPUT_BUFFERS = ['o0', 'o1', 'o2', 'o3'] as const

function isChainNode(arg: unknown): arg is ChainNode {
  return typeof arg === 'object' && arg !== null && 'fn' in arg && 'args' in arg
}

export class HydraEngine {
  private hydra: Hydra
  synth: Record<string, any>
  private paramGetter: ((target: string, defaultValue: number) => () => number) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.hydra = new Hydra({
      canvas,
      detectAudio: false,
      makeGlobal: false,
      width: canvas.width,
      height: canvas.height,
    })
    this.synth = (this.hydra as any).synth
    registerCustomShaders(this.synth)
  }

  setParamGetter(getter: (target: string, defaultValue: number) => () => number): void {
    this.paramGetter = getter
  }

  private resolveArg(arg: number | string | ChainNode): any {
    if (typeof arg === 'number') return arg
    if (typeof arg === 'string') {
      if (OUTPUT_BUFFERS.includes(arg as (typeof OUTPUT_BUFFERS)[number])) {
        return this.synth[arg]
      }
      return this.paramGetter?.(arg, 0) ?? (() => 0)
    }
    if (isChainNode(arg)) {
      return this.buildSubChain(arg)
    }
    return arg
  }

  private buildSubChain(node: ChainNode): any {
    const s = this.synth

    const sourceFn = s[node.fn]
    if (typeof sourceFn !== 'function') return s.solid()

    let chain = sourceFn.call(s, ...node.args.map((a) => this.resolveArg(a)))

    if (node.transforms) {
      for (const transform of node.transforms) {
        const fn = chain[transform.fn]
        if (typeof fn === 'function') {
          chain = fn.call(chain, ...transform.args.map((a) => this.resolveArg(a)))
        }
      }
    }

    return chain
  }

  buildChain(config: HydraChainConfig): void {
    const s = this.synth

    try {
      const sourceFn = s[config.source.fn]
      if (typeof sourceFn !== 'function') return

      let chain = sourceFn.call(s, ...config.source.args.map((a) => this.resolveArg(a)))

      // Apply transforms on the source itself (e.g., source with .rotate())
      if (config.source.transforms) {
        for (const transform of config.source.transforms) {
          const fn = chain[transform.fn]
          if (typeof fn === 'function') {
            chain = fn.call(chain, ...transform.args.map((a) => this.resolveArg(a)))
          }
        }
      }

      for (const transform of config.transforms) {
        const fn = chain[transform.fn]
        if (typeof fn === 'function') {
          chain = fn.call(chain, ...transform.args.map((a) => this.resolveArg(a)))
        }
      }

      if (typeof chain.out === 'function') {
        const output = s[config.output ?? 'o0']
        chain.out(output)
      }
    } catch (err) {
      console.error('HydraEngine.buildChain error:', err)
    }
  }

  resize(width: number, height: number): void {
    if (this.synth?.resolution) {
      this.synth.resolution = [width, height]
    }
  }
}
