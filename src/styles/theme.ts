export const theme = {
  colors: {
    primary: '#75462f',
    primaryLight: '#906044',
    success: '#4caf50',
    successDark: '#2e7d32',
    successLight: '#e8f5e9',
    warning: '#ff9800',
    warningDark: '#f57c00',
    warningLight: '#fff8e1',
    danger: '#c62828',
    dangerLight: '#ffebee',
    info: '#1976d2',
    infoLight: '#e3f2fd',

    shelter: '#e8e0d5',
    shelterDark: '#d4c8b8',
    roman: '#fff8e1',
    romanBorder: '#ffcc80',

    // 로마숫자 무지개색 (I, V, X, L, C, D, M)
    romanI: '#b6322c',  // 빨강
    romanV: '#975000',  // 주황
    romanX: '#806400',  // 노랑
    romanL: '#35723c',  // 초록
    romanC: '#2466a1',  // 파랑
    romanD: '#5e35b1',  // 남색
    romanM: '#8e24aa',  // 보라

    text: '#302b26',
    textLight: '#635b51',
    textMuted: '#71665b',
    textDisabled: '#756b60',

    background: '#faf7f2',
    backgroundAlt: '#f2ede5',
    border: '#e8e0d5',
    borderDark: '#d0dce8',

    player: '#8b4513',
    playerGlow: 'rgba(139, 69, 19, 0.4)',

    autoSlot: '#607d8b',
    autoSlotBg: '#eceff1',
  },

  sizes: {
    cellMobile: '36px',
    cellTablet: '42px',
    cellDesktop: '48px',
    gridGap: '3px',
    borderRadius: '8px',
    borderRadiusSmall: '4px',
  },

  breakpoints: {
    mobile: '400px',
    tablet: '500px',
  },

  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.1)',
    medium: '0 2px 8px rgba(0,0,0,0.15)',
    large: '0 4px 12px rgba(0,0,0,0.2)',
  },
}

export type Theme = typeof theme
