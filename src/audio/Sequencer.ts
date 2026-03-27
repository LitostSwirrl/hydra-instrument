import * as Tone from 'tone'
import { useAppStore } from '../state/store'

type NoteCallback = (note: string, velocity?: number) => void

export class Sequencer {
  private sequence: Tone.Sequence<string | null> | null = null
  private noteCallback: NoteCallback | null = null
  private unsubscribePlaying: (() => void) | null = null
  private unsubscribeBpm: (() => void) | null = null
  private unsubscribePattern: (() => void) | null = null

  setNoteCallback(cb: NoteCallback): void {
    this.noteCallback = cb
  }

  buildSequence(): void {
    if (this.sequence) {
      this.sequence.stop()
      this.sequence.dispose()
      this.sequence = null
    }

    const state = useAppStore.getState()
    const { pattern, subdivision } = state.sequencer
    const totalSteps = pattern.length

    this.sequence = new Tone.Sequence<string | null>(
      (time, note) => {
        if (note !== null && this.noteCallback) {
          Tone.getDraw().schedule(() => {
            // Get current step from sequence internals
            const currentStep = this.sequence
              ? (this.sequence as Tone.Sequence<string | null> & { _index: number })._index %
                totalSteps
              : 0
            useAppStore.getState().setSequencerStep(currentStep / totalSteps)
          }, time)

          this.noteCallback(note, 0.8)
        } else {
          Tone.getDraw().schedule(() => {
            const currentStep = this.sequence
              ? (this.sequence as Tone.Sequence<string | null> & { _index: number })._index %
                totalSteps
              : 0
            useAppStore.getState().setSequencerStep(currentStep / totalSteps)
          }, time)
        }
      },
      pattern,
      subdivision
    )

    if (state.sequencer.playing) {
      this.sequence.start(0)
    }
  }

  startListening(): void {
    // Set initial BPM
    Tone.getTransport().bpm.value = useAppStore.getState().sequencer.bpm

    this.unsubscribePlaying = useAppStore.subscribe(
      (state) => state.sequencer.playing,
      (playing) => {
        if (playing) {
          if (!this.sequence) this.buildSequence()
          else this.sequence.start(0)
          Tone.getTransport().start()
        } else {
          Tone.getTransport().stop()
          if (this.sequence) this.sequence.stop()
          useAppStore.getState().setSequencerStep(0)
        }
      }
    )

    this.unsubscribeBpm = useAppStore.subscribe(
      (state) => state.sequencer.bpm,
      (bpm) => {
        Tone.getTransport().bpm.value = bpm
      }
    )

    this.unsubscribePattern = useAppStore.subscribe(
      (state) => state.sequencer.pattern,
      () => {
        const wasPlaying = useAppStore.getState().sequencer.playing
        this.buildSequence()
        if (wasPlaying) {
          this.sequence?.start(0)
          Tone.getTransport().start()
        }
      }
    )

    // Build initial sequence
    this.buildSequence()
  }

  stopListening(): void {
    if (this.unsubscribePlaying) {
      this.unsubscribePlaying()
      this.unsubscribePlaying = null
    }
    if (this.unsubscribeBpm) {
      this.unsubscribeBpm()
      this.unsubscribeBpm = null
    }
    if (this.unsubscribePattern) {
      this.unsubscribePattern()
      this.unsubscribePattern = null
    }
  }

  dispose(): void {
    this.stopListening()
    if (this.sequence) {
      this.sequence.stop()
      this.sequence.dispose()
      this.sequence = null
    }
    Tone.getTransport().stop()
  }
}
