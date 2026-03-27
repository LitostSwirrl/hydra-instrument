
interface PillSelectorProps {
  options: { value: string; label: string }[]
  value: string
  accentColor?: string
  onChange: (value: string) => void
}

export function PillSelector({
  options,
  value,
  accentColor = '#FF1493',
  onChange,
}: PillSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            tabIndex={-1}
            onClick={() => onChange(option.value)}
            style={{
              padding: '4px 12px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: 'sans-serif',
              fontWeight: isActive ? 600 : 400,
              transition: 'background-color 150ms, color 150ms',
              backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.06)',
              color: isActive ? '#000' : '#999999',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
