import styled, { css } from 'styled-components'
import { theme } from '../styles/theme'
import { pulse } from '../styles/animations'
import { GameState, RomanChar } from '../lib/types'
import { getGameStatus } from '../lib/game'

const romanColors: Record<string, string> = {
  I: theme.colors.romanI,
  V: theme.colors.romanV,
  X: theme.colors.romanX,
  L: theme.colors.romanL,
  C: theme.colors.romanC,
  D: theme.colors.romanD,
  M: theme.colors.romanM,
}

interface StatusBarProps {
  state: GameState
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  height: 60px;
  align-items: center;
`

const StatusItem = styled.div<{ $isQuest?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${theme.colors.backgroundAlt};
  padding: 8px 12px;
  border-radius: 8px;
  min-width: 60px;
  border: 1px solid ${theme.colors.border};
  height: 50px;
  justify-content: center;

  ${props => props.$isQuest && css`
    flex: 1;
    max-width: 200px;
    min-width: 100px;
  `}
`

const StatusLabel = styled.span`
  font-size: 0.65rem;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 2px;
`

const StatusValue = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${theme.colors.text};
`

const QuestValue = styled.span`
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: nowrap;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
`

const CharBase = styled.span<{ $color: string }>`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85rem;
  font-weight: bold;
  color: ${props => props.$color};
  background: ${props => `${props.$color}18`};
  border: 1px solid ${props => `${props.$color}40`};
`

const CharDone = styled(CharBase)`
  opacity: 0.5;
  text-decoration: line-through;
`

const CharCurrent = styled(CharBase)`
  animation: ${pulse} 1s infinite;
  box-shadow: 0 0 8px ${props => `${props.$color}60`};
`

const CharPending = styled(CharBase)`
  opacity: 0.4;
  background: #f5f5f5;
  border-color: #ddd;
  color: #999;
`

const ReturnHint = styled.span`
  color: ${theme.colors.success};
  font-size: 0.7rem;
  margin-left: 4px;
  animation: ${pulse} 1s infinite;
`

export function StatusBar({ state }: StatusBarProps) {
  const status = getGameStatus(state)

  const renderQuestProgress = () => {
    if (!status.isOnQuest && !state.currentQuest) {
      return '-'
    }

    const chars = state.currentQuest.split('') as RomanChar[]
    return (
      <>
        {chars.map((char, i) => {
          const color = romanColors[char] || theme.colors.primary
          if (i < status.questProgress) {
            return <CharDone key={i} $color={color}>{char}</CharDone>
          }
          if (i === status.questProgress && status.isOnQuest) {
            return <CharCurrent key={i} $color={color}>{char}</CharCurrent>
          }
          return <CharPending key={i} $color={color}>{char}</CharPending>
        })}
        {status.isComplete && <ReturnHint>→◇</ReturnHint>}
      </>
    )
  }

  return (
    <Container>
      <StatusItem>
        <StatusLabel>Level</StatusLabel>
        <StatusValue>{status.level}</StatusValue>
      </StatusItem>
      <StatusItem>
        <StatusLabel>Tiles</StatusLabel>
        <StatusValue>{status.tileItems}</StatusValue>
      </StatusItem>
      <StatusItem $isQuest>
        <StatusLabel>Quest</StatusLabel>
        <QuestValue>{renderQuestProgress()}</QuestValue>
      </StatusItem>
    </Container>
  )
}
