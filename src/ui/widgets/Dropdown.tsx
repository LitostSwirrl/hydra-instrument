import { useState, useEffect, useRef } from 'react'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  label: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
}

export function Dropdown({ label, options, value, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [open])

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

      <div
        ref={containerRef}
        style={{ position: 'relative', flex: 1 }}
      >
        <button
          tabIndex={-1}
          onClick={() => setOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '2px 6px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            color: '#7c4ddb',
            fontSize: '12px',
            fontFamily: 'monospace',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'rgba(255,255,255,0.04)'
          }}
        >
          <span>{selected?.label ?? value}</span>
          <span style={{ marginLeft: '6px', fontSize: '10px', color: '#6a6a78' }}>
            {open ? '\u25b2' : '\u25bc'}
          </span>
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '100%',
              zIndex: 50,
              marginTop: '4px',
              width: '100%',
              backgroundColor: '#0d0d14',
              borderRadius: '4px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                tabIndex={-1}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '4px 8px',
                  border: 'none',
                  backgroundColor:
                    option.value === value ? 'rgba(90,40,180,0.15)' : 'transparent',
                  color: option.value === value ? '#7c4ddb' : '#c8c8d0',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'background-color 150ms',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    option.value === value ? 'rgba(90,40,180,0.15)' : 'transparent'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
