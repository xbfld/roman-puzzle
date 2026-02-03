import { GameState, Position, RomanChar, GameTimeline } from './types.js';
export declare class GameRenderer {
    private container;
    private statusContainer;
    private gridContainer;
    private levelUpContainer;
    private timelineContainer;
    private lastMoveDirection;
    private currentState;
    private currentTimeline;
    private onMove;
    private onReset;
    private onUndo;
    private onRedo;
    private onStrongUndo;
    private onStrongRedo;
    private onSeek;
    private onSave;
    private onLoad;
    constructor(containerId: string, callbacks: {
        onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
        onPlaceTile: (position: Position, tile: RomanChar) => void;
        onReset: () => void;
        onUndo: () => void;
        onRedo: () => void;
        onStrongUndo: () => void;
        onStrongRedo: () => void;
        onSeek: (index: number) => void;
        onSave: () => void;
        onLoad: () => void;
    });
    private setupTouchControls;
    private setupKeyboardControls;
    render(state: GameState, timeline?: GameTimeline, moveDirection?: 'up' | 'down' | 'left' | 'right'): void;
    private renderTimeline;
    private copyResult;
    private renderStatus;
    private getQuestProgressDisplay;
    private renderGrid;
    private handleCellClick;
    showLevelUp(level: number): void;
    showAutoTilePlacement(tile: RomanChar): void;
    showMessage(message: string): void;
}
//# sourceMappingURL=renderer.d.ts.map