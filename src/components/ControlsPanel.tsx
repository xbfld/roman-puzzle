import styled from 'styled-components'
import { theme } from '../styles/theme'

interface ControlsPanelProps {
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onHelpOpen: () => void
}

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 500px;
  gap: 10px;
`

const ControlsInfo = styled.div`
  font-size: 0.7rem;
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
  display: flex;
  gap: 6px;
`

const Button = styled.button<{ $variant?: 'help' | 'danger' }>`
  padding: 8px 14px;
  border-radius: ${theme.sizes.borderRadiusSmall};
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: ${theme.shadows.small};

  ${props => {
    if (props.$variant === 'help') {
      return `
        width: 36px;
        height: 36px;
        padding: 0;
        border-radius: 50%;
        background: linear-gradient(145deg, #78909c 0%, #546e7a 100%);
        color: #fff;
        font-size: 1.1rem;
        font-weight: bold;

        &:hover {
          background: linear-gradient(145deg, #90a4ae 0%, #78909c 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(84, 110, 122, 0.4);
        }
      `
    }
    if (props.$variant === 'danger') {
      return `
        background: linear-gradient(145deg, #ef5350 0%, #e53935 100%);
        color: #fff;

        &:hover {
          background: linear-gradient(145deg, #f44336 0%, #d32f2f 100%);
          transform: translateY(-2px);
        }
      `
    }
    return `
      background: linear-gradient(145deg, #a0522d 0%, ${theme.colors.primary} 100%);
      color: #fff;

      &:hover {
        background: linear-gradient(145deg, #b8733d 0%, #a0522d 100%);
        transform: translateY(-2px);
      }
    `
  }}
`

export function ControlsPanel({ onUndo, onRedo, onReset, onHelpOpen }: ControlsPanelProps) {
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
        <Button $variant="help" onClick={onHelpOpen}>?</Button>
        <Button onClick={onUndo}>Undo</Button>
        <Button onClick={onRedo}>Redo</Button>
        <Button $variant="danger" onClick={onReset}>Reset</Button>
      </ButtonGroup>
    </Container>
  )
}
