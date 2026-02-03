import { GameState, Position, RomanChar, Direction } from './types.js';
import { createInitialState, move, resetGame, MoveResult } from './game.js';
import { GameRenderer } from './renderer.js';

class RomanPuzzleGame {
  private state: GameState;
  private renderer: GameRenderer;
  private previousLevel: number;
  private history: GameState[] = [];  // Undo 히스토리
  private redoStack: GameState[] = [];  // Redo 스택
  private maxHistorySize: number = 100;  // 최대 히스토리 크기

  constructor(containerId: string, viewportSize: number = 11) {
    this.state = createInitialState(viewportSize);
    this.previousLevel = this.state.level;

    this.renderer = new GameRenderer(containerId, {
      onMove: (direction) => this.handleMove(direction),
      onPlaceTile: (position, tile) => this.handlePlaceTile(position, tile),
      onReset: () => this.handleReset(),
      onUndo: () => this.handleUndo(),
      onRedo: () => this.handleRedo(),
      onSave: () => this.handleSave(),
      onLoad: () => this.handleLoad(),
    });

    this.render();
  }

  private handleMove(direction: Direction): void {
    const result: MoveResult = move(this.state, direction);

    if (result.state !== this.state) {
      // 이동 전 상태를 히스토리에 저장
      this.saveToHistory(this.state);
      // 새로운 이동 시 redo 스택 초기화
      this.redoStack = [];

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

    // 현재 상태를 redo 스택에 저장
    this.saveToRedoStack(this.state);

    const previousState = this.history.pop()!;
    this.state = previousState;
    this.previousLevel = this.state.level;
    this.render();
  }

  private saveToRedoStack(state: GameState): void {
    const stateCopy: GameState = {
      ...state,
      tiles: new Map(state.tiles),
      playerPosition: { ...state.playerPosition },
    };
    this.redoStack.push(stateCopy);
  }

  private handleRedo(): void {
    if (this.redoStack.length === 0) {
      return;  // 다시 실행할 상태 없음
    }

    // 현재 상태를 히스토리에 저장
    this.saveToHistory(this.state);

    const nextState = this.redoStack.pop()!;
    this.state = nextState;
    this.previousLevel = this.state.level;
    this.render();
  }

  private serializeState(state: GameState): object {
    return {
      ...state,
      tiles: Array.from(state.tiles.entries()),
    };
  }

  private deserializeState(data: any): GameState {
    return {
      ...data,
      tiles: new Map(data.tiles),
      playerPosition: { ...data.playerPosition },
    };
  }

  private async handleSave(): Promise<void> {
    const saveData = {
      version: 1,
      state: this.serializeState(this.state),
      history: this.history.map(s => this.serializeState(s)),
      redoStack: this.redoStack.map(s => this.serializeState(s)),
    };

    const json = JSON.stringify(saveData);

    try {
      await navigator.clipboard.writeText(json);
      this.renderer.showMessage('저장됨!');
    } catch (e) {
      console.error('클립보드 복사 실패:', e);
      this.renderer.showMessage('저장 실패');
    }
  }

  private async handleLoad(): Promise<void> {
    try {
      const json = await navigator.clipboard.readText();
      const saveData = JSON.parse(json);

      if (saveData.version !== 1) {
        throw new Error('지원하지 않는 버전');
      }

      this.state = this.deserializeState(saveData.state);
      this.history = saveData.history.map((s: any) => this.deserializeState(s));
      this.redoStack = saveData.redoStack.map((s: any) => this.deserializeState(s));
      this.previousLevel = this.state.level;
      this.render();
      this.renderer.showMessage('불러옴!');
    } catch (e) {
      console.error('불러오기 실패:', e);
      this.renderer.showMessage('불러오기 실패');
    }
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
