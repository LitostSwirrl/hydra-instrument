import { AppState, CurveType } from '../state/store'

export function resolveSource(sourceId: string, state: AppState): number {
  const fftMatch = sourceId.match(/^fft\[(\d+)\]$/)
  if (fftMatch) return state.analysis.fftBands[parseInt(fftMatch[1], 10)] ?? 0
  switch (sourceId) {
    case 'envelope': return state.analysis.envelope
    case 'noteVelocity': return state.noteVelocity
    case 'noteFrequency': return state.noteFrequency
    case 'mouse.x': return state.mouse.x
    case 'mouse.y': return state.mouse.y
    case 'sequencerStep': return state.sequencerStep
    default: return 0
  }
}

export function applyCurve(value: number, range: [number, number], curve: CurveType): number {
  const [min, max] = range
  const clamped = Math.max(0, Math.min(1, value))
  switch (curve) {
    case 'linear': return min + clamped * (max - min)
    case 'exponential': return min + Math.pow(clamped, 2) * (max - min)
    case 'step': return min + (Math.round(clamped * 8) / 8) * (max - min)
  }
}

export function smoothValue(current: number, target: number, smooth: number): number {
  if (smooth <= 0) return target
  const factor = Math.pow(smooth, 0.5)
  return current * factor + target * (1 - factor)
}
