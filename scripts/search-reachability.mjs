import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Same engine and rules as the app, with explicit offline experiment budgets.
const require = createRequire(import.meta.resolve('vite'))
const { buildSync } = require('esbuild')
const compiled = buildSync({
  stdin: {
    contents: `export { solveAhead } from './lib/solver'; export { createInitialState, move } from './lib/game';`,
    resolveDir: fileURLToPath(new URL('../src/', import.meta.url)), loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', write: false,
})
const { solveAhead, createInitialState, move } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`)
const beamWidth = Number(process.argv[2] ?? 128)
const timeLimitMs = Number(process.argv[3] ?? 15000)
const maxExpanded = Number(process.argv[4] ?? 2000000)
if (!Number.isInteger(beamWidth) || beamWidth < 1 || beamWidth > 2048
  || !Number.isInteger(timeLimitMs) || timeLimitMs < 0 || timeLimitMs > 60000
  || !Number.isInteger(maxExpanded) || maxExpanded < 0 || maxExpanded > 2000000) {
  throw new Error('Usage: node scripts/search-reachability.mjs [beam 1..2048] [milliseconds 0..60000] [attempts 0..2000000]')
}
const result = solveAhead(createInitialState(11), { levels: 3998, beamWidth, timeLimitMs, maxExpanded })
let state = createInitialState(11)
for (const direction of result.moves) {
  const next = move(state, direction).state
  if (next === state) throw new Error('The candidate contains an illegal move')
  state = next
}
if (state.level !== result.bestLevel) throw new Error('Replay and reported level differ')
const letters = { up: 'U', down: 'D', left: 'L', right: 'R' }
const moves = result.moves.map(direction => letters[direction]).join('')
console.log(JSON.stringify({
  targetLevel: 3999, beamWidth, timeLimitMs, maxExpanded,
  reached: result.bestLevel, status: result.status,
  expanded: result.expanded, elapsedMs: Math.round(result.elapsedMs),
  verifiedRoute: { version: 2, viewportSize: 11, moves, currentIndex: moves.length, level: state.level },
}, null, 2))
