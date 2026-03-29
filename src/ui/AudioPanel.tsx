import { useState } from 'react'
import { Slider } from './widgets/Slider'
import { Toggle } from './widgets/Toggle'
import { Dropdown } from './widgets/Dropdown'

interface AudioPanelProps {
  synthType: string
  onSynthTypeChange: (type: string) => void
  synthParams: Record<string, number>
  onSynthParamChange: (key: string, value: number) => void
  effects: { type: string; bypass: boolean; wet: number }[]
  onEffectToggle: (index: number) => void
  onEffectWetChange: (index: number, wet: number) => void
  bpm: number
  onBpmChange: (bpm: number) => void
  sequencerPlaying: boolean
  onToggleSequencer: () => void
  micEnabled: boolean
  onToggleMic: () => void
}

const SYNTH_OPTIONS = [
  { value: 'FMSynth', label: 'FMSynth' },
  { value: 'AMSynth', label: 'AMSynth' },
  { value: 'MembraneSynth', label: 'MembraneSynth' },
  { value: 'MonoSynth', label: 'MonoSynth' },
]

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#B0B8C4',
  fontFamily: 'sans-serif',
  margin: 0,
  cursor: 'pointer',
  userSelect: 'none',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '12px',
}

const subLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'rgba(176, 184, 196, 0.7)',
  marginBottom: '4px',
  marginTop: '8px',
}

export function AudioPanel({
  synthType,
  onSynthTypeChange,
  synthParams,
  onSynthParamChange,
  effects,
  onEffectToggle,
  onEffectWetChange,
  bpm,
  onBpmChange,
  sequencerPlaying,
  onToggleSequencer,
  micEnabled,
  onToggleMic,
}: AudioPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={sectionHeaderStyle} onClick={() => setCollapsed((c) => !c)}>
        Audio Engine {collapsed ? '\u25bc' : '\u25b2'}
      </p>

      {!collapsed && (
        <div style={rowStyle}>
          <Dropdown
            label="Synth"
            options={SYNTH_OPTIONS}
            value={synthType}
            onChange={onSynthTypeChange}
            accentColor="#B0B8C4"
          />

          <p style={subLabelStyle}>Envelope</p>
          <Slider
            label="Attack"
            value={synthParams.attack ?? 0.05}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => onSynthParamChange('attack', v)}
            accentColor="#B0B8C4"
          />
          <Slider
            label="Decay"
            value={synthParams.decay ?? 0.3}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => onSynthParamChange('decay', v)}
            accentColor="#B0B8C4"
          />
          <Slider
            label="Sustain"
            value={synthParams.sustain ?? 0.4}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onSynthParamChange('sustain', v)}
            accentColor="#B0B8C4"
          />
          <Slider
            label="Release"
            value={synthParams.release ?? 0.8}
            min={0}
            max={4}
            step={0.01}
            onChange={(v) => onSynthParamChange('release', v)}
            accentColor="#B0B8C4"
          />

          <p style={subLabelStyle}>Effects</p>
          {effects.map((effect, i) => (
            <div
              key={i}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Toggle
                  label={effect.type}
                  value={!effect.bypass}
                  onChange={() => onEffectToggle(i)}
                  accentColor="#B0B8C4"
                />
              </div>
              {!effect.bypass && (
                <Slider
                  label="Wet"
                  value={effect.wet}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => onEffectWetChange(i, v)}
                  accentColor="#B0B8C4"
                />
              )}
            </div>
          ))}

          <p style={subLabelStyle}>Sequencer</p>
          <Slider
            label="BPM"
            value={bpm}
            min={60}
            max={200}
            step={1}
            onChange={onBpmChange}
            accentColor="#B0B8C4"
          />
          <button
            onClick={onToggleSequencer}
            style={{
              alignSelf: 'flex-start',
              padding: '3px 10px',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              backgroundColor: sequencerPlaying ? 'rgba(176,184,196,0.3)' : 'rgba(255,255,255,0.04)',
              color: sequencerPlaying ? '#B0B8C4' : '#707880',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'sans-serif',
              transition: 'background-color 150ms',
            }}
          >
            {sequencerPlaying ? 'Stop' : 'Play'}
          </button>

          <p style={subLabelStyle}>Input</p>
          <Toggle label="Microphone" value={micEnabled} onChange={onToggleMic} accentColor="#B0B8C4" />
        </div>
      )}
    </div>
  )
}
