import { useAppStore } from '../state/store'

const KEY_TO_NOTE: Record<string, { note: string; octaveOffset: number }> = {
  'a': { note: 'C', octaveOffset: 0 },
  'w': { note: 'C#', octaveOffset: 0 },
  's': { note: 'D', octaveOffset: 0 },
  'e': { note: 'D#', octaveOffset: 0 },
  'd': { note: 'E', octaveOffset: 0 },
  'f': { note: 'F', octaveOffset: 0 },
  't': { note: 'F#', octaveOffset: 0 },
  'g': { note: 'G', octaveOffset: 0 },
  'y': { note: 'G#', octaveOffset: 0 },
  'h': { note: 'A', octaveOffset: 0 },
  'u': { note: 'A#', octaveOffset: 0 },
  'j': { note: 'B', octaveOffset: 0 },
  'k': { note: 'C', octaveOffset: 1 },
  'o': { note: 'C#', octaveOffset: 1 },
  'l': { note: 'D', octaveOffset: 1 },
  'p': { note: 'D#', octaveOffset: 1 },
  ';': { note: 'E', octaveOffset: 1 },
}

interface KeyboardCallbacks {
  onNoteOn: (note: string, velocity: number) => void
  onNoteOff: (note: string) => void
  onPanic: () => void
  onLoadPreset: (slot: number) => void
  onSavePreset: (slot: number) => void
  onToggleMode: () => void
}

export class KeyboardHandler {
  private heldKeys = new Set<string>()
  private callbacks: KeyboardCallbacks
  private handleKeyDown: (e: KeyboardEvent) => void
  private handleKeyUp: (e: KeyboardEvent) => void

  constructor(callbacks: KeyboardCallbacks) {
    this.callbacks = callbacks

    this.handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      // Skip when typing in text inputs
      const tag = (e.target as HTMLElement)?.tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      // Tab: toggle panel (always works)
      if (e.key === 'Tab') {
        e.preventDefault()
        useAppStore.getState().togglePanel()
        return
      }

      // Escape: panic (always works)
      if (e.key === 'Escape') {
        this.callbacks.onPanic()
        return
      }

      if (isTyping) return

      // Space: toggle pattern playback
      if (e.key === ' ') {
        e.preventDefault()
        const state = useAppStore.getState()
        state.setPatternPlaying(!state.patternPlaying)
        return
      }

      // Number keys: presets
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 6) {
        if (e.shiftKey) {
          this.callbacks.onSavePreset(num)
        } else {
          this.callbacks.onLoadPreset(num)
        }
        return
      }

      // Z/X: octave shift
      if (key === 'z') {
        const oct = useAppStore.getState().octave
        useAppStore.getState().setOctave(oct - 1)
        return
      }
      if (key === 'x') {
        const oct = useAppStore.getState().octave
        useAppStore.getState().setOctave(oct + 1)
        return
      }

      // M: toggle UI mode
      if (key === 'm') {
        this.callbacks.onToggleMode()
        return
      }

      // Note keys
      const mapping = KEY_TO_NOTE[key]
      if (mapping && !this.heldKeys.has(key)) {
        this.heldKeys.add(key)
        const octave = useAppStore.getState().octave + mapping.octaveOffset
        const fullNote = mapping.note + octave
        this.callbacks.onNoteOn(fullNote, 0.8)
      }
    }

    this.handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const mapping = KEY_TO_NOTE[key]
      if (mapping && this.heldKeys.has(key)) {
        this.heldKeys.delete(key)
        const octave = useAppStore.getState().octave + mapping.octaveOffset
        const fullNote = mapping.note + octave
        this.callbacks.onNoteOff(fullNote)
      }
    }
  }

  attach(): void {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.heldKeys.clear()
  }
}
