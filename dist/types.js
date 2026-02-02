// 위치를 문자열 키로 변환
export function posToKey(pos) {
    return `${pos.x},${pos.y}`;
}
// 문자열 키를 위치로 변환
export function keyToPos(key) {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
}
//# sourceMappingURL=types.js.map