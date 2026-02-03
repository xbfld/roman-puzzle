import styled from 'styled-components'
import { theme } from '../styles/theme'
import { GameTimeline } from '../lib/types'

interface TimelineSliderProps {
  timeline: GameTimeline
  onSeek: (index: number) => void
}

const Container = styled.div`
  width: 100%;
  max-width: 500px;
  padding: 8px 15px;
  background: ${theme.colors.backgroundAlt};
  border-radius: ${theme.sizes.borderRadius};
  border: 1px solid ${theme.colors.border};
  margin-bottom: 10px;
`

const Track = styled.div`
  position: relative;
  padding: 8px 0;
`

const Markers = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
`

const Marker = styled.div<{ $position: number }>`
  position: absolute;
  left: ${props => props.$position}%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: ${theme.colors.success};
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: ${theme.shadows.small};
  pointer-events: auto;
  cursor: pointer;
  z-index: 2;

  &:hover {
    transform: translate(-50%, -50%) scale(1.3);
  }
`

const Slider = styled.input`
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, ${theme.colors.success} 0%, ${theme.colors.shelter} 0%);
  border-radius: 3px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: linear-gradient(145deg, #a0522d 0%, ${theme.colors.primary} 100%);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: ${theme.shadows.small};
    transition: transform 0.1s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: linear-gradient(145deg, #a0522d 0%, ${theme.colors.primary} 100%);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: ${theme.shadows.small};
  }
`

const Info = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 4px;
`

const Position = styled.span`
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
  font-family: monospace;
`

export function TimelineSlider({ timeline, onSeek }: TimelineSliderProps) {
  const maxMoves = timeline.moves.length
  const currentIndex = timeline.currentIndex
  const progress = maxMoves > 0 ? (currentIndex / maxMoves) * 100 : 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseInt(e.target.value, 10))
  }

  const handleMarkerClick = (index: number) => {
    onSeek(index)
  }

  return (
    <Container>
      <Track>
        <Markers>
          {timeline.levelUpIndices.map((idx, level) => {
            if (idx === 0 || maxMoves === 0) return null
            const position = (idx / maxMoves) * 100
            return (
              <Marker
                key={level}
                $position={position}
                onClick={() => handleMarkerClick(idx)}
                title={`Level ${level + 1}`}
              />
            )
          })}
        </Markers>
        <Slider
          type="range"
          min={0}
          max={maxMoves}
          value={currentIndex}
          onChange={handleChange}
          style={{
            background: `linear-gradient(90deg, ${theme.colors.success} ${progress}%, ${theme.colors.shelter} ${progress}%)`,
          }}
        />
      </Track>
      <Info>
        <Position>{currentIndex} / {maxMoves}</Position>
      </Info>
    </Container>
  )
}
