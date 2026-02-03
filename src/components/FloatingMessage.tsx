import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { theme } from '../styles/theme'
import { levelUpFloat, messageFloat } from '../styles/animations'

interface FloatingMessageProps {
  message: string | null
  type?: 'levelUp' | 'message'
}

const LevelUpText = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  font-weight: bold;
  color: ${theme.colors.success};
  text-shadow: 0 2px 10px rgba(76, 175, 80, 0.5);
  pointer-events: none;
  z-index: 100;
  animation: ${levelUpFloat} 1.5s ease-out forwards;
`

const MessageText = styled.div`
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1rem;
  font-weight: 500;
  color: ${theme.colors.text};
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: ${theme.sizes.borderRadius};
  box-shadow: ${theme.shadows.medium};
  pointer-events: none;
  z-index: 100;
  animation: ${messageFloat} 1s ease-out forwards;
`

export function FloatingMessage({ message, type = 'message' }: FloatingMessageProps) {
  const [visible, setVisible] = useState(false)
  const [displayMessage, setDisplayMessage] = useState<string | null>(null)

  useEffect(() => {
    if (message) {
      setDisplayMessage(message)
      setVisible(true)

      const timer = setTimeout(() => {
        setVisible(false)
      }, type === 'levelUp' ? 1500 : 1000)

      return () => clearTimeout(timer)
    }
  }, [message, type])

  if (!visible || !displayMessage) return null

  if (type === 'levelUp') {
    return <LevelUpText>{displayMessage}</LevelUpText>
  }

  return <MessageText>{displayMessage}</MessageText>
}
