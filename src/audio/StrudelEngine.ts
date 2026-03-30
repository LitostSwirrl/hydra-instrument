import { initStrudel, hush, evaluate, getAudioContext } from '@strudel/web'

interface KeyboardConfig {
  s: string
  effects: string
}

interface MacroDefaults {
  tone: number
  space: number
  intensity: number
}

const DEFAULT_MACROS: MacroDefaults = {
  tone: 0.5,
  space: 0.3,
  intensity: 0.5,
}

const globalRef = globalThis as Record<string, unknown>

export class StrudelEngine {
  private initialized = false
  private activeNotes = new Map<string, boolean>()
  private keyboardConfig: KeyboardConfig = { s: 'sine', effects: '' }
  private triggerCallback: ((hap: unknown) => void) | null = null

  async start(): Promise<void> {
    if (this.initialized) return

    await initStrudel()

    // Set default macros on globalThis so pattern code can reference them
    for (const [name, value] of Object.entries(DEFAULT_MACROS)) {
      globalRef[name] = value
    }

    this.initialized = true
  }

  /**
   * Evaluate and play a Strudel pattern.
   * Uses the built-in evaluate() which handles the transpiler and mini-notation.
   * Pattern code can reference macros (tone, space, intensity) set via setMacro().
   * If a triggerCallback is set, wraps the pattern with .onTrigger() so PatternBridge
   * receives hap events. dominantTrigger=false keeps superdough audio output active.
   */
  setPattern(code: string): void {
    this.ensureInitialized()
    try {
      // Wrap pattern with onTrigger to feed PatternBridge
      // dominantTrigger=false keeps superdough audio output active
      const wrappedCode = this.triggerCallback
        ? `(${code}).onTrigger((hap) => globalThis.__strudelTrigger?.(hap), false)`
        : code
      evaluate(wrappedCode, true).catch((err: unknown) => {
        console.error('[StrudelEngine] pattern evaluation failed:', err)
      })
    } catch (err) {
      console.error('[StrudelEngine] pattern evaluation failed (sync):', err)
    }
  }

  /** Set a callback that fires on every Strudel hap event (for PatternBridge). */
  setTriggerCallback(cb: (hap: unknown) => void): void {
    this.triggerCallback = cb
    globalRef.__strudelTrigger = cb
  }

  stop(): void {
    try {
      hush()
    } catch (err) {
      console.error('[StrudelEngine] stop failed:', err)
    }
  }

  /**
   * Inject a one-shot note using the current keyboard config synth and effects.
   * Builds a pattern string like: note("c3").s("sine").gain(0.8).play()
   */
  noteOn(note: string, vel: number): void {
    this.ensureInitialized()
    this.activeNotes.set(note, true)

    const gain = Math.max(0, Math.min(1, vel))
    const { s, effects } = this.keyboardConfig
    let pattern = `note("${note}").s("${s}").gain(${gain})`
    if (effects) {
      pattern += `.${effects}`
    }
    pattern += '.play()'

    evaluate(pattern, true).catch((err: unknown) => {
      console.error('[StrudelEngine] noteOn failed:', err)
    })
  }

  /**
   * Release a held note.
   * Currently a no-op since Strudel one-shots have fixed duration.
   * Future improvement: use the onTrigger stop callback for sustained notes.
   */
  noteOff(note: string): void {
    this.activeNotes.delete(note)
    // TODO: Implement sustained note release via onTrigger stop callback.
    // Strudel one-shot patterns have a fixed duration, so there's nothing
    // to explicitly release right now.
  }

  /** Silence everything and clear active notes. */
  panic(): void {
    this.stop()
    this.activeNotes.clear()
  }

  /**
   * Set a macro variable on globalThis so pattern code can reference it.
   * Common macros: tone, space, intensity.
   */
  setMacro(name: string, value: number): void {
    globalRef[name] = value
  }

  /** Returns the Web Audio AudioContext. Throws if not initialized. */
  getAudioContext(): AudioContext {
    this.ensureInitialized()
    const ctx = getAudioContext()
    if (!ctx) {
      throw new Error('[StrudelEngine] AudioContext not available')
    }
    return ctx
  }

  /** Configure the synth and effects used for keyboard note injection. */
  setKeyboardConfig(config: KeyboardConfig): void {
    this.keyboardConfig = { ...config }
  }

  /** Clean up and reset state. */
  dispose(): void {
    this.stop()
    this.activeNotes.clear()
    this.initialized = false
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('[StrudelEngine] Not initialized. Call start() first.')
    }
  }
}
