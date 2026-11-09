import { useMemo, useCallback } from 'react'
import styled from 'styled-components'
import { GridCell } from './GridCell'
import { theme } from '../styles/theme'
import { GameState, Direction, Position } from '../lib/types'
import { getValidMoves, getPlacedTileAt } from '../lib/game'

interface GameGridProps {
  state: GameState
  onMove?: (direction: Direction) => void
  camera?: Position
  readOnly?: boolean
  fluid?: boolean
}

const GridWrapper = styled.div`
  position: relative;
  margin: 0 0 12px;
`

const GridContainer = styled.div<{ $size: number; $fluid: boolean }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$size}, 1fr);
  gap: ${theme.sizes.gridGap};
  background: ${theme.colors.shelterDark};
  padding: 8px;
  border-radius: ${theme.sizes.borderRadius};
  width: ${props => props.$fluid ? '100%' : 'min(calc(100vw - 24px), 540px)'};
  aspect-ratio: 1;
`

export function GameGrid({ state, onMove, camera, readOnly = false, fluid = false }: GameGridProps) {
  const validMoves = useMemo(() => readOnly ? [] : getValidMoves(state), [state, readOnly])
  const validMoveSet = useMemo(() => {
    const set = new Set<string>()
    validMoves.forEach(pos => set.add(`${pos.x},${pos.y}`))
    return set
  }, [validMoves])

  const handleCellClick = useCallback((cellX: number, cellY: number) => {
    if (readOnly || !onMove) return
    const playerX = state.playerPosition.x
    const playerY = state.playerPosition.y

    if (cellX === playerX && cellY === playerY - 1) onMove('up')
    else if (cellX === playerX && cellY === playerY + 1) onMove('down')
    else if (cellX === playerX - 1 && cellY === playerY) onMove('left')
    else if (cellX === playerX + 1 && cellY === playerY) onMove('right')
  }, [state.playerPosition, onMove, readOnly])

  const half = Math.floor(state.viewportSize / 2)
  const center = camera ?? state.playerPosition
  const cells = useMemo(() => {
    const result = []
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const x = center.x + dx
        const y = center.y + dy
        const key = `${x},${y}`
        const tile = getPlacedTileAt(state, { x, y })
        const isPlayer = x === state.playerPosition.x && y === state.playerPosition.y
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
  }, [state, validMoveSet, half, center.x, center.y])

  return (
    <GridWrapper>
      <GridContainer $size={state.viewportSize} $fluid={fluid}>
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
            onClick={readOnly ? undefined : () => handleCellClick(cell.x, cell.y)}
          />
        ))}
      </GridContainer>
    </GridWrapper>
  )
}
