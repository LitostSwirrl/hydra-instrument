import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useAppStore } from '../state/store'
import { theme } from './theme'

interface InteractiveIntroProps {
  visible: boolean
  onComplete: () => void
}

export interface InteractiveIntroRef {
  notePlayed: () => void
  presetChanged: () => void
}

const HINT_BASE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 200,
  backgroundColor: 'rgba(10, 10, 15, 0.88)',
  border: `1px solid ${theme.accentVisual}33`,
  borderRadius: '8px',
  padding: '16px 20px',
  maxWidth: '360px',
  width: '90vw',
  color: theme.text,
  fontFamily: "'IBM Plex Mono', monospace",
  userSelect: 'none',
  pointerEvents: 'auto',
}

const SKIP_STYLE: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: theme.textDim,
  cursor: 'pointer',
  fontSize: '10px',
  fontFamily: "'IBM Plex Mono', monospace",
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '4px 0',
}

const KEY_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  backgroundColor: 'rgba(176, 184, 196, 0.15)',
  border: `1px solid ${theme.accentVisual}44`,
  fontSize: '11px',
  fontFamily: 'monospace',
  color: theme.accentVisual,
}

const STEP_POSITIONS: React.CSSProperties[] = [
  { bottom: '80px', left: '50%', transform: 'translateX(-50%)' },
  { bottom: '80px', right: '40px' },
  { top: '80px', left: '50%', transform: 'translateX(-50%)' },
]

const KEYS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D']

export const InteractiveIntro = forwardRef<InteractiveIntroRef, InteractiveIntroProps>(
  function InteractiveIntro({ visible, onComplete }, ref) {
    const [step, setStep] = useState(0)
    const [opacity, setOpacity] = useState(1)

    useEffect(() => {
      if (visible) {
        setStep(0)
        setOpacity(1)
      }
    }, [visible])

    const dismiss = useCallback(() => {
      setOpacity(0)
      setTimeout(onComplete, 400)
    }, [onComplete])

    const advance = useCallback(() => {
      setOpacity(0)
      setTimeout(() => {
        setStep((s) => {
          const next = s + 1
          if (next > 2) {
            onComplete()
            return s
          }
          return next
        })
        setOpacity(1)
      }, 300)
    }, [onComplete])

    useImperativeHandle(
      ref,
      () => ({
        notePlayed: () => {
          if (step === 0) advance()
        },
        presetChanged: () => {
          if (step === 2) dismiss()
        },
      }),
      [step, advance, dismiss]
    )

    // Step 2: auto-advance when panel opens
    useEffect(() => {
      if (!visible || step !== 1) return
      return useAppStore.subscribe(
        (s) => s.ui.panelOpen,
        (open) => {
          if (open) advance()
        }
      )
    }, [visible, step, advance])

    // Auto-dismiss timeout per step (15s)
    useEffect(() => {
      if (!visible) return
      const timer = setTimeout(dismiss, 15000)
      return () => clearTimeout(timer)
    }, [visible, step, dismiss])

    if (!visible) return null

    return (
      <div
        style={{
          ...HINT_BASE,
          ...STEP_POSITIONS[step],
          opacity,
          transition: 'opacity 400ms ease',
        }}
      >
        {step === 0 && (
          <>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '12px',
                lineHeight: 1.6,
                color: theme.textBright,
              }}
            >
              Press keys to play notes
            </p>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {KEYS.map((key) => (
                <span key={key} style={KEY_STYLE}>
                  {key}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
              {NOTES.map((note, i) => (
                <span
                  key={i}
                  style={{
                    width: '24px',
                    textAlign: 'center',
                    fontSize: '9px',
                    color: theme.textDim,
                    fontFamily: 'monospace',
                  }}
                >
                  {note}
                </span>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '12px',
              lineHeight: 1.6,
              color: theme.textBright,
            }}
          >
            Press{' '}
            <span
              style={{
                ...KEY_STYLE,
                display: 'inline-flex',
                width: 'auto',
                padding: '0 6px',
                verticalAlign: 'middle',
                margin: '0 2px',
              }}
            >
              Tab
            </span>{' '}
            to open controls
          </p>
        )}

        {step === 2 && (
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '12px',
              lineHeight: 1.6,
              color: theme.textBright,
            }}
          >
            Try presets <span style={{ fontFamily: 'monospace', color: theme.accentVisual }}>1-6</span> on
            your keyboard
          </p>
        )}

        <button onClick={dismiss} style={SKIP_STYLE}>
          skip
        </button>
      </div>
    )
  }
)
