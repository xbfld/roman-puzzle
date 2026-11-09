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
  margin-bottom: 12px;
`

const Title = styled.h1`
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 2.5rem;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: ${theme.colors.primary};
  margin: 0;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 2.25rem;
  }
`

const DocumentLink = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding: 8px 16px;
  margin: 0 0 8px;
  font-size: 0.9rem;
  text-decoration: underline;
  text-underline-offset: 4px;
`

export function GameHeader({ state }: GameHeaderProps) {
  return (
    <Container>
      <Title>3999</Title>
      <DocumentLink href="./docs/index.html">문서 · 탐색 방법</DocumentLink>
      <StatusBar state={state} />
    </Container>
  )
}
