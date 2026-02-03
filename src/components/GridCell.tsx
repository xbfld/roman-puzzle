import { memo } from 'react'
import styled, { css } from 'styled-components'
import { theme } from '../styles/theme'
import { playerPulse, glow } from '../styles/animations'
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
  transition: all 0.15s ease;

  ${props => props.$isShelter && css`
    background: ${props.$isDark
      ? 'linear-gradient(135deg, #d8cfc2 0%, #c8bfb2 100%)'
      : `linear-gradient(135deg, ${theme.colors.shelter} 0%, #f0e8dd 100%)`};
    border: 1px solid ${theme.colors.shelterDark};
  `}

  ${props => props.$isRoman && css`
    background: ${props.$isOldTile
      ? 'linear-gradient(135deg, #e8e0d5 0%, #d8d0c5 100%)'
      : `linear-gradient(135deg, ${theme.colors.roman} 0%, #ffe0b2 100%)`};
    border: 2px solid ${props.$isOldTile ? '#c0b8a8' : theme.colors.romanBorder};
  `}

  ${props => props.$isPlayer && css`
    background: linear-gradient(145deg, #a0522d 0%, ${theme.colors.primary} 100%);
    border: 2px solid #6b3410;
    box-shadow: 0 0 15px ${theme.colors.playerGlow};
    animation: ${playerPulse} 1.5s ease-in-out infinite;
    z-index: 10;
  `}

  ${props => props.$isValidMove && !props.$isPlayer && css`
    animation: ${glow} 1s ease-in-out infinite;
    cursor: pointer;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(139, 69, 19, 0.6);
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
  font-size: 1.2rem;
  color: ${props => {
    if (props.$isPlayer) return '#fff'
    if (props.$isOldTile) return '#aaa'
    if (props.$char && romanColors[props.$char]) return romanColors[props.$char]
    return theme.colors.primary
  }};
  text-shadow: ${props => props.$isPlayer ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'};
  font-weight: bold;

  @media (max-width: ${theme.breakpoints.tablet}) {
    font-size: 1rem;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 0.9rem;
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

const GridCellComponent = ({
  tile,
  isPlayer,
  isValidMove,
  isDark,
  currentLevel,
  onClick,
}: GridCellProps) => {
  const isShelter = !tile && !isPlayer
  const isRoman = !!tile && !isPlayer
  const isOldTile = tile ? tile.level < currentLevel : false

  return (
    <CellContainer
      $isPlayer={isPlayer}
      $isValidMove={isValidMove}
      $isDark={isDark}
      $isShelter={isShelter}
      $isRoman={isRoman}
      $isOldTile={isOldTile}
      onClick={isValidMove ? onClick : undefined}
    >
      {isPlayer ? (
        <CellContent $isPlayer={true} $isOldTile={false}>●</CellContent>
      ) : tile ? (
        <>
          <CellContent $isPlayer={false} $isOldTile={isOldTile} $char={tile.char}>{tile.char}</CellContent>
          {isOldTile && <LevelBadge>Lv{tile.level}</LevelBadge>}
        </>
      ) : null}
    </CellContainer>
  )
}

export const GridCell = memo(GridCellComponent)
