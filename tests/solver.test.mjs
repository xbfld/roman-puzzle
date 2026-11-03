import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.resolve('vite'))
const { buildSync } = require('esbuild')
const compiled = buildSync({
  stdin: {
    contents: `export { solveAhead, canonicalStateKey } from './lib/solver'; export { createInitialState, move } from './lib/game'; export { toRoman } from './lib/roman';`,
    resolveDir: fileURLToPath(new URL('../src/', import.meta.url)), loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', write: false,
})
const { solveAhead, canonicalStateKey, createInitialState, move, toRoman } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`)

// Independent geometric construction also maps absolute directions for the rule checks.
const symmetries = Array.from({ length: 8 }, (_, index) => (x, y) => {
  if (index >= 4) x = -x
  for (let rotation = 0; rotation < index % 4; rotation++) [x, y] = [-y, x]
  return [x, y]
})
const vectors = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }
function transformState(state, transform, tx = 13, ty = -7) {
  const [px, py] = transform(state.playerPosition.x, state.playerPosition.y)
  return {
    ...state,
    playerPosition: { x: px + tx, y: py + ty },
    tiles: new Map([...state.tiles].map(([key, tile]) => {
      const [x, y] = transform(...key.split(',').map(Number))
      return [`${x + tx},${y + ty}`, { ...tile }]
    })),
  }
}
function mappedDirection(direction, transform) {
  const [x, y] = transform(...vectors[direction])
  return Object.keys(vectors).find(key => vectors[key][0] === x && vectors[key][1] === y)
}
function asymmetricState() {
  return {
    ...createInitialState(), level: 14, currentQuest: 'XIV', tileItems: 4,
    tiles: new Map([
      ['1,0', { char: 'X', level: 10 }],
      ['1,1', { char: 'I', level: 1 }],
      ['2,1', { char: 'V', level: 5 }],
      ['-2,1', { char: 'L', level: 50 }],
    ]),
  }
}

test('canonical keys identify all eight translated symmetries without mutating the state', () => {
  const initial = asymmetricState()
  const snapshot = structuredClone(initial)
  const key = canonicalStateKey(initial)
  for (const transform of symmetries) {
    const equivalent = transformState(initial, transform)
    equivalent.viewportSize = 21
    for (const tile of equivalent.tiles.values()) tile.level = 999
    equivalent.tiles = new Map([...equivalent.tiles].reverse())
    assert.equal(canonicalStateKey(equivalent), key)
  }
  assert.deepEqual(initial, snapshot)
})

test('canonical keys retain board characters, geometry, resources, and quest semantics', () => {
  const initial = asymmetricState()
  const key = canonicalStateKey(initial)
  const changedChar = structuredClone(initial)
  changedChar.tiles.get('1,0').char = 'M'
  const changedPosition = structuredClone(initial)
  changedPosition.tiles.set('3,1', changedPosition.tiles.get('2,1'))
  changedPosition.tiles.delete('2,1')
  const extraTile = structuredClone(initial)
  extraTile.tiles.set('0,2', { char: 'I', level: 1 })
  for (const distinct of [
    changedChar, changedPosition, extraTile,
    { ...initial, tileItems: 3 }, { ...initial, level: 15 },
    { ...initial, questProgress: 1 }, { ...initial, isOnQuest: true },
    { ...initial, currentQuest: 'XV' },
  ]) assert.notEqual(canonicalStateKey(distinct), key)
})

test('all symmetries preserve legal moves, placement, progress, and level-up with mapped directions', () => {
  const shelter = asymmetricState()
  const first = move(shelter, 'right').state
  const second = move(first, 'down').state
  const completed = move(second, 'right').state
  const states = [shelter, first, second, completed, { ...first, tileItems: 0 }]
  let legal = 0
  let illegal = 0
  let leveledUp = 0
  for (const state of states) {
    for (const transform of symmetries) {
      const transformed = transformState(state, transform)
      for (const direction of Object.keys(vectors)) {
        const original = move(state, direction)
        const actual = move(transformed, mappedDirection(direction, transform))
        assert.equal(actual.state === transformed, original.state === state)
        assert.equal(actual.leveledUp, original.leveledUp)
        assert.equal(actual.autoPlacedTile, original.autoPlacedTile)
        assert.deepEqual(actual.state, transformState(original.state, transform))
        if (original.state === state) illegal++
        else legal++
        if (original.leveledUp) leveledUp++
      }
    }
  }
  assert.ok(legal > 0 && illegal > 0 && leveledUp > 0)
})

test('symmetric translated midquest inputs replay in their original coordinates', () => {
  const midquest = move(asymmetricState(), 'right').state
  for (const transform of symmetries) {
    const initial = transformState(midquest, transform)
    const result = solveAhead(initial, { levels: 2 })
    replay(initial, result)
    assert.equal(result.status, 'target')
    assert.equal(result.bestLevel, 16)
  }
})

test('initial state finds twenty completed levels and replays exactly', () => {
  const initial = createInitialState()
  const result = solveAhead(initial, { levels: 20 })
  replay(initial, result)
  assert.equal(result.status, 'target')
  assert.equal(result.bestLevel, 21)
})

function replay(initial, result) {
  let state = initial
  for (const direction of result.moves) {
    const next = move(state, direction).state
    assert.notEqual(next, state, 'every recommended move must be legal')
    state = next
  }
  assert.deepEqual(state, result.state)
  assert.equal(result.bestLevel, state.level)
}

test('initial state finds ten completed levels and replays exactly', () => {
  const initial = createInitialState()
  const result = solveAhead(initial)
  replay(initial, result)
  assert.equal(result.status, 'target')
  assert.equal(result.bestLevel, 11)
  assert.equal(result.state.isOnQuest, false)
})

test('search resumes a midquest without mutating its input', () => {
  const initial = move(createInitialState(), 'right').state
  const snapshot = structuredClone(initial)
  const result = solveAhead(initial, { levels: 3 })
  replay(initial, result)
  assert.deepEqual(initial, snapshot)
  assert.equal(result.bestLevel, 4)
  assert.equal(result.state.isOnQuest, false)
})

test('no legal route returns no partial quest or false progress', () => {
  const initial = { ...createInitialState(), tileItems: 0 }
  const result = solveAhead(initial)
  assert.equal(result.status, 'stuck')
  assert.equal(result.bestLevel, 1)
  assert.deepEqual(result.moves, [])
  replay(initial, result)
})

test('expansion and time budgets stop search and report actual completed levels', () => {
  const initial = createInitialState()
  const updates = []
  const result = solveAhead(initial, { maxExpanded: 17, onProgress: progress => updates.push(progress) })
  assert.equal(result.status, 'budget')
  assert.equal(result.expanded, 17)
  assert.equal(result.state.isOnQuest, false)
  assert.ok(updates.length >= 2)
  assert.equal(updates.at(-1).bestLevel, result.bestLevel)
  replay(initial, result)
  const timed = solveAhead(initial, { timeLimitMs: 0 })
  assert.equal(timed.status, 'budget')
  assert.equal(timed.expanded, 0)
  assert.deepEqual(timed.moves, [])
})

test('target clamps at 3999 and does not try advancing the final level', () => {
  const initial = { ...createInitialState(), level: 3999, currentQuest: toRoman(3999) }
  const result = solveAhead(initial)
  assert.equal(result.status, 'target')
  assert.equal(result.targetLevel, 3999)
  assert.equal(result.expanded, 0)
  assert.deepEqual(result.moves, [])
  const penultimate = { ...createInitialState(), level: 3998, currentQuest: toRoman(3998), tileItems: 20 }
  const capped = solveAhead(penultimate)
  assert.equal(capped.status, 'target')
  assert.equal(capped.bestLevel, 3999)
  replay(penultimate, capped)
})

test('same state and expansion budget choose the same route', () => {
  const initial = createInitialState()
  const options = { maxExpanded: 9000, timeLimitMs: 60000 }
  const first = solveAhead(initial, options)
  const second = solveAhead(initial, options)
  assert.deepEqual(first.moves, second.moves)
  assert.equal(first.expanded, second.expanded)
  replay(initial, first)
})

test('worker exposes an engine failure without returning a candidate or losing its diagnostic', async () => {
  const { runInNewContext } = await import('node:vm')
  const workerCode = buildSync({
    entryPoints: [fileURLToPath(new URL('../src/workers/solver.worker.ts', import.meta.url))],
    bundle: true, platform: 'browser', format: 'iife', write: false,
  }).outputFiles[0].text
  const replies = []
  const errors = []
  const scope = { postMessage: reply => replies.push(reply) }
  runInNewContext(workerCode, { self: scope, performance, console: { error: (...args) => errors.push(args) } })
  scope.onmessage({ data: { state: null } })
  assert.equal(replies.length, 1)
  assert.equal(replies[0].type, 'error')
  assert.equal(errors.length, 1)
  assert.equal(typeof errors[0][1].message, 'string')
})
