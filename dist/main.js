import { createInitialState, move, resetGame } from './game.js';
import { GameRenderer } from './renderer.js';
class RomanPuzzleGame {
    constructor(containerId, viewportSize = 11) {
        this.history = []; // Undo 히스토리
        this.redoStack = []; // Redo 스택
        this.maxHistorySize = 100; // 최대 히스토리 크기
        this.state = createInitialState(viewportSize);
        this.previousLevel = this.state.level;
        this.renderer = new GameRenderer(containerId, {
            onMove: (direction) => this.handleMove(direction),
            onPlaceTile: (position, tile) => this.handlePlaceTile(position, tile),
            onReset: () => this.handleReset(),
            onUndo: () => this.handleUndo(),
            onRedo: () => this.handleRedo(),
        });
        this.render();
    }
    handleMove(direction) {
        const result = move(this.state, direction);
        if (result.state !== this.state) {
            // 이동 전 상태를 히스토리에 저장
            this.saveToHistory(this.state);
            // 새로운 이동 시 redo 스택 초기화
            this.redoStack = [];
            this.state = result.state;
            this.render(direction); // 이동 방향 전달
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
    saveToHistory(state) {
        // 상태 깊은 복사
        const stateCopy = {
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
    handleUndo() {
        if (this.history.length === 0) {
            return; // 되돌릴 상태 없음
        }
        // 현재 상태를 redo 스택에 저장
        this.saveToRedoStack(this.state);
        const previousState = this.history.pop();
        this.state = previousState;
        this.previousLevel = this.state.level;
        this.render();
    }
    saveToRedoStack(state) {
        const stateCopy = {
            ...state,
            tiles: new Map(state.tiles),
            playerPosition: { ...state.playerPosition },
        };
        this.redoStack.push(stateCopy);
    }
    handleRedo() {
        if (this.redoStack.length === 0) {
            return; // 다시 실행할 상태 없음
        }
        // 현재 상태를 히스토리에 저장
        this.saveToHistory(this.state);
        const nextState = this.redoStack.pop();
        this.state = nextState;
        this.previousLevel = this.state.level;
        this.render();
    }
    handlePlaceTile(position, tile) {
        // 자동 배치로 변경되어 수동 배치는 사용하지 않음
    }
    handleReset() {
        this.state = resetGame(this.state.viewportSize);
        this.previousLevel = this.state.level;
        this.render();
    }
    render(direction) {
        this.renderer.render(this.state, direction);
    }
    // 외부에서 상태 접근용
    getState() {
        return this.state;
    }
}
// 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    const game = new RomanPuzzleGame('game-container', 11);
    // 디버그용 전역 접근
    window.game = game;
});
//# sourceMappingURL=main.js.map