import { useEffect, useState } from 'react'

interface HUDProps {
  bpm: number
  presetName: string
  audioLevel: number
  panelOpen: boolean
  sequencerPlaying: boolean
}

export function HUD({ bpm, presetName, audioLevel, panelOpen, sequencerPlaying }: HUDProps) {
  const [hintVisible, setHintVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 30,
        opacity: panelOpen ? 0 : 0.4,
        transition: 'opacity 300ms ease',
        pointerEvents: 'none',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#c8c8d0',
            letterSpacing: '0.05em',
          }}
        >
          {bpm} bpm{sequencerPlaying ? ' \u25b6' : ''}
        </span>

        <span
          style={{
            fontSize: '10px',
            color: '#6a6a78',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {presetName || 'untitled'}
        </span>

        <div
          style={{
            width: '80px',
            height: '2px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: '1px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(1, Math.max(0, audioLevel)) * 100}%`,
              backgroundColor: '#5a28b4',
              borderRadius: '1px',
              transition: 'width 60ms linear',
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          opacity: hintVisible ? 1 : 0,
          transition: 'opacity 600ms ease',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#6a6a78',
            fontFamily: 'monospace',
          }}
        >
          tab
        </span>
      </div>
    </div>
  )
}
