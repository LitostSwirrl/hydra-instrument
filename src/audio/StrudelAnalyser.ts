import { reduceToBands } from './analysisUtils'
import { useAppStore } from '../state/store'

export class StrudelAnalyser {
  private analyserNode: AnalyserNode
  private fftData: Float32Array
  private animFrameId: number | null = null

  constructor(audioContext: AudioContext) {
    this.analyserNode = audioContext.createAnalyser()
    this.analyserNode.fftSize = 1024
    this.fftData = new Float32Array(this.analyserNode.frequencyBinCount)
  }

  connectToOutput(destination: AudioNode): void {
    this.analyserNode.connect(destination)
  }

  getAnalysis(): { bands: number[]; envelope: number } {
    this.analyserNode.getFloatFrequencyData(this.fftData)
    const numBands = useAppStore.getState().analysis.numBands
    const bands = reduceToBands(this.fftData, numBands)
    // Compute envelope from average of mid-frequency bands
    const midBands = bands.slice(1, 5)
    const envelope =
      midBands.length > 0
        ? midBands.reduce((sum, b) => sum + b, 0) / midBands.length
        : 0
    return { bands, envelope }
  }

  startLoop(): void {
    const tick = (): void => {
      const { bands, envelope } = this.getAnalysis()
      useAppStore.getState().setAnalysis(bands, envelope)
      this.animFrameId = requestAnimationFrame(tick)
    }
    tick()
  }

  stopLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  getAnalyserNode(): AnalyserNode {
    return this.analyserNode
  }

  dispose(): void {
    this.stopLoop()
    try {
      this.analyserNode.disconnect()
    } catch {
      /* already disconnected */
    }
  }
}
