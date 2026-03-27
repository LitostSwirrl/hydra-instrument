interface StartOverlayProps {
  visible: boolean
  onStart: () => void
}

export function StartOverlay({ visible, onStart }: StartOverlayProps) {
  return (
    <div
      onClick={onStart}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0f',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 400ms ease',
        fontFamily: 'sans-serif',
        userSelect: 'none',
      }}
    >
      <p
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          color: '#eeeef2',
          margin: 0,
          marginBottom: '16px',
        }}
      >
        Click to begin
      </p>
      <p
        style={{
          fontSize: '10px',
          color: '#6a6a78',
          margin: 0,
          letterSpacing: '0.08em',
          textAlign: 'center',
          maxWidth: '240px',
          lineHeight: 1.6,
        }}
      >
        an audiovisual instrument
        <br />
        press tab to open the control panel
      </p>
    </div>
  )
}
