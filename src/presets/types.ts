import { HydraChainConfig } from '../visual/HydraEngine'
import type { MacroName } from '../state/store'

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
  macro?: MacroName
  scale?: number
}

export interface KeyboardConfig {
  s: string
  effects: string
  effectParams?: SuperdoughParam[]
}

export interface PresetAudio {
  pattern: string
  keyboard: KeyboardConfig
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
