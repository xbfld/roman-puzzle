export type RomanChar = 'I' | 'V' | 'X' | 'L' | 'C' | 'D' | 'M';
export type TileType = RomanChar | null;
export interface PlacedTile {
    char: RomanChar;
    level: number;
}
export interface Position {
    x: number;
    y: number;
}
export interface GameState {
    tiles: Map<string, PlacedTile>;
    playerPosition: Position;
    level: number;
    tileItems: number;
    questProgress: number;
    isOnQuest: boolean;
    currentQuest: string;
    viewportSize: number;
}
export type Direction = 'up' | 'down' | 'left' | 'right';
export interface GameTimeline {
    viewportSize: number;
    moves: Direction[];
    currentIndex: number;
    levelUpIndices: number[];
}
export interface SaveSlot {
    id: number;
    name: string;
    viewportSize: number;
    moves: string;
    currentIndex: number;
    level: number;
    updatedAt: number;
}
export interface LocalSaveData {
    version: number;
    slots: (SaveSlot | null)[];
    lastSlot: number;
}
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