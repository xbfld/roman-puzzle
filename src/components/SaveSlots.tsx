import { useState, useCallback } from 'react'
import styled from 'styled-components'
import { theme } from '../styles/theme'
import { SaveSlot, SaveSlotType } from '../lib/types'

interface SaveSlotsProps {
  autoSlots: (SaveSlot | null)[]
  manualSlots: (SaveSlot | null)[]
  currentAutoSlot: SaveSlot | null
  onSave: (slotId: number, type: SaveSlotType) => void
  onLoad: (slotId: number, type: SaveSlotType) => void
  onDelete: (slotId: number, type: SaveSlotType) => void
}

const Container = styled.div`
  margin-bottom: 10px;
  padding: 8px 10px;
  background: ${theme.colors.backgroundAlt};
  border-radius: ${theme.sizes.borderRadius};
  border: 1px solid ${theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SlotGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
`

const SlotLabel = styled.div`
  font-size: 0.6rem;
  color: ${theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 42px;
  text-align: right;
  flex-shrink: 0;
`

const Slots = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
`

const SlotButton = styled.button<{
  $hasData: boolean
  $isAuto: boolean
  $isCurrent: boolean
  $isActive: boolean
}>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  width: 100%;
  background: ${props => {
    if (props.$isCurrent) return theme.colors.warningLight
    if (props.$isAuto) return props.$hasData ? '#e3f2fd' : theme.colors.autoSlotBg
    return props.$hasData ? '#f0fff0' : '#fff'
  }};
  border: 1px solid ${props => {
    if (props.$isCurrent) return '#ffb74d'
    if (props.$isAuto) return props.$hasData ? '#64b5f6' : '#b0bec5'
    return props.$hasData ? theme.colors.success : '#ddd'
  }};
  border-radius: ${theme.sizes.borderRadiusSmall};
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.7rem;

  ${props => props.$isActive && `
    border-color: ${theme.colors.warning} !important;
    background: ${theme.colors.warningLight} !important;
  `}

  &:hover {
    border-color: ${props => props.$isAuto ? '#78909c' : theme.colors.primary};
  }
`

const SlotNum = styled.span<{ $isAuto: boolean; $isCurrent: boolean }>`
  font-weight: bold;
  color: ${props => {
    if (props.$isCurrent) return theme.colors.warningDark
    if (props.$isAuto) return theme.colors.autoSlot
    return theme.colors.primary
  }};
`

const SlotInfo = styled.span<{ $hasData: boolean; $isCurrent: boolean }>`
  color: ${props => {
    if (props.$isCurrent) return theme.colors.warningDark
    return props.$hasData ? theme.colors.successDark : theme.colors.textDisabled
  }};
  font-weight: ${props => props.$hasData ? '500' : 'normal'};
`

const SlotActions = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  gap: 2px;
  margin-left: 4px;
`

const ActionButton = styled.button<{ $variant: 'load' | 'delete' }>`
  padding: 2px 6px;
  font-size: 0.6rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s ease;
  background: ${props => props.$variant === 'load' ? theme.colors.infoLight : theme.colors.dangerLight};
  color: ${props => props.$variant === 'load' ? theme.colors.info : theme.colors.danger};

  &:hover {
    background: ${props => props.$variant === 'load' ? '#bbdefb' : '#ffcdd2'};
  }
`

export function SaveSlots({
  autoSlots,
  manualSlots,
  currentAutoSlot,
  onSave,
  onLoad,
  onDelete,
}: SaveSlotsProps) {
  const [activeSlot, setActiveSlot] = useState<string | null>(null)

  const handleSlotClick = useCallback((slotId: number, type: SaveSlotType, hasData: boolean, isCurrent: boolean) => {
    const key = `${type}-${slotId}`

    // 수동슬롯: 빈 슬롯 클릭 시 바로 저장
    if (type === 'manual' && !hasData) {
      onSave(slotId, type)
      return
    }

    // 데이터가 있으면 액션 버튼 토글
    if (hasData || isCurrent) {
      setActiveSlot(prev => prev === key ? null : key)

      // 3초 후 자동 닫기
      setTimeout(() => {
        setActiveSlot(prev => prev === key ? null : prev)
      }, 3000)
    }
  }, [onSave])

  const handleLoad = useCallback((slotId: number, type: SaveSlotType, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveSlot(null)
    onLoad(slotId, type)
  }, [onLoad])

  const handleDelete = useCallback((slotId: number, type: SaveSlotType, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveSlot(null)
    onDelete(slotId, type)
  }, [onDelete])

  const renderSlot = (
    slotId: number,
    type: SaveSlotType,
    slot: SaveSlot | null,
    label: string,
    isCurrent: boolean = false
  ) => {
    const key = `${type}-${slotId}`
    const isActive = activeSlot === key
    const hasData = !!slot || isCurrent

    return (
      <SlotButton
        key={key}
        $hasData={hasData}
        $isAuto={type === 'auto'}
        $isCurrent={isCurrent}
        $isActive={isActive}
        onClick={() => handleSlotClick(slotId, type, hasData, isCurrent)}
      >
        <SlotNum $isAuto={type === 'auto'} $isCurrent={isCurrent}>{label}</SlotNum>
        <SlotInfo $hasData={hasData} $isCurrent={isCurrent}>
          {slot ? `Lv${slot.level}` : isCurrent && currentAutoSlot ? `Lv${currentAutoSlot.level}` : '-'}
        </SlotInfo>
        <SlotActions $visible={isActive}>
          <ActionButton $variant="load" onClick={(e) => handleLoad(slotId, type, e)}>Load</ActionButton>
          {!isCurrent && <ActionButton $variant="delete" onClick={(e) => handleDelete(slotId, type, e)}>Del</ActionButton>}
        </SlotActions>
      </SlotButton>
    )
  }

  return (
    <Container>
      <SlotGroup>
        <SlotLabel>Auto</SlotLabel>
        <Slots>
          {renderSlot(-1, 'auto', currentAutoSlot, '▶', true)}
          {autoSlots.map((slot, i) => renderSlot(i, 'auto', slot, `${i + 1}`))}
        </Slots>
      </SlotGroup>
      <SlotGroup>
        <SlotLabel>Manual</SlotLabel>
        <Slots>
          {manualSlots.map((slot, i) => renderSlot(i, 'manual', slot, `${i + 1}`))}
        </Slots>
      </SlotGroup>
    </Container>
  )
}
