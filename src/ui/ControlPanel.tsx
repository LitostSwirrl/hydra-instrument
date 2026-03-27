import { ReactNode } from 'react'

interface ControlPanelProps {
  open: boolean
  children: ReactNode
}

export function ControlPanel({ open, children }: ControlPanelProps) {
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
          background: rgba(90, 40, 180, 0.3);
          border-radius: 2px;
        }
        .hydra-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(90, 40, 180, 0.5);
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
        {children}
      </div>
    </>
  )
}
