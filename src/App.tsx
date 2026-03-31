import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore, Mapping } from './state/store'
import { StrudelEngine } from './audio/StrudelEngine'
import { StrudelAnalyser } from './audio/StrudelAnalyser'
import { PatternBridge } from './audio/PatternBridge'
import { HydraEngine, HydraChainConfig } from './visual/HydraEngine'
import { MappingEngine } from './mapping/MappingEngine'
import { KeyboardHandler } from './input/KeyboardHandler'
import { MouseHandler } from './input/MouseHandler'
import { PresetManager } from './presets/PresetManager'
import { Preset, ChainNode } from './presets/types'
import { StartOverlay } from './ui/StartOverlay'
import { HUD } from './ui/HUD'
import { ControlPanel } from './ui/ControlPanel'
import { PresetBar } from './ui/PresetBar'
import { VisualPanel } from './ui/VisualPanel'
import { MappingPanel } from './ui/MappingPanel'
import { SimplePanel } from './ui/SimplePanel'
import { IntroGuide } from './ui/IntroGuide'

// ---------- helpers for VisualPanel bridge ----------
// VisualPanel works with named args (Record<string, number>), but HydraChainConfig
// uses positional args (number | string)[]. We keep a parallel local state for the UI
// and rebuild the chain config from it when things change.

interface VisualTransformUI {
  fn: string
  args: Record<string, number>
  mappedTargets: Record<string, string>
}

const SOURCE_ARG_KEYS: Record<string, string[]> = {
  osc: ['frequency', 'sync', 'offset'],
  noise: ['scale', 'offset'],
  voronoi: ['scale', 'speed', 'blending'],
  shape: ['sides', 'radius', 'smoothing'],
  gradient: ['speed'],
  solid: ['r', 'g', 'b'],
  src: [],
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
  diff: [],
  blend: ['amount'],
  mult: [],
  modulateScale: ['multiple'],
  luma: ['threshold', 'tolerance'],
  scrollX: ['scrollX', 'speed'],
  repeat: ['repeatX', 'repeatY'],
  invert: ['amount'],
  contrast: ['amount'],
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
  diff: {},
  blend: { amount: 0.5 },
  mult: {},
  modulateScale: { multiple: 1 },
  luma: { threshold: 0.5, tolerance: 0.1 },
  scrollX: { scrollX: 0.5, speed: 0 },
  repeat: { repeatX: 3, repeatY: 3 },
  invert: { amount: 1 },
  contrast: { amount: 1.5 },
}

const TRANSFORM_SOURCE_COUNT: Record<string, number> = {
  diff: 1,
  blend: 1,
  mult: 1,
  modulate: 1,
  modulateScale: 1,
}

type ChainArg = number | string | ChainNode

function positionalToNamed(
  fn: string,
  args: ChainArg[],
  keyMap: Record<string, string[]>,
  argOffset = 0
): Record<string, number> {
  const keys = keyMap[fn] ?? []
  const result: Record<string, number> = {}
  keys.forEach((key, i) => {
    const val = args[i + argOffset]
    result[key] = typeof val === 'number' ? val : 0
  })
  return result
}

function namedToPositional(
  fn: string,
  named: Record<string, number>,
  original: ChainArg[],
  keyMap: Record<string, string[]>,
  argOffset = 0
): ChainArg[] {
  const keys = keyMap[fn] ?? []
  const result = original.slice(0, argOffset)
  keys.forEach((key, i) => {
    const origVal = original[i + argOffset]
    if (typeof origVal === 'string' || (typeof origVal === 'object' && origVal !== null)) {
      result.push(origVal)
    } else {
      result.push(named[key] ?? (typeof origVal === 'number' ? origVal : 0))
    }
  })
  return result
}

function chainToVisualUI(chain: HydraChainConfig): {
  source: string
  sourceArgs: Record<string, number>
  transforms: VisualTransformUI[]
} {
  return {
    source: chain.source.fn,
    sourceArgs: positionalToNamed(chain.source.fn, chain.source.args, SOURCE_ARG_KEYS),
    transforms: chain.transforms.map((t) => {
      const keys = TRANSFORM_ARG_KEYS[t.fn] ?? []
      const offset = TRANSFORM_SOURCE_COUNT[t.fn] ?? 0
      const mappedTargets: Record<string, string> = {}
      keys.forEach((key, i) => {
        const arg = t.args[i + offset]
        if (typeof arg === 'string') {
          mappedTargets[key] = arg
        }
      })
      return {
        fn: t.fn,
        args: positionalToNamed(t.fn, t.args, TRANSFORM_ARG_KEYS, TRANSFORM_SOURCE_COUNT[t.fn] ?? 0),
        mappedTargets,
      }
    }),
  }
}

// ---------- main component ----------

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strudelEngineRef = useRef<StrudelEngine | null>(null)
  const strudelAnalyserRef = useRef<StrudelAnalyser | null>(null)
  const patternBridgeRef = useRef<PatternBridge | null>(null)
  const hydraEngineRef = useRef<HydraEngine | null>(null)
  const mappingEngineRef = useRef<MappingEngine | null>(null)
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

  // Keep a ref to the current chain config for rebuilding
  const chainRef = useRef<HydraChainConfig>({
    source: { fn: 'osc', args: [60, 0.1, 0] },
    transforms: [],
    output: 'o0',
  })

  // Store selectors
  const mappings = useAppStore((s) => s.mappings)
  const panelOpen = useAppStore((s) => s.ui.panelOpen)
  const uiMode = useAppStore((s) => s.uiMode)
  const analysis = useAppStore((s) => s.analysis)
  const patternCode = useAppStore((s) => s.patternCode)
  const patternPlaying = useAppStore((s) => s.patternPlaying)
  const patternError = useAppStore((s) => s.patternError)
  const macros = useAppStore((s) => s.macros)
  const bpm = useAppStore((s) => s.bpm)
  const synthType = useAppStore((s) => s.synthType)
  const octave = useAppStore((s) => s.octave)

  // ---------- preset manager (singleton, no audio dependency) ----------
  if (!presetManagerRef.current) {
    presetManagerRef.current = new PresetManager()
  }

  // ---------- apply preset ----------
  const applyPreset = useCallback(
    (preset: Preset) => {
      const store = useAppStore.getState()
      const engine = strudelEngineRef.current

      // Audio
      if (engine) {
        engine.setPattern(preset.audio.pattern)
        engine.setKeyboardConfig(preset.audio.keyboard)
        for (const [name, value] of Object.entries(preset.audio.macros)) {
          engine.setMacro(name, value)
        }
      }
      store.setPatternCode(preset.audio.pattern)
      store.setPatternPlaying(true)
      for (const [name, value] of Object.entries(preset.audio.macros)) {
        store.setMacro(name as 'tone' | 'space' | 'intensity', value)
      }
      store.setSynthType(preset.audio.keyboard.s)

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
          const offset = TRANSFORM_SOURCE_COUNT[t.fn] ?? 0
          return {
            fn: t.fn,
            args: namedToPositional(
              t.fn,
              t.args,
              existingTransform?.fn === t.fn ? existingTransform.args : [],
              TRANSFORM_ARG_KEYS,
              offset
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

    // 1. Strudel engine
    const engine = new StrudelEngine()
    await engine.start()
    strudelEngineRef.current = engine

    // 2. Strudel analyser (taps Strudel's audio output via superdough)
    const analyser = new StrudelAnalyser(engine.getAudioContext())
    const { getSuperdoughAudioController } = await import('@strudel/web')
    const controller = getSuperdoughAudioController()
    analyser.connectSource(controller.output.destinationGain)
    analyser.startLoop()
    strudelAnalyserRef.current = analyser

    // 3. Pattern bridge (wired to Strudel's onTrigger via engine callback)
    const bridge = new PatternBridge()
    patternBridgeRef.current = bridge

    engine.setTriggerCallback((hap: unknown) => {
      const h = hap as { value?: { note?: string }; whole?: { begin: number; end: number } }
      if (h.whole) {
        bridge.handleTrigger({
          value: { note: h.value?.note },
          whole: { begin: h.whole.begin, end: h.whole.end },
        })
      }
    })

    engine.setErrorCallback((error: string) => {
      useAppStore.getState().setPatternError(error)
    })

    // 4. Hydra
    const hydraEngine = new HydraEngine(canvas)
    hydraEngineRef.current = hydraEngine

    // 5. Mapping
    const mappingEngine = new MappingEngine()
    mappingEngineRef.current = mappingEngine

    // 6. Wire param getter
    hydraEngine.setParamGetter((target, def) => mappingEngine.param(target, def))

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
      onNoteOn: (note, velocity) => engine.noteOn(note, velocity),
      onNoteOff: (note) => engine.noteOff(note),
      onPanic: () => engine.panic(),
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
            pattern: state.patternCode,
            keyboard: { s: 'sine', effects: '' },
            macros: { ...state.macros },
          },
          visual: {
            chain: { ...chainRef.current },
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
      onTogglePattern: handleTogglePattern,
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
      bridge.tick()
      useAppStore.getState().setPatternData(
        bridge.getCycle(),
        bridge.getDensity(),
        bridge.getOnset(),
        bridge.getPatternNote()
      )
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
      strudelAnalyserRef.current?.dispose()
      strudelEngineRef.current?.dispose()
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
        const next = [...prev, { fn, args: { ...(TRANSFORM_ARG_DEFAULTS[fn] ?? {}) }, mappedTargets: {} }]
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

  // ---------- Pattern / Macro callbacks ----------
  const handleToggleMode = useCallback(() => {
    useAppStore.getState().toggleUIMode()
  }, [])

  const handlePatternChange = useCallback((code: string) => {
    useAppStore.getState().setPatternCode(code)
  }, [])

  const handleEvaluatePattern = useCallback(() => {
    const engine = strudelEngineRef.current
    if (!engine) return
    const code = useAppStore.getState().patternCode
    useAppStore.getState().setPatternError(null)
    engine.setPattern(code)
    useAppStore.getState().setPatternPlaying(true)
  }, [])

  const handleStopPattern = useCallback(() => {
    strudelEngineRef.current?.stop()
    useAppStore.getState().setPatternPlaying(false)
  }, [])

  const handleTogglePattern = useCallback(() => {
    const playing = useAppStore.getState().patternPlaying
    if (playing) {
      strudelEngineRef.current?.stop()
      useAppStore.getState().setPatternPlaying(false)
    } else {
      const code = useAppStore.getState().patternCode
      if (code) {
        strudelEngineRef.current?.setPattern(code)
      }
      useAppStore.getState().setPatternPlaying(true)
    }
  }, [])

  const handleMacroChange = useCallback((name: 'tone' | 'space' | 'intensity', value: number) => {
    strudelEngineRef.current?.setMacro(name, value)
    useAppStore.getState().setMacro(name, value)
  }, [])

  const handleSynthTypeChange = useCallback((type: string) => {
    useAppStore.getState().setSynthType(type)
    const engine = strudelEngineRef.current
    if (engine) {
      const currentEffects = currentPresetRef.current?.audio.keyboard.effects ?? ''
      engine.setKeyboardConfig({ s: type, effects: currentEffects })
    }
  }, [])

  const handleOctaveChange = useCallback((oct: number) => {
    useAppStore.getState().setOctave(oct)
  }, [])

  const handleBpmChange = useCallback((value: number) => {
    useAppStore.getState().setBpm(value)
    strudelEngineRef.current?.setBPM(value)
  }, [])

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
    : new Array(6).fill(null)

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

  const handleShowHelp = useCallback(() => {
    setShowIntro(true)
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
            bpm={bpm}
            presetName={currentPreset?.name ?? ''}
            audioLevel={analysis.envelope}
            panelOpen={panelOpen}
            sequencerPlaying={patternPlaying}
            uiMode={uiMode}
            onToggleMode={handleToggleMode}
            onShowHelp={handleShowHelp}
          />

          <ControlPanel
            open={panelOpen}
            uiMode={uiMode}
            onToggleMode={handleToggleMode}
            patternCode={patternCode}
            onPatternChange={handlePatternChange}
            onEvaluatePattern={handleEvaluatePattern}
            onStopPattern={handleStopPattern}
            patternPlaying={patternPlaying}
            patternError={patternError}
            macros={macros}
            onMacroChange={handleMacroChange}
            synthType={synthType}
            onSynthTypeChange={handleSynthTypeChange}
            octave={octave}
            onOctaveChange={handleOctaveChange}
            bpm={bpm}
            onBpmChange={handleBpmChange}
            onTogglePattern={handleTogglePattern}
          >
            {uiMode === 'simple' ? (
              <SimplePanel
                presetNames={presetSlots.map((name, i) => name ?? `Slot ${i + 1}`)}
                activePresetIndex={activeSlot}
                onPresetSelect={handlePresetSelect}
                synthType={synthType}
                onSynthTypeChange={handleSynthTypeChange}
                octave={octave}
                onOctaveChange={handleOctaveChange}
                tone={macros.tone}
                onToneChange={(v) => handleMacroChange('tone', v)}
                space={macros.space}
                onSpaceChange={(v) => handleMacroChange('space', v)}
                intensity={macros.intensity}
                onIntensityChange={(v) => handleMacroChange('intensity', v)}
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
