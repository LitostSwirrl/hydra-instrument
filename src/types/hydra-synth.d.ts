declare module 'hydra-synth' {
  interface HydraOptions {
    canvas?: HTMLCanvasElement | null
    width?: number
    height?: number
    autoLoop?: boolean
    makeGlobal?: boolean
    detectAudio?: boolean
    numSources?: number
    numOutputs?: number
    precision?: string | null
  }
  export default class Hydra {
    synth: Record<string, unknown>
    constructor(options?: HydraOptions)
    tick(dt: number): void
  }
}
