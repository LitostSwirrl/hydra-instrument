import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore, SynthType, Mapping } from './state/store'
import { AudioEngine } from './audio/AudioEngine'
import { Sequencer } from './audio/Sequencer'
import { MicInput } from './audio/MicInput'
import { HydraEngine, HydraChainConfig } from './visual/HydraEngine'
import { MappingEngine } from './mapping/MappingEngine'
import { KeyboardHandler } from './input/KeyboardHandler'
import { MouseHandler } from './input/MouseHandler'
import { PresetManager } from './presets/PresetManager'
import { Preset } from './presets/types'
import { StartOverlay } from './ui/StartOverlay'
import { HUD } from './ui/HUD'
import { ControlPanel } from './ui/ControlPanel'
import { PresetBar } from './ui/PresetBar'
import { AudioPanel } from './ui/AudioPanel'
import { VisualPanel } from './ui/VisualPanel'
import { MappingPanel } from './ui/MappingPanel'
import { SimplePanel } from './ui/SimplePanel'
import { MacroEngine } from './ui/MacroEngine'
import { IntroGuide } from './ui/IntroGuide'

// ---------- helpers for VisualPanel bridge ----------
// VisualPanel works with named args (Record<string, number>), but HydraChainConfig
// uses positional args (number | string)[]. We keep a parallel local state for the UI
// and rebuild the chain config from it when things change.

interface VisualTransformUI {
  fn: string
  args: Record<string, number>
}

const SOURCE_ARG_KEYS: Record<string, string[]> = {
  osc: ['frequency', 'sync', 'offset'],
  noise: ['scale', 'offset'],
  voronoi: ['scale', 'speed', 'blending'],
  shape: ['sides', 'radius', 'smoothing'],
  gradient: ['speed'],
  solid: ['r', 'g', 'b'],
  sacredGeometry: ['pulse', 'rings'],
  tribalMask: ['symmetry', 'glow'],
  particleField: ['density'],
  voidPulse: ['depth', 'rate'],
  ritualFire: ['turbulence', 'height'],
  paisleyFlow: ['density', 'speed', 'colorShift'],
}

const TRANSFORM_ARG_KEYS: Record<string, string[]> = {
  rotate: ['angle'],
  scale: ['amount'],
  kaleid: ['nSides'],
  pixelate: ['x'],
  colorama: ['amount'],
  hue: ['amount'],
  brightness: ['amount'],
  modulate: ['amount'],
  color: ['r', 'g', 'b'],
  glitchScan: ['amount'],
}

const TRANSFORM_ARG_DEFAULTS: Record<string, Record<string, number>> = {
  rotate: { angle: 0 },
  scale: { amount: 1 },
  kaleid: { nSides: 4 },
  pixelate: { x: 20 },
  colorama: { amount: 0.005 },
  hue: { amount: 0 },
  brightness: { amount: 0 },
  modulate: { amount: 0.1 },
}

const VISUAL_GROUP_TO_SOURCE: Record<string, string> = {
  Geometry: 'sacredGeometry',
  Mask: 'tribalMask',
  Fire: 'ritualFire',
  Particles: 'particleField',
  Flow: 'paisleyFlow',
}

function positionalToNamed(
  fn: string,
  args: (number | string)[],
  keyMap: Record<string, string[]>
): Record<string, number> {
  const keys = keyMap[fn] ?? []
  const result: Record<string, number> = {}
  keys.forEach((key, i) => {
    const val = args[i]
    // string args are mapping targets -- show 0 in UI
    result[key] = typeof val === 'number' ? val : 0
  })
  return result
}

function namedToPositional(
  fn: string,
  named: Record<string, number>,
  original: (number | string)[],
  keyMap: Record<string, string[]>
): (number | string)[] {
  const keys = keyMap[fn] ?? []
  return keys.map((key, i) => {
    const origVal = original[i]
    // Preserve string mapping targets
    if (typeof origVal === 'string') return origVal
    return named[key] ?? (typeof origVal === 'number' ? origVal : 0)
  })
}

function chainToVisualUI(chain: HydraChainConfig): {
  source: string
  sourceArgs: Record<string, number>
  transforms: VisualTransformUI[]
} {
  return {
    source: chain.source.fn,
    sourceArgs: positionalToNamed(chain.source.fn, chain.source.args, SOURCE_ARG_KEYS),
    transforms: chain.transforms.map((t) => ({
      fn: t.fn,
      args: positionalToNamed(t.fn, t.args, TRANSFORM_ARG_KEYS),
    })),
  }
}

// ---------- main component ----------

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const hydraEngineRef = useRef<HydraEngine | null>(null)
  const mappingEngineRef = useRef<MappingEngine | null>(null)
  const sequencerRef = useRef<Sequencer | null>(null)
  const micInputRef = useRef<MicInput | null>(null)
  const keyboardRef = useRef<KeyboardHandler | null>(null)
  const mouseRef = useRef<MouseHandler | null>(null)
  const presetManagerRef = useRef<PresetManager | null>(null)
  const rafRef = useRef<number>(0)

  const [started, setStarted] = useState(false)
  const [showIntro, setShowIntro] = useState(
    () => !localStorage.getItem('hydra-intro-seen')
  )
  const [activeSlot, setActiveSlot] = useState(0)
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null)
  const currentPresetRef = useRef<Preset | null>(null)

  // Visual UI state (bridged from chain config)
  const [visualSource, setVisualSource] = useState('osc')
  const [visualSourceArgs, setVisualSourceArgs] = useState<Record<string, number>>({})
  const [visualTransforms, setVisualTransforms] = useState<VisualTransformUI[]>([])

  const [macroTone, setMacroTone] = useState(0.5)
  const [macroSpace, setMacroSpace] = useState(0.3)
  const [macroIntensity, setMacroIntensity] = useState(0.5)
  const [macroMorph, setMacroMorph] = useState(0)
  const [visualGroup, setVisualGroup] = useState('Geometry')

  // Keep a ref to the current chain config for rebuilding
  const chainRef = useRef<HydraChainConfig>({
    source: { fn: 'osc', args: [60, 0.1, 0] },
    transforms: [],
    output: 'o0',
  })

  // Store selectors
  const synthType = useAppStore((s) => s.synthType)
  const synthParams = useAppStore((s) => s.synthParams)
  const effects = useAppStore((s) => s.effects)
  const sequencer = useAppStore((s) => s.sequencer)
  const micEnabled = useAppStore((s) => s.micEnabled)
  const mappings = useAppStore((s) => s.mappings)
  const panelOpen = useAppStore((s) => s.ui.panelOpen)
  const uiMode = useAppStore((s) => s.uiMode)
  const analysis = useAppStore((s) => s.analysis)

  // ---------- preset manager (singleton, no audio dependency) ----------
  if (!presetManagerRef.current) {
    presetManagerRef.current = new PresetManager()
  }

  // ---------- apply preset ----------
  const applyPreset = useCallback(
    (preset: Preset) => {
      const store = useAppStore.getState()

      // Audio
      if (audioEngineRef.current) {
        audioEngineRef.current.setSynthType(preset.audio.synthType as SynthType)
      }
      store.setSynthParams(preset.audio.synthParams)
      // Effects: replace all
      preset.audio.effects.forEach((eff, i) => {
        store.setEffectBypass(i, eff.bypass)
        store.setEffectWet(i, eff.wet)
        for (const [key, val] of Object.entries(eff.params)) {
          store.setEffectParam(i, key, val)
        }
      })
      // Sequencer
      if (preset.audio.sequencer) {
        store.setSequencerBpm(preset.audio.sequencer.bpm)
        store.setSequencerPattern(preset.audio.sequencer.pattern)
      }

      // Visual
      chainRef.current = { ...preset.visual.chain }
      if (hydraEngineRef.current) {
        hydraEngineRef.current.buildChain(preset.visual.chain)
      }
      const vis = chainToVisualUI(preset.visual.chain)
      setVisualSource(vis.source)
      setVisualSourceArgs(vis.sourceArgs)
      setVisualTransforms(vis.transforms)

      // Mappings -- clear old and add new
      const currentMappings = useAppStore.getState().mappings
      for (const m of currentMappings) {
        store.removeMapping(m.id)
      }
      for (const m of preset.mappings) {
        store.addMapping(m)
      }
      if (mappingEngineRef.current) {
        mappingEngineRef.current.reset()
      }

      setCurrentPreset(preset)
      currentPresetRef.current = preset

      // Update URL hash
      if (presetManagerRef.current) {
        const url = presetManagerRef.current.encodeToURL(preset)
        const hashPart = url.split('#')[1]
        if (hashPart) {
          window.location.hash = hashPart
        }
      }
    },
    []
  )

  // ---------- rebuild chain from UI state ----------
  const rebuildChain = useCallback(
    (
      source: string,
      sourceArgs: Record<string, number>,
      transforms: VisualTransformUI[]
    ) => {
      const newChain: HydraChainConfig = {
        source: {
          fn: source,
          args: namedToPositional(
            source,
            sourceArgs,
            chainRef.current.source.fn === source ? chainRef.current.source.args : [],
            SOURCE_ARG_KEYS
          ),
        },
        transforms: transforms.map((t, i) => {
          const existingTransform = chainRef.current.transforms[i]
          return {
            fn: t.fn,
            args: namedToPositional(
              t.fn,
              t.args,
              existingTransform?.fn === t.fn ? existingTransform.args : [],
              TRANSFORM_ARG_KEYS
            ),
          }
        }),
        output: chainRef.current.output,
      }
      chainRef.current = newChain
      hydraEngineRef.current?.buildChain(newChain)
    },
    []
  )

  // ---------- canvas resize ----------
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
        hydraEngineRef.current?.resize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ---------- start handler (user gesture) ----------
  const handleStart = useCallback(async () => {
    if (started) return
    setStarted(true)

    const canvas = canvasRef.current
    if (!canvas) return

    // 1. Audio
    const audioEngine = new AudioEngine()
    await audioEngine.start()
    audioEngineRef.current = audioEngine

    // 2. Hydra
    const hydraEngine = new HydraEngine(canvas)
    hydraEngineRef.current = hydraEngine

    // 3. Mapping
    const mappingEngine = new MappingEngine()
    mappingEngineRef.current = mappingEngine

    // 4. Wire param getter
    hydraEngine.setParamGetter((target, def) => mappingEngine.param(target, def))

    // 5. Sequencer
    const seq = new Sequencer()
    seq.setNoteCallback((note, velocity) => audioEngine.noteOn(note, velocity))
    seq.startListening()
    sequencerRef.current = seq

    // 6. MicInput
    const mic = new MicInput()
    const inputNode = audioEngine.getInputNode()
    if (inputNode) {
      mic.connectTo(inputNode)
    }
    mic.startListening()
    micInputRef.current = mic

    // 7. Load preset from URL hash or slot 1
    const pm = presetManagerRef.current!
    let initialPreset: Preset | null = null

    const hash = window.location.hash
    if (hash) {
      initialPreset = pm.decodeFromURL(hash)
    }
    if (!initialPreset) {
      initialPreset = pm.loadPreset(1)
    }
    if (initialPreset) {
      applyPreset(initialPreset)
      setActiveSlot(0)
    }

    // 8. Keyboard handler
    const keyboard = new KeyboardHandler({
      onNoteOn: (note, velocity) => audioEngine.noteOn(note, velocity),
      onNoteOff: (note) => audioEngine.noteOff(note),
      onPanic: () => audioEngine.panic(),
      onToggleMode: () => {
        useAppStore.getState().toggleUIMode()
      },
      onLoadPreset: (slot) => {
        const preset = pm.loadPreset(slot)
        if (preset) {
          applyPreset(preset)
          setActiveSlot(slot - 1)
        }
      },
      onSavePreset: (slot) => {
        const state = useAppStore.getState()
        const preset: Preset = {
          name: currentPresetRef.current?.name ?? `preset-${slot}`,
          audio: {
            synthType: state.synthType,
            synthParams: { ...state.synthParams },
            effects: state.effects.map((e) => ({
              ...e,
              params: { ...e.params },
            })),
            sequencer: state.sequencer.playing
              ? {
                  pattern: [...state.sequencer.pattern],
                  subdivision: state.sequencer.subdivision,
                  bpm: state.sequencer.bpm,
                }
              : null,
          },
          visual: {
            chain: { ...chainRef.current },
            customShaders: [],
          },
          mappings: state.mappings.map((m) => ({ ...m })),
          meta: {
            createdAt: new Date().toISOString(),
            description: '',
          },
        }
        pm.savePreset(slot, preset)
        setCurrentPreset(preset)
        currentPresetRef.current = preset
        setActiveSlot(slot - 1)
      },
    })
    keyboard.attach()
    keyboardRef.current = keyboard

    // 9. Mouse handler
    const mouse = new MouseHandler(canvas, {
      onScroll: (_delta) => {
        // Could map scroll to something; no-op for now
      },
    })
    mouse.attach()
    mouseRef.current = mouse

    // 10. rAF loop
    const tick = () => {
      mappingEngine.tick()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [started, applyPreset])

  // ---------- cleanup on unmount ----------
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      keyboardRef.current?.detach()
      mouseRef.current?.detach()
      sequencerRef.current?.dispose()
      micInputRef.current?.dispose()
      audioEngineRef.current?.dispose()
    }
  }, [])

  // ---------- persist uiMode to localStorage ----------
  useEffect(() => {
    const saved = localStorage.getItem('hydra-instrument-mode')
    if (saved === 'simple' || saved === 'pro') {
      useAppStore.getState().setUIMode(saved)
    }
    return useAppStore.subscribe(
      (s) => s.uiMode,
      (mode) => localStorage.setItem('hydra-instrument-mode', mode)
    )
  }, [])

  // ---------- VisualPanel callbacks ----------
  const handleSourceChange = useCallback(
    (source: string) => {
      const keys = SOURCE_ARG_KEYS[source] ?? []
      const newArgs: Record<string, number> = {}
      keys.forEach((k) => {
        newArgs[k] = 0
      })
      setVisualSource(source)
      setVisualSourceArgs(newArgs)
      rebuildChain(source, newArgs, visualTransforms)
    },
    [visualTransforms, rebuildChain]
  )

  const handleSourceArgChange = useCallback(
    (key: string, value: number) => {
      setVisualSourceArgs((prev) => {
        const next = { ...prev, [key]: value }
        rebuildChain(visualSource, next, visualTransforms)
        return next
      })
    },
    [visualSource, visualTransforms, rebuildChain]
  )

  const handleTransformArgChange = useCallback(
    (index: number, key: string, value: number) => {
      setVisualTransforms((prev) => {
        const next = prev.map((t, i) =>
          i === index ? { ...t, args: { ...t.args, [key]: value } } : t
        )
        rebuildChain(visualSource, visualSourceArgs, next)
        return next
      })
    },
    [visualSource, visualSourceArgs, rebuildChain]
  )

  const handleAddTransform = useCallback(
    (fn: string) => {
      setVisualTransforms((prev) => {
        const next = [...prev, { fn, args: { ...(TRANSFORM_ARG_DEFAULTS[fn] ?? {}) } }]
        rebuildChain(visualSource, visualSourceArgs, next)
        return next
      })
    },
    [visualSource, visualSourceArgs, rebuildChain]
  )

  const handleRemoveTransform = useCallback(
    (index: number) => {
      setVisualTransforms((prev) => {
        const next = prev.filter((_, i) => i !== index)
        rebuildChain(visualSource, visualSourceArgs, next)
        return next
      })
    },
    [visualSource, visualSourceArgs, rebuildChain]
  )

  // ---------- AudioPanel callbacks ----------
  const handleSynthTypeChange = useCallback((type: string) => {
    audioEngineRef.current?.setSynthType(type as SynthType)
  }, [])

  const handleSynthParamChange = useCallback((key: string, value: number) => {
    useAppStore.getState().setSynthParams({ [key]: value })
  }, [])

  const handleEffectToggle = useCallback((index: number) => {
    const current = useAppStore.getState().effects[index]
    if (current) {
      useAppStore.getState().setEffectBypass(index, !current.bypass)
    }
  }, [])

  const handleEffectWetChange = useCallback((index: number, wet: number) => {
    useAppStore.getState().setEffectWet(index, wet)
  }, [])

  const handleBpmChange = useCallback((bpm: number) => {
    useAppStore.getState().setSequencerBpm(bpm)
  }, [])

  const handleToggleSequencer = useCallback(() => {
    const state = useAppStore.getState()
    state.setSequencerPlaying(!state.sequencer.playing)
  }, [])

  const handleToggleMic = useCallback(() => {
    const state = useAppStore.getState()
    state.setMicEnabled(!state.micEnabled)
  }, [])

  const handleToggleMode = useCallback(() => {
    useAppStore.getState().toggleUIMode()
  }, [])

  const handleToneChange = useCallback((value: number) => {
    setMacroTone(value)
    const params = MacroEngine.computeTone(value)
    const store = useAppStore.getState()
    store.setEffectParam(0, 'frequency', params.filterFrequency)
    store.setEffectParam(0, 'Q', params.filterQ)
    store.setSynthParams({ decay: params.decay })
  }, [])

  const handleSpaceChange = useCallback((value: number) => {
    setMacroSpace(value)
    const params = MacroEngine.computeSpace(value)
    const store = useAppStore.getState()
    store.setEffectBypass(1, params.reverbBypass)
    store.setEffectWet(1, params.reverbWet)
    store.setEffectBypass(2, params.delayBypass)
    store.setEffectWet(2, params.delayWet)
    store.setEffectParam(2, 'feedback', params.delayFeedback)
  }, [])

  const handleIntensityChange = useCallback((value: number) => {
    setMacroIntensity(value)
    const params = MacroEngine.computeIntensity(value, visualSource)
    const key = MacroEngine.getSourcePrimaryKey(visualSource)
    handleSourceArgChange(key, params.sourcePrimary)
  }, [visualSource, handleSourceArgChange])

  const handleMorphChange = useCallback((value: number) => {
    setMacroMorph(value)
    const params = MacroEngine.computeMorph(value)
    setVisualTransforms((prev) => {
      const next = [...prev]
      const updateOrAdd = (fn: string, key: string, val: number) => {
        const idx = next.findIndex((t) => t.fn === fn)
        if (idx >= 0) {
          next[idx] = { ...next[idx], args: { ...next[idx].args, [key]: val } }
        } else if (val > 0.01) {
          next.push({ fn, args: { [key]: val } })
        }
      }
      updateOrAdd('hue', 'amount', params.hue)
      updateOrAdd('colorama', 'amount', params.colorama)
      updateOrAdd('rotate', 'angle', params.rotate)
      rebuildChain(visualSource, visualSourceArgs, next)
      return next
    })
  }, [visualSource, visualSourceArgs, rebuildChain])

  const handleVisualGroupChange = useCallback((group: string) => {
    setVisualGroup(group)
    const source = VISUAL_GROUP_TO_SOURCE[group] ?? 'osc'
    handleSourceChange(source)
  }, [handleSourceChange])

  // ---------- MappingPanel callbacks ----------
  const handleAddMapping = useCallback(() => {
    const newMapping: Mapping = {
      id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: 'envelope',
      target: 'osc.frequency',
      range: [0, 1],
      smooth: 0.1,
      curve: 'linear',
    }
    useAppStore.getState().addMapping(newMapping)
  }, [])

  const handleRemoveMapping = useCallback((id: string) => {
    useAppStore.getState().removeMapping(id)
  }, [])

  const handleUpdateMapping = useCallback((id: string, field: string, value: unknown) => {
    useAppStore.getState().updateMapping(id, { [field]: value })
  }, [])

  // ---------- PresetBar callbacks ----------
  const presetSlots: (string | null)[] = presetManagerRef.current
    ? presetManagerRef.current.getAllSlots().map((p) => p?.name ?? null)
    : new Array(9).fill(null)

  const handlePresetSelect = useCallback(
    (slotIndex: number) => {
      const pm = presetManagerRef.current
      if (!pm) return
      const preset = pm.loadPreset(slotIndex + 1)
      if (preset) {
        applyPreset(preset)
        setActiveSlot(slotIndex)
      }
    },
    [applyPreset]
  )

  const handleExport = useCallback(() => {
    const pm = presetManagerRef.current
    if (!pm) return
    const json = pm.exportJSON(activeSlot + 1)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `preset-${activeSlot + 1}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeSlot])

  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const pm = presetManagerRef.current
          if (!pm) return
          const preset = pm.importJSON(reader.result as string)
          pm.savePreset(activeSlot + 1, preset)
          applyPreset(preset)
        } catch {
          console.error('Failed to import preset')
        }
      }
      reader.readAsText(file)
    },
    [activeSlot, applyPreset]
  )

  const handleCopyURL = useCallback(() => {
    if (!currentPreset || !presetManagerRef.current) return
    const url = presetManagerRef.current.encodeToURL(currentPreset)
    navigator.clipboard.writeText(url).catch(() => {
      // fallback: do nothing
    })
  }, [currentPreset])

  const handleIntroDone = useCallback(() => {
    localStorage.setItem('hydra-intro-seen', '1')
    setShowIntro(false)
  }, [])

  // ---------- render ----------
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      <StartOverlay visible={!started} onStart={handleStart} />

      <IntroGuide visible={started && showIntro} onComplete={handleIntroDone} />

      {started && (
        <>
          <HUD
            bpm={sequencer.bpm}
            presetName={currentPreset?.name ?? ''}
            audioLevel={analysis.envelope}
            panelOpen={panelOpen}
            sequencerPlaying={sequencer.playing}
            uiMode={uiMode}
            onToggleMode={handleToggleMode}
          />

          <ControlPanel open={panelOpen} uiMode={uiMode} onToggleMode={handleToggleMode}>
            {uiMode === 'simple' ? (
              <SimplePanel
                presetNames={presetSlots.map((name, i) => name ?? `Slot ${i + 1}`)}
                activePresetIndex={activeSlot}
                onPresetSelect={handlePresetSelect}
                synthType={synthType}
                onSynthTypeChange={handleSynthTypeChange}
                tone={macroTone}
                onToneChange={handleToneChange}
                space={macroSpace}
                onSpaceChange={handleSpaceChange}
                visualGroup={visualGroup}
                onVisualGroupChange={handleVisualGroupChange}
                intensity={macroIntensity}
                onIntensityChange={handleIntensityChange}
                morph={macroMorph}
                onMorphChange={handleMorphChange}
                bpm={sequencer.bpm}
                onBpmChange={handleBpmChange}
                sequencerPlaying={sequencer.playing}
                onToggleSequencer={handleToggleSequencer}
              />
            ) : (
              <>
                <PresetBar
                  activeSlot={activeSlot}
                  slots={presetSlots}
                  onSelect={handlePresetSelect}
                  onExport={handleExport}
                  onImport={handleImport}
                  onCopyURL={handleCopyURL}
                />
                <AudioPanel
                  synthType={synthType}
                  onSynthTypeChange={handleSynthTypeChange}
                  synthParams={synthParams}
                  onSynthParamChange={handleSynthParamChange}
                  effects={effects.map((e) => ({ type: e.type, bypass: e.bypass, wet: e.wet }))}
                  onEffectToggle={handleEffectToggle}
                  onEffectWetChange={handleEffectWetChange}
                  bpm={sequencer.bpm}
                  onBpmChange={handleBpmChange}
                  sequencerPlaying={sequencer.playing}
                  onToggleSequencer={handleToggleSequencer}
                  micEnabled={micEnabled}
                  onToggleMic={handleToggleMic}
                />
                <VisualPanel
                  source={visualSource}
                  sourceArgs={visualSourceArgs}
                  onSourceChange={handleSourceChange}
                  onSourceArgChange={handleSourceArgChange}
                  transforms={visualTransforms}
                  onTransformArgChange={handleTransformArgChange}
                  onAddTransform={handleAddTransform}
                  onRemoveTransform={handleRemoveTransform}
                />
                <MappingPanel
                  mappings={mappings}
                  onAdd={handleAddMapping}
                  onRemove={handleRemoveMapping}
                  onUpdate={handleUpdateMapping}
                />
              </>
            )}
          </ControlPanel>
        </>
      )}
    </>
  )
}
