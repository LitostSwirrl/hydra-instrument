import { ReactNode } from 'react'

interface ControlPanelProps {
  open: boolean
  uiMode: 'simple' | 'pro'
  onToggleMode: () => void
  children: ReactNode
}

export function ControlPanel({ open, uiMode, onToggleMode, children }: ControlPanelProps) {
  const modeColor = uiMode === 'simple' ? '#00E676' : '#FF1493'

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
          background: rgba(255, 20, 147, 0.3);
          border-radius: 2px;
        }
        .hydra-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 20, 147, 0.5);
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
        {children}
      </div>
    </>
  )
}
