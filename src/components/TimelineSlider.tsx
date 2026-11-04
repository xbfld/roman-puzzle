import { useState } from 'react'
import styled from 'styled-components'
import { theme } from '../styles/theme'
import { GameTimeline } from '../lib/types'

interface TimelineSliderProps {
  timeline: GameTimeline
  onSeek: (index: number) => void
}

const Container = styled.section`
  width: 100%;
  max-width: 540px;
  padding: 8px 0;
  margin-bottom: 10px;
`

const Explorer = styled.div`
  & + & {
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px solid ${theme.colors.border};
  }
`

const Info = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
  color: ${theme.colors.textLight};
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;

  h3 {
    color: ${theme.colors.text};
    font-size: 1rem;
    font-weight: 600;
  }
`

const Navigation = styled.div`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 56px;
  align-items: center;
  gap: 10px;
`

const Slider = styled.input<{ $progress: number }>`
  display: block;
  width: 100%;
  min-width: 0;
  height: 56px;
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  touch-action: none;

  &::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(90deg, ${theme.colors.primary} ${props => props.$progress}%, ${theme.colors.shelterDark} ${props => props.$progress}%);
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 36px;
    height: 36px;
    margin-top: -14px;
    background: ${theme.colors.primary};
    border-radius: 50%;
    border: 3px solid ${theme.colors.background};
    box-shadow: ${theme.shadows.small};
  }

  &::-moz-range-track {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(90deg, ${theme.colors.primary} ${props => props.$progress}%, ${theme.colors.shelterDark} ${props => props.$progress}%);
  }

  &::-moz-range-thumb {
    box-sizing: border-box;
    width: 36px;
    height: 36px;
    background: ${theme.colors.primary};
    border-radius: 50%;
    border: 3px solid ${theme.colors.background};
    box-shadow: ${theme.shadows.small};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`

const SeekButton = styled.button`
  min-height: 56px;
  padding: 8px 4px;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  background: transparent;
  color: ${theme.colors.primary};
  font-size: 0.9rem;
  font-weight: 600;

  &:hover:not(:disabled) { background: ${theme.colors.backgroundAlt}; }
  &:active:not(:disabled) { background: ${theme.colors.shelter}; }
  &:disabled {
    color: ${theme.colors.textDisabled};
    opacity: 0.5;
    cursor: default;
  }
`

const Hint = styled.p`
  margin-top: 6px;
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`

export function TimelineSlider({ timeline, onSeek }: TimelineSliderProps) {
  const { moves, currentIndex, levelUpIndices } = timeline
  // Keep a completed level selected at its final turn. External moves, undo,
  // loading and branching return selection to the level at the new position.
  const [selection, setSelection] = useState<{
    level: number
    index: number
    moves: GameTimeline['moves']
  } | null>(null)
  const activeLevel = levelUpIndices.reduce((level, start, index) => start <= currentIndex ? index : level, 0)
  const level = selection?.moves === moves && selection.index === currentIndex ? selection.level : activeLevel
  const start = levelUpIndices[level]
  const nextStart = levelUpIndices[level + 1]
  const end = nextStart ?? moves.length
  const turnCount = end - start
  const turn = currentIndex - start
  const lastLevel = levelUpIndices.length - 1

  const seek = (selectedLevel: number, index: number) => {
    setSelection({ level: selectedLevel, index, moves })
    onSeek(index)
  }
  const selectLevel = (selectedLevel: number) => seek(selectedLevel, levelUpIndices[selectedLevel])

  return (
    <Container aria-label="타임라인">
      <Explorer role="group" aria-labelledby="level-explorer-title">
        <Info>
          <h3 id="level-explorer-title">레벨 탐색</h3>
          <span>레벨 {level + 1} / {lastLevel + 1}</span>
        </Info>
        <Navigation>
          <SeekButton aria-label="이전 레벨" disabled={level === 0} onClick={() => selectLevel(level - 1)}>이전</SeekButton>
          <Slider
            aria-label="레벨 선택"
            aria-valuetext={`레벨 ${level + 1}, 총 ${lastLevel + 1}개`}
            type="range"
            min={0}
            max={lastLevel}
            step={1}
            value={level}
            disabled={lastLevel === 0}
            $progress={lastLevel > 0 ? level / lastLevel * 100 : 0}
            onChange={event => selectLevel(Number(event.target.value))}
          />
          <SeekButton aria-label="다음 레벨" disabled={level === lastLevel} onClick={() => selectLevel(level + 1)}>다음</SeekButton>
        </Navigation>
      </Explorer>
      <Explorer role="group" aria-labelledby="turn-explorer-title">
        <Info>
          <h3 id="turn-explorer-title">레벨 {level + 1} 턴 탐색</h3>
          <span>{turn} / {turnCount}턴</span>
        </Info>
        <Navigation>
          <SeekButton aria-label="이전 턴" disabled={turn === 0} onClick={() => seek(level, currentIndex - 1)}>이전</SeekButton>
          <Slider
            aria-label="레벨 내 턴 선택"
            aria-valuetext={`레벨 ${level + 1}, ${turnCount}턴 중 ${turn}턴`}
            type="range"
            min={0}
            max={turnCount}
            step={1}
            value={turn}
            disabled={turnCount === 0}
            $progress={turnCount > 0 ? turn / turnCount * 100 : 0}
            onChange={event => seek(level, start + Number(event.target.value))}
          />
          <SeekButton aria-label="다음 턴" disabled={turn === turnCount} onClick={() => seek(level, currentIndex + 1)}>다음</SeekButton>
        </Navigation>
        <Hint>{turnCount === 0 ? '이 레벨에서 이동하면 턴 기록이 쌓여요.' : nextStart !== undefined ? '마지막 턴에는 다음 레벨 도착 지점이 표시돼요.' : '이 레벨에 기록된 턴 안에서 이동할 수 있어요.'}</Hint>
      </Explorer>
    </Container>
  )
}
