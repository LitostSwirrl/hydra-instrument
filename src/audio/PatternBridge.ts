/**
 * PatternBridge -- extracts musical structure from Strudel hap events.
 *
 * Standalone class with no dependencies on Strudel, Tone.js, or the store.
 * Receives hap-like objects via handleTrigger() and exposes computed values
 * (cycle position, onset impulse, density, pattern note frequency).
 *
 * Wiring to Strudel's onTrigger and store integration happen externally.
 */

export interface HapLike {
  value: { note?: string; [key: string]: unknown }
  whole: { begin: number; end: number }
}

// Base frequencies at octave 4 (Hz)
const NOTE_FREQ: Record<string, number> = {
  c: 261.63,
  'c#': 277.18,
  db: 277.18,
  d: 293.66,
  'd#': 311.13,
  eb: 311.13,
  e: 329.63,
  f: 349.23,
  'f#': 369.99,
  gb: 369.99,
  g: 392.0,
  'g#': 415.3,
  ab: 415.3,
  a: 440.0,
  'a#': 466.16,
  bb: 466.16,
  b: 493.88,
}

const FREQ_MIN = 20
const FREQ_MAX = 4000
const LOG_MIN = Math.log(FREQ_MIN)
const LOG_MAX = Math.log(FREQ_MAX)

const ONSET_DECAY = 0.85
const ONSET_EPSILON = 0.01
const MAX_EVENTS_PER_CYCLE = 16

function noteToFreq(noteStr: string): number {
  const match = noteStr.match(/^([a-g][b#]?)(\d+)$/i)
  if (!match) return 0

  const name = match[1].toLowerCase()
  const octave = parseInt(match[2], 10)
  const baseFreq = NOTE_FREQ[name]
  if (baseFreq === undefined) return 0

  // Scale from octave 4 reference
  return baseFreq * Math.pow(2, octave - 4)
}

function normalizeFreq(freq: number): number {
  if (freq <= FREQ_MIN) return 0
  if (freq >= FREQ_MAX) return 1
  return (Math.log(freq) - LOG_MIN) / (LOG_MAX - LOG_MIN)
}

export class PatternBridge {
  private cycle = 0
  private onset = 0
  private density = 0
  private patternNote = 0

  private eventsInCurrentCycle = 0
  private currentCycleInt = 0

  handleTrigger(hap: HapLike): void {
    // Cycle position: fractional part of begin
    const begin = hap.whole.begin
    this.cycle = begin % 1

    // Onset: impulse on every trigger
    this.onset = 1

    // Note frequency (normalized)
    const noteStr = hap.value.note
    if (noteStr) {
      const freq = noteToFreq(noteStr)
      if (freq > 0) {
        this.patternNote = normalizeFreq(freq)
      }
    }

    // Density tracking: count events per integer cycle
    const cycleInt = Math.floor(begin)
    if (cycleInt !== this.currentCycleInt) {
      // New cycle -- save density from previous cycle
      this.density = Math.min(this.eventsInCurrentCycle / MAX_EVENTS_PER_CYCLE, 1)
      this.eventsInCurrentCycle = 1
      this.currentCycleInt = cycleInt
    } else {
      this.eventsInCurrentCycle++
      // Update density live so it is non-zero even within the first cycle
      this.density = Math.min(this.eventsInCurrentCycle / MAX_EVENTS_PER_CYCLE, 1)
    }
  }

  tick(): void {
    this.onset *= ONSET_DECAY
    if (this.onset < ONSET_EPSILON) {
      this.onset = 0
    }
  }

  getCycle(): number {
    return this.cycle
  }

  getOnset(): number {
    return this.onset
  }

  getDensity(): number {
    return this.density
  }

  getPatternNote(): number {
    return this.patternNote
  }

  reset(): void {
    this.cycle = 0
    this.onset = 0
    this.density = 0
    this.patternNote = 0
    this.eventsInCurrentCycle = 0
    this.currentCycleInt = 0
  }
}
