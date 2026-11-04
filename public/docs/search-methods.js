const captions = {
  cp: ['시작: 현재 보드와 짧은 목표 구간', '조건: 문자 순서·이동·빈 쉼터', '검사: 생성 시점·매 순간 잔량', '선택: 조건을 만족하는 최소 배치'],
  bulb: ['상위 후보 묶음부터 탐색', '막힘: 보류한 묶음은 유지', '이탈 1회 허용: 다른 묶음 복구', '이탈 예산을 늘려 재탐색'],
  bfws: ['재고만 보면 A와 B가 유리', 'A와 B의 구조 특징은 반복', 'C에는 새로운 연결 조합', '재고와 구조 다양성을 함께 유지'],
  nrpa: ['비슷한 확률로 여러 경로 생성', '전체 경로의 도달 결과를 평가', '좋은 경로의 선택 확률을 강화', '갱신한 확률로 다시 탐색'],
}

document.querySelectorAll('figure[data-method]').forEach(figure => {
  const method = figure.dataset.method
  const host = figure.querySelector('.diagram')
  const status = figure.querySelector('.stage')
  const previous = figure.querySelector('[data-step="-1"]')
  const next = figure.querySelector('[data-step="1"]')
  let step = 0

  function draw() {
    const width = host.getBoundingClientRect().width
    if (!width) return
    const height = method === 'cp' ? 330 : method === 'nrpa' ? 320 : 350
    const parts = []
    const text = (x, y, value, anchor = 'middle', cls = '') => {
      parts.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${value}</text>`)
    }
    const box = (x, y, w, h, label, cls = 'node') => {
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="${cls}"/>`)
      text(x + w / 2, y + h / 2 + 5, label)
    }
    const edge = (x, y, xx, yy, active = false) => {
      parts.push(`<path d="M${x},${y} L${xx},${yy}" class="${active ? 'chosen' : 'edge'}"/>`)
    }

    if (method === 'cp') {
      const size = Math.min(52, (width - 16) / 5)
      const left = (width - size * 5) / 2
      const letters = [['·', '·', '·', '·', '·'], ['·', 'S', 'C', 'L', '·'], ['·', '·', '·', '·', '·']]
      letters.forEach((row, r) => row.forEach((letter, c) => {
        box(left + c * size, 8 + r * size, size - 3, size - 3, letter, (r + c) % 2 ? 'node' : 'active')
      }))
      if (step > 0) {
        edge(left + 1.5 * size, 8 + 1.5 * size, left + 2.5 * size, 8 + 1.5 * size, true)
        edge(left + 2.5 * size, 8 + 1.5 * size, left + 3.5 * size, 8 + 1.5 * size, true)
        edge(left + 3.5 * size, 8 + 1.5 * size, left + 3.5 * size, 8 + 2.5 * size, true)
      }
      text(width / 2, 8 + size * 3 + 25, 'S → C → L → 빈 쉼터')
      text(width / 2, 8 + size * 3 + 57, step > 0 ? '문자·홀짝·인접 이동 확인' : '고정된 타일 C와 L')
      text(width / 2, 8 + size * 3 + 84, step > 1 ? '매 순간 아이템 부족 금지' : '구간 전체의 조건 설정')
      text(width / 2, 8 + size * 3 + 111, step > 2 ? '이 예의 신규 배치: 0개' : '목표: 신규 배치 최소화')
    } else if (method === 'bulb') {
      const middle = width / 2
      const left = width * .23
      const right = width * .77
      edge(middle, 40, left, 98, true)
      edge(middle, 40, right, 98, step > 1)
      edge(left, 134, left, 204, true)
      edge(right, 134, right, 204, step > 1)
      edge(right, 240, middle, 299, step > 2)
      box(middle - 50, 4, 100, 36, '현재 상태', 'active')
      box(left - 50, 98, 100, 36, '1위 묶음', 'active')
      box(right - 50, 98, 100, 36, '2위 묶음', step > 1 ? 'active' : 'node')
      text(middle, 176, step > 1 ? '순위를 거스르는 선택 1회' : '대안 묶음을 보존')
      box(left - 50, 204, 100, 36, step > 0 ? '막힘 ×' : '진행')
      box(right - 50, 204, 100, 36, step > 1 ? '복구·진행' : '보류', step > 1 ? 'active' : 'node')
      box(middle - 70, 299, 140, 36, step > 2 ? '다음 대안도 복구' : '이탈 예산 0 → 1 → 2', step > 2 ? 'active' : 'node')
    } else if (method === 'bfws') {
      const labels = ['A · 아이템 12', 'B · 아이템 12', 'C · 아이템 11']
      labels.forEach((label, i) => {
        const selected = step === 1 ? i < 2 : step === 2 ? i === 2 : step === 3 ? i !== 1 : false
        const y = 6 + i * 96
        box(4, y, width - 8, 78, label, selected ? 'active' : 'node')
        text(width / 2, y + 62, i < 2 ? 'C—L · 빈 출구 1개' : 'C—L · L—X · 빈 출구 2개')
      })
      text(width / 2, 325, step === 3 ? '보존: A의 재고 + C의 다른 구조' : step === 2 ? '신규 특징 조합 발견' : '점수와 새로움은 서로 다른 기준')
    } else {
      text(width / 2, 20, '같은 문맥: 다음 글자 X')
      const probabilities = step > 1 ? [75, 25] : [50, 50]
      ;['기존 X 재사용', '새 X 배치'].forEach((label, i) => {
        const y = 54 + i * 72
        text(4, y, label, 'start')
        text(width - 4, y, `${probabilities[i]}%`, 'end')
        parts.push(`<rect x="4" y="${y + 12}" width="${width - 8}" height="20" class="node"/><rect x="4" y="${y + 12}" width="${(width - 8) * probabilities[i] / 100}" height="20" fill="var(--brand)"/>`)
      })
      box(4, 203, width - 8, 42, step > 0 ? '좋은 경로: 재사용 → … → 생존' : '여러 경로 표본', step > 0 ? 'active' : 'node')
      edge(width / 2, 245, width / 2, 275, step > 1)
      text(width / 2, 300, step > 2 ? '새 정책으로 다음 탐색' : step > 1 ? '선택 확률 갱신' : '경로 전체를 평가')
    }
    status.textContent = `${step + 1} / 4 · ${captions[method][step]}`
    host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${captions[method][step]}"><title>${captions[method][step]}</title>${parts.join('')}</svg>`
    previous.disabled = step === 0
    next.disabled = step === 3
  }

  for (const button of [previous, next]) {
    button.addEventListener('click', () => {
      step = Math.max(0, Math.min(3, step + Number(button.dataset.step)))
      draw()
    })
  }
  new ResizeObserver(draw).observe(host)
  draw()
})
