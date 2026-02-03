import { posToKey } from './types.js';
import { toRoman } from './roman.js';
// 게임 상태 초기화
export function createInitialState(viewportSize = 11) {
    return {
        tiles: new Map(),
        playerPosition: { x: 0, y: 0 }, // 시작 위치 = (0, 0)
        level: 1,
        tileItems: 1,
        questProgress: 0,
        isOnQuest: false,
        currentQuest: toRoman(1), // 첫 퀘스트: I
        viewportSize,
    };
}
// 다음 레벨 퀘스트 문자열 가져오기
export function getNextQuest(level) {
    return toRoman(level);
}
// 현재 밟아야 할 문자 가져오기
export function getCurrentRequiredChar(state) {
    if (!state.isOnQuest) {
        // 퀘스트 시작 전: 첫 글자 필요
        return state.currentQuest[0];
    }
    if (state.questProgress >= state.currentQuest.length) {
        return null; // 모든 문자를 밟음 - 쉼터로 돌아가야 함
    }
    return state.currentQuest[state.questProgress];
}
// 특정 위치의 타일 가져오기 (없으면 null = 쉼터)
export function getTileAt(state, pos) {
    const tile = state.tiles.get(posToKey(pos));
    return tile ? tile.char : null;
}
// 특정 위치의 타일 전체 정보 가져오기 (레벨 포함)
export function getPlacedTileAt(state, pos) {
    return state.tiles.get(posToKey(pos)) ?? null;
}
// 방향으로 새 위치 계산
export function getNewPosition(pos, direction) {
    switch (direction) {
        case 'up':
            return { x: pos.x, y: pos.y - 1 };
        case 'down':
            return { x: pos.x, y: pos.y + 1 };
        case 'left':
            return { x: pos.x - 1, y: pos.y };
        case 'right':
            return { x: pos.x + 1, y: pos.y };
    }
}
// 인접한 위치인지 확인 (상하좌우만)
export function isAdjacent(pos1, pos2) {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}
// 특정 위치로 이동 가능한지 확인
export function canMoveTo(state, targetPos) {
    // 인접한 위치만 이동 가능
    if (!isAdjacent(state.playerPosition, targetPos)) {
        return false;
    }
    const currentTile = getTileAt(state, state.playerPosition);
    const targetTile = getTileAt(state, targetPos);
    // 현재 쉼터에 있을 때 (퀘스트 시작 전 또는 퀘스트 완료 후)
    if (currentTile === null && !state.isOnQuest) {
        const firstChar = state.currentQuest[0];
        // 쉼터에서 쉼터로 이동 시 - 타일 아이템이 있으면 자동 배치 가능
        if (targetTile === null) {
            return state.tileItems > 0;
        }
        // 퀘스트의 첫 글자 타일로만 이동 가능
        return targetTile === firstChar;
    }
    // 퀘스트 진행 중일 때
    if (state.isOnQuest) {
        const requiredChar = getCurrentRequiredChar(state);
        if (requiredChar === null) {
            // 모든 문자를 밟았으면 쉼터(null)만 갈 수 있음
            return targetTile === null;
        }
        // 빈칸(쉼터)으로 이동 시 자동 타일 배치 (타일 아이템이 있어야 함)
        if (targetTile === null) {
            return state.tileItems > 0;
        }
        // 필요한 문자만 밟을 수 있음
        return targetTile === requiredChar;
    }
    return false;
}
// 이동 가능한 모든 위치 가져오기
export function getValidMoves(state) {
    const directions = ['up', 'down', 'left', 'right'];
    const validMoves = [];
    for (const dir of directions) {
        const newPos = getNewPosition(state.playerPosition, dir);
        if (canMoveTo(state, newPos)) {
            validMoves.push(newPos);
        }
    }
    return validMoves;
}
// 이동 실행
export function move(state, direction) {
    const newPos = getNewPosition(state.playerPosition, direction);
    if (!canMoveTo(state, newPos)) {
        return { state, leveledUp: false, autoPlacedTile: null }; // 이동 불가
    }
    // 새 상태 생성 (불변성 유지)
    const newTiles = new Map(state.tiles);
    let newState = {
        ...state,
        tiles: newTiles,
        playerPosition: newPos,
    };
    let leveledUp = false;
    let autoPlacedTile = null;
    const targetTile = getTileAt(state, newPos);
    const requiredChar = getCurrentRequiredChar(state);
    // 쉼터에서 쉼터로 이동 시 자동 타일 배치 (퀘스트 시작)
    if (targetTile === null && !state.isOnQuest && state.tileItems > 0) {
        const firstChar = state.currentQuest[0];
        newTiles.set(posToKey(newPos), { char: firstChar, level: state.level });
        newState.tileItems = state.tileItems - 1;
        autoPlacedTile = firstChar;
        newState.isOnQuest = true;
        newState.questProgress = 1;
    }
    // 퀘스트 중 빈칸으로 이동 시 자동 타일 배치
    else if (targetTile === null && state.isOnQuest && requiredChar !== null && state.tileItems > 0) {
        // 자동으로 필요한 타일 배치
        newTiles.set(posToKey(newPos), { char: requiredChar, level: state.level });
        newState.tileItems = state.tileItems - 1;
        autoPlacedTile = requiredChar;
        // 진행도 업데이트
        newState.questProgress = state.questProgress + 1;
    }
    // 쉼터에 있고, 이미 있는 로마숫자 타일로 이동하면 퀘스트 시작
    else if (!state.isOnQuest && targetTile !== null) {
        newState.isOnQuest = true;
        // 밟은 타일이 필요한 첫 번째 문자와 일치하면 진행
        if (targetTile === newState.currentQuest[0]) {
            newState.questProgress = 1;
        }
    }
    // 퀘스트 진행 중
    else if (state.isOnQuest) {
        if (requiredChar !== null && targetTile === requiredChar) {
            // 필요한 문자를 밟음
            newState.questProgress = state.questProgress + 1;
        }
        // 모든 문자를 밟고 쉼터에 도착하면 레벨업
        if (newState.questProgress >= newState.currentQuest.length && targetTile === null) {
            newState.level = state.level + 1;
            newState.tileItems = state.tileItems + 1;
            newState.isOnQuest = false;
            newState.questProgress = 0;
            newState.currentQuest = getNextQuest(newState.level);
            leveledUp = true;
        }
    }
    return { state: newState, leveledUp, autoPlacedTile };
}
// 타일 배치 (수동 - 현재 게임에서는 사용하지 않음)
export function placeTile(state, position, tile) {
    // 타일 아이템이 없으면 불가
    if (state.tileItems <= 0) {
        return null;
    }
    // 이미 타일이 있으면 불가
    if (getTileAt(state, position) !== null) {
        return null;
    }
    // 플레이어 위치에는 배치 불가
    if (position.x === state.playerPosition.x && position.y === state.playerPosition.y) {
        return null;
    }
    // 새 격자 생성 및 타일 배치
    const newTiles = new Map(state.tiles);
    newTiles.set(posToKey(position), { char: tile, level: state.level });
    return {
        ...state,
        tiles: newTiles,
        tileItems: state.tileItems - 1,
    };
}
// 게임 리셋
export function resetGame(viewportSize = 11) {
    return createInitialState(viewportSize);
}
// 게임 오버 체크 (이동 가능한 곳이 없고 퀘스트 중일 때)
export function isGameOver(state) {
    if (!state.isOnQuest) {
        // 쉼터에 있으면서 첫 글자 타일이 주변에 없고 타일 아이템도 없으면 게임 오버
        const validMoves = getValidMoves(state);
        if (validMoves.length === 0 && state.tileItems === 0) {
            return true;
        }
        return false;
    }
    const validMoves = getValidMoves(state);
    return validMoves.length === 0;
}
export function getGameStatus(state) {
    const requiredChar = getCurrentRequiredChar(state);
    const isComplete = state.isOnQuest && requiredChar === null;
    return {
        level: state.level,
        tileItems: state.tileItems,
        currentQuest: state.currentQuest,
        questProgress: state.questProgress,
        isOnQuest: state.isOnQuest,
        requiredChar,
        isComplete,
        isGameOver: isGameOver(state),
    };
}
// 타임라인 초기화
export function createTimeline(viewportSize = 11) {
    return {
        viewportSize,
        moves: [],
        currentIndex: 0,
        levelUpIndices: [0], // 레벨 1 시작점
    };
}
// 이동 기록에서 특정 인덱스까지의 상태 복원
export function getStateAtIndex(timeline, targetIndex) {
    let state = createInitialState(timeline.viewportSize);
    const maxIndex = Math.min(targetIndex, timeline.moves.length);
    for (let i = 0; i < maxIndex; i++) {
        const result = move(state, timeline.moves[i]);
        state = result.state;
    }
    return state;
}
// 타임라인에 이동 추가
export function addMoveToTimeline(timeline, direction, currentState) {
    const moveResult = move(currentState, direction);
    if (moveResult.state === currentState) {
        // 이동 실패 - 타임라인 변경 없음
        return { timeline, moveResult };
    }
    // 현재 인덱스 이후의 기록이 있으면 분기 발생 (일단 덮어씀)
    const newMoves = [...timeline.moves.slice(0, timeline.currentIndex), direction];
    const newIndex = timeline.currentIndex + 1;
    // 레벨업 인덱스 업데이트
    let newLevelUpIndices = timeline.levelUpIndices.filter(i => i < newIndex);
    if (moveResult.leveledUp) {
        newLevelUpIndices = [...newLevelUpIndices, newIndex];
    }
    return {
        timeline: {
            ...timeline,
            moves: newMoves,
            currentIndex: newIndex,
            levelUpIndices: newLevelUpIndices,
        },
        moveResult,
    };
}
// 타임라인에서 undo (1수)
export function undoTimeline(timeline) {
    if (timeline.currentIndex <= 0) {
        return timeline;
    }
    return {
        ...timeline,
        currentIndex: timeline.currentIndex - 1,
    };
}
// 타임라인에서 redo (1수)
export function redoTimeline(timeline) {
    if (timeline.currentIndex >= timeline.moves.length) {
        return timeline;
    }
    return {
        ...timeline,
        currentIndex: timeline.currentIndex + 1,
    };
}
// 강력 undo (이전 레벨 시작점으로)
export function strongUndoTimeline(timeline) {
    // 현재 인덱스보다 작은 레벨업 인덱스 중 가장 큰 것 찾기
    const previousLevelIndex = [...timeline.levelUpIndices]
        .reverse()
        .find(i => i < timeline.currentIndex);
    if (previousLevelIndex === undefined) {
        return { ...timeline, currentIndex: 0 };
    }
    return {
        ...timeline,
        currentIndex: previousLevelIndex,
    };
}
// 강력 redo (다음 레벨 시작점으로)
export function strongRedoTimeline(timeline) {
    // 현재 인덱스보다 큰 레벨업 인덱스 중 가장 작은 것 찾기
    const nextLevelIndex = timeline.levelUpIndices.find(i => i > timeline.currentIndex);
    if (nextLevelIndex === undefined) {
        // 다음 레벨업 지점이 없으면 끝까지
        return { ...timeline, currentIndex: timeline.moves.length };
    }
    return {
        ...timeline,
        currentIndex: nextLevelIndex,
    };
}
// 타임라인을 특정 인덱스로 이동
export function seekTimeline(timeline, targetIndex) {
    const clampedIndex = Math.max(0, Math.min(targetIndex, timeline.moves.length));
    return {
        ...timeline,
        currentIndex: clampedIndex,
    };
}
//# sourceMappingURL=game.js.map