import { posToKey } from './types.js';
import { getValidMoves, getGameStatus, getTileAt } from './game.js';
export class GameRenderer {
    constructor(containerId, callbacks) {
        this.lastMoveDirection = null;
        this.currentState = null;
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = container;
        this.onMove = callbacks.onMove;
        this.onReset = callbacks.onReset;
        this.onUndo = callbacks.onUndo;
        this.onRedo = callbacks.onRedo;
        this.onSave = callbacks.onSave;
        this.onLoad = callbacks.onLoad;
        // 컨테이너 구조 생성
        this.container.innerHTML = `
      <div class="game-header">
        <h1>3999</h1>
        <div class="status-container"></div>
      </div>
      <div class="grid-wrapper">
        <div class="grid-container"></div>
        <div class="level-up-container"></div>
      </div>
      <div class="game-footer">
        <div class="controls-info desktop-only">
          <p><strong>Move:</strong> Arrow / WASD</p>
          <p><strong>Undo/Redo:</strong> Z / Y</p>
          <p><strong>Save/Load:</strong> C / V</p>
        </div>
        <div class="controls-info mobile-only">
          <p><strong>스와이프로 이동</strong></p>
        </div>
        <div class="button-group">
          <button class="undo-button">Undo</button>
          <button class="redo-button">Redo</button>
          <button class="reset-button">Reset</button>
        </div>
      </div>
    `;
        this.statusContainer = this.container.querySelector('.status-container');
        this.gridContainer = this.container.querySelector('.grid-container');
        this.levelUpContainer = this.container.querySelector('.level-up-container');
        // 버튼 이벤트
        const resetButton = this.container.querySelector('.reset-button');
        resetButton.addEventListener('click', () => this.onReset());
        const undoButton = this.container.querySelector('.undo-button');
        undoButton.addEventListener('click', () => this.onUndo());
        const redoButton = this.container.querySelector('.redo-button');
        redoButton.addEventListener('click', () => this.onRedo());
        // 키보드 이벤트
        this.setupKeyboardControls();
        // 터치 이벤트 (모바일)
        this.setupTouchControls();
    }
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        const minSwipeDistance = 30;
        this.gridContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        this.gridContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY, minSwipeDistance);
        }, { passive: true });
    }
    handleSwipe(startX, startY, endX, endY, minDistance) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);
        // 최소 스와이프 거리 체크
        if (Math.max(absDiffX, absDiffY) < minDistance) {
            return;
        }
        // 가로 스와이프가 더 큰 경우
        if (absDiffX > absDiffY) {
            if (diffX > 0) {
                this.onMove('right');
            }
            else {
                this.onMove('left');
            }
        }
        else {
            // 세로 스와이프가 더 큰 경우
            if (diffY > 0) {
                this.onMove('down');
            }
            else {
                this.onMove('up');
            }
        }
    }
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            // Undo: Z
            if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                this.onUndo();
                return;
            }
            // Redo: Y
            if (e.key === 'y' || e.key === 'Y') {
                e.preventDefault();
                this.onRedo();
                return;
            }
            // Save: C
            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                this.onSave();
                return;
            }
            // Load: V
            if (e.key === 'v' || e.key === 'V') {
                e.preventDefault();
                this.onLoad();
                return;
            }
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.onMove('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.onMove('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.onMove('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.onMove('right');
                    break;
            }
        });
    }
    render(state, moveDirection) {
        this.currentState = state;
        this.renderStatus(state);
        this.renderGrid(state, moveDirection);
        // 결과 복사 버튼 이벤트
        const copyBtn = this.statusContainer.querySelector('.copy-result-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyResult(state));
        }
    }
    async copyResult(state) {
        const status = getGameStatus(state);
        const result = `🏛️ 3999 결과\n` +
            `레벨: ${status.level}\n` +
            `배치한 타일: ${state.tiles.size}개\n` +
            `https://3999.vercel.app`;
        try {
            await navigator.clipboard.writeText(result);
            this.showMessage('결과 복사됨!');
        }
        catch (e) {
            console.error('복사 실패:', e);
        }
    }
    renderStatus(state) {
        const status = getGameStatus(state);
        let questDisplay = '';
        if (status.isOnQuest || state.currentQuest) {
            questDisplay = this.getQuestProgressDisplay(status.currentQuest, status.questProgress, status.isOnQuest);
            if (status.isComplete) {
                questDisplay += ' <span class="return-hint">Return to shelter!</span>';
            }
        }
        this.statusContainer.innerHTML = `
      <div class="status-item">
        <span class="status-label">Level</span>
        <span class="status-value">${status.level}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Tiles</span>
        <span class="status-value">${status.tileItems}</span>
      </div>
      <div class="status-item quest-status">
        <span class="status-label">Quest</span>
        <span class="status-value">${questDisplay}</span>
      </div>
      ${status.isGameOver ? `<div class="game-over">Game Over! Level ${status.level} 달성! <button class="copy-result-btn">결과 복사</button></div>` : ''}
    `;
    }
    getQuestProgressDisplay(quest, progress, isOnQuest) {
        let display = '';
        for (let i = 0; i < quest.length; i++) {
            const char = quest[i];
            if (isOnQuest && i < progress) {
                display += `<span class="char-done">${char}</span>`;
            }
            else if (isOnQuest && i === progress) {
                display += `<span class="char-current">${char}</span>`;
            }
            else if (!isOnQuest && i === 0) {
                display += `<span class="char-current">${char}</span>`;
            }
            else {
                display += `<span class="char-pending">${char}</span>`;
            }
        }
        return display;
    }
    renderGrid(state, moveDirection) {
        const validMoves = getValidMoves(state);
        const validPositions = new Set(validMoves.map((p) => posToKey(p)));
        const halfSize = Math.floor(state.viewportSize / 2);
        const playerX = state.playerPosition.x;
        const playerY = state.playerPosition.y;
        this.gridContainer.innerHTML = '';
        this.gridContainer.style.gridTemplateColumns = `repeat(${state.viewportSize}, 1fr)`;
        // 뷰포트 범위 계산 (플레이어 중심)
        const startX = playerX - halfSize;
        const endX = playerX + halfSize;
        const startY = playerY - halfSize;
        const endY = playerY + halfSize;
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = String(x);
                cell.dataset.y = String(y);
                const pos = { x, y };
                const tile = getTileAt(state, pos);
                const isPlayer = x === playerX && y === playerY;
                const isValidMove = validPositions.has(posToKey(pos));
                // 체커보드 패턴 (좌표 합이 홀수면 어둡게)
                const isDark = (x + y) % 2 !== 0;
                // 셀 타입 클래스
                if (tile === null) {
                    cell.classList.add('cell-shelter');
                    if (isDark) {
                        cell.classList.add('cell-dark');
                    }
                }
                else {
                    cell.classList.add('cell-roman');
                    const tileText = document.createElement('span');
                    tileText.className = 'tile-text';
                    tileText.textContent = tile;
                    cell.appendChild(tileText);
                }
                // 이동 가능 표시 (플레이어 위치가 아닐 때만)
                if (isValidMove && !isPlayer) {
                    cell.classList.add('cell-valid-move');
                }
                // 플레이어 위치
                if (isPlayer) {
                    cell.classList.add('cell-player');
                    const playerWrapper = document.createElement('div');
                    playerWrapper.className = 'player-wrapper';
                    // 레벨 표시
                    const levelBadge = document.createElement('div');
                    levelBadge.className = 'level-badge';
                    levelBadge.textContent = `Lv.${state.level}`;
                    playerWrapper.appendChild(levelBadge);
                    // 캐릭터 (CSS로 표현)
                    const playerMarker = document.createElement('div');
                    playerMarker.className = 'player-marker';
                    playerWrapper.appendChild(playerMarker);
                    cell.appendChild(playerWrapper);
                }
                // 클릭 이벤트 (이동 가능한 칸만)
                if (isValidMove) {
                    cell.addEventListener('click', () => this.handleCellClick(state, pos));
                }
                this.gridContainer.appendChild(cell);
            }
        }
    }
    handleCellClick(state, targetPos) {
        const playerPos = state.playerPosition;
        // 방향 계산
        if (targetPos.y < playerPos.y)
            this.onMove('up');
        else if (targetPos.y > playerPos.y)
            this.onMove('down');
        else if (targetPos.x < playerPos.x)
            this.onMove('left');
        else if (targetPos.x > playerPos.x)
            this.onMove('right');
    }
    // 레벨업 애니메이션 표시
    showLevelUp(level) {
        const levelUpText = document.createElement('div');
        levelUpText.className = 'level-up-text';
        levelUpText.textContent = `Level ${level}!`;
        this.levelUpContainer.appendChild(levelUpText);
        // 애니메이션 후 제거
        setTimeout(() => {
            levelUpText.remove();
        }, 1500);
    }
    // 타일 자동 배치 애니메이션
    showAutoTilePlacement(tile) {
        const tileText = document.createElement('div');
        tileText.className = 'auto-tile-text';
        tileText.textContent = `+${tile}`;
        this.levelUpContainer.appendChild(tileText);
        setTimeout(() => {
            tileText.remove();
        }, 800);
    }
    // 메시지 표시
    showMessage(message) {
        const msgEl = document.createElement('div');
        msgEl.className = 'message-text';
        msgEl.textContent = message;
        this.levelUpContainer.appendChild(msgEl);
        setTimeout(() => {
            msgEl.remove();
        }, 1000);
    }
}
//# sourceMappingURL=renderer.js.map