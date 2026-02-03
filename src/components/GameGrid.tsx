import { useMemo, useCallback } from 'react'
import styled from 'styled-components'
import { GridCell } from './GridCell'
import { theme } from '../styles/theme'
import { GameState, Direction } from '../lib/types'
import { getValidMoves, getPlacedTileAt } from '../lib/game'

interface GameGridProps {
  state: GameState
  onMove: (direction: Direction) => void
}

const GridWrapper = styled.div`
  position: relative;
  margin: 10px 0;
`

const GridContainer = styled.div<{ $size: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$size}, 1fr);
  gap: ${theme.sizes.gridGap};
  background: ${theme.colors.shelterDark};
  padding: ${theme.sizes.gridGap};
  border-radius: ${theme.sizes.borderRadius};
  box-shadow: ${theme.shadows.medium};
  width: min(90vw, 500px);
  aspect-ratio: 1;
`

export function GameGrid({ state, onMove }: GameGridProps) {
  const validMoves = useMemo(() => getValidMoves(state), [state])
  const validMoveSet = useMemo(() => {
    const set = new Set<string>()
    validMoves.forEach(pos => set.add(`${pos.x},${pos.y}`))
    return set
  }, [validMoves])

  const handleCellClick = useCallback((cellX: number, cellY: number) => {
    const playerX = state.playerPosition.x
    const playerY = state.playerPosition.y

    if (cellX === playerX && cellY === playerY - 1) onMove('up')
    else if (cellX === playerX && cellY === playerY + 1) onMove('down')
    else if (cellX === playerX - 1 && cellY === playerY) onMove('left')
    else if (cellX === playerX + 1 && cellY === playerY) onMove('right')
  }, [state.playerPosition, onMove])

  const half = Math.floor(state.viewportSize / 2)
  const cells = useMemo(() => {
    const result = []
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const x = state.playerPosition.x + dx
        const y = state.playerPosition.y + dy
        const key = `${x},${y}`
        const tile = getPlacedTileAt(state, { x, y })
        const isPlayer = dx === 0 && dy === 0
        const isValidMove = validMoveSet.has(key)
        const isDark = (x + y) % 2 !== 0

        result.push({
          key,
          x,
          y,
          tile,
          isPlayer,
          isValidMove,
          isDark,
        })
      }
    }
    return result
  }, [state, validMoveSet, half])

  return (
    <GridWrapper>
      <GridContainer $size={state.viewportSize}>
        {cells.map(cell => (
          <GridCell
            key={cell.key}
            x={cell.x}
            y={cell.y}
            tile={cell.tile}
            isPlayer={cell.isPlayer}
            isValidMove={cell.isValidMove}
            isDark={cell.isDark}
            currentLevel={state.level}
            onClick={() => handleCellClick(cell.x, cell.y)}
          />
        ))}
      </GridContainer>
    </GridWrapper>
  )
}
