import { useEffect, RefObject } from 'react'
import { Direction } from '../lib/types'
import { bindBoardTouch } from '../lib/boardTouch'

interface UseTouchProps {
  enabled?: boolean
  containerRef: RefObject<HTMLElement>
  onMove: (direction: Direction) => void
}

export function useTouch({ containerRef, onMove, enabled = true }: UseTouchProps) {
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return
    return bindBoardTouch(container, onMove)
  }, [containerRef, onMove, enabled])
}
