import styled from 'styled-components'
import { theme } from '../styles/theme'

interface ControlsPanelProps {
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onHelpOpen: () => void
  onCopyToClipboard: () => void
  onPasteFromClipboard: () => void
}

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  flex-direction: column;
  width: 100%;
  max-width: 540px;
  gap: 10px;
`

const ControlsInfo = styled.div`
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
  line-height: 1.4;

  p {
    margin: 2px 0;
  }

  strong {
    color: ${theme.colors.textLight};
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    display: none;
  }
`

const MobileInfo = styled.div`
  font-size: 0.7rem;
  color: ${theme.colors.textMuted};
  display: none;

  @media (max-width: ${theme.breakpoints.tablet}) {
    display: block;
  }
`

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;

  @media (max-width: ${theme.breakpoints.tablet}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`

const Button = styled.button<{ $variant?: 'help' | 'danger' | 'clipboard' }>`
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  background: ${props => props.$variant ? 'transparent' : theme.colors.primary};
  color: ${props => props.$variant === 'danger' ? theme.colors.danger : props.$variant ? theme.colors.primary : '#fff'};
  border: 1px solid ${props => props.$variant ? theme.colors.border : theme.colors.primary};
  transition: background 150ms ease;

  &:hover {
    background: ${props => props.$variant === 'danger' ? theme.colors.dangerLight : props.$variant ? theme.colors.backgroundAlt : theme.colors.primaryLight};
  }

  &:active { transform: translateY(1px); }
`

export function ControlsPanel({
  onUndo,
  onRedo,
  onReset,
  onHelpOpen,
  onCopyToClipboard,
  onPasteFromClipboard,
}: ControlsPanelProps) {
  return (
    <Container>
      <ControlsInfo>
        <p><strong>Move:</strong> Arrow / WASD</p>
        <p><strong>Undo/Redo:</strong> Z / Y (Shift: 레벨)</p>
        <p><strong>Slot:</strong> 1-3 (Shift: 저장)</p>
      </ControlsInfo>
      <MobileInfo>
        <p><strong>터치로 이동</strong></p>
      </MobileInfo>
      <ButtonGroup>
        <Button $variant="help" onClick={onHelpOpen} aria-label="게임 방법">?</Button>
        <Button $variant="clipboard" onClick={onCopyToClipboard} title="클립보드로 복사">복사</Button>
        <Button $variant="clipboard" onClick={onPasteFromClipboard} title="클립보드에서 불러오기">불러오기</Button>
        <Button onClick={onUndo}>Undo</Button>
        <Button onClick={onRedo}>Redo</Button>
        <Button $variant="help" onClick={onReset}>새 전략</Button>
      </ButtonGroup>
    </Container>
  )
}
