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
    background: linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%);
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
    padding: 10px;
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
