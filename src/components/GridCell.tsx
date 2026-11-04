import { memo } from 'react'
import styled, { css } from 'styled-components'
import { theme } from '../styles/theme'
import { PlacedTile } from '../lib/types'

interface GridCellProps {
  x: number
  y: number
  tile: PlacedTile | null
  isPlayer: boolean
  isValidMove: boolean
  isDark: boolean
  currentLevel: number
  onClick?: () => void
}

const CellContainer = styled.div<{
  $isPlayer: boolean
  $isValidMove: boolean
  $isDark: boolean
  $isShelter: boolean
  $isRoman: boolean
  $isOldTile: boolean
}>`
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: bold;
  position: relative;
  cursor: ${props => props.$isValidMove ? 'pointer' : 'default'};
  transition: background 150ms ease, transform 150ms ease;

  ${props => props.$isShelter && css`
    background: ${props.$isDark ? '#e7dfd3' : '#eee7dc'};
    border: 1px solid transparent;
  `}

  ${props => props.$isRoman && css`
    background: ${props.$isOldTile ? '#e4ddd1' : theme.colors.roman};
    border: 1px solid ${props.$isOldTile ? theme.colors.shelterDark : theme.colors.romanBorder};
  `}

  ${props => props.$isPlayer && css`
    background: ${theme.colors.primary};
    border: 2px solid #6b3410;
    z-index: 10;
  `}

  ${props => props.$isValidMove && !props.$isPlayer && css`
    outline: 2px solid ${theme.colors.primary};
    outline-offset: -2px;
    cursor: pointer;

    &:hover {
      transform: scale(1.05);
      background: ${theme.colors.roman};
    }
  `}
`

const romanColors: Record<string, string> = {
  I: theme.colors.romanI,
  V: theme.colors.romanV,
  X: theme.colors.romanX,
  L: theme.colors.romanL,
  C: theme.colors.romanC,
  D: theme.colors.romanD,
  M: theme.colors.romanM,
}

const CellContent = styled.span<{ $isPlayer: boolean; $isOldTile: boolean; $char?: string }>`
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.3rem;
  color: ${props => {
    if (props.$isPlayer) return '#fff'
    if (props.$isOldTile) return theme.colors.textMuted
    if (props.$char && romanColors[props.$char]) return romanColors[props.$char]
    return theme.colors.primary
  }};

  font-weight: bold;
  z-index: 1;

  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: 1.1rem;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 1rem;
  }
`

const LevelBadge = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.5rem;
  color: ${theme.colors.textMuted};
  background: rgba(255, 255, 255, 0.7);
  padding: 1px 3px;
  border-radius: 2px;
`

const PlayerIndicator = styled.div`
  position: absolute;
  inset: 2px;
  border: 3px solid #fff;
  border-radius: 50%;

  pointer-events: none;
`

const GridCellComponent = ({
  tile,
  isPlayer,
  isValidMove,
  isDark,
  currentLevel,
  onClick,
}: GridCellProps) => {
  const isShelter = !tile
  const isRoman = !!tile
  const isOldTile = tile ? tile.level < currentLevel : false

  return (
    <CellContainer
      $isPlayer={isPlayer}
      $isValidMove={isValidMove}
      $isDark={isDark}
      $isShelter={isShelter && !isPlayer}
      $isRoman={isRoman && !isPlayer}
      $isOldTile={isOldTile}
      onClick={isValidMove ? onClick : undefined}
    >
      {tile ? (
        <>
          <CellContent $isPlayer={isPlayer} $isOldTile={isOldTile && !isPlayer} $char={tile.char}>{tile.char}</CellContent>
          {isOldTile && !isPlayer && <LevelBadge>Lv{tile.level}</LevelBadge>}
        </>
      ) : isPlayer ? (
        <CellContent $isPlayer={true} $isOldTile={false}>◇</CellContent>
      ) : null}
      {isPlayer && <PlayerIndicator />}
    </CellContainer>
  )
}

export const GridCell = memo(GridCellComponent)
