import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import type { GameState, GameTimeline } from '../lib/types'
import type { SolveProgress, SolveResult } from '../lib/solver'
import { useStrategyStore } from '../stores/strategyStore'
import { theme } from '../styles/theme'

interface SolverPanelProps {
  state: GameState
  timeline: GameTimeline
  activeId: string | null
  onOpen: (id: string) => void
  onCompare: (parentId: string, candidateId: string) => void
}

const Container = styled.section`
  width: 100%;
  padding: 18px 0;
  margin-bottom: 16px;
  border-top: 1px solid ${theme.colors.border};
  h2 { font-size: 1rem; margin-bottom: 8px; }
  p { font-size: 0.85rem; line-height: 1.6; color: ${theme.colors.textLight}; }
`
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`
const Button = styled.button<{ $primary?: boolean }>`
  flex: 1 1 140px;
  min-height: 48px;
  padding: 12px;
  border: 1px solid ${theme.colors.primary};
  border-radius: 8px;
  background: ${props => props.$primary ? theme.colors.primary : 'transparent'};
  color: ${props => props.$primary ? '#fff' : theme.colors.primary};
  font-size: 0.9rem;
  font-weight: 600;
  &:hover:not(:disabled) { background: ${theme.colors.backgroundAlt}; color: ${theme.colors.primary}; }
  &:disabled { opacity: 0.5; cursor: default; }
`

interface Outcome {
  result: SolveResult
  strategyId: string | null
  originName: string
  parentId: string
}

type WorkerReply =
  | { type: 'progress'; progress: SolveProgress }
  | { type: 'result'; result: SolveResult }
  | { type: 'error'; message: string }

export function SolverPanel({ state, timeline, activeId, onOpen, onCompare }: SolverPanelProps) {
  const worker = useRef<Worker | null>(null)
  const [progress, setProgress] = useState<SolveProgress | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => () => {
    worker.current?.terminate()
    worker.current = null
  }, [])

  const cancel = () => {
    worker.current?.terminate()
    worker.current = null
    setRunning(false)
    setProgress(null)
    setMessage('탐색을 중지했습니다. 플레이 기록은 바뀌지 않았습니다.')
  }

  const start = () => {
    if (!activeId || running) return
    const parent = useStrategyStore.getState().strategies.find(strategy => strategy.id === activeId)
    if (!parent) return
    const originName = `${parent.name} · 레벨 ${state.level}`
    const forkIndex = timeline.currentIndex
    const prefix = timeline.moves.slice(0, forkIndex)
    const indices = timeline.levelUpIndices.filter(index => index <= forkIndex)
    setOutcome(null)
    setMessage(null)
    setProgress({ startLevel: state.level, targetLevel: Math.min(3999, state.level + 10), bestLevel: state.level, expanded: 0 })
    setRunning(true)
    let search: Worker
    try {
      search = new Worker(new URL('../workers/solver.worker.ts', import.meta.url), { type: 'module' })
      worker.current = search
    } catch (error) {
      console.error('탐색 작업 시작 실패', error)
      setRunning(false)
      setMessage('이 브라우저에서 탐색을 시작할 수 없습니다. 페이지를 새로고침해 다시 시도해 주세요.')
      return
    }
    const finish = () => {
      search.terminate()
      if (worker.current === search) worker.current = null
      setRunning(false)
    }
    search.onmessage = (event: MessageEvent<WorkerReply>) => {
      if (worker.current !== search) return
      if (event.data.type === 'progress') setProgress(event.data.progress)
      else if (event.data.type === 'error') {
        setMessage(event.data.message)
        finish()
      } else {
        const result = event.data.result
        try {
          let strategyId: string | null = null
          if (result.moves.length > 0 && result.bestLevel > result.startLevel) {
            const moves = [...prefix, ...result.moves]
            // Replay validation rebuilds level boundaries before the candidate is persisted.
            strategyId = useStrategyStore.getState().addRecommendation(activeId, forkIndex, {
              viewportSize: state.viewportSize, moves, currentIndex: forkIndex, levelUpIndices: indices,
            }, `추천 · 레벨 ${result.startLevel} → ${result.bestLevel}`)
          }
          setOutcome({ result, strategyId, originName, parentId: activeId })
          setProgress(null)
        } catch (error) {
          console.error('추천 전략 추가 실패', error)
          setMessage('찾은 경로를 전략으로 추가하지 못했습니다. 기존 전략은 유지됩니다.')
        }
        finish()
      }
    }
    search.onerror = event => {
      if (worker.current !== search) return
      console.error('탐색 작업 실행 오류', event.error ?? event.message)
      setMessage('탐색 중 오류가 발생했습니다. 현재 위치에서 다시 시도해 주세요.')
      finish()
    }
    try { search.postMessage({ state }) }
    catch (error) {
      console.error('탐색 보드 전달 실패', error)
      setMessage('현재 보드를 탐색으로 전달하지 못했습니다. 다시 시도해 주세요.')
      finish()
    }
  }

  return (
    <Container aria-label="추천 경로 탐색" onKeyDown={event => event.stopPropagation()}>
      <h2>앞으로 10레벨 도와주기</h2>
      <p>현재 레벨 {state.level} → 목표 레벨 {Math.min(3999, state.level + 10)}. 찾은 경로는 별도 추천 전략에 저장하고, 시작 위치에서 한 수씩 따라갈 수 있어요.</p>
      <p>약 12초 안에서 경로를 탐색하며 10레벨 도달은 보장하지 않아요.</p>
      <Actions>
        <Button $primary type="button" disabled={running || !activeId || state.level >= 3999} onClick={start}>10레벨 도와주기</Button>
        {running && <Button type="button" onClick={cancel}>탐색 중지</Button>}
      </Actions>
      <div role="status" aria-live="polite">
        {running && progress && <p>레벨 {progress.startLevel}에서 탐색 중 · 레벨 {progress.bestLevel} 도달 경로 발견 / 목표 {progress.targetLevel}</p>}
        {message && <p>{message}</p>}
        {outcome && <>
          <p>{outcome.originName}에서 시작한 결과: 레벨 {outcome.result.bestLevel}까지 {outcome.result.moves.length}수 경로를 찾았습니다.</p>
          <p>{outcome.result.status === 'target' ? '목표 레벨 도달 경로를 찾았어요.' : '탐색 범위 안에서 찾은 결과입니다. 더 좋은 경로가 있을 수 있어요.'}</p>
          {!outcome.strategyId && <p>다음 레벨 도달 경로를 찾지 못했습니다. 다른 턴으로 돌아가 다시 탐색해 보세요.</p>}
        </>}
      </div>
      {outcome?.strategyId && <Actions>
        <Button $primary type="button" onClick={() => onOpen(outcome.strategyId!)}>추천 전략 열기</Button>
        <Button type="button" onClick={() => onCompare(outcome.parentId, outcome.strategyId!)}>두 전략 비교</Button>
      </Actions>}
    </Container>
  )
}
