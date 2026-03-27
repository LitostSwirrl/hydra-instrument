import Hydra from 'hydra-synth'
import { registerCustomShaders } from './CustomShaders'

export interface HydraChainConfig {
  source: { fn: string; args: (number | string)[] }
  transforms: { fn: string; args: (number | string)[] }[]
  output: string
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

  buildChain(config: HydraChainConfig): void {
    const s = this.synth

    const resolveArg = (arg: number | string): any => {
      if (typeof arg === 'string') {
        return this.paramGetter?.(arg, 0) ?? (() => 0)
      }
      return arg
    }

    try {
      const sourceFn = s[config.source.fn]
      if (typeof sourceFn !== 'function') return

      let chain = sourceFn.call(s, ...config.source.args.map(resolveArg))

      for (const transform of config.transforms) {
        const fn = chain[transform.fn]
        if (typeof fn === 'function') {
          chain = fn.call(chain, ...transform.args.map(resolveArg))
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
