const FFT_MIN_DB = -100
const FFT_MAX_DB = -10

export function dbToNormalized(db: number, minDb: number, maxDb: number): number {
  if (db <= minDb) return 0
  if (db >= maxDb) return 1
  return (db - minDb) / (maxDb - minDb)
}

export function reduceToBands(fftData: Float32Array, numBands: number): number[] {
  const len = fftData.length
  const bands: number[] = []

  for (let b = 0; b < numBands; b++) {
    const startFrac = b / numBands
    const endFrac = (b + 1) / numBands

    // Logarithmic spacing across bins
    const logStart = Math.pow(len, startFrac)
    const logEnd = Math.pow(len, endFrac)

    const startBin = Math.floor(startFrac === 0 ? 0 : logStart)
    const endBin = Math.min(Math.ceil(logEnd), len)

    let sum = 0
    let count = 0
    for (let i = startBin; i < endBin; i++) {
      sum += dbToNormalized(fftData[i], FFT_MIN_DB, FFT_MAX_DB)
      count++
    }
    bands.push(count > 0 ? sum / count : 0)
  }

  return bands
}
