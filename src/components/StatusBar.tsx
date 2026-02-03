import styled, { css } from 'styled-components'
import { theme } from '../styles/theme'
import { pulse } from '../styles/animations'
import { GameState } from '../lib/types'
import { getGameStatus } from '../lib/game'

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

const CharDone = styled.span`
  color: ${theme.colors.success};
  background: ${theme.colors.successLight};
  padding: 1px 4px;
  border-radius: 3px;
  position: relative;
  font-size: 0.9rem;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 1px;
    background: ${theme.colors.success};
  }
`

const CharCurrent = styled.span`
  color: #fff;
  background: ${theme.colors.warning};
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.9rem;
  animation: ${pulse} 1s infinite;
`

const CharPending = styled.span`
  color: ${theme.colors.textDisabled};
  background: #f0f0f0;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.9rem;
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

    const chars = state.currentQuest.split('')
    return (
      <>
        {chars.map((char, i) => {
          if (i < status.questProgress) {
            return <CharDone key={i}>{char}</CharDone>
          }
          if (i === status.questProgress && status.isOnQuest) {
            return <CharCurrent key={i}>{char}</CharCurrent>
          }
          return <CharPending key={i}>{char}</CharPending>
        })}
        {status.isComplete && <ReturnHint>→⛺</ReturnHint>}
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
