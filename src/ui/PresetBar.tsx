import { useRef } from 'react'

interface PresetBarProps {
  activeSlot: number
  slots: (string | null)[]
  onSelect: (slot: number) => void
  onExport: () => void
  onImport: (file: File) => void
  onCopyURL: () => void
}

export function PresetBar({ activeSlot, slots, onSelect, onExport, onImport, onCopyURL }: PresetBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
      e.target.value = ''
    }
  }

  const actionButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#6a6a78',
    cursor: 'pointer',
    fontFamily: 'sans-serif',
    padding: '2px 4px',
    transition: 'color 150ms',
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {slots.map((name, i) => {
          const isActive = i === activeSlot
          const isOccupied = name !== null

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              title={name ?? undefined}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'monospace',
                transition: 'background-color 150ms, color 150ms',
                backgroundColor: isActive
                  ? '#5a28b4'
                  : isOccupied
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.02)',
                color: isActive
                  ? '#ffffff'
                  : isOccupied
                  ? '#c8c8d0'
                  : '#6a6a78',
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '2px', marginTop: '6px', alignItems: 'center' }}>
        <button
          style={actionButtonStyle}
          onClick={onExport}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#c8c8d0' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6a6a78' }}
        >
          Export
        </button>
        <span style={{ color: '#3a3a42', fontSize: '10px', fontFamily: 'sans-serif' }}>|</span>
        <button
          style={actionButtonStyle}
          onClick={handleImportClick}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#c8c8d0' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6a6a78' }}
        >
          Import
        </button>
        <span style={{ color: '#3a3a42', fontSize: '10px', fontFamily: 'sans-serif' }}>|</span>
        <button
          style={actionButtonStyle}
          onClick={onCopyURL}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#c8c8d0' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6a6a78' }}
        >
          Copy URL
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
