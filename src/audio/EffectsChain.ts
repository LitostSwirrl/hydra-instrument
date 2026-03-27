import * as Tone from 'tone'
import { useAppStore, EffectConfig } from '../state/store'

interface EffectNode {
  node: Tone.ToneAudioNode & { wet?: Tone.Signal<'normalRange'> }
  storedWet: number
}

export class EffectsChain {
  private input: Tone.Gain
  private output: Tone.Gain
  private filter: Tone.Filter
  private reverb: Tone.Reverb
  private delay: Tone.FeedbackDelay
  private distortion: Tone.Distortion
  private compressor: Tone.Compressor
  private effectNodes: EffectNode[]
  private unsubscribe: (() => void) | null = null

  constructor() {
    this.input = new Tone.Gain(1)
    this.output = new Tone.Gain(1)

    const state = useAppStore.getState()
    const effects = state.effects

    // filter (index 0) -- no wet, always in-line, use bypass to pass-through by setting very high freq
    const filterCfg = effects[0]
    this.filter = new Tone.Filter({
      frequency: filterCfg.params.frequency ?? 2000,
      Q: filterCfg.params.Q ?? 1,
      type: 'lowpass',
    })

    // reverb (index 1)
    const reverbCfg = effects[1]
    this.reverb = new Tone.Reverb({ decay: reverbCfg.params.decay ?? 2.5 })
    this.reverb.wet.value = reverbCfg.bypass ? 0 : reverbCfg.wet

    // delay (index 2)
    const delayCfg = effects[2]
    this.delay = new Tone.FeedbackDelay({
      delayTime: delayCfg.params.delayTime ?? 0.25,
      feedback: delayCfg.params.feedback ?? 0.4,
    })
    this.delay.wet.value = delayCfg.bypass ? 0 : delayCfg.wet

    // distortion (index 3)
    const distortionCfg = effects[3]
    this.distortion = new Tone.Distortion(distortionCfg.params.distortion ?? 0.4)
    this.distortion.wet.value = distortionCfg.bypass ? 0 : distortionCfg.wet

    // compressor (index 4) -- no wet knob, bypass by disconnecting signal
    const compressorCfg = effects[4]
    this.compressor = new Tone.Compressor({
      threshold: compressorCfg.params.threshold ?? -24,
      ratio: compressorCfg.params.ratio ?? 4,
    })

    // Serial chain: input -> filter -> reverb -> delay -> distortion -> compressor -> output
    this.input.chain(this.filter, this.reverb, this.delay, this.distortion, this.compressor, this.output)

    // Track storedWet for bypass toggle
    this.effectNodes = [
      { node: this.filter as unknown as EffectNode['node'], storedWet: filterCfg.wet },
      { node: this.reverb, storedWet: reverbCfg.wet },
      { node: this.delay, storedWet: delayCfg.wet },
      { node: this.distortion, storedWet: distortionCfg.wet },
      { node: this.compressor as unknown as EffectNode['node'], storedWet: compressorCfg.wet },
    ]

    this.subscribeToStore()
  }

  private subscribeToStore(): void {
    this.unsubscribe = useAppStore.subscribe(
      (state) => state.effects,
      (effects) => {
        this.applyEffects(effects)
      }
    )
  }

  private applyEffects(effects: EffectConfig[]): void {
    effects.forEach((cfg, i) => {
      switch (i) {
        case 0: // filter
          this.filter.frequency.value = cfg.params.frequency ?? 2000
          ;(this.filter as Tone.Filter & { Q: { value: number } }).Q.value = cfg.params.Q ?? 1
          // Filter bypass: push frequency to Nyquist to open it up
          if (cfg.bypass) {
            this.filter.frequency.value = 20000
          }
          break

        case 1: // reverb
          this.reverb.wet.value = cfg.bypass ? 0 : cfg.wet
          if (!cfg.bypass && cfg.params.decay !== undefined) {
            this.reverb.decay = cfg.params.decay
          }
          break

        case 2: // delay
          this.delay.wet.value = cfg.bypass ? 0 : cfg.wet
          if (cfg.params.delayTime !== undefined) {
            this.delay.delayTime.value = cfg.params.delayTime
          }
          if (cfg.params.feedback !== undefined) {
            this.delay.feedback.value = cfg.params.feedback
          }
          break

        case 3: // distortion
          this.distortion.wet.value = cfg.bypass ? 0 : cfg.wet
          if (cfg.params.distortion !== undefined) {
            this.distortion.distortion = cfg.params.distortion
          }
          break

        case 4: // compressor
          if (cfg.params.threshold !== undefined) {
            this.compressor.threshold.value = cfg.params.threshold
          }
          if (cfg.params.ratio !== undefined) {
            this.compressor.ratio.value = cfg.params.ratio
          }
          break
      }

      this.effectNodes[i].storedWet = cfg.wet
    })
  }

  getInput(): Tone.Gain {
    return this.input
  }

  getOutput(): Tone.Gain {
    return this.output
  }

  connectOutput(destination: Tone.ToneAudioNode): void {
    this.output.connect(destination)
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    this.filter.dispose()
    this.reverb.dispose()
    this.delay.dispose()
    this.distortion.dispose()
    this.compressor.dispose()
    this.input.dispose()
    this.output.dispose()
  }
}
