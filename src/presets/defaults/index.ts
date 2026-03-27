import { Preset } from '../types'
import { voidPreset } from './void'
import { ritualPreset } from './ritual'
import { signalPreset } from './signal'
import { emberPreset } from './ember'
import { cosmosPreset } from './cosmos'
import { maskPreset } from './mask'

export const defaultPresets: Preset[] = [
  voidPreset,
  ritualPreset,
  signalPreset,
  emberPreset,
  cosmosPreset,
  maskPreset,
]
