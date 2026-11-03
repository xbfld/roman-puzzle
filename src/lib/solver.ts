import { move } from './game';
import { toRoman } from './roman';
import type { Direction, GameState } from './types';

export interface SolveProgress {
  startLevel: number;
  targetLevel: number;
  bestLevel: number;
  expanded: number;
}

export interface SolveResult extends SolveProgress {
  moves: Direction[];
  state: GameState;
  status: 'target' | 'budget' | 'stuck';
  elapsedMs: number;
}

export interface SolveOptions {
  levels?: number;
  beamWidth?: number;
  maxExpanded?: number;
  timeLimitMs?: number;
  onProgress?: (progress: SolveProgress) => void;
}

interface Candidate { state: GameState; moves: Direction[]; score: number }
const directions: Direction[] = ['up', 'right', 'down', 'left'];
const offsets = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function bounded(value: number | undefined, fallback: number, maximum: number): number {
  return value === undefined || !Number.isFinite(value)
    ? fallback : Math.min(maximum, Math.max(0, Math.floor(value)));
}

// Tile creation levels affect the display, but not legal moves or future resources.
// Translate around the player so identical arrangements reached elsewhere share a key.
function stateKey(state: GameState): string {
  const { x, y } = state.playerPosition;
  const tiles = [...state.tiles].map(([key, tile]) => {
    const [tx, ty] = key.split(',').map(Number);
    return `${tx - x},${ty - y}:${tile.char}`;
  }).sort().join(';');
  return `${state.level}/${state.questProgress}/${Number(state.isOnQuest)}/${state.tileItems}/${tiles}`;
}

function evaluate(state: GameState): number {
  const { x, y } = state.playerPosition;
  let reuse = 0;
  let exits = 0;
  let spread = 0;
  const upcoming = toRoman(Math.min(3999, state.level + 1));
  for (const [key, tile] of state.tiles) {
    const [tx, ty] = key.split(',').map(Number);
    const distance = Math.abs(tx - x) + Math.abs(ty - y);
    spread += distance;
    if (upcoming.includes(tile.char)) reuse += 1 / Math.max(1, distance);
  }
  for (const [dx, dy] of offsets) {
    const tile = state.tiles.get(`${x + dx},${y + dy}`);
    if (!tile || tile.char === state.currentQuest[0]) exits++;
  }
  return state.tileItems * 100 + reuse * 4 + exits * 2 - spread * 0.05;
}

function prune(candidates: Candidate[], width: number): Candidate[] {
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, width);
}

/** Finds a bounded candidate route, never a proof that a higher level is impossible. */
export function solveAhead(initial: GameState, options: SolveOptions = {}): SolveResult {
  const started = performance.now();
  const levels = bounded(options.levels, 10, 3999);
  const beamWidth = Math.max(1, bounded(options.beamWidth, 128, 2048));
  const maxExpanded = bounded(options.maxExpanded, 120000, 2000000);
  const timeLimitMs = bounded(options.timeLimitMs, 12000, 60000);
  const startLevel = initial.level;
  const targetLevel = Math.min(3999, startLevel + levels);
  let expanded = 0;
  let best: Candidate = { state: initial, moves: [], score: evaluate(initial) };
  let beam = [best];
  let limited = false;
  const progress = (): SolveProgress => ({ startLevel, targetLevel, bestLevel: best.state.level, expanded });
  const exhausted = () => expanded >= maxExpanded || performance.now() - started >= timeLimitMs;
  options.onProgress?.(progress());

  while (best.state.level < targetLevel && beam.length) {
    const endpoints: Candidate[] = [];
    const endpointKeys = new Set<string>();
    // Progress increases at every move until the single return-to-shelter move.
    // A depth beam bounds branching even for a long Roman numeral quest.
    let frontier = beam;
    while (frontier.length) {
      const next: Candidate[] = [];
      const nextKeys = new Set<string>();
      outer: for (const candidate of frontier) {
        for (const direction of directions) {
          if (exhausted()) { limited = true; break outer; }
          expanded++;
          const result = move(candidate.state, direction);
          if (result.state === candidate.state) continue;
          const key = stateKey(result.state);
          const keys = result.leveledUp ? endpointKeys : nextKeys;
          if (keys.has(key)) continue;
          keys.add(key);
          const child = { state: result.state, moves: [...candidate.moves, direction], score: evaluate(result.state) };
          if (result.leveledUp) {
            endpoints.push(child);
            if (child.state.level > best.state.level || (child.state.level === best.state.level && child.score > best.score)) best = child;
          } else next.push(child);
        }
      }
      if (limited) break;
      frontier = prune(next, beamWidth);
    }
    options.onProgress?.(progress());
    if (limited) break;
    beam = prune(endpoints, beamWidth);
  }

  return {
    ...progress(), moves: best.moves, state: best.state,
    status: best.state.level >= targetLevel ? 'target' : limited ? 'budget' : 'stuck',
    elapsedMs: performance.now() - started,
  };
}
