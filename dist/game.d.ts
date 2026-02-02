import { GameState, Position, Direction, RomanChar } from './types.js';
export declare function createInitialState(viewportSize?: number): GameState;
export declare function getNextQuest(level: number): string;
export declare function getCurrentRequiredChar(state: GameState): RomanChar | null;
export declare function getTileAt(state: GameState, pos: Position): RomanChar | null;
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
//# sourceMappingURL=game.d.ts.map