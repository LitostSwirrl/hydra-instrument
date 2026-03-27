import { PillSelector } from './widgets/PillSelector'
import { Slider } from './widgets/Slider'

interface SimplePanelProps {
  presetNames: string[]
  activePresetIndex: number
  onPresetSelect: (index: number) => void
  synthType: string
  onSynthTypeChange: (type: string) => void
  tone: number
  onToneChange: (value: number) => void
  space: number
  onSpaceChange: (value: number) => void
  visualGroup: string
  onVisualGroupChange: (group: string) => void
  intensity: number
  onIntensityChange: (value: number) => void
  morph: number
  onMorphChange: (value: number) => void
  bpm: number
  onBpmChange: (bpm: number) => void
  sequencerPlaying: boolean
  onToggleSequencer: () => void
}

const SYNTH_OPTIONS = [
  { value: 'FMSynth', label: 'FM' },
  { value: 'AMSynth', label: 'AM' },
  { value: 'MembraneSynth', label: 'Drum' },
  { value: 'MonoSynth', label: 'Mono' },
]

const VISUAL_GROUP_OPTIONS = [
  { value: 'Geometry', label: 'Geometry' },
  { value: 'Mask', label: 'Mask' },
  { value: 'Fire', label: 'Fire' },
  { value: 'Particles', label: 'Particles' },
  { value: 'Flow', label: 'Flow' },
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
  tone,
  onToneChange,
  space,
  onSpaceChange,
  visualGroup,
  onVisualGroupChange,
  intensity,
  onIntensityChange,
  morph,
  onMorphChange,
  bpm,
  onBpmChange,
  sequencerPlaying,
  onToggleSequencer,
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
          accentColor="#FF1493"
          onChange={(v) => onPresetSelect(parseInt(v, 10))}
        />
      </div>

      <div>
        <p style={sectionStyle('#FFD700')}>Sound</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <PillSelector
            options={SYNTH_OPTIONS}
            value={synthType}
            accentColor="#FFD700"
            onChange={onSynthTypeChange}
          />
          <Slider label="Tone" value={tone} min={0} max={1} step={0.01} accentColor="#FFD700" onChange={onToneChange} />
          <Slider label="Space" value={space} min={0} max={1} step={0.01} accentColor="#FFD700" onChange={onSpaceChange} />
        </div>
      </div>

      <div>
        <p style={sectionStyle('#00E676')}>Visuals</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <PillSelector
            options={VISUAL_GROUP_OPTIONS}
            value={visualGroup}
            accentColor="#00E676"
            onChange={onVisualGroupChange}
          />
          <Slider label="Intensity" value={intensity} min={0} max={1} step={0.01} accentColor="#00E676" onChange={onIntensityChange} />
          <Slider label="Morph" value={morph} min={0} max={1} step={0.01} accentColor="#00E676" onChange={onMorphChange} />
        </div>
      </div>

      <div>
        <p style={sectionStyle('#4488FF')}>Rhythm</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onToggleSequencer}
            tabIndex={-1}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: sequencerPlaying ? '#4488FF' : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: sequencerPlaying ? '#fff' : '#999999',
              transition: 'background-color 150ms',
              flexShrink: 0,
            }}
          >
            {sequencerPlaying ? '\u25a0' : '\u25b6'}
          </button>
          <div style={{ flex: 1 }}>
            <Slider label="BPM" value={bpm} min={60} max={200} step={1} accentColor="#4488FF" onChange={onBpmChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
