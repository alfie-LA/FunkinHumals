// Keyboard input manager with precise timestamps.
// Mirrors FNF's inputPressQueue / inputReleaseQueue from PlayState.hx
import { KEY_BINDINGS } from '../constants.js'

export class InputManager {
  constructor() {
    this.pressQueue = []      // { direction, timestamp }
    this.releaseQueue = []    // { direction, timestamp }
    this.heldKeys = new Set() // Currently held directions (0-3)
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this.active = false
  }

  /** Start listening for keyboard input. */
  start() {
    if (this.active) return
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    this.active = true
  }

  /** Stop listening and clear state. */
  stop() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    this.active = false
    this.pressQueue = []
    this.releaseQueue = []
    this.heldKeys.clear()
  }

  /** Drain and return all pending presses since last call. */
  drainPresses() {
    const presses = this.pressQueue
    this.pressQueue = []
    return presses
  }

  /** Drain and return all pending releases since last call. */
  drainReleases() {
    const releases = this.releaseQueue
    this.releaseQueue = []
    return releases
  }

  /** Check if a direction is currently held. */
  isHeld(direction) {
    return this.heldKeys.has(direction)
  }

  _onKeyDown(e) {
    const direction = KEY_BINDINGS[e.code]
    if (direction === undefined) return
    if (e.repeat) return // Ignore key repeat

    e.preventDefault()
    this.heldKeys.add(direction)
    this.pressQueue.push({
      direction,
      timestamp: performance.now(),
    })
  }

  _onKeyUp(e) {
    const direction = KEY_BINDINGS[e.code]
    if (direction === undefined) return

    e.preventDefault()
    this.heldKeys.delete(direction)
    this.releaseQueue.push({
      direction,
      timestamp: performance.now(),
    })
  }
}
