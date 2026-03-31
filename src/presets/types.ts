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

export type CurveType = 'linear' | 'exponential' | 'step'

export interface SuperdoughParam {
  key: string
  value: number
  macro?: string
  scale?: number
}

export interface PresetAudio {
  pattern: string
  keyboard: {
    s: string
    effects: string
    effectParams?: SuperdoughParam[]
  }
  macros: {
    tone: number
    space: number
    intensity: number
  }
}

export interface MappingConfig {
  id: string
  source: string
  target: string
  range: [number, number]
  smooth: number
  curve: CurveType
}

export interface Preset {
  name: string
  audio: PresetAudio
  visual: {
    chain: HydraChainConfig
  }
  mappings: MappingConfig[]
  meta: {
    createdAt: string
    description: string
  }
}
