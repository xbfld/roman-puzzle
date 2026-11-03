import type { Direction } from './types'

export function bindBoardTouch(container: HTMLElement, onMove: (direction: Direction) => void) {
  let gesture: { id: number; x: number; y: number; cancelled: boolean } | null = null
  let suppressTouchClick = false

  const start = (event: TouchEvent) => {
    suppressTouchClick = true
    if (gesture) {
      gesture.cancelled = true
      return
    }
    const touch = event.touches[0]
    if (!touch) return
    gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, cancelled: event.touches.length !== 1 }
  }

  const move = (event: TouchEvent) => {
    if (!gesture) return
    const touch = Array.from(event.touches).find(touch => touch.identifier === gesture?.id)
    if (!touch || event.touches.length !== 1 || Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > 16) {
      gesture.cancelled = true
    }
  }

  const end = (event: TouchEvent) => {
    if (!gesture) return
    const touch = Array.from(event.changedTouches).find(touch => touch.identifier === gesture?.id)
    if (!touch) return
    const completed = gesture
    gesture = null
    // Suppress compatibility clicks, which would otherwise move the tile again.
    event.preventDefault()
    if (completed.cancelled || event.touches.length !== 0) return

    const rect = container.getBoundingClientRect()
    if (touch.clientX < rect.left || touch.clientX > rect.right || touch.clientY < rect.top || touch.clientY > rect.bottom) return
    const dx = touch.clientX - (rect.left + rect.width / 2)
    const dy = touch.clientY - (rect.top + rect.height / 2)
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return
    onMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
  }

  const cancel = () => { gesture = null }
  const pointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') suppressTouchClick = false
  }
  const click = (event: MouseEvent) => {
    // A genuine mouse or pen press resets this flag; keyboard activation stays available.
    if (suppressTouchClick && (event.detail > 0 || (event as PointerEvent).pointerType === 'touch')) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }

  container.addEventListener('touchstart', start, { passive: true })
  container.addEventListener('touchmove', move, { passive: true })
  container.addEventListener('touchend', end, { passive: false })
  container.addEventListener('touchcancel', cancel)
  container.addEventListener('pointerdown', pointerDown)
  container.addEventListener('click', click, { capture: true })
  return () => {
    container.removeEventListener('touchstart', start)
    container.removeEventListener('touchmove', move)
    container.removeEventListener('touchend', end)
    container.removeEventListener('touchcancel', cancel)
    container.removeEventListener('pointerdown', pointerDown)
    container.removeEventListener('click', click, { capture: true })
  }
}
