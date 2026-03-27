import React from 'react'

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
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #7c4ddb;
            cursor: pointer;
            box-shadow: 0 0 4px rgba(90, 40, 180, 0.6);
            transition: background 150ms;
          }
          input[type='range']::-moz-range-thumb {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #7c4ddb;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 4px rgba(90, 40, 180, 0.6);
            transition: background 150ms;
          }
          input[type='range']::-webkit-slider-thumb:hover {
            background: #9a6dff;
          }
          input[type='range']::-moz-range-thumb:hover {
            background: #9a6dff;
          }
        `}</style>
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
