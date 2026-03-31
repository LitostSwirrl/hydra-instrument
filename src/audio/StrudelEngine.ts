import type { KeyboardConfig } from '../presets/types'

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
  private activeNotes = new Set<string>()
  private keyboardConfig: KeyboardConfig = { s: 'sine', effects: '', effectParams: [] }
  private triggerCallback: ((hap: unknown) => void) | null = null
  private errorCallback: ((error: string) => void) | null = null
  private repl: { setCps: (cps: number) => void } | null = null
  private strudelModule: Awaited<typeof import('@strudel/web')> | null = null

  async start(): Promise<void> {
    if (this.initialized) return

    const mod = await import('@strudel/web')
    this.strudelModule = mod
    const repl = await mod.initStrudel()
    this.repl = repl

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
      this.strudelModule!.evaluate(wrappedCode, true).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[StrudelEngine] pattern evaluation failed:', msg)
        this.errorCallback?.(msg)
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[StrudelEngine] pattern evaluation failed (sync):', msg)
      this.errorCallback?.(msg)
    }
  }

  /** Set a callback that fires when pattern evaluation fails. */
  setErrorCallback(cb: (error: string) => void): void {
    this.errorCallback = cb
  }

  /** Set a callback that fires on every Strudel hap event (for PatternBridge). */
  setTriggerCallback(cb: (hap: unknown) => void): void {
    this.triggerCallback = cb
    globalRef.__strudelTrigger = cb
  }

  stop(): void {
    try {
      this.strudelModule?.hush()
    } catch (err) {
      console.error('[StrudelEngine] stop failed:', err)
    }
  }

  /**
   * Trigger a one-shot note via superdough -- bypasses the Strudel transpiler
   * entirely for near-instant audio. Resolves effect params from current macros.
   */
  noteOn(note: string, vel: number): void {
    this.ensureInitialized()
    this.activeNotes.add(note)

    const gain = Math.max(0, Math.min(1, vel))
    const { s, effectParams } = this.keyboardConfig
    const value: Record<string, unknown> = {
      note: note.toLowerCase(),
      s,
      gain,
    }
    if (effectParams) {
      for (const p of effectParams) {
        const macroVal = p.macro ? (globalRef[p.macro] as number ?? 0) : 0
        value[p.key] = macroVal * (p.scale ?? 1) + p.value
      }
    }

    const ctx = this.strudelModule!.getAudioContext()
    this.strudelModule!.superdough(value, ctx.currentTime, 0.5).catch((err: unknown) => {
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

  /** Set tempo in BPM. Converts to cycles-per-second for Strudel. */
  setBPM(bpm: number): void {
    this.repl?.setCps(bpm / 60)
  }

  /** Returns the Web Audio AudioContext. Throws if not initialized. */
  getAudioContext(): AudioContext {
    this.ensureInitialized()
    const ctx = this.strudelModule!.getAudioContext()
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
