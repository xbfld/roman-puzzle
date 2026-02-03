import { useEffect, useCallback, RefObject } from 'react'
import { Direction } from '../lib/types'

interface UseTouchProps {
  containerRef: RefObject<HTMLElement>
  onMove: (direction: Direction) => void
}

export function useTouch({ containerRef, onMove }: UseTouchProps) {
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!containerRef.current) return

    const touch = e.changedTouches[0]
    const rect = containerRef.current.getBoundingClientRect()

    // 그리드 중심 좌표
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // 터치 위치와 중심의 차이
    const diffX = touch.clientX - centerX
    const diffY = touch.clientY - centerY

    const absDiffX = Math.abs(diffX)
    const absDiffY = Math.abs(diffY)

    // 최소 거리 체크 (너무 가까운 터치는 무시)
    const minDistance = 20
    if (absDiffX < minDistance && absDiffY < minDistance) {
      return
    }

    // 가로 방향이 더 큰 경우
    if (absDiffX > absDiffY) {
      if (diffX > 0) {
        onMove('right')
      } else {
        onMove('left')
      }
    } else {
      // 세로 방향이 더 큰 경우
      if (diffY > 0) {
        onMove('down')
      } else {
        onMove('up')
      }
    }
  }, [containerRef, onMove])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchend', handleTouchEnd)
    return () => container.removeEventListener('touchend', handleTouchEnd)
  }, [containerRef, handleTouchEnd])
}
