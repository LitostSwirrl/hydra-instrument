import * as Tone from 'tone'
import { useAppStore, SynthType } from '../state/store'
import { EffectsChain } from './EffectsChain'
import { Analyser } from './Analyser'

const SYNTH_MAP: Record<
  SynthType,
  typeof Tone.FMSynth | typeof Tone.AMSynth | typeof Tone.MembraneSynth | typeof Tone.MonoSynth
> = {
  FMSynth: Tone.FMSynth,
  AMSynth: Tone.AMSynth,
  MembraneSynth: Tone.MembraneSynth,
  MonoSynth: Tone.MonoSynth,
}

export class AudioEngine {
  private synth: Tone.PolySynth | null = null
  private effectsChain: EffectsChain | null = null
  private analyser: Analyser | null = null

  async start(): Promise<void> {
    await Tone.start()
    this.effectsChain = new EffectsChain()
    this.analyser = new Analyser()
    this.effectsChain.connectOutput(this.analyser.getInput())
    this.analyser.connectOutput(Tone.getDestination())
    this.createSynth(useAppStore.getState().synthType)
    this.analyser.startLoop()
    useAppStore.getState().startAudio()
  }

  private createSynth(type: SynthType): void {
    if (this.synth) this.synth.dispose()
    const Voice = SYNTH_MAP[type]
    this.synth = new Tone.PolySynth(Voice)
    this.synth.connect(this.effectsChain!.getInput())
  }

  setSynthType(type: SynthType): void {
    this.createSynth(type)
    useAppStore.getState().setSynthType(type)
  }

  noteOn(note: string, velocity = 0.8): void {
    this.synth?.triggerAttack(note, Tone.now(), velocity)
    const freq = Tone.Frequency(note).toFrequency()
    useAppStore.getState().setNoteInfo(velocity, Math.min(freq / 2000, 1))
  }

  noteOff(note: string): void {
    this.synth?.triggerRelease(note, Tone.now())
  }

  panic(): void {
    this.synth?.releaseAll()
    useAppStore.getState().setNoteInfo(0, 0)
  }

  getInputNode(): Tone.ToneAudioNode | null {
    return this.effectsChain?.getInput() ?? null
  }

  dispose(): void {
    this.synth?.dispose()
    this.effectsChain?.dispose()
    this.analyser?.dispose()
  }
}
