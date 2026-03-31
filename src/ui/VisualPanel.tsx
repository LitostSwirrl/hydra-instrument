import { useState } from 'react'
import { Slider } from './widgets/Slider'
import { Dropdown } from './widgets/Dropdown'

interface Transform {
  fn: string
  args: Record<string, number>
}

interface VisualPanelProps {
  source: string
  sourceArgs: Record<string, number>
  onSourceChange: (source: string) => void
  onSourceArgChange: (key: string, value: number) => void
  transforms: Transform[]
  onTransformArgChange: (index: number, key: string, value: number) => void
  onAddTransform: (fn: string) => void
  onRemoveTransform: (index: number) => void
}

const SOURCE_OPTIONS = [
  { value: 'osc', label: 'osc' },
  { value: 'noise', label: 'noise' },
  { value: 'voronoi', label: 'voronoi' },
  { value: 'shape', label: 'shape' },
  { value: 'gradient', label: 'gradient' },
  { value: 'solid', label: 'solid' },
  { value: 'src', label: 'src' },
]

const TRANSFORM_OPTIONS = [
  { value: 'rotate', label: 'rotate' },
  { value: 'scale', label: 'scale' },
  { value: 'kaleid', label: 'kaleid' },
  { value: 'pixelate', label: 'pixelate' },
  { value: 'colorama', label: 'colorama' },
  { value: 'hue', label: 'hue' },
  { value: 'brightness', label: 'brightness' },
  { value: 'modulate', label: 'modulate' },
]

const SOURCE_PARAMS: Record<string, { key: string; label: string; min: number; max: number; step: number }[]> = {
  osc: [
    { key: 'frequency', label: 'Freq', min: 0, max: 100, step: 0.1 },
    { key: 'sync', label: 'Sync', min: 0, max: 5, step: 0.01 },
    { key: 'offset', label: 'Offset', min: 0, max: 6.28, step: 0.01 },
  ],
  noise: [
    { key: 'scale', label: 'Scale', min: 0, max: 20, step: 0.1 },
    { key: 'offset', label: 'Offset', min: 0, max: 5, step: 0.01 },
  ],
  voronoi: [
    { key: 'scale', label: 'Scale', min: 0, max: 20, step: 0.1 },
    { key: 'speed', label: 'Speed', min: 0, max: 5, step: 0.01 },
    { key: 'blending', label: 'Blend', min: 0, max: 1, step: 0.01 },
  ],
  shape: [
    { key: 'sides', label: 'Sides', min: 3, max: 12, step: 1 },
    { key: 'radius', label: 'Radius', min: 0, max: 1, step: 0.01 },
    { key: 'smoothing', label: 'Smooth', min: 0, max: 1, step: 0.01 },
  ],
  gradient: [
    { key: 'speed', label: 'Speed', min: 0, max: 5, step: 0.01 },
  ],
  solid: [
    { key: 'r', label: 'R', min: 0, max: 1, step: 0.01 },
    { key: 'g', label: 'G', min: 0, max: 1, step: 0.01 },
    { key: 'b', label: 'B', min: 0, max: 1, step: 0.01 },
  ],
}

const TRANSFORM_PARAMS: Record<string, { key: string; label: string; min: number; max: number; step: number }[]> = {
  rotate: [{ key: 'angle', label: 'Angle', min: -6.28, max: 6.28, step: 0.01 }],
  scale: [{ key: 'amount', label: 'Amount', min: 0, max: 4, step: 0.01 }],
  kaleid: [{ key: 'nSides', label: 'Sides', min: 2, max: 12, step: 1 }],
  pixelate: [{ key: 'x', label: 'X', min: 1, max: 100, step: 1 }],
  colorama: [{ key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01 }],
  hue: [{ key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01 }],
  brightness: [{ key: 'amount', label: 'Amount', min: -1, max: 2, step: 0.01 }],
  modulate: [{ key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.01 }],
}

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

const subLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'rgba(176, 184, 196, 0.7)',
  marginBottom: '4px',
  marginTop: '8px',
}

export function VisualPanel({
  source,
  sourceArgs,
  onSourceChange,
  onSourceArgChange,
  transforms,
  onTransformArgChange,
  onAddTransform,
  onRemoveTransform,
}: VisualPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [addTransformValue, setAddTransformValue] = useState('rotate')

  const sourceParams = SOURCE_PARAMS[source] ?? []

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={sectionHeaderStyle} onClick={() => setCollapsed((c) => !c)}>
        Visual Engine {collapsed ? '\u25bc' : '\u25b2'}
      </p>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          <Dropdown
            label="Source"
            options={SOURCE_OPTIONS}
            value={source}
            onChange={onSourceChange}
            accentColor="#B0B8C4"
          />

          {sourceParams.length > 0 && (
            <>
              <p style={subLabelStyle}>Source params</p>
              {sourceParams.map((param) => (
                <Slider
                  key={param.key}
                  label={param.label}
                  value={sourceArgs[param.key] ?? (param.min + param.max) / 2}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  onChange={(v) => onSourceArgChange(param.key, v)}
                  accentColor="#B0B8C4"
                />
              ))}
            </>
          )}

          {transforms.length > 0 && (
            <>
              <p style={subLabelStyle}>Transforms</p>
              {transforms.map((transform, i) => {
                const tParams = TRANSFORM_PARAMS[transform.fn] ?? []
                return (
                  <div
                    key={i}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderRadius: '4px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#B0B8C4',
                          fontFamily: 'monospace',
                          textTransform: 'lowercase',
                        }}
                      >
                        {transform.fn}
                      </span>
                      <button
                        onClick={() => onRemoveTransform(i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#999999',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '0 2px',
                          lineHeight: 1,
                          fontFamily: 'sans-serif',
                        }}
                      >
                        x
                      </button>
                    </div>
                    {tParams.map((param) => (
                      <Slider
                        key={param.key}
                        label={param.label}
                        value={transform.args[param.key] ?? 0}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        onChange={(v) => onTransformArgChange(i, param.key, v)}
                        accentColor="#B0B8C4"
                      />
                    ))}
                  </div>
                )
              })}
            </>
          )}

          <p style={subLabelStyle}>Add transform</p>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Dropdown
                label=""
                options={TRANSFORM_OPTIONS}
                value={addTransformValue}
                onChange={setAddTransformValue}
                accentColor="#B0B8C4"
              />
            </div>
            <button
              onClick={() => onAddTransform(addTransformValue)}
              style={{
                padding: '3px 10px',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                backgroundColor: 'rgba(176,184,196,0.2)',
                color: '#B0B8C4',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontFamily: 'sans-serif',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
