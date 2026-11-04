import assert from 'node:assert/strict'
import test from 'node:test'
import { bindBoardTouch } from '../src/lib/boardTouch.ts'

const finger = (x = 250, y = 150, identifier = 1) => ({ clientX: x, clientY: y, identifier })

function setup() {
  const board = new EventTarget()
  board.getBoundingClientRect = () => ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300 })
  const moves = []
  const cleanup = bindBoardTouch(board, direction => moves.push(direction))
  const dispatch = (type, touches = [], changedTouches = []) => {
    const event = new Event(type, { cancelable: true })
    Object.assign(event, { touches, changedTouches })
    board.dispatchEvent(event)
    return event
  }
  return { board, moves, cleanup, dispatch }
}

test('holding does not move; releasing once moves once and suppresses the compatibility click', () => {
  const { board, moves, dispatch } = setup()
  const touch = finger()
  dispatch('touchstart', [touch])
  for (let i = 0; i < 20; i++) dispatch('touchmove', [touch])
  assert.deepEqual(moves, [])
  assert.equal(dispatch('touchend', [], [touch]).defaultPrevented, true)
  dispatch('touchend', [], [touch])
  const click = new Event('click', { cancelable: true })
  Object.assign(click, { detail: 1 })
  board.dispatchEvent(click)
  assert.equal(click.defaultPrevented, true)
  assert.deepEqual(moves, ['right'])
})

test('each direction accepts consecutive independent taps', () => {
  const { moves, dispatch } = setup()
  for (const touch of [finger(250, 150), finger(50, 150), finger(150, 50), finger(150, 250)]) {
    dispatch('touchstart', [touch])
    dispatch('touchend', [], [touch])
  }
  assert.deepEqual(moves, ['right', 'left', 'up', 'down'])
})

test('scrolling, cancellation, release outside the board, and touching the center do not move', () => {
  const { moves, dispatch } = setup()
  dispatch('touchstart', [finger()])
  dispatch('touchmove', [finger(250, 190)])
  dispatch('touchend', [], [finger(250, 190)])
  dispatch('touchstart', [finger()])
  dispatch('touchcancel')
  dispatch('touchend', [], [finger()])
  dispatch('touchstart', [finger()])
  dispatch('touchend', [], [finger(350, 150)])
  dispatch('touchstart', [finger(150, 150)])
  dispatch('touchend', [], [finger(150, 150)])
  assert.deepEqual(moves, [])
})

test('multiple fingers do not move, and a new single-finger gesture still works', () => {
  const { moves, dispatch } = setup()
  const first = finger()
  const second = finger(50, 150, 2)
  dispatch('touchstart', [first])
  dispatch('touchstart', [first, second])
  dispatch('touchend', [second], [first])
  dispatch('touchend', [], [second])
  assert.deepEqual(moves, [])
  dispatch('touchstart', [first])
  dispatch('touchend', [], [first])
  assert.deepEqual(moves, ['right'])
})

test('mouse, pen and keyboard activation remain available after a touch', () => {
  const { board, dispatch } = setup()
  dispatch('touchstart', [finger()])
  dispatch('touchend', [], [finger()])
  const keyboardClick = new Event('click', { cancelable: true })
  Object.assign(keyboardClick, { detail: 0 })
  board.dispatchEvent(keyboardClick)
  assert.equal(keyboardClick.defaultPrevented, false)
  for (const pointerType of ['mouse', 'pen']) {
    dispatch('touchstart', [finger()])
    dispatch('touchend', [], [finger()])
    const pointer = new Event('pointerdown')
    Object.assign(pointer, { pointerType })
    board.dispatchEvent(pointer)
    const click = new Event('click', { cancelable: true })
    Object.assign(click, { detail: 1, pointerType })
    board.dispatchEvent(click)
    assert.equal(click.defaultPrevented, false)
  }
})

test('cleanup removes touch and click listeners', () => {
  const { board, moves, dispatch, cleanup } = setup()
  dispatch('touchstart', [finger()])
  cleanup()
  dispatch('touchend', [], [finger()])
  const click = new Event('click', { cancelable: true })
  Object.assign(click, { detail: 1 })
  board.dispatchEvent(click)
  assert.equal(click.defaultPrevented, false)
  assert.deepEqual(moves, [])
})
