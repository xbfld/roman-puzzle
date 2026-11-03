import styled from 'styled-components'
import { theme } from '../styles/theme'
import { StatusBar } from './StatusBar'
import { GameState } from '../lib/types'

interface GameHeaderProps {
  state: GameState
}

const Container = styled.div`
  width: 100%;
  text-align: center;
  margin-bottom: 20px;
`

const Title = styled.h1`
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 4rem;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: ${theme.colors.primary};
  margin: 0 0 24px;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 3.5rem;
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
