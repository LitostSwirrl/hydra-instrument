import { useState, useCallback, useEffect } from 'react'
import { theme } from './theme'

interface IntroGuideProps {
  visible: boolean
  onComplete: () => void
}

interface Step {
  title: string
  message: string
  position: 'center' | 'bottom' | 'top' | 'right'
}

const STEPS: Step[] = [
  {
    title: 'Welcome',
    message:
      'This is an audiovisual instrument. Play your keyboard to make sound and visuals react.',
    position: 'center',
  },
  {
    title: 'Keyboard',
    message: 'Press keys A-L to play notes. Hold shift for sharps.',
    position: 'bottom',
  },
  {
    title: 'Presets',
    message: 'Switch scenes with the preset buttons, or press 1-6.',
    position: 'top',
  },
  {
    title: 'Controls',
    message:
      'Press Tab to open the control panel. Tweak sound, visuals, and mappings.',
    position: 'right',
  },
  {
    title: 'Ready',
    message: "You're ready. Press any key to start playing.",
    position: 'center',
  },
]

const BACKDROP_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  transition: 'opacity 300ms ease',
  fontFamily: "'IBM Plex Mono', monospace",
}

const CARD_BASE: React.CSSProperties = {
  background: theme.bgPanel,
  border: `1px solid ${theme.accentVisual}33`,
  borderRadius: '6px',
  padding: '28px 32px',
  maxWidth: '420px',
  width: '90vw',
  color: theme.text,
  fontFamily: "'IBM Plex Mono', monospace",
  userSelect: 'none',
}

function getCardPosition(position: Step['position']): React.CSSProperties {
  switch (position) {
    case 'center':
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    case 'bottom':
      return {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    case 'top':
      return {
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    case 'right':
      return {
        position: 'fixed',
        top: '50%',
        right: '40px',
        transform: 'translateY(-50%)',
      }
  }
}

const BUTTON_BASE: React.CSSProperties = {
  padding: '8px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  letterSpacing: '0.08em',
  fontFamily: "'IBM Plex Mono', monospace",
  transition: 'background-color 150ms ease, color 150ms ease',
}

export function IntroGuide({ visible, onComplete }: IntroGuideProps) {
  const [step, setStep] = useState(0)
  const [fading, setFading] = useState(false)

  const dismiss = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      onComplete()
    }, 300)
  }, [onComplete])

  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) {
      dismiss()
      return
    }
    setStep((s) => s + 1)
  }, [step, dismiss])

  const handleSkip = useCallback(() => {
    dismiss()
  }, [dismiss])

  // On the last step, allow any keypress to dismiss
  useEffect(() => {
    if (!visible || step !== STEPS.length - 1) return

    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault()
      dismiss()
    }

    // Small delay to avoid immediately catching the key that advanced to this step
    const timer = setTimeout(() => {
      window.addEventListener('keydown', handleKey)
    }, 200)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [visible, step, dismiss])

  if (!visible) return null

  const currentStep = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      style={{
        ...BACKDROP_STYLE,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div style={{ ...CARD_BASE, ...getCardPosition(currentStep.position) }}>
        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '16px',
          }}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: '24px',
                height: '2px',
                backgroundColor:
                  i <= step ? theme.accentVisual : 'rgba(255,255,255,0.15)',
                borderRadius: '1px',
                transition: 'background-color 200ms ease',
              }}
            />
          ))}
        </div>

        {/* Title */}
        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: theme.accentVisual,
          }}
        >
          {currentStep.title}
        </p>

        {/* Message */}
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '13px',
            lineHeight: 1.7,
            color: theme.textBright,
          }}
        >
          {currentStep.message}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {!isLast ? (
            <button
              onClick={handleSkip}
              style={{
                ...BUTTON_BASE,
                background: 'transparent',
                color: theme.textDim,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.text
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.textDim
              }}
            >
              Skip
            </button>
          ) : (
            <span />
          )}

          <button
            onClick={handleNext}
            style={{
              ...BUTTON_BASE,
              backgroundColor: theme.accentVisual,
              color: '#0a0a0f',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#D0D4DA'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.accentVisual
            }}
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
