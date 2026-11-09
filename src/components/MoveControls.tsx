import styled from 'styled-components'
import { canMoveTo, getNewPosition } from '../lib/game'
import { Direction, GameState } from '../lib/types'
import { theme } from '../styles/theme'

const Container = styled.section`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 0 16px;
`

const Hint = styled.div`
  font-size: 0.85rem;
  color: ${theme.colors.textLight};
  strong { display: block; color: ${theme.colors.text}; margin-bottom: 4px; }
  p { max-width: 22ch; }
`

const Pad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 48px);
  grid-template-rows: repeat(2, 48px);
  gap: 4px;
  flex-shrink: 0;
`

const MoveButton = styled.button<{ $direction: Direction }>`
  grid-column: ${p => p.$direction === 'left' ? 1 : p.$direction === 'right' ? 3 : 2};
  grid-row: ${p => p.$direction === 'up' ? 1 : 2};
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: ${theme.colors.primary};
  color: #fff;
  &:hover:not(:disabled) { background: ${theme.colors.primaryLight}; }
  &:active:not(:disabled) { transform: translateY(1px); }
  &:disabled { background: ${theme.colors.backgroundAlt}; color: ${theme.colors.textDisabled}; cursor: default; }
`

const directions: { direction: Direction; label: string; rotation: number }[] = [
  { direction: 'up', label: '위', rotation: 0 },
  { direction: 'left', label: '왼쪽', rotation: 270 },
  { direction: 'down', label: '아래', rotation: 180 },
  { direction: 'right', label: '오른쪽', rotation: 90 },
]

export function MoveControls({ state, onMove }: { state: GameState; onMove: (direction: Direction) => void }) {
  const blocked = directions.every(({ direction }) => !canMoveTo(state, getNewPosition(state.playerPosition, direction)))
  return (
    <Container aria-label="이동 조작">
      <Hint>
        <strong>{blocked ? '이동할 곳이 없어요' : '테두리 칸으로 이동하세요'}</strong>
        <p>{blocked ? '되돌리기로 이전 수에서 다시 시도하세요.' : '칸을 누르거나 방향 버튼을 사용하세요.'}</p>
      </Hint>
      <Pad role="group" aria-label="방향 버튼">
        {directions.map(({ direction, label, rotation }) => (
          <MoveButton key={direction} $direction={direction} aria-label={`${label}${direction === 'left' || direction === 'right' ? '으로' : '로'} 이동`}
            disabled={!canMoveTo(state, getNewPosition(state.playerPosition, direction))}
            onClick={() => onMove(direction)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: `rotate(${rotation}deg)` }}>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </MoveButton>
        ))}
      </Pad>
    </Container>
  )
}
