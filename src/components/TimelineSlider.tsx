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

const Info = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.8rem;
  color: ${theme.colors.textLight};
  font-variant-numeric: tabular-nums;
`

const Track = styled.div`
  position: relative;
`

// Markers share the thumb's travel distance and never intercept a drag.
const Markers = styled.div`
  position: absolute;
  inset: 0 16px;
  pointer-events: none;
`

const Marker = styled.span<{ $position: number }>`
  position: absolute;
  left: ${props => props.$position}%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 10px;
  background: ${theme.colors.successDark};
  border: 1px solid ${theme.colors.background};
  border-radius: 2px;
`

const Slider = styled.input<{ $progress: number }>`
  display: block;
  width: 100%;
  height: 48px;
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  touch-action: none;

  &::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary} ${props => props.$progress}%, ${theme.colors.shelterDark} ${props => props.$progress}%);
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 32px;
    height: 32px;
    margin-top: -13px;
    background: ${theme.colors.primary};
    border-radius: 50%;
    border: 3px solid ${theme.colors.background};
    box-shadow: ${theme.shadows.small};
  }

  &::-moz-range-track {
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(90deg, ${theme.colors.primary} ${props => props.$progress}%, ${theme.colors.shelterDark} ${props => props.$progress}%);
  }

  &::-moz-range-thumb {
    box-sizing: border-box;
    width: 32px;
    height: 32px;
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

const Navigation = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
`

const SeekButton = styled.button`
  min-height: 44px;
  padding: 8px 4px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  background: transparent;
  color: ${theme.colors.primary};
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;

  &:hover:not(:disabled) { background: ${theme.colors.backgroundAlt}; }
  &:active:not(:disabled) { background: ${theme.colors.shelter}; }
  &:disabled {
    color: ${theme.colors.textDisabled};
    opacity: 0.5;
    cursor: default;
  }
`

export function TimelineSlider({ timeline, onSeek }: TimelineSliderProps) {
  const maxMoves = timeline.moves.length
  const currentIndex = timeline.currentIndex
  const progress = maxMoves > 0 ? (currentIndex / maxMoves) * 100 : 0
  const previousLevel = timeline.levelUpIndices.reduce((previous, index) => index < currentIndex ? index : previous, 0)
  const nextLevel = timeline.levelUpIndices.find(index => index > currentIndex)

  return (
    <Container aria-label="타임라인">
      <Info>
        <span>이동 기록</span>
        <span>{maxMoves === 0 ? '이동하면 기록이 쌓여요' : `${currentIndex} / ${maxMoves}수`}</span>
      </Info>
      <Track>
        <Slider
          aria-label="이동 기록"
          aria-valuetext={`${maxMoves}수 중 ${currentIndex}수`}
          type="range"
          min={0}
          max={maxMoves}
          step={1}
          value={currentIndex}
          disabled={maxMoves === 0}
          $progress={progress}
          onChange={event => onSeek(Number(event.target.value))}
        />
        <Markers aria-hidden="true">
          {timeline.levelUpIndices.map((index, level) => {
            if (index === 0 || maxMoves === 0) return null
            return <Marker key={level} $position={(index / maxMoves) * 100} />
          })}
        </Markers>
      </Track>
      <Navigation aria-label="기록 이동">
        <SeekButton disabled={currentIndex === 0} onClick={() => onSeek(previousLevel)}>이전 레벨</SeekButton>
        <SeekButton disabled={currentIndex === 0} onClick={() => onSeek(currentIndex - 1)}>이전 수</SeekButton>
        <SeekButton disabled={currentIndex === maxMoves} onClick={() => onSeek(currentIndex + 1)}>다음 수</SeekButton>
        <SeekButton disabled={nextLevel === undefined} onClick={() => nextLevel !== undefined && onSeek(nextLevel)}>다음 레벨</SeekButton>
      </Navigation>
    </Container>
  )
}
