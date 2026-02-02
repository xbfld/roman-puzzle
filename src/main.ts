import { GameState, Position, RomanChar, Direction } from './types.js';
import { createInitialState, move, resetGame, MoveResult } from './game.js';
import { GameRenderer } from './renderer.js';

class RomanPuzzleGame {
  private state: GameState;
  private renderer: GameRenderer;
  private previousLevel: number;
  private history: GameState[] = [];  // Undo 히스토리
  private maxHistorySize: number = 100;  // 최대 히스토리 크기

  constructor(containerId: string, viewportSize: number = 11) {
    this.state = createInitialState(viewportSize);
    this.previousLevel = this.state.level;

    this.renderer = new GameRenderer(containerId, {
      onMove: (direction) => this.handleMove(direction),
      onPlaceTile: (position, tile) => this.handlePlaceTile(position, tile),
      onReset: () => this.handleReset(),
      onUndo: () => this.handleUndo(),
    });

    this.render();
  }

  private handleMove(direction: Direction): void {
    const result: MoveResult = move(this.state, direction);

    if (result.state !== this.state) {
      // 이동 전 상태를 히스토리에 저장
      this.saveToHistory(this.state);

      this.state = result.state;
      this.render(direction);  // 이동 방향 전달

      // 타일 자동 배치 표시
      if (result.autoPlacedTile) {
        this.renderer.showAutoTilePlacement(result.autoPlacedTile);
      }

      // 레벨업 시 알림
      if (result.leveledUp) {
        this.renderer.showLevelUp(this.state.level);
      }

      this.previousLevel = this.state.level;
    }
  }

  private saveToHistory(state: GameState): void {
    // 상태 깊은 복사
    const stateCopy: GameState = {
      ...state,
      tiles: new Map(state.tiles),
      playerPosition: { ...state.playerPosition },
    };
    this.history.push(stateCopy);

    // 히스토리 크기 제한
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  private handleUndo(): void {
    if (this.history.length === 0) {
      return;  // 되돌릴 상태 없음
    }

    const previousState = this.history.pop()!;
    this.state = previousState;
    this.previousLevel = this.state.level;
    this.render();
  }

  private handlePlaceTile(position: Position, tile: RomanChar): void {
    // 자동 배치로 변경되어 수동 배치는 사용하지 않음
  }

  private handleReset(): void {
    this.state = resetGame(this.state.viewportSize);
    this.previousLevel = this.state.level;
    this.render();
  }

  private render(direction?: Direction): void {
    this.renderer.render(this.state, direction);
  }

  // 외부에서 상태 접근용
  getState(): GameState {
    return this.state;
  }
}

// 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
  const game = new RomanPuzzleGame('game-container', 11);

  // 디버그용 전역 접근
  (window as any).game = game;
});
