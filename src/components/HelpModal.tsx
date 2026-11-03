import styled from 'styled-components'
import { theme } from '../styles/theme'
import { fadeIn } from '../styles/animations'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease;
`

const Content = styled.div`
  background: #fff;
  border-radius: ${theme.sizes.borderRadius};
  padding: 20px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: ${theme.shadows.large};
`

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${theme.colors.backgroundAlt};
  border: 1px solid ${theme.colors.border};
  font-size: 1.2rem;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.dangerLight};
    color: ${theme.colors.danger};
  }
`

const Title = styled.h2`
  margin: 0 0 15px 0;
  color: ${theme.colors.primary};
  font-size: 1.3rem;
`

const Body = styled.div`
  font-size: 0.9rem;
  line-height: 1.6;
  color: ${theme.colors.text};

  p {
    margin: 8px 0;
  }

  hr {
    border: none;
    border-top: 1px solid ${theme.colors.border};
    margin: 12px 0;
  }

  strong {
    color: ${theme.colors.primary};
  }
`

const RomanExample = styled.span`
  font-weight: bold;
  color: ${theme.colors.primary};
  background: ${theme.colors.warningLight};
  padding: 2px 6px;
  border-radius: 4px;
`

const UpdateInfo = styled.section`
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${theme.colors.border};
  font-size: 0.8rem;
  line-height: 1.6;
  color: ${theme.colors.textLight};

  h3 {
    color: ${theme.colors.text};
    font-size: 0.95rem;
    margin-bottom: 6px;
  }

  p + p { margin-top: 6px; }
  time { font-variant-numeric: tabular-nums; }
`

const builtAt = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Seoul',
}).format(new Date(__BUILD_INFO__.builtAt))

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <Overlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <Content>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>3999 안내</Title>
        <UpdateInfo aria-labelledby="update-info-title">
          <h3 id="update-info-title">업데이트 정보</h3>
          <p>버전 {__BUILD_INFO__.version} · 빌드 {__BUILD_INFO__.commit}</p>
          <p>생성 시각: <time dateTime={__BUILD_INFO__.builtAt}>{builtAt}</time> (한국 시간)</p>
          <p>과거에서 다른 수를 두면 원래 경로를 보존한 새 전략이 생깁니다. 전략 목록에서 이름을 바꾸거나 고정하고, 두 전략을 비교할 수 있습니다.</p>
          <p>빌드 번호와 생성 시각으로 지금 보고 있는 배포본을 구분할 수 있습니다.</p>
        </UpdateInfo>
        <Title as="h3">게임 방법</Title>
        <Body>
          <p><strong>전략 탐색:</strong> 레벨과 턴을 되짚어 다른 수를 두세요. 새 전략을 열어도 기존 기록과 각 전략에서 보던 위치는 남습니다.</p>
          <p><strong>전략 비교:</strong> 같은 레벨 시작점이나 처음 다른 수에서 보드를 비교하세요. 모바일은 A/B 전환, 넓은 화면은 나란히 보기를 지원합니다. 비교 중 탐색은 플레이 기록을 바꾸지 않습니다.</p>
          <hr />
          <p><strong>목표:</strong> 로마숫자 퀘스트를 완료하며 최대한 높은 레벨 달성</p>
          <hr />
          <p><strong>퀘스트:</strong> 로마숫자를 순서대로 밟고 쉼터(빈칸)로 돌아가기</p>
          <p>예: 레벨 4 = <RomanExample>IV</RomanExample> → I 밟고 → V 밟고 → 쉼터 도착</p>
          <hr />
          <p><strong>타일:</strong> 퀘스트 중 빈칸을 밟으면 다음 글자가 자동 배치됨</p>
          <p>(로마숫자 타일을 밟을 때는 소모 없음, 빈칸일 때만 아이템 1개 소모)</p>
          <p><strong>레벨업:</strong> 쉼터 도착 시 레벨업 + 타일 아이템 1개 획득</p>
          <hr />
          <p><strong>팁:</strong> 타일을 효율적으로 재사용하세요!</p>
        </Body>
      </Content>
    </Overlay>
  )
}
