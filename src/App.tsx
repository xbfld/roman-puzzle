import { useEffect, useState, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { GameHeader } from './components/GameHeader'
import { GameGrid } from './components/GameGrid'
import { TimelineSlider } from './components/TimelineSlider'
import { SaveSlots } from './components/SaveSlots'
import { StrategyPanel } from './components/StrategyPanel'
import { StrategyComparison } from './components/StrategyComparison'
import { SolverPanel } from './components/SolverPanel'
import { useStrategyStore } from './stores/strategyStore'
import { ControlsPanel } from './components/ControlsPanel'
import { HelpModal } from './components/HelpModal'
import { FloatingMessage } from './components/FloatingMessage'
import { useGameStore } from './stores/gameStore'
import { useSaveStore, parseSlotToTimeline } from './stores/saveStore'
import { useKeyboard } from './hooks/useKeyboard'
import { useTouch } from './hooks/useTouch'
import { theme } from './styles/theme'
import { SaveSlot, SaveSlotType } from './lib/types'
import { createTimeline } from './lib/game'

const Container = styled.main<{ $comparing: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: ${props => props.$comparing ? '1120px' : '540px'};
`

const LegacySaves = styled.details`
  width: 100%;
  margin-bottom: 20px;
  color: ${theme.colors.textLight};
  font-size: 0.85rem;
  summary { cursor: pointer; padding: 12px 0; min-height: 48px; }
  summary:focus-visible { outline: 2px solid ${theme.colors.primary}; outline-offset: 2px; }
  p { margin-bottom: 12px; }
`

const RecommendationGuide = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 0;
  margin-bottom: 12px;
  color: ${theme.colors.primary};
  font-size: 0.9rem;
  button {
    min-height: 48px;
    padding: 10px 12px;
    border-radius: 8px;
    background: ${theme.colors.primary};
    color: #fff;
    font-weight: 600;
  }
`

const Credits = styled.div`
  margin-top: 28px;
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
  const [comparing, setComparing] = useState(false)
  const [comparisonPair, setComparisonPair] = useState<[string, string] | null>(null)
  const strategyStore = useStrategyStore()
  const followingRecommendation = strategyStore.strategies.some(strategy => strategy.id === strategyStore.activeId && strategy.source === 'algorithm')
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
    restoreTimeline,
    switchStrategy,
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
  } = useSaveStore()

  useEffect(() => {
    const viewportSize = calculateViewportSize()
    loadFromStorage()
    const saves = useSaveStore.getState()
    const slots = [saves.currentAutoSlot, ...saves.autoSlots, ...saves.manualSlots].filter((slot): slot is SaveSlot => slot !== null)
    const strategies = useStrategyStore.getState()
    strategies.hydrate(slots, createTimeline(viewportSize))
    const loaded = useStrategyStore.getState()
    const active = loaded.strategies.find(strategy => strategy.id === loaded.activeId)
    if (active) restoreTimeline(active.timeline)
    else {
      const timeline = createTimeline(viewportSize)
      loaded.addStrategy(timeline, '첫 전략')
      restoreTimeline(timeline)
    }
  }, [loadFromStorage, restoreTimeline])

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

    try {
      useGameStore.getState().importTimeline(parseSlotToTimeline(slot), '기존 저장에서 불러온 전략')
    } catch {
      useGameStore.getState().setMessage('이 저장 기록은 불러올 수 없습니다. 원본 저장은 유지됩니다.')
    }
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
      if (!Number.isInteger(data.viewportSize) || data.viewportSize < 5) throw new Error('Invalid viewportSize')
      if (!Number.isInteger(data.currentIndex) || data.currentIndex < 0) throw new Error('Invalid currentIndex')
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

      if (!useGameStore.getState().importTimeline(newTimeline, '클립보드에서 불러온 전략')) return
      useGameStore.getState().setMessage('클립보드에서 불러옴')
      setTimeout(() => useGameStore.setState({ message: null }), 1500)
    } catch {
      useGameStore.setState({ message: '불러오기 실패: 잘못된 형식' })
      setTimeout(() => useGameStore.setState({ message: null }), 2000)
    }
  }, [])

  // Keyboard controls
  useKeyboard({
    enabled: !comparing,
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
    enabled: !comparing,
    containerRef: gridRef as React.RefObject<HTMLElement>,
    onMove: handleMove,
  })

  return (
    <Container $comparing={comparing}>
      {comparing ? (
        <StrategyComparison
          strategies={strategyStore.strategies}
          initialAId={comparisonPair?.[0] ?? strategyStore.activeId}
          initialBId={comparisonPair?.[1]}
          viewportSize={state.viewportSize}
          onClose={() => setComparing(false)}
          onContinue={id => { switchStrategy(id); setComparing(false) }}
        />
      ) : (
        <>
          <GameHeader state={state} />

          {followingRecommendation && <RecommendationGuide aria-label="추천 방향 안내">
            {timeline.currentIndex < timeline.moves.length ? <>
              <strong>다음 추천 방향: {{ up: '위', down: '아래', left: '왼쪽', right: '오른쪽' }[timeline.moves[timeline.currentIndex]]}</strong>
              <button type="button" onClick={handleRedo}>추천 한 수 따라가기</button>
            </> : <strong>추천 경로의 마지막 위치입니다.</strong>}
          </RecommendationGuide>}

          <div ref={gridRef}>
            <GameGrid state={state} onMove={handleMove} />
          </div>

          <TimelineSlider timeline={timeline} onSeek={handleSeek} />

          <SolverPanel
            state={state}
            timeline={timeline}
            activeId={strategyStore.activeId}
            onOpen={id => {
              switchStrategy(id)
              requestAnimationFrame(() => gridRef.current?.scrollIntoView({ block: 'center' }))
            }}
            onCompare={(parentId, candidateId) => { setComparisonPair([parentId, candidateId]); setComparing(true) }}
          />

          <StrategyPanel
            strategies={strategyStore.strategies}
            activeId={strategyStore.activeId}
            error={strategyStore.error}
            onSelect={switchStrategy}
            onRename={strategyStore.renameStrategy}
            onTogglePin={strategyStore.togglePin}
            onToggleCollapse={strategyStore.toggleCollapse}
            onCompare={() => { setComparisonPair(null); setComparing(true) }}
          />

          <LegacySaves>
            <summary>기존 세이브 슬롯</summary>
            <p>이전 저장의 원본입니다. 불러오면 별도의 전략으로 열립니다.</p>
            <SaveSlots
              autoSlots={autoSlots}
              manualSlots={manualSlots}
              currentAutoSlot={currentAutoSlot}
              onSave={handleSaveSlot}
              onLoad={handleLoadSlot}
              onDelete={handleDeleteSlot}
            />

          </LegacySaves>

          <ControlsPanel
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            onHelpOpen={() => setHelpOpen(true)}
            onCopyToClipboard={handleCopyToClipboard}
            onPasteFromClipboard={handlePasteFromClipboard}
          />

        </>
      )}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      <FloatingMessage message={message} />

      <Credits>
        Made by <a href="https://github.com/xbfld" target="_blank" rel="noopener noreferrer">@xbfld</a>
      </Credits>
    </Container>
  )
}
