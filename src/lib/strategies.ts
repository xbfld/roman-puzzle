import type { Direction, GameTimeline, SaveSlot } from './types'

export interface Strategy {
  id: string
  name: string
  parentId: string | null
  forkIndex: number
  timeline: GameTimeline
  pinned: boolean
  collapsed: boolean
  source: 'manual' | 'import' | 'algorithm'
  createdAt: number
  updatedAt: number
}

export interface StrategyData {
  version: 1
  strategies: Strategy[]
  activeId: string | null
}

export function cloneTimeline(timeline: GameTimeline): GameTimeline {
  return { ...timeline, moves: [...timeline.moves], levelUpIndices: [...timeline.levelUpIndices] }
}

export function createStrategy(
  timeline: GameTimeline,
  name = '새 전략',
  source: Strategy['source'] = 'manual',
): Strategy {
  const now = Date.now()
  return {
    id: globalThis.crypto.randomUUID(), name, parentId: null, forkIndex: 0,
    timeline: cloneTimeline(timeline), pinned: false, collapsed: false,
    source, createdAt: now, updatedAt: now,
  }
}

export function branchStrategy(parent: Strategy, forkIndex: number, timeline: GameTimeline): Strategy {
  return {
    ...createStrategy(timeline, `${parent.name} 분기`),
    parentId: parent.id,
    forkIndex: Math.max(0, Math.min(forkIndex, parent.timeline.moves.length, timeline.moves.length)),
  }
}

export function getStrategyMaxLevel(strategy: Strategy): number {
  return strategy.timeline.levelUpIndices.length
}

export function migrateLegacySlots(
  slots: SaveSlot[],
  initialTimeline: GameTimeline,
  normalize: (timeline: GameTimeline) => GameTimeline = cloneTimeline,
): StrategyData {
  const directions: Record<string, Direction> = { U: 'up', D: 'down', L: 'left', R: 'right' }
  const strategies = slots.map(slot => {
    if (!/^[UDLR]*$/.test(slot.moves)) throw new Error('이전 저장의 이동 기록이 올바르지 않습니다.')
    const timeline = normalize({
      viewportSize: slot.viewportSize,
      moves: [...slot.moves].map(char => directions[char]),
      currentIndex: slot.currentIndex,
      levelUpIndices: [0],
    })
    const name = slot.id === -1 ? '이어 하던 전략' : `${slot.type === 'manual' ? '저장' : '자동 저장'} ${slot.id + 1}`
    return { ...createStrategy(timeline, name, 'import'), createdAt: slot.updatedAt, updatedAt: slot.updatedAt }
  })
  if (!strategies.length || slots[0].id !== -1) strategies.unshift(createStrategy(normalize(initialTimeline), '첫 전략'))
  return { version: 1, strategies, activeId: strategies[0].id }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTimeline(value: unknown): value is GameTimeline {
  if (!isRecord(value)) return false
  return Number.isInteger(value.viewportSize) && Number(value.viewportSize) > 0
    && Array.isArray(value.moves) && value.moves.every(move => ['up', 'down', 'left', 'right'].includes(move))
    && Number.isInteger(value.currentIndex) && Number(value.currentIndex) >= 0 && Number(value.currentIndex) <= value.moves.length
    && Array.isArray(value.levelUpIndices) && value.levelUpIndices[0] === 0
    && value.levelUpIndices.every((index, i, indices) => Number.isInteger(index) && index >= 0
      && index <= (value.moves as unknown[]).length && (i === 0 || index > indices[i - 1]))
}

export function parseStrategyData(raw: string): StrategyData {
  const data: unknown = JSON.parse(raw)
  if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.strategies)) throw new Error('전략 저장 형식을 읽을 수 없습니다.')
  const ids = new Set<string>()
  for (const strategy of data.strategies) {
    if (!isRecord(strategy) || typeof strategy.id !== 'string' || !strategy.id || ids.has(strategy.id)
      || typeof strategy.name !== 'string' || !strategy.name.trim()
      || !(strategy.parentId === null || typeof strategy.parentId === 'string')
      || !Number.isInteger(strategy.forkIndex) || Number(strategy.forkIndex) < 0
      || !isTimeline(strategy.timeline) || Number(strategy.forkIndex) > strategy.timeline.moves.length
      || typeof strategy.pinned !== 'boolean' || typeof strategy.collapsed !== 'boolean'
      || !['manual', 'import', 'algorithm'].includes(String(strategy.source))
      || typeof strategy.createdAt !== 'number' || !Number.isFinite(strategy.createdAt)
      || typeof strategy.updatedAt !== 'number' || !Number.isFinite(strategy.updatedAt)) {
      throw new Error('전략 저장 내용이 올바르지 않습니다.')
    }
    ids.add(strategy.id)
  }
  if (!(data.activeId === null && !data.strategies.length || typeof data.activeId === 'string' && ids.has(data.activeId))
    || data.strategies.some(strategy => strategy.parentId !== null && (!ids.has(strategy.parentId) || strategy.parentId === strategy.id))) {
    throw new Error('전략 연결 정보를 읽을 수 없습니다.')
  }
  const parents = new Map<string, string | null>(data.strategies.map(strategy => [strategy.id, strategy.parentId]))
  const checked = new Set<string>()
  for (const id of ids) {
    const path = new Set<string>()
    let current: string | null = id
    while (current !== null && !checked.has(current)) {
      if (path.has(current)) throw new Error('전략 분기 연결이 순환합니다.')
      path.add(current)
      current = parents.get(current) ?? null
    }
    for (const ancestor of path) checked.add(ancestor)
  }
  return data as unknown as StrategyData
}
