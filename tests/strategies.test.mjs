import test from 'node:test'
import assert from 'node:assert/strict'
import { branchStrategy, cloneTimeline, createStrategy, getStrategyMaxLevel, migrateLegacySlots, parseStrategyData } from '../src/lib/strategies.ts'

const timeline = () => ({ viewportSize: 7, moves: ['right', 'left', 'right'], currentIndex: 1, levelUpIndices: [0, 2] })
const slot = (id, type, currentIndex) => ({ id, type, viewportSize: 7, moves: 'RLR', currentIndex, level: 1, updatedAt: 42 })

test('branch preserves parent future and remembered cursor and owns its move arrays', () => {
  const parent = createStrategy(timeline(), 'A')
  const snapshot = structuredClone(parent)
  const divergent = { ...timeline(), moves: ['right', 'up'], currentIndex: 2, levelUpIndices: [0] }
  const child = branchStrategy(parent, 1, divergent)
  assert.deepEqual(parent, snapshot)
  assert.equal(child.parentId, parent.id)
  assert.equal(child.forkIndex, 1)
  divergent.moves.push('left')
  assert.deepEqual(child.timeline.moves, ['right', 'up'])
})

test('migration retains every auto/manual slot including identical paths with distinct cursors', () => {
  const slots = [slot(-1, 'auto', 1), slot(0, 'auto', 2), slot(1, 'manual', 3)]
  const data = migrateLegacySlots(slots, timeline(), value => ({ ...cloneTimeline(value), levelUpIndices: [0, 2] }))
  assert.equal(data.strategies.length, 3)
  assert.equal(data.activeId, data.strategies[0].id)
  assert.deepEqual(data.strategies.map(strategy => strategy.timeline.currentIndex), [1, 2, 3])
  assert.deepEqual(data.strategies[0].timeline.levelUpIndices, [0, 2])
  assert.ok(data.strategies.every(strategy => strategy.source === 'import'))
})

test('migration without current auto save activates the initial timeline and retains saves', () => {
  const data = migrateLegacySlots([slot(0, 'manual', 2)], timeline())
  assert.equal(data.strategies.length, 2)
  assert.equal(data.strategies[0].source, 'manual')
  assert.equal(data.strategies[0].timeline.currentIndex, 1)
})

test('highest level includes the preserved future regardless of remembered cursor', () => {
  const strategy = createStrategy(timeline())
  assert.equal(strategy.timeline.currentIndex, 1)
  assert.equal(getStrategyMaxLevel(strategy), 2)
})

test('persistence round trip preserves branches, cursors, pins and collapsed state', () => {
  const parent = { ...createStrategy(timeline()), pinned: true, collapsed: true }
  const child = branchStrategy(parent, 1, timeline())
  const data = { version: 1, strategies: [parent, child], activeId: child.id }
  assert.deepEqual(parseStrategyData(JSON.stringify(data)), data)
})

test('invalid versions, cursors, directions, duplicate ids and orphan branches are rejected', () => {
  const strategy = createStrategy(timeline())
  const data = { version: 1, strategies: [strategy], activeId: strategy.id }
  for (const invalid of [
    { ...data, version: 2 },
    { ...data, activeId: 'missing' },
    { ...data, activeId: null },
    { ...data, strategies: [strategy, strategy] },
    { ...data, strategies: [{ ...strategy, parentId: 'missing' }] },
    { ...data, strategies: [{ ...strategy, timeline: { ...timeline(), currentIndex: 99 } }] },
    { ...data, strategies: [{ ...strategy, timeline: { ...timeline(), moves: ['sideways'] } }] },
    { ...data, strategies: [{ ...strategy, timeline: { ...timeline(), levelUpIndices: [0, 2, 1] } }] },
  ]) assert.throws(() => parseStrategyData(JSON.stringify(invalid)))
  assert.throws(() => migrateLegacySlots([{ ...slot(0, 'auto', 1), moves: 'RX' }], timeline()))
})

test('persistence rejects parent cycles spanning several strategies', () => {
  const a = createStrategy(timeline(), 'A')
  const b = { ...createStrategy(timeline(), 'B'), parentId: a.id }
  const c = { ...createStrategy(timeline(), 'C'), parentId: b.id }
  a.parentId = c.id
  assert.throws(() => parseStrategyData(JSON.stringify({ version: 1, strategies: [a, b, c], activeId: a.id })), /순환/)
  a.parentId = null
  assert.equal(parseStrategyData(JSON.stringify({ version: 1, strategies: [a, b, c], activeId: c.id })).strategies.length, 3)
})
