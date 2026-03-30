declare module '@strudel/web' {
  interface StrudelRepl {
    setCps: (cps: number) => void
  }
  export function initStrudel(options?: Record<string, unknown>): Promise<StrudelRepl>
  export function hush(): void
  export function evaluate(code: string, autoplay?: boolean): Promise<unknown>
  export function getAudioContext(): AudioContext

  // superdough re-exports for audio graph access
  interface SuperdoughOutput {
    destinationGain: GainNode
    channelMerger: ChannelMergerNode
  }
  interface SuperdoughAudioController {
    output: SuperdoughOutput
  }
  export function getSuperdoughAudioController(): SuperdoughAudioController
}
