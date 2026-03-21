// Chart event processor.
// Walks sorted events array forward, fires FocusCamera and PlayAnimation events.

export class EventHandler {
  /**
   * @param {Array} events - Chart events sorted by time
   */
  constructor(events = []) {
    this.events = [...events].sort((a, b) => a.t - b.t)
    this.cursor = 0
  }

  /**
   * Process all events up to the current song position.
   * @param {number} songPosition - Current position in ms
   * @param {import('./camera.js').Camera} camera
   * @param {Object} characters - { bf, dad, gf }
   */
  update(songPosition, camera, characters) {
    while (this.cursor < this.events.length && this.events[this.cursor].t <= songPosition) {
      this._processEvent(this.events[this.cursor], camera, characters)
      this.cursor++
    }
  }

  _processEvent(evt, camera, characters) {
    switch (evt.e) {
      case 'FocusCamera': {
        // v can be a number (legacy) or object { char, x, y, duration, ease }
        const charIndex = typeof evt.v === 'number' ? evt.v : (evt.v?.char ?? 0)
        const offsetX = evt.v?.x ?? 0
        const offsetY = evt.v?.y ?? 0
        camera.focusOnCharacter(charIndex, offsetX, offsetY)
        break
      }
      case 'PlayAnimation': {
        const target = evt.v?.target
        const anim = evt.v?.anim
        if (target && anim && characters?.[target]?.sprite) {
          characters[target].sprite.play(anim, true)
        }
        break
      }
      // Other events (ZoomCamera, etc.) can be added later
    }
  }

  /** Reset cursor to beginning (for retry). */
  reset() {
    this.cursor = 0
  }
}
