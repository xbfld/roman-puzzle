import { create } from 'zustand'
import { GameState, GameTimeline, Direction } from '../lib/types'
import {
  createInitialState, createTimeline, move, addMoveToTimeline,
  undoTimeline, redoTimeline, strongUndoTimeline, strongRedoTimeline, seekTimeline,
} from '../lib/game'
import { useStrategyStore, validateStrategyTimeline } from './strategyStore'

interface GameStore {
  timeline: GameTimeline
  state: GameState
  stateCache: Map<number, GameState>
  cacheInterval: number
  message: string | null
  initialize: (viewportSize: number) => void
  restoreTimeline: (timeline: GameTimeline) => void
  switchStrategy: (id: string) => void
  importTimeline: (timeline: GameTimeline, name?: string) => boolean
  handleMove: (direction: Direction) => void
  handleUndo: () => void
  handleRedo: () => void
  handleStrongUndo: () => void
  handleStrongRedo: () => void
  handleSeek: (index: number) => void
  handleReset: () => void
  setMessage: (message: string | null) => void
  updateViewportSize: (size: number) => void
}

function calculateViewportSize(): number {
  if (window.innerWidth <= 400) return 7
  if (window.innerWidth <= 500) return 9
  return 11
}

function getStateAtIndexOptimized(timeline: GameTimeline, cache: Map<number, GameState>, index: number): GameState {
  let nearestIndex = 0
  let state = createInitialState(timeline.viewportSize)
  for (const [cachedIndex, cachedState] of cache) {
    if (cachedIndex <= index && cachedIndex > nearestIndex) {
      nearestIndex = cachedIndex
      state = { ...cachedState, tiles: new Map(cachedState.tiles), playerPosition: { ...cachedState.playerPosition } }
    }
  }
  for (let i = nearestIndex; i < index; i++) state = move(state, timeline.moves[i]).state
  return { ...state, viewportSize: timeline.viewportSize }
}

export const useGameStore = create<GameStore>((set, get) => {
  const seek = (timeline: GameTimeline) => {
    if (timeline.currentIndex === get().timeline.currentIndex) return
    const state = getStateAtIndexOptimized(timeline, get().stateCache, timeline.currentIndex)
    set({ timeline, state })
    useStrategyStore.getState().syncActive(timeline)
  }
  return {
    timeline: createTimeline(calculateViewportSize()),
    state: createInitialState(calculateViewportSize()),
    stateCache: new Map(), cacheInterval: 50, message: null,
    initialize: viewportSize => {
      const timeline = createTimeline(viewportSize)
      set({ timeline, state: createInitialState(viewportSize), stateCache: new Map() })
    },
    restoreTimeline: saved => {
      const timeline = { ...saved, viewportSize: get().state.viewportSize }
      const state = getStateAtIndexOptimized(timeline, new Map(), timeline.currentIndex)
      set({ timeline, state, stateCache: new Map(), message: null })
      useStrategyStore.getState().syncActive(timeline)
    },
    switchStrategy: id => {
      useStrategyStore.getState().syncActive(get().timeline)
      const timeline = useStrategyStore.getState().selectStrategy(id)
      if (timeline) get().restoreTimeline(timeline)
    },
    importTimeline: (timeline, name = '불러온 전략') => {
      try {
        const validated = validateStrategyTimeline(timeline)
        useStrategyStore.getState().addStrategy(validated, name, 'import')
        get().restoreTimeline(validated)
        return true
      } catch {
        set({ message: '불러오기 실패: 이동 기록이나 탐색 위치가 올바르지 않습니다.' })
        setTimeout(() => set({ message: null }), 2500)
        return false
      }
    },
    handleMove: direction => {
      const { timeline, state, stateCache, cacheInterval } = get()
      const hasFuture = timeline.currentIndex < timeline.moves.length
      if (hasFuture && timeline.moves[timeline.currentIndex] === direction) {
        seek(redoTimeline(timeline))
        return
      }
      const { timeline: next, moveResult } = addMoveToTimeline(timeline, direction, state)
      if (moveResult.state === state) return

      const strategies = useStrategyStore.getState()
      // Preserve the entire original future before writing a valid new branch.
      if (hasFuture && strategies.activeId) {
        strategies.syncActive(timeline)
        strategies.createBranch(strategies.activeId, timeline.currentIndex, next)
      } else {
        strategies.syncActive(next)
      }
      const cache = new Map([...stateCache].filter(([index]) => index <= timeline.currentIndex))
      if (next.currentIndex % cacheInterval === 0) cache.set(next.currentIndex, moveResult.state)
      set({ timeline: next, state: moveResult.state, stateCache: cache })
      if (moveResult.leveledUp) {
        set({ message: `Level ${moveResult.state.level}!` })
        setTimeout(() => set({ message: null }), 1500)
      }
    },
    handleUndo: () => seek(undoTimeline(get().timeline)),
    handleRedo: () => seek(redoTimeline(get().timeline)),
    handleStrongUndo: () => seek(strongUndoTimeline(get().timeline)),
    handleStrongRedo: () => seek(strongRedoTimeline(get().timeline)),
    handleSeek: index => seek(seekTimeline(get().timeline, index)),
    handleReset: () => {
      const timeline = createTimeline(get().state.viewportSize)
      useStrategyStore.getState().addStrategy(timeline, '새 전략', 'manual')
      get().restoreTimeline(timeline)
    },
    setMessage: message => set({ message }),
    updateViewportSize: size => {
      const timeline = { ...get().timeline, viewportSize: size }
      set({ timeline, state: { ...get().state, viewportSize: size } })
      useStrategyStore.getState().syncActive(timeline)
    },
  }
})
