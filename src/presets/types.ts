import { EffectConfig, Mapping } from '../state/store'
import { HydraChainConfig } from '../visual/HydraEngine'

// -- Expanded chain config types for nested sources and feedback --

export interface ChainNode {
  fn: string
  args: (number | string | ChainNode)[]
  transforms?: TransformNode[]
}

export interface TransformNode {
  fn: string
  args: (number | string | ChainNode)[]
}

export interface PresetAudio {
  synthType: string
  synthParams: Record<string, number>
  effects: EffectConfig[]
  sequencer: {
    pattern: (string | null)[]
    subdivision: string
    bpm: number
  } | null
}

export interface Preset {
  name: string
  audio: PresetAudio
  visual: {
    chain: HydraChainConfig
    customShaders: string[]
  }
  mappings: Mapping[]
  meta: {
    createdAt: string
    description: string
  }
}
