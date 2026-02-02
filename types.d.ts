export type RomanChar = 'I' | 'V' | 'X' | 'L' | 'C' | 'D' | 'M';
export type TileType = RomanChar | null;
export interface Position {
    x: number;
    y: number;
}
export interface GameState {
    tiles: Map<string, RomanChar>;
    playerPosition: Position;
    level: number;
    tileItems: number;
    questProgress: number;
    isOnQuest: boolean;
    currentQuest: string;
    viewportSize: number;
}
export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameEvent = {
    type: 'move';
    direction: Direction;
} | {
    type: 'placeTile';
    position: Position;
    tile: RomanChar;
} | {
    type: 'reset';
};
export declare function posToKey(pos: Position): string;
export declare function keyToPos(key: string): Position;
//# sourceMappingURL=types.d.ts.map