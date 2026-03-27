import '@testing-library/jest-dom'

class MockAudioContext {
  state = 'suspended'
  sampleRate = 44100
  currentTime = 0
  destination = { channelCount: 2 }
  createGain() { return { connect: () => {}, gain: { value: 1 } } }
  createAnalyser() {
    return {
      connect: () => {},
      fftSize: 2048,
      frequencyBinCount: 1024,
      getFloatFrequencyData: (arr: Float32Array) => arr.fill(-100),
      getFloatTimeDomainData: (arr: Float32Array) => arr.fill(0),
    }
  }
  createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 440 } } }
  createBiquadFilter() { return { connect: () => {}, frequency: { value: 350 }, Q: { value: 1 }, type: 'lowpass' } }
  createDynamicsCompressor() { return { connect: () => {} } }
  resume() { this.state = 'running'; return Promise.resolve() }
  close() { return Promise.resolve() }
}

Object.defineProperty(globalThis, 'AudioContext', { value: MockAudioContext, writable: true })
Object.defineProperty(globalThis, 'webkitAudioContext', { value: MockAudioContext, writable: true })
