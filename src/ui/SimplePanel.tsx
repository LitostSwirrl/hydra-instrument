import { PillSelector } from './widgets/PillSelector'
import { Slider } from './widgets/Slider'
import { OctaveControl } from './widgets/OctaveControl'

interface SimplePanelProps {
  presetNames: string[]
  activePresetIndex: number
  onPresetSelect: (index: number) => void
  synthType: string
  onSynthTypeChange: (type: string) => void
  octave: number
  onOctaveChange: (octave: number) => void
  tone: number
  onToneChange: (value: number) => void
  space: number
  onSpaceChange: (value: number) => void
  intensity: number
  onIntensityChange: (value: number) => void
}

const SYNTH_OPTIONS = [
  { value: 'sine', label: 'sine' },
  { value: 'triangle', label: 'tri' },
  { value: 'square', label: 'square' },
  { value: 'sawtooth', label: 'saw' },
]

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
  synthType,
  onSynthTypeChange,
  octave,
  onOctaveChange,
  tone,
  onToneChange,
  space,
  onSpaceChange,
  intensity,
  onIntensityChange,
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
          <PillSelector
            options={SYNTH_OPTIONS}
            value={synthType}
            accentColor="#B0B8C4"
            onChange={onSynthTypeChange}
          />
          <OctaveControl octave={octave} onChange={onOctaveChange} accentColor="#B0B8C4" />
          <Slider label="Filter" value={tone} min={0} max={1} step={0.01} accentColor="#B0B8C4" onChange={onToneChange} />
          <Slider label="Reverb" value={space} min={0} max={1} step={0.01} accentColor="#B0B8C4" onChange={onSpaceChange} />
          <Slider label="Volume" value={intensity} min={0} max={1} step={0.01} accentColor="#B0B8C4" onChange={onIntensityChange} />
        </div>
      </div>
    </div>
  )
}
