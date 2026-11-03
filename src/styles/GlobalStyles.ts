import { createGlobalStyle } from 'styled-components'
import { theme } from './theme'

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: ${theme.colors.background};
    line-height: 1.5;
    color: ${theme.colors.text};
    min-height: 100vh;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px 32px;

    @media (max-width: ${theme.breakpoints.tablet}) {
      padding: 20px 12px 28px;
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;

    &:focus-visible {
      outline: 2px solid ${theme.colors.primary};
      outline-offset: 2px;
    }
  }

  :where(a, input):focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 4px;
  }

  ::selection {
    background: ${theme.colors.shelterDark};
    color: ${theme.colors.text};
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  /* 스크롤바 스타일 */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.backgroundAlt};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.shelterDark};
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.primary};
  }
`
