// 로마숫자 글자 타입
export type RomanChar = 'I' | 'V' | 'X' | 'L' | 'C' | 'D' | 'M';

// 타일 타입: null = 쉼터(빈칸), RomanChar = 로마숫자 타일
export type TileType = RomanChar | null;

// 배치된 타일 정보 (문자 + 배치 레벨)
export interface PlacedTile {
  char: RomanChar;
  level: number;
}

// 위치 인터페이스 (무한 격자용 - 음수 좌표 가능)
export interface Position {
  x: number;
  y: number;
}

// 게임 상태 인터페이스
export interface GameState {
  // 무한 격자: Map으로 타일 저장 (key: "x,y", value: PlacedTile)
  tiles: Map<string, PlacedTile>;
  playerPosition: Position;
  level: number;
  tileItems: number;
  questProgress: number; // 현재 퀘스트에서 몇 번째 글자를 밟아야 하는지
  isOnQuest: boolean; // 퀘스트 진행 중인지 (쉼터를 떠났는지)
  currentQuest: string; // 현재 레벨의 로마숫자 문자열
  // 뷰포트 설정
  viewportSize: number; // 화면에 표시할 격자 크기 (예: 11x11)
}

// 이동 방향
export type Direction = 'up' | 'down' | 'left' | 'right';

// 게임 타임라인 (인풋 기반 히스토리)
export interface GameTimeline {
  viewportSize: number;
  moves: Direction[];        // 모든 이동 기록
  currentIndex: number;      // 현재 위치 (0 ~ moves.length)
  levelUpIndices: number[];  // 레벨업 발생 시점 (move index)
}

// 세이브 슬롯 타입
export type SaveSlotType = 'auto' | 'manual';

// 세이브 슬롯
export interface SaveSlot {
  id: number;
  type: SaveSlotType;
  viewportSize: number;
  moves: string;             // 압축된 이동 기록 (UDLR...)
  currentIndex: number;
  level: number;             // 표시용 레벨
  updatedAt: number;         // 타임스탬프
}

// 로컬 저장 데이터
export interface LocalSaveData {
  version: number;
  autoSlots: (SaveSlot | null)[];   // 자동저장 슬롯 (세계선 분기 시 저장)
  manualSlots: (SaveSlot | null)[]; // 수동저장 슬롯
  currentAutoSlot: SaveSlot | null; // 현재 진행 상태 (항상 최신)
}

// 게임 이벤트 타입
export type GameEvent =
  | { type: 'move'; direction: Direction }
  | { type: 'placeTile'; position: Position; tile: RomanChar }
  | { type: 'reset' };

// 위치를 문자열 키로 변환
export function posToKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

// 문자열 키를 위치로 변환
export function keyToPos(key: string): Position {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}
