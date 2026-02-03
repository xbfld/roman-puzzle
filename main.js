import { createInitialState, resetGame, move, createTimeline, addMoveToTimeline, undoTimeline, redoTimeline, strongUndoTimeline, strongRedoTimeline, seekTimeline, } from './game.js';
import { GameRenderer } from './renderer.js';
class RomanPuzzleGame {
    constructor(containerId, viewportSize = 11) {
        // 퍼포먼스 최적화: 체크포인트 캐싱
        this.stateCache = new Map();
        this.cacheInterval = 50; // 50수마다 캐싱
        this.timeline = createTimeline(viewportSize);
        this.state = createInitialState(viewportSize);
        this.previousLevel = this.state.level;
        this.renderer = new GameRenderer(containerId, {
            onMove: (direction) => this.handleMove(direction),
            onPlaceTile: (position, tile) => this.handlePlaceTile(position, tile),
            onReset: () => this.handleReset(),
            onUndo: () => this.handleUndo(),
            onRedo: () => this.handleRedo(),
            onStrongUndo: () => this.handleStrongUndo(),
            onStrongRedo: () => this.handleStrongRedo(),
            onSeek: (index) => this.handleSeek(index),
            onSave: () => this.handleSave(),
            onLoad: () => this.handleLoad(),
        });
        this.render();
    }
    handleMove(direction) {
        const { timeline: newTimeline, moveResult } = addMoveToTimeline(this.timeline, direction, this.state);
        if (moveResult.state !== this.state) {
            this.timeline = newTimeline;
            this.state = moveResult.state;
            // 체크포인트 캐싱
            if (this.timeline.currentIndex % this.cacheInterval === 0) {
                this.cacheState(this.timeline.currentIndex, this.state);
            }
            this.render(direction);
            // 타일 자동 배치 표시
            if (moveResult.autoPlacedTile) {
                this.renderer.showAutoTilePlacement(moveResult.autoPlacedTile);
            }
            // 레벨업 시 알림
            if (moveResult.leveledUp) {
                this.renderer.showLevelUp(this.state.level);
            }
            this.previousLevel = this.state.level;
        }
    }
    cacheState(index, state) {
        // 깊은 복사
        const stateCopy = {
            ...state,
            tiles: new Map(state.tiles),
            playerPosition: { ...state.playerPosition },
        };
        this.stateCache.set(index, stateCopy);
    }
    getStateAtIndexOptimized(index) {
        // 가장 가까운 캐시된 체크포인트 찾기
        let nearestCacheIndex = 0;
        let nearestState = createInitialState(this.timeline.viewportSize);
        for (const [cachedIndex, cachedState] of this.stateCache) {
            if (cachedIndex <= index && cachedIndex > nearestCacheIndex) {
                nearestCacheIndex = cachedIndex;
                nearestState = cachedState;
            }
        }
        // 체크포인트부터 목표 인덱스까지 재생
        let state = {
            ...nearestState,
            tiles: new Map(nearestState.tiles),
            playerPosition: { ...nearestState.playerPosition },
        };
        for (let i = nearestCacheIndex; i < index; i++) {
            const result = move(state, this.timeline.moves[i]);
            state = result.state;
        }
        return state;
    }
    rebuildStateSync() {
        this.state = this.getStateAtIndexOptimized(this.timeline.currentIndex);
        this.previousLevel = this.state.level;
    }
    handleUndo() {
        const newTimeline = undoTimeline(this.timeline);
        if (newTimeline.currentIndex !== this.timeline.currentIndex) {
            this.timeline = newTimeline;
            this.rebuildStateSync();
            this.render();
        }
    }
    handleRedo() {
        const newTimeline = redoTimeline(this.timeline);
        if (newTimeline.currentIndex !== this.timeline.currentIndex) {
            this.timeline = newTimeline;
            this.rebuildStateSync();
            this.render();
        }
    }
    handleStrongUndo() {
        const newTimeline = strongUndoTimeline(this.timeline);
        if (newTimeline.currentIndex !== this.timeline.currentIndex) {
            this.timeline = newTimeline;
            this.rebuildStateSync();
            this.render();
            this.renderer.showMessage(`Lv.${this.state.level} 시작점`);
        }
    }
    handleStrongRedo() {
        const newTimeline = strongRedoTimeline(this.timeline);
        if (newTimeline.currentIndex !== this.timeline.currentIndex) {
            this.timeline = newTimeline;
            this.rebuildStateSync();
            this.render();
            if (this.timeline.currentIndex < this.timeline.moves.length) {
                this.renderer.showMessage(`Lv.${this.state.level} 시작점`);
            }
        }
    }
    handleSeek(index) {
        const newTimeline = seekTimeline(this.timeline, index);
        if (newTimeline.currentIndex !== this.timeline.currentIndex) {
            this.timeline = newTimeline;
            this.rebuildStateSync();
            this.render();
        }
    }
    // 압축 포맷으로 직렬화 (공유용)
    serializeCompact() {
        const dirMap = {
            up: 'U',
            down: 'D',
            left: 'L',
            right: 'R',
        };
        const movesStr = this.timeline.moves.map(d => dirMap[d]).join('');
        return JSON.stringify({
            v: 2,
            s: this.timeline.viewportSize,
            m: movesStr,
            i: this.timeline.currentIndex,
        });
    }
    // 압축 포맷 역직렬화
    deserializeCompact(json) {
        try {
            const data = JSON.parse(json);
            if (data.v === 2) {
                const dirMap = {
                    U: 'up',
                    D: 'down',
                    L: 'left',
                    R: 'right',
                };
                const moves = data.m.split('').map((c) => dirMap[c]);
                // 레벨업 인덱스 재계산
                const levelUpIndices = this.calculateLevelUpIndices(data.s, moves);
                return {
                    viewportSize: data.s,
                    moves,
                    currentIndex: data.i ?? moves.length,
                    levelUpIndices,
                };
            }
            // v1 호환 (기존 포맷)
            if (data.version === 1) {
                return this.migrateFromV1(data);
            }
            return null;
        }
        catch {
            return null;
        }
    }
    // 레벨업 인덱스 계산
    calculateLevelUpIndices(viewportSize, moves) {
        const indices = [0];
        let state = createInitialState(viewportSize);
        for (let i = 0; i < moves.length; i++) {
            const result = move(state, moves[i]);
            if (result.leveledUp) {
                indices.push(i + 1);
            }
            state = result.state;
        }
        return indices;
    }
    // v1 포맷에서 마이그레이션 (기존 저장 호환)
    migrateFromV1(data) {
        // v1은 전체 상태를 저장했으므로 moves 복원 불가
        // 현재 상태만 로드하고 히스토리는 버림
        this.renderer.showMessage('이전 버전 - 히스토리 없이 로드');
        return null;
    }
    async handleSave() {
        const json = this.serializeCompact();
        try {
            await navigator.clipboard.writeText(json);
            const moveCount = this.timeline.moves.length;
            const bytes = new Blob([json]).size;
            this.renderer.showMessage(`저장됨! (${moveCount}수, ${bytes}B)`);
        }
        catch (e) {
            console.error('클립보드 복사 실패:', e);
            this.renderer.showMessage('저장 실패');
        }
    }
    async handleLoad() {
        try {
            const json = await navigator.clipboard.readText();
            const timeline = this.deserializeCompact(json);
            if (!timeline) {
                throw new Error('파싱 실패');
            }
            this.timeline = timeline;
            this.stateCache.clear();
            this.rebuildStateSync();
            // 체크포인트 재구축
            this.rebuildCache();
            this.render();
            this.renderer.showMessage(`불러옴! (${this.timeline.moves.length}수)`);
        }
        catch (e) {
            console.error('불러오기 실패:', e);
            this.renderer.showMessage('불러오기 실패');
        }
    }
    rebuildCache() {
        // 체크포인트 캐싱
        let state = createInitialState(this.timeline.viewportSize);
        for (let i = 0; i < this.timeline.moves.length; i++) {
            const result = move(state, this.timeline.moves[i]);
            state = result.state;
            if ((i + 1) % this.cacheInterval === 0) {
                this.cacheState(i + 1, state);
            }
        }
    }
    handlePlaceTile(position, tile) {
        // 자동 배치로 변경되어 수동 배치는 사용하지 않음
    }
    handleReset() {
        this.timeline = createTimeline(this.timeline.viewportSize);
        this.state = resetGame(this.timeline.viewportSize);
        this.stateCache.clear();
        this.previousLevel = this.state.level;
        this.render();
    }
    render(direction) {
        this.renderer.render(this.state, this.timeline, direction);
    }
    // 외부에서 상태 접근용
    getState() {
        return this.state;
    }
    getTimeline() {
        return this.timeline;
    }
    // 뷰포트 크기 업데이트
    updateViewportSize(newSize) {
        this.timeline = { ...this.timeline, viewportSize: newSize };
        this.state = { ...this.state, viewportSize: newSize };
        this.render();
    }
}
// 화면 크기에 따라 뷰포트 크기 계산 (홀수 유지)
function calculateViewportSize() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 400) {
        return 7; // 아주 작은 화면
    }
    else if (screenWidth <= 500) {
        return 9; // 모바일
    }
    else {
        return 11; // 데스크톱
    }
}
// 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    const viewportSize = calculateViewportSize();
    const game = new RomanPuzzleGame('game-container', viewportSize);
    // 화면 크기 변경 시 뷰포트 재조정
    window.addEventListener('resize', () => {
        const newSize = calculateViewportSize();
        if (newSize !== game.getState().viewportSize) {
            game.updateViewportSize(newSize);
        }
    });
    // 디버그용 전역 접근
    window.game = game;
});
//# sourceMappingURL=main.js.map