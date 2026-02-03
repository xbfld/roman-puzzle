import { create } from 'zustand'
import { GameState, GameTimeline, Direction } from '../lib/types'
import {
  createInitialState,
  createTimeline,
  move,
  addMoveToTimeline,
  undoTimeline,
  redoTimeline,
  strongUndoTimeline,
  strongRedoTimeline,
  seekTimeline,
} from '../lib/game'
import { useSaveStore } from './saveStore'

interface BranchPoint {
  timeline: GameTimeline
  state: GameState
}

interface GameStore {
  timeline: GameTimeline
  state: GameState
  branchPoint: BranchPoint | null
  stateCache: Map<number, GameState>
  cacheInterval: number
  message: string | null

  // Actions
  initialize: (viewportSize: number) => void
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
  const screenWidth = window.innerWidth
  if (screenWidth <= 400) return 7
  if (screenWidth <= 500) return 9
  return 11
}

function cacheState(cache: Map<number, GameState>, index: number, state: GameState): void {
  const stateCopy: GameState = {
    ...state,
    tiles: new Map(state.tiles),
    playerPosition: { ...state.playerPosition },
  }
  cache.set(index, stateCopy)
}

function getStateAtIndexOptimized(
  timeline: GameTimeline,
  cache: Map<number, GameState>,
  index: number
): GameState {
  let nearestCacheIndex = 0
  let nearestState = createInitialState(timeline.viewportSize)

  for (const [cachedIndex, cachedState] of cache) {
    if (cachedIndex <= index && cachedIndex > nearestCacheIndex) {
      nearestCacheIndex = cachedIndex
      nearestState = cachedState
    }
  }

  let state: GameState = {
    ...nearestState,
    tiles: new Map(nearestState.tiles),
    playerPosition: { ...nearestState.playerPosition },
  }

  for (let i = nearestCacheIndex; i < index; i++) {
    const result = move(state, timeline.moves[i])
    state = result.state
  }

  return state
}

export const useGameStore = create<GameStore>((set, get) => ({
  timeline: createTimeline(calculateViewportSize()),
  state: createInitialState(calculateViewportSize()),
  branchPoint: null,
  stateCache: new Map(),
  cacheInterval: 50,
  message: null,

  initialize: (viewportSize: number) => {
    set({
      timeline: createTimeline(viewportSize),
      state: createInitialState(viewportSize),
      branchPoint: null,
      stateCache: new Map(),
    })
  },

  handleMove: (direction: Direction) => {
    const { timeline, state, branchPoint, stateCache, cacheInterval } = get()

    // 리두와 동일한 동작인지 확인
    const hasRedoHistory = timeline.currentIndex < timeline.moves.length
    const nextRedoMove = hasRedoHistory ? timeline.moves[timeline.currentIndex] : null
    const isRedoEquivalent = nextRedoMove === direction

    if (isRedoEquivalent) {
      const newTimeline = { ...timeline, currentIndex: timeline.currentIndex + 1 }
      const newState = getStateAtIndexOptimized(newTimeline, stateCache, newTimeline.currentIndex)
      set({ timeline: newTimeline, state: newState, branchPoint: null })
      return
    }

    // 세계선 분기 감지 - 이전 세계선을 자동저장 슬롯에 저장
    if (hasRedoHistory && branchPoint) {
      useSaveStore.getState().saveWorldlineToAutoSlot(
        branchPoint.timeline,
        branchPoint.state.level
      )
      set({ branchPoint: null })
    }

    const { timeline: newTimeline, moveResult } = addMoveToTimeline(timeline, direction, state)

    if (moveResult.state !== state) {
      const newCache = new Map(stateCache)
      if (newTimeline.currentIndex % cacheInterval === 0) {
        cacheState(newCache, newTimeline.currentIndex, moveResult.state)
      }

      set({
        timeline: newTimeline,
        state: moveResult.state,
        stateCache: newCache,
      })

      if (moveResult.leveledUp) {
        set({ message: `Level ${moveResult.state.level}!` })
        setTimeout(() => set({ message: null }), 1500)
      }
    }
  },

  handleUndo: () => {
    const { timeline, state, branchPoint, stateCache } = get()
    const newTimeline = undoTimeline(timeline)

    if (newTimeline.currentIndex !== timeline.currentIndex) {
      const newBranchPoint = !branchPoint && timeline.currentIndex === timeline.moves.length
        ? { timeline: { ...timeline }, state }
        : branchPoint

      const newState = getStateAtIndexOptimized(newTimeline, stateCache, newTimeline.currentIndex)
      set({ timeline: newTimeline, state: newState, branchPoint: newBranchPoint })
    }
  },

  handleRedo: () => {
    const { timeline, stateCache } = get()
    const newTimeline = redoTimeline(timeline)

    if (newTimeline.currentIndex !== timeline.currentIndex) {
      const newState = getStateAtIndexOptimized(newTimeline, stateCache, newTimeline.currentIndex)
      const newBranchPoint = newTimeline.currentIndex === newTimeline.moves.length ? null : get().branchPoint
      set({ timeline: newTimeline, state: newState, branchPoint: newBranchPoint })
    }
  },

  handleStrongUndo: () => {
    const { timeline, state, branchPoint, stateCache } = get()
    const newTimeline = strongUndoTimeline(timeline)

    if (newTimeline.currentIndex !== timeline.currentIndex) {
      const newBranchPoint = !branchPoint && timeline.currentIndex === timeline.moves.length
        ? { timeline: { ...timeline }, state }
        : branchPoint

      const newState = getStateAtIndexOptimized(newTimeline, stateCache, newTimeline.currentIndex)
      set({
        timeline: newTimeline,
        state: newState,
        branchPoint: newBranchPoint,
        message: `Lv.${newState.level} 시작점`,
      })
      setTimeout(() => set({ message: null }), 1000)
    }
  },

  handleStrongRedo: () => {
    const { timeline, stateCache } = get()
    const newTimeline = strongRedoTimeline(timeline)

    if (newTimeline.currentIndex !== timeline.currentIndex) {
      const newState = getStateAtIndexOptimized(newTimeline, stateCache, newTimeline.currentIndex)
      const newBranchPoint = newTimeline.currentIndex === newTimeline.moves.length ? null : get().branchPoint

      set({ timeline: newTimeline, state: newState, branchPoint: newBranchPoint })

      if (newTimeline.currentIndex < newTimeline.moves.length) {
        set({ message: `Lv.${newState.level} 시작점` })
        setTimeout(() => set({ message: null }), 1000)
      }
    }
  },

  handleSeek: (index: number) => {
    const { timeline, state, branchPoint, stateCache } = get()
    const newTimeline = seekTimeline(timeline, index)

    if (newTimeline.currentIndex !== timeline.currentIndex) {
      const newBranchPoint = !branchPoint && timeline.currentIndex === timeline.moves.length && index < timeline.moves.length
        ? { timeline: { ...timeline }, state }
        : newTimeline.currentIndex === newTimeline.moves.length ? null : branchPoint

      const newState = getStateAtIndexOptimized(newTimeline, stateCache, newTimeline.currentIndex)
      set({ timeline: newTimeline, state: newState, branchPoint: newBranchPoint })
    }
  },

  handleReset: () => {
    const { timeline } = get()
    set({
      timeline: createTimeline(timeline.viewportSize),
      state: createInitialState(timeline.viewportSize),
      branchPoint: null,
      stateCache: new Map(),
    })
  },

  setMessage: (message: string | null) => set({ message }),

  updateViewportSize: (size: number) => {
    const { timeline, state } = get()
    set({
      timeline: { ...timeline, viewportSize: size },
      state: { ...state, viewportSize: size },
    })
  },
}))
