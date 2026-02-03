import { create } from 'zustand'
import { SaveSlot, SaveSlotType, LocalSaveData, GameTimeline, Direction } from '../lib/types'
import { createInitialState, move } from '../lib/game'

const STORAGE_KEY = 'roman-puzzle-saves-v2'
const MAX_AUTO_SLOTS = 3
const MAX_MANUAL_SLOTS = 3

interface SaveStore {
  autoSlots: (SaveSlot | null)[]
  manualSlots: (SaveSlot | null)[]
  currentAutoSlot: SaveSlot | null

  // Actions
  loadFromStorage: () => void
  saveToSlot: (slotId: number, type: SaveSlotType, timeline: GameTimeline, level: number) => void
  deleteSlot: (slotId: number, type: SaveSlotType) => void
  autoSaveCurrent: (timeline: GameTimeline, level: number) => void
  saveWorldlineToAutoSlot: (timeline: GameTimeline, level: number) => void
  getSlotData: (slotId: number, type: SaveSlotType) => SaveSlot | null
}

function getLocalSaveData(): LocalSaveData {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('세이브 데이터 로드 실패:', e)
  }
  return {
    version: 2,
    autoSlots: new Array(MAX_AUTO_SLOTS).fill(null),
    manualSlots: new Array(MAX_MANUAL_SLOTS).fill(null),
    currentAutoSlot: null,
  }
}

function saveLocalData(data: LocalSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('세이브 데이터 저장 실패:', e)
  }
}

function getMoveString(timeline: GameTimeline): string {
  const dirMap: Record<Direction, string> = {
    up: 'U',
    down: 'D',
    left: 'L',
    right: 'R',
  }
  return timeline.moves.map(d => dirMap[d]).join('')
}

function createSlot(id: number, type: SaveSlotType, timeline: GameTimeline, level: number): SaveSlot {
  return {
    id,
    type,
    viewportSize: timeline.viewportSize,
    moves: getMoveString(timeline),
    currentIndex: timeline.currentIndex,
    level,
    updatedAt: Date.now(),
  }
}

export function parseSlotToTimeline(slot: SaveSlot): GameTimeline {
  const dirMap: Record<string, Direction> = {
    U: 'up',
    D: 'down',
    L: 'left',
    R: 'right',
  }
  const moves: Direction[] = slot.moves.split('').map(c => dirMap[c])
  const levelUpIndices = calculateLevelUpIndices(slot.viewportSize, moves)

  return {
    viewportSize: slot.viewportSize,
    moves,
    currentIndex: slot.currentIndex,
    levelUpIndices,
  }
}

function calculateLevelUpIndices(viewportSize: number, moves: Direction[]): number[] {
  const indices: number[] = [0]
  let state = createInitialState(viewportSize)

  for (let i = 0; i < moves.length; i++) {
    const result = move(state, moves[i])
    if (result.leveledUp) {
      indices.push(i + 1)
    }
    state = result.state
  }

  return indices
}

export const useSaveStore = create<SaveStore>((set, get) => ({
  autoSlots: new Array(MAX_AUTO_SLOTS).fill(null),
  manualSlots: new Array(MAX_MANUAL_SLOTS).fill(null),
  currentAutoSlot: null,

  loadFromStorage: () => {
    const data = getLocalSaveData()
    set({
      autoSlots: data.autoSlots,
      manualSlots: data.manualSlots,
      currentAutoSlot: data.currentAutoSlot,
    })
  },

  saveToSlot: (slotId: number, type: SaveSlotType, timeline: GameTimeline, level: number) => {
    if (type === 'auto') return // 자동슬롯은 수동 저장 불가

    const { autoSlots, manualSlots, currentAutoSlot } = get()
    const newManualSlots = [...manualSlots]
    newManualSlots[slotId] = createSlot(slotId, 'manual', timeline, level)

    const data: LocalSaveData = {
      version: 2,
      autoSlots,
      manualSlots: newManualSlots,
      currentAutoSlot,
    }
    saveLocalData(data)
    set({ manualSlots: newManualSlots })
  },

  deleteSlot: (slotId: number, type: SaveSlotType) => {
    const { autoSlots, manualSlots, currentAutoSlot } = get()

    let newAutoSlots = autoSlots
    let newManualSlots = manualSlots

    if (type === 'auto' && slotId >= 0) {
      newAutoSlots = [...autoSlots]
      newAutoSlots[slotId] = null
    } else if (type === 'manual') {
      newManualSlots = [...manualSlots]
      newManualSlots[slotId] = null
    }

    const data: LocalSaveData = {
      version: 2,
      autoSlots: newAutoSlots,
      manualSlots: newManualSlots,
      currentAutoSlot,
    }
    saveLocalData(data)
    set({ autoSlots: newAutoSlots, manualSlots: newManualSlots })
  },

  autoSaveCurrent: (timeline: GameTimeline, level: number) => {
    const { autoSlots, manualSlots } = get()
    const newCurrentAutoSlot = createSlot(-1, 'auto', timeline, level)

    const data: LocalSaveData = {
      version: 2,
      autoSlots,
      manualSlots,
      currentAutoSlot: newCurrentAutoSlot,
    }
    saveLocalData(data)
    set({ currentAutoSlot: newCurrentAutoSlot })
  },

  saveWorldlineToAutoSlot: (timeline: GameTimeline, level: number) => {
    const { autoSlots, manualSlots, currentAutoSlot } = get()

    // 자동저장 슬롯을 한 칸씩 밀고 새로운 세계선 저장
    const newAutoSlots = [...autoSlots]
    for (let i = MAX_AUTO_SLOTS - 1; i > 0; i--) {
      newAutoSlots[i] = newAutoSlots[i - 1]
      if (newAutoSlots[i]) {
        newAutoSlots[i] = { ...newAutoSlots[i]!, id: i }
      }
    }
    newAutoSlots[0] = createSlot(0, 'auto', timeline, level)

    const data: LocalSaveData = {
      version: 2,
      autoSlots: newAutoSlots,
      manualSlots,
      currentAutoSlot,
    }
    saveLocalData(data)
    set({ autoSlots: newAutoSlots })
  },

  getSlotData: (slotId: number, type: SaveSlotType) => {
    const { autoSlots, manualSlots, currentAutoSlot } = get()

    if (type === 'auto') {
      if (slotId === -1) return currentAutoSlot
      return autoSlots[slotId] ?? null
    }
    return manualSlots[slotId] ?? null
  },
}))
