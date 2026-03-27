import { useAppStore } from '../state/store'

interface MouseCallbacks {
  onScroll: (delta: number) => void
}

export class MouseHandler {
  private canvas: HTMLCanvasElement
  private callbacks: MouseCallbacks
  private onMouseMove: (e: MouseEvent) => void
  private onTouchMove: (e: TouchEvent) => void
  private onWheel: (e: WheelEvent) => void

  constructor(canvas: HTMLCanvasElement, callbacks: MouseCallbacks) {
    this.canvas = canvas
    this.callbacks = callbacks

    this.onMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      useAppStore.getState().setMouse(
        Math.max(0, Math.min(1, x)),
        Math.max(0, Math.min(1, y))
      )
    }

    this.onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      const x = (touch.clientX - rect.left) / rect.width
      const y = (touch.clientY - rect.top) / rect.height
      useAppStore.getState().setMouse(
        Math.max(0, Math.min(1, x)),
        Math.max(0, Math.min(1, y))
      )
    }

    this.onWheel = (e: WheelEvent) => {
      e.preventDefault()
      this.callbacks.onScroll(e.deltaY)
    }
  }

  attach(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('touchmove', this.onTouchMove)
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false })
  }

  detach(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('touchmove', this.onTouchMove)
    this.canvas.removeEventListener('wheel', this.onWheel)
  }
}
