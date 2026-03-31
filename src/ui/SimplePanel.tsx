import { PillSelector } from './widgets/PillSelector'
import { Slider } from './widgets/Slider'

interface SimplePanelProps {
  presetNames: string[]
  activePresetIndex: number
  onPresetSelect: (index: number) => void
  tone: number
  onToneChange: (value: number) => void
  space: number
  onSpaceChange: (value: number) => void
  bpm: number
  onBpmChange: (bpm: number) => void
  patternPlaying: boolean
  onTogglePattern: () => void
}

const sectionStyle = (color: string): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color,
  fontFamily: 'sans-serif',
  margin: '0 0 10px 0',
})

export function SimplePanel({
  presetNames,
  activePresetIndex,
  onPresetSelect,
  tone,
  onToneChange,
  space,
  onSpaceChange,
  bpm,
  onBpmChange,
  patternPlaying,
  onTogglePattern,
}: SimplePanelProps) {
  const presetPills = presetNames.map((name, i) => ({
    value: String(i),
    label: name || `Slot ${i + 1}`,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <PillSelector
          options={presetPills}
          value={String(activePresetIndex)}
          accentColor="#B0B8C4"
          onChange={(v) => onPresetSelect(parseInt(v, 10))}
        />
      </div>

      <div>
        <p style={sectionStyle('#B0B8C4')}>Sound</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Slider label="Tone" value={tone} min={0} max={1} step={0.01} accentColor="#B0B8C4" onChange={onToneChange} />
          <Slider label="Space" value={space} min={0} max={1} step={0.01} accentColor="#B0B8C4" onChange={onSpaceChange} />
        </div>
      </div>

      <div>
        <p style={sectionStyle('#8890A0')}>Rhythm</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onTogglePattern}
            tabIndex={-1}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: patternPlaying ? '#8890A0' : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: patternPlaying ? '#fff' : '#999999',
              transition: 'background-color 150ms',
              flexShrink: 0,
            }}
          >
            {patternPlaying ? '\u25a0' : '\u25b6'}
          </button>
          <div style={{ flex: 1 }}>
            <Slider label="BPM" value={bpm} min={60} max={200} step={1} accentColor="#8890A0" onChange={onBpmChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
