import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type AppState, useAppStore } from '../../state/store'

// Reset store before each test
beforeEach(() => {
  const initial = (
    useAppStore as unknown as { getInitialState: () => AppState }
  ).getInitialState()
  useAppStore.setState(initial, true)
})

describe('StrudelAnalyser', () => {
  let mockAnalyserNode: {
    connect: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
    fftSize: number
    frequencyBinCount: number
    getFloatFrequencyData: ReturnType<typeof vi.fn>
  }

  let mockAudioContext: {
    createAnalyser: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAnalyserNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      fftSize: 2048,
      frequencyBinCount: 512,
      getFloatFrequencyData: vi.fn((arr: Float32Array) => arr.fill(-55)),
    }
    mockAudioContext = {
      createAnalyser: vi.fn(() => mockAnalyserNode),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates analyser node with fftSize 1024', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)

    expect(mockAudioContext.createAnalyser).toHaveBeenCalledOnce()
    expect(mockAnalyserNode.fftSize).toBe(1024)

    analyser.dispose()
  })

  it('frequencyBinCount determines fftData buffer size', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)

    // The analyser node was created; getAnalyserNode should return it
    expect(analyser.getAnalyserNode()).toBe(mockAnalyserNode)

    analyser.dispose()
  })

  it('getAnalysis returns bands array with numBands elements', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)

    // Store default is 8 bands
    const result = analyser.getAnalysis()

    expect(result.bands).toHaveLength(8)
    expect(result.bands.every((b) => typeof b === 'number')).toBe(true)

    analyser.dispose()
  })

  it('getAnalysis returns envelope between 0 and 1', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)

    const result = analyser.getAnalysis()

    expect(result.envelope).toBeGreaterThanOrEqual(0)
    expect(result.envelope).toBeLessThanOrEqual(1)

    analyser.dispose()
  })

  it('getAnalysis reads numBands from store', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)

    useAppStore.setState({
      analysis: { ...useAppStore.getState().analysis, numBands: 4 },
    })
    const result = analyser.getAnalysis()

    expect(result.bands).toHaveLength(4)

    analyser.dispose()
  })

  it('getAnalysis calls getFloatFrequencyData on the analyser node', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)

    analyser.getAnalysis()

    expect(mockAnalyserNode.getFloatFrequencyData).toHaveBeenCalledOnce()

    analyser.dispose()
  })

  it('silence produces zero envelope', async () => {
    // Override mock to return silence (-100 dB)
    mockAnalyserNode.getFloatFrequencyData = vi.fn((arr: Float32Array) => arr.fill(-100))

    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)

    const result = analyser.getAnalysis()

    expect(result.envelope).toBe(0)
    result.bands.forEach((b) => expect(b).toBe(0))

    analyser.dispose()
  })

  it('connectToOutput connects analyser node to destination', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)
    const mockDest = {} as AudioNode

    analyser.connectToOutput(mockDest)

    expect(mockAnalyserNode.connect).toHaveBeenCalledWith(mockDest)

    analyser.dispose()
  })

  it('dispose disconnects the analyser node', async () => {
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(mockAudioContext as unknown as AudioContext)

    analyser.dispose()

    expect(mockAnalyserNode.disconnect).toHaveBeenCalledOnce()
  })

  it('connectSource connects upstream node to analyser', async () => {
    const ctx = new AudioContext()
    const { StrudelAnalyser } = await import('../StrudelAnalyser')
    const analyser = new StrudelAnalyser(ctx)
    const gain = ctx.createGain()
    const spy = vi.spyOn(gain, 'connect')
    analyser.connectSource(gain)
    expect(spy).toHaveBeenCalledWith(analyser.getAnalyserNode())
    analyser.dispose()
  })
})
