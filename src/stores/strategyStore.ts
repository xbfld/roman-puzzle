import { create } from 'zustand'
import type { GameTimeline, SaveSlot } from '../lib/types'
import { createInitialState, move } from '../lib/game'
import { branchStrategy, cloneTimeline, createStrategy, migrateLegacySlots, parseStrategyData } from '../lib/strategies'
import type { Strategy } from '../lib/strategies'

const STORAGE_KEY = 'roman-puzzle-strategies-v1'

interface StrategyStore {
  strategies: Strategy[]
  activeId: string | null
  hydrated: boolean
  error: string | null
  hydrate: (legacySlots: SaveSlot[], initialTimeline: GameTimeline) => void
  syncActive: (timeline: GameTimeline) => void
  createBranch: (parentId: string, forkIndex: number, timeline: GameTimeline) => string
  addStrategy: (timeline: GameTimeline, name?: string, source?: Strategy['source']) => string
  selectStrategy: (id: string) => GameTimeline | null
  renameStrategy: (id: string, name: string) => void
  togglePin: (id: string) => void
  toggleCollapse: (id: string) => void
}

export function validateStrategyTimeline(timeline: GameTimeline): GameTimeline {
  if (!Number.isInteger(timeline.viewportSize) || timeline.viewportSize < 1
    || !Number.isInteger(timeline.currentIndex) || timeline.currentIndex < 0 || timeline.currentIndex > timeline.moves.length) {
    throw new Error('저장된 탐색 위치가 올바르지 않습니다.')
  }
  let state = createInitialState(timeline.viewportSize)
  const levelUpIndices = [0]
  for (const [index, direction] of timeline.moves.entries()) {
    const result = move(state, direction)
    if (result.state === state) throw new Error('저장된 이동을 재생할 수 없습니다.')
    if (result.leveledUp) levelUpIndices.push(index + 1)
    state = result.state
  }
  return { ...cloneTimeline(timeline), levelUpIndices }
}

export const useStrategyStore = create<StrategyStore>((set, get) => {
  let storageBlocked = false
  function persist(): void {
    if (storageBlocked) return
    const { strategies, activeId } = get()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, strategies, activeId }))
      set({ error: null })
    } catch {
      set({ error: '전략을 저장하지 못했습니다. 저장 공간을 확인해 주세요. 현재 변경은 이 화면에만 남아 있습니다.' })
    }
  }
  function update(id: string, change: (strategy: Strategy) => Strategy): void {
    set({ strategies: get().strategies.map(strategy => strategy.id === id ? change(strategy) : strategy) })
    persist()
  }
  function uniqueName(name: string): string {
    const existing = new Set(get().strategies.map(strategy => strategy.name))
    if (!existing.has(name)) return name
    let ordinal = 2
    while (existing.has(`${name} ${ordinal}`)) ordinal++
    return `${name} ${ordinal}`
  }
  return {
    strategies: [], activeId: null, hydrated: false, error: null,
    hydrate: (legacySlots, initialTimeline) => {
      if (get().hydrated) return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const data = raw ? parseStrategyData(raw) : migrateLegacySlots(legacySlots, initialTimeline, validateStrategyTimeline)
        const strategies = data.strategies.map(strategy => ({ ...strategy, timeline: validateStrategyTimeline(strategy.timeline) }))
        set({ strategies, activeId: data.activeId, hydrated: true })
        if (!raw) persist()
      } catch {
        // Keep unreadable storage intact so recovery remains possible.
        storageBlocked = true
        const strategy = createStrategy(initialTimeline, '복구 중인 전략')
        set({ strategies: [strategy], activeId: strategy.id, hydrated: true,
          error: '저장된 전략을 읽지 못했습니다. 기존 저장은 보존했으며, 현재 변경은 이 화면에만 남습니다.' })
      }
    },
    syncActive: timeline => {
      if (!get().hydrated || !get().activeId) return
      update(get().activeId!, strategy => ({ ...strategy, timeline: cloneTimeline(timeline), updatedAt: Date.now() }))
    },
    createBranch: (parentId, forkIndex, timeline) => {
      const parent = get().strategies.find(strategy => strategy.id === parentId)
      if (!parent) return get().addStrategy(timeline)
      const ordinal = get().strategies.filter(strategy => strategy.parentId === parentId).length + 1
      const child = { ...branchStrategy(parent, forkIndex, timeline), name: uniqueName(`${parent.name} 분기 ${ordinal}`) }
      set({ strategies: [...get().strategies, child], activeId: child.id })
      persist()
      return child.id
    },
    addStrategy: (timeline, name, source) => {
      const strategy = createStrategy(timeline, uniqueName(name?.trim() || '새 전략'), source)
      set({ strategies: [...get().strategies, strategy], activeId: strategy.id })
      persist()
      return strategy.id
    },
    selectStrategy: id => {
      const strategy = get().strategies.find(candidate => candidate.id === id)
      if (!strategy) return null
      set({ activeId: id })
      persist()
      return cloneTimeline(strategy.timeline)
    },
    renameStrategy: (id, name) => {
      const trimmed = name.trim().slice(0, 80)
      if (trimmed) update(id, strategy => ({ ...strategy, name: trimmed, updatedAt: Date.now() }))
    },
    togglePin: id => update(id, strategy => ({ ...strategy, pinned: !strategy.pinned })),
    toggleCollapse: id => update(id, strategy => ({ ...strategy, collapsed: !strategy.collapsed })),
  }
})

