import { useMemo, useState } from 'react'
import styled from 'styled-components'
import type { Strategy } from '../lib/strategies'
import type { GameTimeline } from '../lib/types'
import { getStateAtIndex } from '../lib/game'
import { theme } from '../styles/theme'
import { GameGrid } from './GameGrid'

interface StrategyComparisonProps {
  strategies: Strategy[]
  initialAId: string | null
  viewportSize: number
  onClose: () => void
  onContinue: (id: string) => void
}

const Container = styled.section`
  width: 100%;
  padding-bottom: 24px;
  h2 { font-size: 1.25rem; }
`
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
`
const Button = styled.button<{ $active?: boolean }>`
  min-height: 48px;
  padding: 10px 14px;
  border: 1px solid ${props => props.$active ? theme.colors.primary : theme.colors.shelterDark};
  border-radius: 8px;
  background: ${props => props.$active ? theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? '#fff' : theme.colors.primary};
  font-weight: 600;
  &:disabled { cursor: default; opacity: 0.5; }
  &:hover:not(:disabled) { background: ${theme.colors.backgroundAlt}; color: ${theme.colors.primary}; }
`
const Hint = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 0.85rem;
  line-height: 1.7;
  margin: 8px 0 16px;
`
const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: end;
  margin: 16px 0;
  > label { flex: 1 1 160px; }
`
const Label = styled.label`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
`
const Select = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 10px;
  font: inherit;
  color: ${theme.colors.text};
  border: 1px solid ${theme.colors.shelterDark};
  border-radius: 8px;
  background: ${theme.colors.background};
  &:focus-visible { outline: 2px solid ${theme.colors.primary}; outline-offset: 2px; }
`
const Summaries = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`
const Summary = styled.div`
  min-width: 0;
  padding: 12px 0;
  border-block: 1px solid ${theme.colors.border};
  h3 { font-size: 0.95rem; line-height: 1.5; overflow-wrap: anywhere; }
  p { font-size: 0.85rem; line-height: 1.7; color: ${theme.colors.textLight}; }
  strong { color: ${theme.colors.primary}; }
`
const Camera = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 16px 0;
  > span { width: 100%; font-size: 0.8rem; color: ${theme.colors.textMuted}; }
`
const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0;
  @media (min-width: 1000px) { display: none; }
`
const Boards = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1fr);
  @media (min-width: 1000px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`
const Board = styled.div<{ $visible: boolean }>`
  min-width: 0;
  display: ${props => props.$visible ? 'block' : 'none'};
  @media (min-width: 1000px) { display: block; }
  h3 { font-size: 0.95rem; overflow-wrap: anywhere; margin-bottom: 12px; }
  > button { width: 100%; }
`
const Missing = styled.div`
  min-height: 180px;
  padding: 24px;
  background: ${theme.colors.backgroundAlt};
  border: 1px dashed ${theme.colors.shelterDark};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.7;
  margin-bottom: 20px;
`
const Scrubber = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  gap: 4px;
  margin: 12px 0;
  input { width: 100%; min-width: 0; height: 48px; accent-color: ${theme.colors.primary}; }
`
const TurnButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
`

function turnAt(timeline: GameTimeline, index: number) {
  let start = 0
  for (const levelStart of timeline.levelUpIndices) {
    if (levelStart > index) break
    start = levelStart
  }
  return index - start
}

export function StrategyComparison({ strategies, initialAId, viewportSize, onClose, onContinue }: StrategyComparisonProps) {
  const initialA = strategies.find(item => item.id === initialAId) ?? strategies[0]
  const initialB = strategies.find(item => item.id !== initialA?.id)
  const [aId, setAId] = useState(initialA?.id ?? '')
  const [bId, setBId] = useState(initialB?.id ?? '')
  const a = strategies.find(item => item.id === aId) ?? initialA
  const b = strategies.find(item => item.id === bId) ?? initialB
  const [indices, setIndices] = useState<[number, number]>([initialA?.timeline.currentIndex ?? 0, initialB?.timeline.currentIndex ?? 0])
  const [selection, setSelection] = useState('cursor')
  const [tab, setTab] = useState<'A' | 'B'>('A')
  const [cameraSide, setCameraSide] = useState<'A' | 'B'>('A')
  const aIndex = Math.min(indices[0], a?.timeline.moves.length ?? 0)
  const bIndex = Math.min(indices[1], b?.timeline.moves.length ?? 0)
  const aState = useMemo(() => a ? getStateAtIndex(a.timeline, aIndex) : null, [a, aIndex])
  const bState = useMemo(() => b ? getStateAtIndex(b.timeline, bIndex) : null, [b, bIndex])
  const prefix = useMemo(() => {
    let index = 0
    if (a && b) while (index < Math.min(a.timeline.moves.length, b.timeline.moves.length) && a.timeline.moves[index] === b.timeline.moves[index]) index++
    return index
  }, [a, b])
  const originState = useMemo(() => a ? getStateAtIndex(a.timeline, prefix) : null, [a, prefix])
  if (!a || !b || !aState || !bState || !originState) return <Container><Header><h2>전략 비교</h2><Button onClick={onClose}>닫기</Button></Header><Hint>비교하려면 전략이 두 개 필요해요.</Hint></Container>

  const pair = [a, b]
  const states = [aState, bState]
  const maxLevel = Math.max(a.timeline.levelUpIndices.length, b.timeline.levelUpIndices.length)
  const level = Number(selection)
  const missing = pair.map(strategy => Number.isInteger(level) && level > 0 && strategy.timeline.levelUpIndices[level - 1] === undefined)
  const camera = states[cameraSide === 'A' ? 0 : 1].playerPosition
  const identical = prefix === a.timeline.moves.length && prefix === b.timeline.moves.length
  const prefixOnly = prefix === Math.min(a.timeline.moves.length, b.timeline.moves.length)

  const seek = (side: number, index: number) => {
    setIndices(previous => side === 0 ? [index, previous[1]] : [previous[0], index])
    setSelection('custom')
  }
  const selectLevel = (value: string) => {
    setSelection(value)
    if (value === 'cursor') setIndices([a.timeline.currentIndex, b.timeline.currentIndex])
    else if (value !== 'custom' && value !== 'divergence') {
      const target = Number(value) - 1
      setIndices([a.timeline.levelUpIndices[target] ?? a.timeline.moves.length, b.timeline.levelUpIndices[target] ?? b.timeline.moves.length])
    }
  }

  return (
    <Container aria-label="전략 비교" onKeyDown={event => event.stopPropagation()}>
      <Header><h2>두 경로, 같은 좌표에서</h2><Button type="button" onClick={onClose}>비교 닫기</Button></Header>
      <Hint>레벨 시작점을 맞추거나 처음 달라진 수를 살펴보세요. 비교 중에는 플레이 기록과 보던 위치가 바뀌지 않아요.</Hint>
      <Controls>
        {pair.map((strategy, side) => (
          <Label key={side}>{side === 0 ? 'A 전략' : 'B 전략'}
            <Select aria-label={side === 0 ? 'A 전략 선택' : 'B 전략 선택'} value={strategy.id} onChange={event => {
              const selected = strategies.find(item => item.id === event.target.value)
              if (!selected) return
              if (side === 0) setAId(selected.id)
              else setBId(selected.id)
              setIndices(previous => side === 0 ? [selected.timeline.currentIndex, previous[1]] : [previous[0], selected.timeline.currentIndex])
              setSelection('custom')
            }}>
              {strategies.map(item => <option key={item.id} value={item.id} disabled={item.id === pair[1 - side].id}>{item.name}</option>)}
            </Select>
          </Label>
        ))}
      </Controls>
      <Controls>
        <Label>같은 레벨 시작점
          <Select aria-label="비교할 레벨 시작점" value={selection} onChange={event => selectLevel(event.target.value)}>
            <option value="cursor">각 전략에서 보던 위치</option>
            {selection === 'custom' && <option value="custom">각자 탐색 중</option>}
            {selection === 'divergence' && <option value="divergence">처음 다른 수</option>}
            {Array.from({ length: maxLevel }, (_, i) => <option key={i} value={i + 1}>레벨 {i + 1} 시작{pair.some(strategy => strategy.timeline.levelUpIndices[i] === undefined) ? ' · 한쪽 기록 없음' : ''}</option>)}
          </Select>
        </Label>
        <Button type="button" disabled={identical} onClick={() => {
          setSelection('divergence')
          setIndices([Math.min(prefix + 1, a.timeline.moves.length), Math.min(prefix + 1, b.timeline.moves.length)])
        }}>처음 다른 수</Button>
      </Controls>
      <Hint>{identical ? '두 전략의 이동 기록이 같아요.' : `레벨 ${originState.level} · ${turnAt(a.timeline, prefix)}턴까지 같은 경로예요. ${prefixOnly ? '한 경로가 먼저 끝나서, 그쪽은 마지막 수를 표시해요.' : '‘처음 다른 수’는 갈라진 직후의 보드를 보여줘요.'}`}</Hint>
      <Summaries>
        {pair.map((strategy, side) => <Summary key={side} aria-label={`${side === 0 ? 'A' : 'B'} 비교 요약`}>
          <h3>{side === 0 ? 'A' : 'B'} · {strategy.name}</h3>
          {missing[side] ? <p role="status">레벨 {level} 기록 없음</p> : <><p>레벨 <strong>{states[side].level}</strong> · {turnAt(strategy.timeline, indices[side])}턴</p><p>남은 타일 <strong>{states[side].tileItems}</strong>개</p></>}
          <p>최고 레벨 {strategy.timeline.levelUpIndices.length}</p>
        </Summary>)}
      </Summaries>
      <Camera role="group" aria-label="공통 보드 중심">
        <span>같은 크기 · 공통 중심 ({camera.x}, {camera.y})</span>
        <Button type="button" $active={cameraSide === 'A'} aria-pressed={cameraSide === 'A'} onClick={() => setCameraSide('A')} disabled={missing[0]}>A 위치 중심</Button>
        <Button type="button" $active={cameraSide === 'B'} aria-pressed={cameraSide === 'B'} onClick={() => setCameraSide('B')} disabled={missing[1]}>B 위치 중심</Button>
      </Camera>
      <Tabs role="group" aria-label="표시할 보드">
        <Button type="button" $active={tab === 'A'} aria-pressed={tab === 'A'} onClick={() => setTab('A')}>A 보드</Button>
        <Button type="button" $active={tab === 'B'} aria-pressed={tab === 'B'} onClick={() => setTab('B')}>B 보드</Button>
      </Tabs>
      <Boards>
        {pair.map((strategy, side) => <Board key={side} $visible={tab === (side === 0 ? 'A' : 'B')} aria-label={`${side === 0 ? 'A' : 'B'} 보드`}>
          <h3>{side === 0 ? 'A' : 'B'} · {strategy.name}</h3>
          {missing[side] ? <Missing>이 전략은 레벨 {level}에 도달하지 않았어요.<br />최고 도달 레벨은 {strategy.timeline.levelUpIndices.length}이에요.</Missing> : <>
            <GameGrid state={{ ...states[side], viewportSize }} camera={camera} readOnly fluid />
            <Scrubber>{side === 0 ? 'A' : 'B'} 전체 기록 · {indices[side]} / {strategy.timeline.moves.length}수
              <input aria-label={`${side === 0 ? 'A' : 'B'} 비교 기록 탐색`} type="range" min={0} max={strategy.timeline.moves.length} value={indices[side]} disabled={strategy.timeline.moves.length === 0} onChange={event => seek(side, Number(event.target.value))} />
            </Scrubber>
            <TurnButtons>
              <Button type="button" disabled={indices[side] === 0} onClick={() => seek(side, indices[side] - 1)}>이전 수</Button>
              <Button type="button" disabled={indices[side] === strategy.timeline.moves.length} onClick={() => seek(side, indices[side] + 1)}>다음 수</Button>
            </TurnButtons>
          </>}
          <Button type="button" onClick={() => onContinue(strategy.id)}>{side === 0 ? 'A' : 'B'} 전략 이어하기</Button>
        </Board>)}
      </Boards>
      <Hint>플레이어가 화면 밖에 있으면 해당 전략의 ‘위치 중심’을 누르세요. 이어하기는 그 전략에서 마지막으로 보던 위치를 열어요.</Hint>
    </Container>
  )
}
