import { useAppStore } from '../state/store'
import { resolveSource, applyCurve, smoothValue } from './MappingTypes'

export class MappingEngine {
  private smoothedValues = new Map<string, number>()
  private outputValues = new Map<string, number>()

  getValue(target: string, defaultValue = 0): number {
    return this.outputValues.get(target) ?? defaultValue
  }

  param(target: string, defaultValue: number): () => number {
    return () => this.getValue(target, defaultValue)
  }

  tick(): void {
    const state = useAppStore.getState()
    for (const mapping of state.mappings) {
      const raw = resolveSource(mapping.source, state)
      const curved = applyCurve(raw, mapping.range, mapping.curve)
      const current = this.smoothedValues.get(mapping.id) ?? curved
      const smoothed = smoothValue(current, curved, mapping.smooth)
      this.smoothedValues.set(mapping.id, smoothed)
      this.outputValues.set(mapping.target, smoothed)
    }
  }

  reset(): void {
    this.smoothedValues.clear()
    this.outputValues.clear()
  }
}
