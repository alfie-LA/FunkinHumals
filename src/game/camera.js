// Camera system: follow point, zoom, bop on beat.
// Ported from PlayState.hx camera zoom/follow logic.

import {
  CAMERA_BOP_INTENSITY, CAMERA_DECAY_RATE,
  CAMERA_ZOOM_RATE, CAMERA_FOLLOW_RATE,
} from '../constants.js'

export class Camera {
  constructor() {
    this.followPoint = { x: 0, y: 0 }
    this.targetPoint = { x: 0, y: 0 }
    this.zoom = 1.0
    this.bopMultiplier = 1.0
    this.characters = null // set by game engine
  }

  /**
   * Set the stage zoom level.
   * @param {number} zoom
   */
  setZoom(zoom) {
    this.zoom = zoom
  }

  /**
   * Focus camera on a character by index.
   * @param {number} charIndex - 0=bf, 1=dad, 2=gf
   * @param {number} offsetX
   * @param {number} offsetY
   */
  focusOnCharacter(charIndex, offsetX = 0, offsetY = 0) {
    if (!this.characters) return
    let target = null
    switch (charIndex) {
      case 0: target = this.characters.bf; break
      case 1: target = this.characters.dad; break
      case 2: target = this.characters.gf; break
    }
    if (target) {
      this.targetPoint.x = target.cameraFocusPoint.x + offsetX
      this.targetPoint.y = target.cameraFocusPoint.y + offsetY
    }
  }

  /** Trigger camera bop (called on beat). */
  bop() {
    this.bopMultiplier = CAMERA_BOP_INTENSITY
  }

  /**
   * Update camera each frame.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Lerp bopMultiplier back to 1.0
    const dtScaled = dt * 60 // Normalize to 60fps like FNF
    this.bopMultiplier = 1.0 + (this.bopMultiplier - 1.0) * Math.pow(CAMERA_DECAY_RATE, dtScaled)

    // Lerp follow point toward target
    const rate = CAMERA_FOLLOW_RATE * dtScaled
    this.followPoint.x += (this.targetPoint.x - this.followPoint.x) * Math.min(rate, 1.0)
    this.followPoint.y += (this.targetPoint.y - this.followPoint.y) * Math.min(rate, 1.0)
  }

  /** Get effective zoom (base zoom × bop multiplier). */
  get effectiveZoom() {
    return this.zoom * this.bopMultiplier
  }
}
