import styled from 'styled-components'
import { theme } from '../styles/theme'

interface ControlsPanelProps {
  canUndo: boolean
  canRedo: boolean
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
  margin-bottom: 24px;
  summary { min-height: 44px; padding: 10px 0; color: ${theme.colors.textLight}; font-size: 0.85rem; cursor: pointer; }
  summary:focus-visible { outline: 2px solid ${theme.colors.primary}; outline-offset: 2px; }
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  &:disabled { background: ${theme.colors.backgroundAlt}; color: ${theme.colors.textDisabled}; border-color: ${theme.colors.border}; cursor: default; transform: none; }
`

export function ControlsPanel({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onHelpOpen,
  onCopyToClipboard,
  onPasteFromClipboard,
}: ControlsPanelProps) {
  return (
    <Container>
      <ButtonGroup>
        <Button onClick={onUndo} disabled={!canUndo} title="Z">되돌리기</Button>
        <Button onClick={onRedo} disabled={!canRedo} title="Y">다시 실행</Button>
        <Button $variant="help" onClick={onHelpOpen}>게임 방법</Button>
      </ButtonGroup>
      <ControlsInfo>
        <p><strong>Move:</strong> Arrow / WASD</p>
        <p><strong>Undo/Redo:</strong> Z / Y (Shift: 레벨)</p>
        <p><strong>Slot:</strong> 1-3 (Shift: 저장)</p>
      </ControlsInfo>
      <MobileInfo>
        <p>보드의 위·아래·왼쪽·오른쪽 영역을 눌러도 이동해요.</p>
      </MobileInfo>
      <details>
        <summary>기록 복사 · 불러오기 · 새 전략</summary>
        <ButtonGroup>
        <Button $variant="clipboard" onClick={onCopyToClipboard} title="클립보드로 복사">복사</Button>
        <Button $variant="clipboard" onClick={onPasteFromClipboard} title="클립보드에서 불러오기">불러오기</Button>
        <Button $variant="help" onClick={onReset}>새 전략</Button>
        </ButtonGroup>
      </details>
    </Container>
  )
}
