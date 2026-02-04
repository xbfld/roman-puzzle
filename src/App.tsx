import { useEffect, useState, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { GameHeader } from './components/GameHeader'
import { GameGrid } from './components/GameGrid'
import { TimelineSlider } from './components/TimelineSlider'
import { SaveSlots } from './components/SaveSlots'
import { ControlsPanel } from './components/ControlsPanel'
import { HelpModal } from './components/HelpModal'
import { FloatingMessage } from './components/FloatingMessage'
import { useGameStore } from './stores/gameStore'
import { useSaveStore, parseSlotToTimeline } from './stores/saveStore'
import { useKeyboard } from './hooks/useKeyboard'
import { useTouch } from './hooks/useTouch'
import { theme } from './styles/theme'
import { SaveSlotType } from './lib/types'
import { getStateAtIndex } from './lib/game'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 520px;
`

const Credits = styled.div`
  margin-top: 15px;
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
`

function calculateViewportSize(): number {
  const screenWidth = window.innerWidth
  if (screenWidth <= 400) return 7
  if (screenWidth <= 500) return 9
  return 11
}

export default function App() {
  const [helpOpen, setHelpOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Game store
  const {
    timeline,
    state,
    message,
    handleMove,
    handleUndo,
    handleRedo,
    handleStrongUndo,
    handleStrongRedo,
    handleSeek,
    handleReset,
    initialize,
    updateViewportSize,
  } = useGameStore()

  // Save store
  const {
    autoSlots,
    manualSlots,
    currentAutoSlot,
    loadFromStorage,
    saveToSlot,
    deleteSlot,
    autoSaveCurrent,
  } = useSaveStore()

  // Initialize
  useEffect(() => {
    const viewportSize = calculateViewportSize()
    loadFromStorage()

    // currentAutoSlot이 있으면 자동 복원
    const { currentAutoSlot } = useSaveStore.getState()
    if (currentAutoSlot && currentAutoSlot.viewportSize === viewportSize) {
      const savedTimeline = parseSlotToTimeline(currentAutoSlot)
      const savedState = getStateAtIndex(savedTimeline, savedTimeline.currentIndex)

      useGameStore.setState({
        timeline: savedTimeline,
        state: savedState,
        branchPoint: null,
        stateCache: new Map(),
      })
    } else {
      initialize(viewportSize)
    }
  }, [initialize, loadFromStorage])

  // Auto-save on state change
  useEffect(() => {
    if (timeline.moves.length > 0 || state.level > 1) {
      autoSaveCurrent(timeline, state.level)
    }
  }, [timeline, state.level, autoSaveCurrent])

  // Viewport resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = calculateViewportSize()
      if (newSize !== state.viewportSize) {
        updateViewportSize(newSize)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [state.viewportSize, updateViewportSize])

  // Save slot handlers
  const handleSaveSlot = useCallback((slotId: number, type: SaveSlotType) => {
    saveToSlot(slotId, type, timeline, state.level)
  }, [saveToSlot, timeline, state.level])

  const handleLoadSlot = useCallback((slotId: number, type: SaveSlotType) => {
    const { getSlotData } = useSaveStore.getState()
    const slot = getSlotData(slotId, type)

    if (!slot) return

    const newTimeline = parseSlotToTimeline(slot)
    const newState = getStateAtIndex(newTimeline, newTimeline.currentIndex)

    useGameStore.setState({
      timeline: newTimeline,
      state: newState,
      branchPoint: null,
      stateCache: new Map(),
    })
  }, [])

  const handleDeleteSlot = useCallback((slotId: number, type: SaveSlotType) => {
    deleteSlot(slotId, type)
  }, [deleteSlot])

  // Clipboard handlers
  const handleCopyToClipboard = useCallback(async () => {
    const dirMap: Record<string, string> = {
      up: 'U', down: 'D', left: 'L', right: 'R',
    }
    const moves = timeline.moves.map(d => dirMap[d]).join('')
    const data = {
      version: 2,
      viewportSize: timeline.viewportSize,
      moves,
      currentIndex: timeline.currentIndex,
      level: state.level,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(data))
      useGameStore.setState({ message: '클립보드에 복사됨' })
      setTimeout(() => useGameStore.setState({ message: null }), 1500)
    } catch {
      useGameStore.setState({ message: '복사 실패' })
      setTimeout(() => useGameStore.setState({ message: null }), 1500)
    }
  }, [timeline, state.level])

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text)

      // 유효성 검사
      if (data.version !== 2) throw new Error('Invalid version')
      if (typeof data.moves !== 'string') throw new Error('Invalid moves')
      if (!/^[UDLR]*$/.test(data.moves)) throw new Error('Invalid move characters')
      if (typeof data.viewportSize !== 'number' || data.viewportSize < 5) throw new Error('Invalid viewportSize')
      if (typeof data.currentIndex !== 'number' || data.currentIndex < 0) throw new Error('Invalid currentIndex')
      if (data.currentIndex > data.moves.length) throw new Error('currentIndex out of range')

      const slot = {
        id: -1,
        type: 'auto' as const,
        viewportSize: data.viewportSize,
        moves: data.moves,
        currentIndex: data.currentIndex,
        level: data.level || 1,
        updatedAt: Date.now(),
      }
      const newTimeline = parseSlotToTimeline(slot)
      const newState = getStateAtIndex(newTimeline, newTimeline.currentIndex)
      useGameStore.setState({
        timeline: newTimeline,
        state: newState,
        branchPoint: null,
        stateCache: new Map(),
      })
      useGameStore.setState({ message: '클립보드에서 불러옴' })
      setTimeout(() => useGameStore.setState({ message: null }), 1500)
    } catch {
      useGameStore.setState({ message: '불러오기 실패: 잘못된 형식' })
      setTimeout(() => useGameStore.setState({ message: null }), 2000)
    }
  }, [])

  // Keyboard controls
  useKeyboard({
    onMove: handleMove,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onStrongUndo: handleStrongUndo,
    onStrongRedo: handleStrongRedo,
    onSaveSlot: handleSaveSlot,
    onLoadSlot: handleLoadSlot,
  })

  // Touch controls
  useTouch({
    containerRef: gridRef as React.RefObject<HTMLElement>,
    onMove: handleMove,
  })

  return (
    <Container>
      <GameHeader state={state} />

      <div ref={gridRef}>
        <GameGrid state={state} onMove={handleMove} />
      </div>

      <TimelineSlider timeline={timeline} onSeek={handleSeek} />

      <SaveSlots
        autoSlots={autoSlots}
        manualSlots={manualSlots}
        currentAutoSlot={currentAutoSlot}
        onSave={handleSaveSlot}
        onLoad={handleLoadSlot}
        onDelete={handleDeleteSlot}
      />

      <ControlsPanel
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onHelpOpen={() => setHelpOpen(true)}
        onCopyToClipboard={handleCopyToClipboard}
        onPasteFromClipboard={handlePasteFromClipboard}
      />

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      <FloatingMessage message={message} />

      <Credits>
        Made by <a href="https://github.com/xbfld" target="_blank" rel="noopener noreferrer">@xbfld</a>
      </Credits>
    </Container>
  )
}
