import { GameState, Position, RomanChar } from './types.js';
export declare class GameRenderer {
    private container;
    private statusContainer;
    private gridContainer;
    private levelUpContainer;
    private lastMoveDirection;
    private onMove;
    private onReset;
    private onUndo;
    constructor(containerId: string, callbacks: {
        onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
        onPlaceTile: (position: Position, tile: RomanChar) => void;
        onReset: () => void;
        onUndo: () => void;
    });
    private setupKeyboardControls;
    render(state: GameState, moveDirection?: 'up' | 'down' | 'left' | 'right'): void;
    private renderStatus;
    private getQuestProgressDisplay;
    private renderGrid;
    private handleCellClick;
    showLevelUp(level: number): void;
    showAutoTilePlacement(tile: RomanChar): void;
}
//# sourceMappingURL=renderer.d.ts.map