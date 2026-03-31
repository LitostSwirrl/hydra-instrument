import { ReactNode } from 'react'
import { PatternEditor } from './PatternEditor'
import { Slider } from './widgets/Slider'

interface ControlPanelProps {
  open: boolean
  uiMode: 'simple' | 'pro'
  onToggleMode: () => void
  children: ReactNode
  patternCode?: string
  onPatternChange?: (code: string) => void
  onEvaluatePattern?: () => void
  onStopPattern?: () => void
  patternPlaying?: boolean
  patternError?: string | null
  macros?: { tone: number; space: number; intensity: number }
  onMacroChange?: (name: 'tone' | 'space' | 'intensity', value: number) => void
  bpm?: number
  onBpmChange?: (bpm: number) => void
  onTogglePattern?: () => void
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#B0B8C4',
  fontFamily: 'sans-serif',
  margin: '0 0 10px 0',
}

export function ControlPanel({
  open,
  uiMode,
  onToggleMode,
  children,
  patternCode,
  onPatternChange,
  onEvaluatePattern,
  onStopPattern,
  patternPlaying,
  patternError,
  macros,
  onMacroChange,
  bpm,
  onBpmChange,
  onTogglePattern,
}: ControlPanelProps) {
  const modeColor = uiMode === 'simple' ? '#B0B8C4' : '#B0B8C4'

  const showPatternEditor =
    uiMode === 'pro' &&
    patternCode !== undefined &&
    onPatternChange &&
    onEvaluatePattern &&
    onStopPattern &&
    patternPlaying !== undefined &&
    macros &&
    onMacroChange

  return (
    <>
      <style>{`
        .hydra-panel::-webkit-scrollbar {
          width: 3px;
        }
        .hydra-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .hydra-panel::-webkit-scrollbar-thumb {
          background: rgba(176, 184, 196, 0.3);
          border-radius: 2px;
        }
        .hydra-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(176, 184, 196, 0.5);
        }
      `}</style>
      <div
        className="hydra-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '380px',
          zIndex: 40,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-in-out',
          backgroundColor: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          overflowY: 'auto',
          padding: '16px',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            onClick={onToggleMode}
            tabIndex={-1}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            <span style={{ fontSize: '9px', color: modeColor, textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'sans-serif' }}>
              {uiMode}
            </span>
            <div style={{ width: '28px', height: '14px', borderRadius: '7px', backgroundColor: `${modeColor}44`, position: 'relative', transition: 'background-color 150ms' }}>
              <div style={{ position: 'absolute', top: '2px', left: uiMode === 'simple' ? '2px' : '14px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: modeColor, transition: 'left 150ms' }} />
            </div>
          </button>
        </div>
        {bpm !== undefined && onBpmChange && patternPlaying !== undefined && onTogglePattern && (
          <div style={{ marginBottom: '16px' }}>
            <p style={sectionHeaderStyle}>Rhythm</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={onTogglePattern}
                tabIndex={-1}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: patternPlaying ? '#B0B8C4' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: patternPlaying ? '#0a0a0f' : '#999999',
                  transition: 'background-color 150ms',
                  flexShrink: 0,
                }}
              >
                {patternPlaying ? '\u25a0' : '\u25b6'}
              </button>
              <div style={{ flex: 1 }}>
                <Slider label="BPM" value={bpm} min={60} max={200} step={1} accentColor="#B0B8C4" onChange={onBpmChange} />
              </div>
            </div>
          </div>
        )}
        {showPatternEditor && (
          <>
            <PatternEditor
              code={patternCode}
              onChange={onPatternChange}
              onEvaluate={onEvaluatePattern}
              onStop={onStopPattern}
              isPlaying={patternPlaying}
              error={patternError ?? null}
            />
            <div style={{ marginBottom: '16px' }}>
              <p style={sectionHeaderStyle}>MACROS</p>
              <Slider label="Tone" value={macros.tone} onChange={(v) => onMacroChange('tone', v)} min={0} max={1} step={0.01} />
              <Slider label="Space" value={macros.space} onChange={(v) => onMacroChange('space', v)} min={0} max={1} step={0.01} />
              <Slider label="Intensity" value={macros.intensity} onChange={(v) => onMacroChange('intensity', v)} min={0} max={1} step={0.01} />
            </div>
          </>
        )}
        {children}
      </div>
    </>
  )
}
