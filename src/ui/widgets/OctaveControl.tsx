interface OctaveControlProps {
  octave: number
  onChange: (octave: number) => void
  accentColor?: string
}

export function OctaveControl({
  octave,
  onChange,
  accentColor = '#B0B8C4',
}: OctaveControlProps) {
  const btnStyle: React.CSSProperties = {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: 'none',
    cursor: 'pointer',
    color: accentColor,
    fontSize: '13px',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <span
        className="shrink-0"
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#cccccc',
          fontFamily: 'sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        Octave
      </span>
      <div className="flex-1" />
      <button onClick={() => onChange(octave - 1)} style={btnStyle} tabIndex={-1}>
        -
      </button>
      <span
        style={{
          fontSize: '13px',
          fontFamily: 'monospace',
          color: accentColor,
          minWidth: '24px',
          textAlign: 'center',
        }}
      >
        {octave}
      </span>
      <button onClick={() => onChange(octave + 1)} style={btnStyle} tabIndex={-1}>
        +
      </button>
    </div>
  )
}
