import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.resolve('vite'))
const { buildSync } = require('esbuild')
const compiled = buildSync({
  stdin: {
    contents: `export { solveAhead } from './lib/solver'; export { createInitialState, move } from './lib/game'; export { toRoman } from './lib/roman';`,
    resolveDir: fileURLToPath(new URL('../src/', import.meta.url)), loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', write: false,
})
const { solveAhead, createInitialState, move, toRoman } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`)

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
  console.log(`Initial search: ${result.status}, level ${result.bestLevel}, ${result.expanded} expansions, ${Math.round(result.elapsedMs)} ms`)
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
