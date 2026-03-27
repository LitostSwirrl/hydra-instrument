import * as Tone from 'tone'
import { useAppStore } from '../state/store'
import { dbToNormalized, reduceToBands } from './analyserUtils'

export { dbToNormalized, reduceToBands }

const METER_MIN_DB = -60
const METER_MAX_DB = 0

export class Analyser {
  private fft: Tone.FFT
  private meter: Tone.Meter
  private input: Tone.Gain
  private output: Tone.Gain
  private rafId: number | null = null
  private running = false

  constructor() {
    this.input = new Tone.Gain(1)
    this.output = new Tone.Gain(1)
    this.fft = new Tone.FFT(1024)
    this.meter = new Tone.Meter()

    this.input.connect(this.fft)
    this.input.connect(this.meter)
    this.input.connect(this.output)
  }

  getInput(): Tone.Gain {
    return this.input
  }

  connectOutput(destination: Tone.ToneAudioNode): void {
    this.output.connect(destination)
  }

  startLoop(): void {
    if (this.running) return
    this.running = true

    const loop = () => {
      if (!this.running) return

      const fftData = this.fft.getValue() as Float32Array
      const numBands = useAppStore.getState().analysis.numBands
      const bands = reduceToBands(fftData, numBands)

      const meterValue = this.meter.getValue()
      const meterDb = typeof meterValue === 'number' ? meterValue : (meterValue as number[])[0]
      const envelope = dbToNormalized(meterDb, METER_MIN_DB, METER_MAX_DB)

      useAppStore.getState().setAnalysis(bands, envelope)

      this.rafId = requestAnimationFrame(loop)
    }

    this.rafId = requestAnimationFrame(loop)
  }

  stopLoop(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  dispose(): void {
    this.stopLoop()
    this.fft.dispose()
    this.meter.dispose()
    this.input.dispose()
    this.output.dispose()
  }
}
