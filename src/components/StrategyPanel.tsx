import { useMemo, useState } from 'react'
import styled from 'styled-components'
import type { Strategy } from '../lib/strategies'
import type { GameTimeline } from '../lib/types'
import { theme } from '../styles/theme'

interface StrategyPanelProps {
  strategies: Strategy[]
  activeId: string | null
  error: string | null
  onSelect: (id: string) => void
  onRename: (id: string, name: string) => void
  onTogglePin: (id: string) => void
  onToggleCollapse: (id: string) => void
  onCompare: () => void
}

const Container = styled.section`
  width: 100%;
  margin: 0 0 20px;
  padding: 18px 0;
  border-block: 1px solid ${theme.colors.border};
`
const Heading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  h2 { font-size: 1rem; }
  p { margin-top: 4px; font-size: 0.8rem; color: ${theme.colors.textMuted}; }
  > div { min-width: 0; overflow-wrap: anywhere; }
`
const Button = styled.button<{ $selected?: boolean }>`
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid ${props => props.$selected ? theme.colors.primary : theme.colors.shelterDark};
  border-radius: 8px;
  background: ${props => props.$selected ? theme.colors.primary : 'transparent'};
  color: ${props => props.$selected ? '#fff' : theme.colors.primary};
  font-weight: 600;
  flex-shrink: 0;
  &:hover:not(:disabled) { background: ${theme.colors.backgroundAlt}; color: ${theme.colors.primary}; }
  &:disabled { opacity: 0.5; cursor: default; }
`
const Details = styled.details`
  margin-top: 14px;
  summary { min-height: 48px; padding: 13px 0; cursor: pointer; font-weight: 600; }
  summary:focus-visible { outline: 2px solid ${theme.colors.primary}; outline-offset: 2px; }
`
const Hint = styled.p`
  margin-bottom: 12px;
  color: ${theme.colors.textMuted};
  font-size: 0.8rem;
  line-height: 1.6;
`
const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 480px;
  overflow-y: auto;
  padding: 2px;
`
const Row = styled.li<{ $active: boolean; $depth: number }>`
  margin-left: ${props => Math.min(props.$depth, 3) * 10}px;
  padding: 12px;
  border: 1px solid ${props => props.$active ? theme.colors.primary : theme.colors.border};
  border-radius: 6px;
  background: ${props => props.$active ? theme.colors.backgroundAlt : 'transparent'};
`
const Select = styled.button`
  width: 100%;
  min-height: 48px;
  text-align: left;
  background: transparent;
  strong { display: block; overflow-wrap: anywhere; line-height: 1.5; font-size: 0.95rem; }
  span { display: block; color: ${theme.colors.textLight}; font-size: 0.8rem; margin-top: 4px; line-height: 1.5; }
`
const Origin = styled.p`
  font-size: 0.75rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  color: ${theme.colors.textMuted};
  margin: 6px 0 10px;
`
const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  button { font-size: 0.8rem; flex: 1; }
`
const Rename = styled.form`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
  label { width: 100%; font-size: 0.8rem; }
  input {
    flex: 1 1 140px;
    width: 100%;
    min-width: 0;
    min-height: 48px;
    padding: 10px;
    border: 1px solid ${theme.colors.shelterDark};
    border-radius: 6px;
    background: ${theme.colors.background};
    color: ${theme.colors.text};
    font: inherit;
  }
`
const ErrorText = styled.p`
  margin-top: 10px;
  color: ${theme.colors.danger};
  font-size: 0.85rem;
  line-height: 1.6;
`

function location(timeline: GameTimeline, index = timeline.currentIndex) {
  let level = 0
  timeline.levelUpIndices.forEach((start, i) => { if (start <= index) level = i })
  return `레벨 ${level + 1} · ${index - (timeline.levelUpIndices[level] ?? 0)}턴`
}

const sourceLabels = { manual: '직접 플레이', import: '기존 세이브', algorithm: '추천 후보' }

export function StrategyPanel({ strategies, activeId, error, onSelect, onRename, onTogglePin, onToggleCollapse, onCompare }: StrategyPanelProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const active = strategies.find(strategy => strategy.id === activeId)
  const visible = useMemo(() => {
    const result: { strategy: Strategy; depth: number }[] = []
    const seen = new Set<string>()
    const append = (parentId: string | null, depth: number) => {
      strategies.filter(strategy => strategy.parentId === parentId)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.createdAt - b.createdAt)
        .forEach(strategy => {
          if (seen.has(strategy.id)) return
          seen.add(strategy.id)
          result.push({ strategy, depth })
          if (!strategy.collapsed) append(strategy.id, depth + 1)
        })
    }
    append(null, 0)
    // Imported standalone records can outlive an unavailable parent.
    strategies.filter(strategy => strategy.parentId && !strategies.some(parent => parent.id === strategy.parentId))
      .forEach(strategy => {
        if (seen.has(strategy.id)) return
        seen.add(strategy.id)
        result.push({ strategy, depth: 0 })
        if (!strategy.collapsed) append(strategy.id, 1)
      })
    // Keep important paths reachable when their ancestor branches are folded.
    const retained = strategies
      .filter(strategy => (strategy.pinned || strategy.id === activeId) && !seen.has(strategy.id))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.createdAt - b.createdAt)
      .map(strategy => ({ strategy, depth: 0 }))
    return [...retained, ...result]
  }, [strategies, activeId])

  return (
    <Container aria-label="전략 탐색" onKeyDown={event => event.stopPropagation()}>
      <Heading>
        <div>
          <h2>{active?.name ?? '전략 탐색'}</h2>
          <p>{active ? `현재 ${location(active.timeline)}` : '첫 이동부터 전략이 자동으로 보존돼요.'}</p>
        </div>
        <Button type="button" onClick={onCompare} disabled={strategies.length < 2}>두 전략 비교</Button>
      </Heading>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      <Details>
        <summary>전략 목록 · {strategies.length}개</summary>
        <Hint>과거에서 다른 수를 두면 새 가지가 생겨요. 원래 경로와 보던 위치는 그대로 남아요. 가지를 접어도 고정한 전략과 현재 전략은 보여요.</Hint>
        <List>
          {visible.map(({ strategy, depth }) => {
            const parent = strategies.find(item => item.id === strategy.parentId)
            const hasChildren = strategies.some(item => item.parentId === strategy.id)
            return (
              <Row key={strategy.id} $active={strategy.id === activeId} $depth={depth}>
                <Select type="button" aria-current={strategy.id === activeId ? 'true' : undefined} onClick={() => onSelect(strategy.id)}>
                  <strong>{strategy.pinned ? '고정 · ' : ''}{strategy.name}{strategy.id === activeId ? ' · 현재 전략' : ''}</strong>
                  <span>최고 레벨 {strategy.timeline.levelUpIndices.length} · 현재 {location(strategy.timeline)}</span>
                </Select>
                <Origin>{sourceLabels[strategy.source]} · {parent ? `${parent.name}의 ${location(parent.timeline, strategy.forkIndex)}에서 분기` : '시작 경로'}</Origin>
                <Actions>
                  <Button type="button" aria-pressed={strategy.pinned} onClick={() => onTogglePin(strategy.id)}>{strategy.pinned ? '고정 해제' : '고정'}</Button>
                  <Button type="button" onClick={() => { setEditing(strategy.id); setName(strategy.name) }}>이름 변경</Button>
                  {hasChildren && <Button type="button" aria-expanded={!strategy.collapsed} onClick={() => onToggleCollapse(strategy.id)}>{strategy.collapsed ? '가지 펼치기' : '가지 접기'}</Button>}
                </Actions>
                {editing === strategy.id && (
                  <Rename onKeyDown={event => {
                    event.stopPropagation()
                    if (event.key === 'Escape') setEditing(null)
                  }} onSubmit={event => {
                    event.preventDefault()
                    if (!name.trim()) return
                    onRename(strategy.id, name.trim())
                    setEditing(null)
                  }}>
                    <label htmlFor={`strategy-name-${strategy.id}`}>전략 이름</label>
                    <input id={`strategy-name-${strategy.id}`} autoFocus value={name} maxLength={80} required onChange={event => setName(event.target.value)} />
                    <Button type="submit" disabled={!name.trim()}>저장</Button>
                    <Button type="button" onClick={() => setEditing(null)}>취소</Button>
                  </Rename>
                )}
              </Row>
            )
          })}
        </List>
      </Details>
    </Container>
  )
}
