import { keyframes } from 'styled-components'

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`

export const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(139, 69, 19, 0.3); }
  50% { box-shadow: 0 0 15px rgba(139, 69, 19, 0.6); }
`

export const playerPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(139, 69, 19, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(139, 69, 19, 0.8);
  }
`

export const tentPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`

export const levelUpFloat = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(1.5);
  }
`

export const autoTileFloat = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(1.2);
  }
`

export const messageFloat = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-30px);
  }
`

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

export const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`
