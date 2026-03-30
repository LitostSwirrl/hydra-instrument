import { useEffect, useState } from 'react'

interface HUDProps {
  bpm: number
  presetName: string
  audioLevel: number
  panelOpen: boolean
  sequencerPlaying: boolean
  uiMode: 'simple' | 'pro'
  onToggleMode: () => void
  onShowHelp: () => void
}

export function HUD({
  bpm,
  presetName,
  audioLevel,
  panelOpen,
  sequencerPlaying,
  uiMode,
  onToggleMode,
  onShowHelp,
}: HUDProps) {
  const [hintVisible, setHintVisible] = useState(true)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const modeColor = uiMode === 'simple' ? '#B0B8C4' : '#B0B8C4'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 30,
        opacity: panelOpen ? 0 : hovered ? 1 : 0.4,
        transition: 'opacity 300ms ease',
        pointerEvents: panelOpen ? 'none' : 'auto',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#cccccc', letterSpacing: '0.05em' }}>
          {bpm} bpm{sequencerPlaying ? ' \u25b6' : ''}
        </span>
        <span style={{ fontSize: '10px', color: '#999999', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {presetName || 'untitled'}
        </span>
        <div style={{ width: '80px', height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(1, Math.max(0, audioLevel)) * 100}%`, backgroundColor: '#B0B8C4', borderRadius: '2px', transition: 'width 60ms linear' }} />
        </div>
        <button
          onClick={onToggleMode}
          tabIndex={-1}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ width: '28px', height: '14px', borderRadius: '7px', backgroundColor: `${modeColor}44`, position: 'relative', transition: 'background-color 150ms' }}>
            <div style={{ position: 'absolute', top: '2px', left: uiMode === 'simple' ? '2px' : '14px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: modeColor, transition: 'left 150ms' }} />
          </div>
          <span style={{ fontSize: '9px', color: modeColor, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            {uiMode}
          </span>
        </button>
      </div>
      <div style={{ position: 'fixed', bottom: '16px', right: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={onShowHelp}
          tabIndex={-1}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#999999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 300ms ease',
          }}
        >
          ?
        </button>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999999', fontFamily: 'monospace', opacity: hintVisible ? 1 : 0, transition: 'opacity 600ms ease', pointerEvents: 'none' }}>tab</span>
      </div>
    </div>
  )
}
