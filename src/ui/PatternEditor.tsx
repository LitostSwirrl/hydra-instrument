import { useCallback, useEffect, useRef } from 'react'

interface PatternEditorProps {
  code: string
  onChange: (code: string) => void
  onEvaluate: () => void
  onStop: () => void
  isPlaying: boolean
  error: string | null
}

export function PatternEditor({
  code,
  onChange,
  onEvaluate,
  onStop,
  isPlaying,
  error,
}: PatternEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.max(80, ta.scrollHeight)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [code, autoResize])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // CRITICAL: stop propagation so KeyboardHandler doesn't trigger note playback
    e.stopPropagation()

    const isMod = e.metaKey || e.ctrlKey

    // Ctrl+Enter / Cmd+Enter to evaluate
    if (isMod && e.key === 'Enter') {
      e.preventDefault()
      onEvaluate()
      return
    }

    // Ctrl+. / Cmd+. to stop
    if (isMod && e.key === '.') {
      e.preventDefault()
      onStop()
      return
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: '#999999',
    fontFamily: 'sans-serif',
  }

  const hintButtonStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #333333',
    borderRadius: '3px',
    fontSize: '8px',
    fontFamily: "'IBM Plex Mono', monospace",
    color: '#666666',
    padding: '2px 5px',
    cursor: 'default',
    lineHeight: 1,
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <span style={labelStyle}>PATTERN</span>

        {isPlaying && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#B0B8C4',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
        )}

        <div style={{ flex: 1 }} />

        <span style={hintButtonStyle}>Ctrl+Enter</span>
        <span style={hintButtonStyle}>Ctrl+.</span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '10px',
          backgroundColor: '#0a0a0f',
          border: '1px solid #333333',
          borderRadius: '4px',
          color: '#aaaaaa',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '12px',
          lineHeight: 1.5,
          resize: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      />

      {/* Error display */}
      {error && (
        <div
          style={{
            marginTop: '6px',
            padding: '6px 8px',
            backgroundColor: 'rgba(255, 60, 60, 0.08)',
            border: '1px solid rgba(255, 60, 60, 0.2)',
            borderRadius: '3px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            lineHeight: 1.4,
            color: '#ff4444',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
