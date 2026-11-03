import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Bundle the real stores with Vite's existing compiler; no browser or extra test dependency.
const require = createRequire(import.meta.resolve('vite'))
const { buildSync } = require('esbuild')
const storage = new Map()
globalThis.window = { innerWidth: 390 }
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
}
const compiled = buildSync({
  stdin: {
    contents: `export { useGameStore } from './stores/gameStore'; export { useStrategyStore } from './stores/strategyStore'; export { createTimeline } from './lib/game';`,
    resolveDir: fileURLToPath(new URL('../src/', import.meta.url)),
    loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', write: false,
})
const { useGameStore, useStrategyStore, createTimeline } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`)

function reset() {
  storage.clear()
  useStrategyStore.setState({ strategies: [], activeId: null, hydrated: false, error: null })
  useStrategyStore.getState().hydrate([], createTimeline(7))
  useGameStore.getState().restoreTimeline(useStrategyStore.getState().strategies[0].timeline)
}
function play(...directions) { directions.forEach(direction => useGameStore.getState().handleMove(direction)) }

test('valid divergence preserves original future, parent position, and highest level', () => {
  reset()
  const root = useStrategyStore.getState().activeId
  play('right', 'right', 'left', 'right', 'up')
  assert.equal(useGameStore.getState().state.level, 3)
  const original = [...useGameStore.getState().timeline.moves]
  useGameStore.getState().handleSeek(1)
  assert.equal(useStrategyStore.getState().strategies.length, 1)
  play('down')
  const records = useStrategyStore.getState().strategies
  assert.equal(records.length, 2)
  const parent = records.find(strategy => strategy.id === root)
  const child = records.find(strategy => strategy.id !== root)
  assert.deepEqual(parent.timeline.moves, original)
  assert.equal(parent.timeline.currentIndex, 1)
  assert.equal(parent.timeline.levelUpIndices.length, 3)
  assert.equal(child.parentId, root)
  assert.equal(child.forkIndex, 1)
  assert.deepEqual(child.timeline.moves, ['right', 'down'])
  useGameStore.getState().switchStrategy(root)
  assert.equal(useGameStore.getState().timeline.currentIndex, 1)
  useGameStore.getState().switchStrategy(child.id)
  assert.equal(useGameStore.getState().timeline.currentIndex, 2)
})

test('browsing, matching redo, and invalid directions create no branch', () => {
  reset()
  play('right', 'right', 'left', 'right', 'up')
  useGameStore.getState().handleUndo()
  useGameStore.getState().handleRedo()
  useGameStore.getState().handleStrongUndo()
  useGameStore.getState().handleStrongRedo()
  useGameStore.getState().handleSeek(1)
  play('right')
  assert.equal(useStrategyStore.getState().strategies.length, 1)
  useGameStore.getState().handleSeek(4)
  // Quest II is complete here: the existing I to the left cannot be entered.
  play('left')
  assert.equal(useStrategyStore.getState().strategies.length, 1)
  assert.equal(useGameStore.getState().timeline.currentIndex, 4)
  assert.equal(useGameStore.getState().timeline.moves.length, 5)
})

test('branch records outlive the three-slot limit and reset preserves prior strategies', () => {
  reset()
  const root = useStrategyStore.getState().activeId
  play('right', 'right')
  for (let i = 0; i < 5; i++) {
    useGameStore.getState().switchStrategy(root)
    useGameStore.getState().handleSeek(0)
    play('down')
  }
  assert.equal(useStrategyStore.getState().strategies.length, 6)
  useGameStore.getState().handleReset()
  assert.equal(useStrategyStore.getState().strategies.length, 7)
  assert.equal(useGameStore.getState().timeline.moves.length, 0)
  assert.equal(useStrategyStore.getState().strategies.find(strategy => strategy.id === root).timeline.moves.length, 2)
})

test('reload restores branch cursor and imports all legacy slots without changing v2 storage', () => {
  reset()
  play('right', 'right')
  useGameStore.getState().handleSeek(1)
  const active = useStrategyStore.getState().activeId
  const legacy = '{"keep":"original"}'
  storage.set('roman-puzzle-saves-v2', legacy)
  useStrategyStore.setState({ strategies: [], activeId: null, hydrated: false })
  useStrategyStore.getState().hydrate([], createTimeline(11))
  assert.equal(useStrategyStore.getState().activeId, active)
  assert.equal(useStrategyStore.getState().strategies[0].timeline.currentIndex, 1)
  assert.equal(storage.get('roman-puzzle-saves-v2'), legacy)
  storage.delete('roman-puzzle-strategies-v1')
  useStrategyStore.setState({ strategies: [], activeId: null, hydrated: false })
  const slots = Array.from({ length: 7 }, (_, i) => ({ id: i === 0 ? -1 : i - 1, type: i > 3 ? 'manual' : 'auto', viewportSize: 7, moves: 'RR', currentIndex: i % 3, level: 1, updatedAt: 1 }))
  useStrategyStore.getState().hydrate(slots, createTimeline(7))
  assert.equal(useStrategyStore.getState().strategies.length, 7)
  assert.deepEqual(useStrategyStore.getState().strategies.map(strategy => strategy.timeline.currentIndex), slots.map(slot => slot.currentIndex))
  assert.equal(storage.get('roman-puzzle-saves-v2'), legacy)
})

test('branch seeks never reuse cached states from the original future', () => {
  reset()
  useGameStore.setState({ cacheInterval: 1 })
  play('right', 'right', 'left', 'right', 'up')
  useGameStore.getState().handleSeek(1)
  play('down')
  useGameStore.getState().handleSeek(0)
  useGameStore.getState().handleSeek(2)
  assert.deepEqual(useGameStore.getState().state.playerPosition, { x: 1, y: 1 })
  assert.equal(useGameStore.getState().state.level, 2)
  useGameStore.setState({ cacheInterval: 50 })
})

test('storage quota errors remain visible while in-memory branches stay usable', () => {
  reset()
  const originalWrite = localStorage.setItem
  localStorage.setItem = () => { throw new Error('quota') }
  try {
    play('right', 'right')
    useGameStore.getState().handleSeek(0)
    play('down')
    assert.equal(useStrategyStore.getState().strategies.length, 2)
    assert.match(useStrategyStore.getState().error, /저장/)
  } finally { localStorage.setItem = originalWrite }
})

test('invalid imports cannot poison persisted strategies or cursor restoration', () => {
  reset()
  play('right', 'right')
  const original = storage.get('roman-puzzle-strategies-v1')
  const active = useStrategyStore.getState().activeId
  for (const timeline of [
    { viewportSize: 7, moves: ['right', 'right', 'left', 'right', 'left'], currentIndex: 5, levelUpIndices: [0, 2] },
    { viewportSize: 7, moves: ['right'], currentIndex: 0.5, levelUpIndices: [0] },
  ]) {
    assert.equal(useGameStore.getState().importTimeline(timeline), false)
    assert.equal(storage.get('roman-puzzle-strategies-v1'), original)
    assert.equal(useStrategyStore.getState().activeId, active)
  }
  useStrategyStore.setState({ strategies: [], activeId: null, hydrated: false })
  useStrategyStore.getState().hydrate([], createTimeline(7))
  assert.equal(useStrategyStore.getState().strategies.length, 1)
  assert.equal(useStrategyStore.getState().error, null)
  assert.equal(useStrategyStore.getState().activeId, active)
})

