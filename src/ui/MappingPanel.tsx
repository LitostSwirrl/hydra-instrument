import { useState } from 'react'
import { Slider } from './widgets/Slider'
import { Dropdown } from './widgets/Dropdown'

interface Mapping {
  id: string
  source: string
  target: string
  range: [number, number]
  smooth: number
  curve: string
}

interface MappingPanelProps {
  mappings: Mapping[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: string, value: unknown) => void
}

const SOURCE_OPTIONS = [
  { value: 'fft[0]', label: 'fft[0]' },
  { value: 'fft[1]', label: 'fft[1]' },
  { value: 'fft[2]', label: 'fft[2]' },
  { value: 'fft[3]', label: 'fft[3]' },
  { value: 'fft[4]', label: 'fft[4]' },
  { value: 'fft[5]', label: 'fft[5]' },
  { value: 'fft[6]', label: 'fft[6]' },
  { value: 'fft[7]', label: 'fft[7]' },
  { value: 'envelope', label: 'envelope' },
  { value: 'noteVelocity', label: 'noteVelocity' },
  { value: 'noteFrequency', label: 'noteFrequency' },
  { value: 'mouse.x', label: 'mouse.x' },
  { value: 'mouse.y', label: 'mouse.y' },
  { value: 'sequencerStep', label: 'sequencerStep' },
]

const TARGET_OPTIONS = [
  { value: 'osc.frequency', label: 'osc.frequency' },
  { value: 'noise.scale', label: 'noise.scale' },
  { value: 'voronoi.scale', label: 'voronoi.scale' },
  { value: 'shape.sides', label: 'shape.sides' },
  { value: 'rotate.angle', label: 'rotate.angle' },
  { value: 'scale.amount', label: 'scale.amount' },
  { value: 'kaleid.nSides', label: 'kaleid.nSides' },
  { value: 'pixelate.x', label: 'pixelate.x' },
  { value: 'colorama.amount', label: 'colorama.amount' },
  { value: 'hue.amount', label: 'hue.amount' },
  { value: 'brightness.amount', label: 'brightness.amount' },
  { value: 'modulate.amount', label: 'modulate.amount' },
  { value: 'sacredGeometry.pulse', label: 'sacredGeometry.pulse' },
  { value: 'sacredGeometry.rings', label: 'sacredGeometry.rings' },
  { value: 'tribalMask.symmetry', label: 'tribalMask.symmetry' },
  { value: 'tribalMask.glow', label: 'tribalMask.glow' },
  { value: 'particleField.density', label: 'particleField.density' },
  { value: 'voidPulse.depth', label: 'voidPulse.depth' },
  { value: 'voidPulse.rate', label: 'voidPulse.rate' },
  { value: 'ritualFire.turbulence', label: 'ritualFire.turbulence' },
  { value: 'ritualFire.height', label: 'ritualFire.height' },
]

const CURVE_OPTIONS = [
  { value: 'linear', label: 'linear' },
  { value: 'exponential', label: 'exponential' },
  { value: 'step', label: 'step' },
]

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#8890A0',
  fontFamily: 'sans-serif',
  margin: 0,
  cursor: 'pointer',
  userSelect: 'none',
}

const inputStyle: React.CSSProperties = {
  width: '48px',
  padding: '2px 4px',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: 'none',
  borderRadius: '3px',
  color: '#8890A0',
  fontSize: '11px',
  fontFamily: 'monospace',
  textAlign: 'center',
  outline: 'none',
}

export function MappingPanel({ mappings, onAdd, onRemove, onUpdate }: MappingPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={sectionHeaderStyle} onClick={() => setCollapsed((c) => !c)}>
        Mappings {collapsed ? '\u25bc' : '\u25b2'}
      </p>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
          {mappings.length === 0 && (
            <span
              style={{
                fontSize: '10px',
                color: '#999999',
                fontFamily: 'sans-serif',
                fontStyle: 'italic',
              }}
            >
              no mappings
            </span>
          )}

          {mappings.map((mapping) => (
            <div
              key={mapping.id}
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                minHeight: '60px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    label=""
                    options={SOURCE_OPTIONS}
                    value={mapping.source}
                    onChange={(v) => onUpdate(mapping.id, 'source', v)}
                    accentColor="#8890A0"
                  />
                </div>
                <span style={{ fontSize: '10px', color: '#999999', flexShrink: 0 }}>\u2192</span>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    label=""
                    options={TARGET_OPTIONS}
                    value={mapping.target}
                    onChange={(v) => onUpdate(mapping.id, 'target', v)}
                    accentColor="#8890A0"
                  />
                </div>
                <button
                  onClick={() => onRemove(mapping.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#999999',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '0 2px',
                    lineHeight: 1,
                    fontFamily: 'sans-serif',
                    flexShrink: 0,
                  }}
                >
                  x
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '9px', color: '#999999', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'sans-serif' }}>
                  range
                </span>
                <input
                  type="number"
                  value={mapping.range[0]}
                  style={inputStyle}
                  onChange={(e) =>
                    onUpdate(mapping.id, 'range', [parseFloat(e.target.value) || 0, mapping.range[1]])
                  }
                />
                <span style={{ fontSize: '9px', color: '#999999', fontFamily: 'monospace' }}>\u2014</span>
                <input
                  type="number"
                  value={mapping.range[1]}
                  style={inputStyle}
                  onChange={(e) =>
                    onUpdate(mapping.id, 'range', [mapping.range[0], parseFloat(e.target.value) || 1])
                  }
                />
              </div>

              <Slider
                label="Smooth"
                value={mapping.smooth}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => onUpdate(mapping.id, 'smooth', v)}
                accentColor="#8890A0"
              />

              <Dropdown
                label="Curve"
                options={CURVE_OPTIONS}
                value={mapping.curve}
                onChange={(v) => onUpdate(mapping.id, 'curve', v)}
                accentColor="#8890A0"
              />
            </div>
          ))}

          <button
            onClick={onAdd}
            style={{
              alignSelf: 'flex-start',
              marginTop: '4px',
              padding: '3px 10px',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              backgroundColor: 'rgba(136,144,160,0.2)',
              color: '#8890A0',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'sans-serif',
            }}
          >
            Add Mapping
          </button>
        </div>
      )}
    </div>
  )
}
