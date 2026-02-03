import { GameState, Position, Direction, RomanChar, PlacedTile, GameTimeline } from './types.js';
export declare function createInitialState(viewportSize?: number): GameState;
export declare function getNextQuest(level: number): string;
export declare function getCurrentRequiredChar(state: GameState): RomanChar | null;
export declare function getTileAt(state: GameState, pos: Position): RomanChar | null;
export declare function getPlacedTileAt(state: GameState, pos: Position): PlacedTile | null;
export declare function getNewPosition(pos: Position, direction: Direction): Position;
export declare function isAdjacent(pos1: Position, pos2: Position): boolean;
export declare function canMoveTo(state: GameState, targetPos: Position): boolean;
export declare function getValidMoves(state: GameState): Position[];
export interface MoveResult {
    state: GameState;
    leveledUp: boolean;
    autoPlacedTile: RomanChar | null;
}
export declare function move(state: GameState, direction: Direction): MoveResult;
export declare function placeTile(state: GameState, position: Position, tile: RomanChar): GameState | null;
export declare function resetGame(viewportSize?: number): GameState;
export declare function isGameOver(state: GameState): boolean;
export interface GameStatus {
    level: number;
    tileItems: number;
    currentQuest: string;
    questProgress: number;
    isOnQuest: boolean;
    requiredChar: RomanChar | null;
    isComplete: boolean;
    isGameOver: boolean;
}
export declare function getGameStatus(state: GameState): GameStatus;
export declare function createTimeline(viewportSize?: number): GameTimeline;
export declare function getStateAtIndex(timeline: GameTimeline, targetIndex: number): GameState;
export declare function addMoveToTimeline(timeline: GameTimeline, direction: Direction, currentState: GameState): {
    timeline: GameTimeline;
    moveResult: MoveResult;
};
export declare function undoTimeline(timeline: GameTimeline): GameTimeline;
export declare function redoTimeline(timeline: GameTimeline): GameTimeline;
export declare function strongUndoTimeline(timeline: GameTimeline): GameTimeline;
export declare function strongRedoTimeline(timeline: GameTimeline): GameTimeline;
export declare function seekTimeline(timeline: GameTimeline, targetIndex: number): GameTimeline;
//# sourceMappingURL=game.d.ts.map