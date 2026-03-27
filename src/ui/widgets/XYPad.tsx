import React, { useRef, useCallback, useEffect } from 'react'

interface XYPadProps {
  label: string
  valueX: number
  valueY: number
  onChange: (x: number, y: number) => void
}

const GRID_LINES = 4

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export function XYPad({ label, valueX, valueY, onChange }: XYPadProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const getXY = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clamp((clientX - rect.left) / rect.width)
    const y = clamp((clientY - rect.top) / rect.height)
    onChange(x, y)
  }, [onChange])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragging.current = true
    getXY(e.clientX, e.clientY)
  }, [getXY])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      getXY(e.clientX, e.clientY)
    }

    const handleMouseUp = () => {
      dragging.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [getXY])

  const gridLines = Array.from({ length: GRID_LINES - 1 })

  return (
    <div style={{ width: '100%', fontFamily: 'sans-serif' }}>
      <div
        style={{
          marginBottom: '4px',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6a6a78',
        }}
      >
        {label}
      </div>

      <div
        ref={containerRef}
        tabIndex={-1}
        onMouseDown={handleMouseDown}
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: '4px',
          position: 'relative',
          cursor: 'crosshair',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Vertical grid lines */}
        {gridLines.map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${((i + 1) / GRID_LINES) * 100}%`,
              width: '1px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Horizontal grid lines */}
        {gridLines.map((_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${((i + 1) / GRID_LINES) * 100}%`,
              height: '1px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Vertical crosshair line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${valueX * 100}%`,
            width: '1px',
            backgroundColor: 'rgba(90,40,180,0.40)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Horizontal crosshair line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${valueY * 100}%`,
            height: '1px',
            backgroundColor: 'rgba(90,40,180,0.40)',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Dot at intersection */}
        <div
          style={{
            position: 'absolute',
            left: `${valueX * 100}%`,
            top: `${valueY * 100}%`,
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#7c4ddb',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 6px rgba(90,40,180,0.8)',
            pointerEvents: 'none',
            transition: 'box-shadow 150ms',
          }}
        />
      </div>
    </div>
  )
}
