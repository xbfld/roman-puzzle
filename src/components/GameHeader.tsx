import styled from 'styled-components'
import { theme } from '../styles/theme'
import { StatusBar } from './StatusBar'
import { GameState } from '../lib/types'

interface GameHeaderProps {
  state: GameState
}

const Container = styled.div`
  text-align: center;
  margin-bottom: 5px;
`

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${theme.colors.primary};
  margin: 0 0 5px 0;
  text-shadow: 2px 2px 4px rgba(139, 69, 19, 0.2);

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 2rem;
  }
`

export function GameHeader({ state }: GameHeaderProps) {
  return (
    <Container>
      <Title>3999</Title>
      <StatusBar state={state} />
    </Container>
  )
}
