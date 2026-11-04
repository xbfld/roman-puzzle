import { solveAhead } from '../lib/solver'
import type { GameState } from '../lib/types'

self.onmessage = (event: MessageEvent<{ state: GameState }>) => {
  try {
    const result = solveAhead(event.data.state, {
      onProgress: progress => self.postMessage({ type: 'progress', progress }),
    })
    self.postMessage({ type: 'result', result })
  } catch (error) {
    console.error('추천 경로 탐색 실패', error)
    self.postMessage({ type: 'error', message: '경로를 탐색하지 못했습니다. 현재 위치에서 다시 시도해 주세요.' })
  }
}
