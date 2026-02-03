import { useEffect, useCallback } from 'react'
import { Direction, SaveSlotType } from '../lib/types'

interface UseKeyboardProps {
  onMove: (direction: Direction) => void
  onUndo: () => void
  onRedo: () => void
  onStrongUndo: () => void
  onStrongRedo: () => void
  onSaveSlot: (slotId: number, type: SaveSlotType) => void
  onLoadSlot: (slotId: number, type: SaveSlotType) => void
}

export function useKeyboard({
  onMove,
  onUndo,
  onRedo,
  onStrongUndo,
  onStrongRedo,
  onSaveSlot,
  onLoadSlot,
}: UseKeyboardProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 입력 필드에서는 무시
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    // Undo: Z
    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault()
      if (e.shiftKey) {
        onStrongUndo()
      } else {
        onUndo()
      }
      return
    }

    // Redo: Y
    if (e.key === 'y' || e.key === 'Y') {
      e.preventDefault()
      if (e.shiftKey) {
        onStrongRedo()
      } else {
        onRedo()
      }
      return
    }

    // 슬롯 1-3
    if (e.key >= '1' && e.key <= '3') {
      e.preventDefault()
      const slotId = parseInt(e.key, 10) - 1
      if (e.shiftKey) {
        onSaveSlot(slotId, 'manual')
      } else {
        onLoadSlot(slotId, 'manual')
      }
      return
    }

    // 이동
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        onMove('up')
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        onMove('down')
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault()
        onMove('left')
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        onMove('right')
        break
    }
  }, [onMove, onUndo, onRedo, onStrongUndo, onStrongRedo, onSaveSlot, onLoadSlot])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
