
interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step = 0.01, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  const displayValue = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2)

  return (
    <div className="flex items-center gap-2 w-full">
      <span
        className="shrink-0"
        style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6a6a78',
          fontFamily: 'sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>

      <div className="flex-1 relative flex items-center" style={{ height: '16px' }}>
        <input
          type="range"
          tabIndex={-1}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            width: '100%',
            height: '3px',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
            background: `linear-gradient(to right, #5a28b4 0%, #5a28b4 ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>

      <span
        className="shrink-0 font-mono"
        style={{
          fontSize: '12px',
          color: '#7c4ddb',
          minWidth: '40px',
          textAlign: 'right',
        }}
      >
        {displayValue}
      </span>
    </div>
  )
}
