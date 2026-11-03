import { useEffect, RefObject } from 'react'
import { Direction } from '../lib/types'
import { bindBoardTouch } from '../lib/boardTouch'

interface UseTouchProps {
  containerRef: RefObject<HTMLElement>
  onMove: (direction: Direction) => void
}

export function useTouch({ containerRef, onMove }: UseTouchProps) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    return bindBoardTouch(container, onMove)
  }, [containerRef, onMove])
}
