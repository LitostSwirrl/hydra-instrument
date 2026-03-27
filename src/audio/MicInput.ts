import * as Tone from 'tone'
import { useAppStore } from '../state/store'

export class MicInput {
  private userMedia: Tone.UserMedia
  private destination: Tone.ToneAudioNode | null = null
  private unsubscribe: (() => void) | null = null
  private connected = false

  constructor() {
    this.userMedia = new Tone.UserMedia()
  }

  connectTo(destination: Tone.ToneAudioNode): void {
    this.destination = destination
  }

  startListening(): void {
    this.unsubscribe = useAppStore.subscribe(
      (state) => state.micEnabled,
      (micEnabled) => {
        if (micEnabled) {
          this.openMic()
        } else {
          this.closeMic()
        }
      }
    )

    // Handle initial state
    if (useAppStore.getState().micEnabled) {
      this.openMic()
    }
  }

  private openMic(): void {
    this.userMedia
      .open()
      .then(() => {
        if (this.destination && !this.connected) {
          this.userMedia.connect(this.destination)
          this.connected = true
        }
      })
      .catch(() => {
        // Permission denied or device unavailable
        useAppStore.getState().setMicEnabled(false)
      })
  }

  private closeMic(): void {
    if (this.connected) {
      if (this.destination) {
        this.userMedia.disconnect(this.destination)
      }
      this.connected = false
    }
    if (this.userMedia.state === 'started') {
      this.userMedia.close()
    }
  }

  stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }

  dispose(): void {
    this.stopListening()
    this.closeMic()
    this.userMedia.dispose()
  }
}
