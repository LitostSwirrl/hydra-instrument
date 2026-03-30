import { Preset } from './types'
import { defaultPresets } from './defaults'

const STORAGE_KEY = 'hydra-instrument-presets'

export class PresetManager {
  private slots: (Preset | null)[] = new Array(6).fill(null)

  constructor() {
    this.loadFromStorage()
    this.ensureDefaults()
  }

  loadPreset(slot: number): Preset | null {
    return this.slots[slot - 1] ?? null
  }

  savePreset(slot: number, preset: Preset): void {
    this.slots[slot - 1] = preset
    this.saveToStorage()
  }

  getAllSlots(): (Preset | null)[] {
    return [...this.slots]
  }

  private loadFromStorage(): void {
    try {
      const json = localStorage.getItem(STORAGE_KEY)
      if (json) {
        const parsed = JSON.parse(json) as (Preset | null)[]
        this.slots = parsed.slice(0, 6)
      }
    } catch { /* ignore corrupt data */ }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slots))
  }

  private ensureDefaults(): void {
    defaultPresets.forEach((preset, i) => {
      if (!this.slots[i]) this.slots[i] = preset
    })
  }

  exportJSON(slot: number): string {
    return JSON.stringify(this.slots[slot - 1], null, 2)
  }

  importJSON(json: string): Preset {
    return JSON.parse(json) as Preset
  }

  encodeToURL(preset: Preset): string {
    const json = JSON.stringify(preset)
    const base64 = btoa(unescape(encodeURIComponent(json)))
    return `${window.location.origin}${window.location.pathname}#preset=${base64}`
  }

  decodeFromURL(hash: string): Preset | null {
    const match = hash.match(/preset=(.+)/)
    if (!match) return null
    try {
      const json = decodeURIComponent(escape(atob(match[1])))
      return JSON.parse(json) as Preset
    } catch { return null }
  }

  resetToDefaults(): void {
    this.slots = new Array(6).fill(null)
    this.ensureDefaults()
    this.saveToStorage()
  }
}
