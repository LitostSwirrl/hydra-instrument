
interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  accentColor?: string
  onChange: (value: number) => void
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  accentColor = '#B0B8C4',
  onChange,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  const displayValue = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2)

  return (
    <div className="flex items-center gap-2 w-full">
      <style>{`
        .hydra-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--slider-accent);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        }
        .hydra-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--slider-accent);
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        }
      `}</style>
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
        {label}
      </span>

      <div className="flex-1 relative flex items-center" style={{ height: '20px' }}>
        <input
          type="range"
          className="hydra-slider"
          tabIndex={-1}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            '--slider-accent': accentColor,
            WebkitAppearance: 'none',
            appearance: 'none',
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer',
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
          } as React.CSSProperties}
        />
      </div>

      <span
        className="shrink-0 font-mono"
        style={{
          fontSize: '11px',
          color: accentColor,
          minWidth: '40px',
          textAlign: 'right',
        }}
      >
        {displayValue}
      </span>
    </div>
  )
}
