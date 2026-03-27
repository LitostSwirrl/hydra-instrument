import React from 'react'

interface ToggleProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}

export function Toggle({ label, value, onChange }: ToggleProps) {
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

      <button
        role="switch"
        aria-checked={value}
        tabIndex={-1}
        onClick={() => onChange(!value)}
        style={{
          position: 'relative',
          width: '32px',
          height: '16px',
          borderRadius: '9999px',
          backgroundColor: value ? '#5a28b4' : 'rgba(255,255,255,0.10)',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
          transition: 'background-color 150ms',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: value ? 'calc(100% - 14px)' : '2px',
            transform: 'translateY(-50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.80)',
            transition: 'left 150ms',
          }}
        />
      </button>
    </div>
  )
}
