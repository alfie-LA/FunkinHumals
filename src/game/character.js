// Character: loads character JSON, wraps AnimatedSprite with gameplay logic.
// Handles sing/miss/idle animations, hold timer, GF dance alternation.

import { AnimatedSprite } from './animated-sprite.js'
import { SparrowAtlas } from './sparrow-atlas.js'
import { loadImage, loadText, loadJSON } from './asset-loader.js'

const SING_ANIMS = ['singLEFT', 'singDOWN', 'singUP', 'singRIGHT']
const MISS_ANIMS = ['singLEFTmiss', 'singDOWNmiss', 'singUPmiss', 'singRIGHTmiss']

export class Character {
  constructor() {
    this.sprite = null
    this.data = null
    this.name = ''
    this.flipX = false
    this.scale = 1.0

    // Position on stage (set from stage data)
    this.x = 0
    this.y = 0

    // Camera focus point (character center + stage cameraOffsets)
    this.cameraFocusPoint = { x: 0, y: 0 }

    // Sing hold timer
    this.holdTimer = 0
    this.isSinging = false
    this.singTimeSteps = 8.0 // default, overridden from JSON

    // GF dance state
    this.danceDirection = false // alternates left/right
    this.danceEvery = 1

    // Character type
    this.type = 'other' // 'bf', 'dad', 'gf'
  }

  /**
   * Load a character from its JSON data file.
   * @param {string} charId - e.g. 'bf', 'dad', 'gf'
   * @param {string} type - 'bf', 'dad', or 'gf'
   */
  async load(charId, type = 'other') {
    this.type = type
    this.data = await loadJSON(`data/characters/${charId}.json`)
    this.name = this.data.name ?? charId
    this.flipX = this.data.flipX ?? false
    this.scale = this.data.scale ?? 1.0
    this.singTimeSteps = this.data.singTime ?? 8.0
    this.danceEvery = this.data.danceEvery ?? 1

    // Load spritesheet + atlas
    const assetPath = this.data.assetPath ?? `characters/${charId}`
    const image = await loadImage(`images/${assetPath}.png`)
    const xmlText = await loadText(`images/${assetPath}.xml`)
    const atlas = new SparrowAtlas(xmlText)

    this.sprite = new AnimatedSprite(image, atlas)

    // Register all animations from character JSON
    for (const anim of this.data.animations ?? []) {
      // Skip animations that reference a different assetPath (multi-sparrow)
      // unless it matches the main asset
      if (anim.assetPath && anim.assetPath !== assetPath) continue

      this.sprite.addAnimation(anim.name, anim.prefix, {
        fps: anim.frameRate ?? 24,
        looped: anim.looped ?? false,
        frameIndices: anim.frameIndices ?? null,
        offsets: anim.offsets ?? [0, 0],
      })
    }

    // Play starting animation
    const startAnim = this.data.startingAnimation ?? 'idle'
    if (this.sprite.hasAnimation(startAnim)) {
      this.sprite.play(startAnim)
    }
  }

  /**
   * Set position and compute camera focus point.
   * @param {number} x - Stage x position
   * @param {number} y - Stage y position
   * @param {number[]} cameraOffsets - [x, y] from stage data
   */
  setPosition(x, y, cameraOffsets = [0, 0]) {
    // Stage data stores the character's "feet" position:
    // horizontal center + vertical bottom, matching original FNF stage logic.
    const w = this.sprite?.frameWidth ?? 200
    const h = this.sprite?.frameHeight ?? 400
    this.x = x - (w * this.scale) / 2
    this.y = y - (h * this.scale)

    // Camera focus = approximate character center + stage camera offsets.
    this.cameraFocusPoint.x = this.x + (w * this.scale) / 2 + cameraOffsets[0]
    this.cameraFocusPoint.y = this.y + (h * this.scale) / 2 + cameraOffsets[1]
  }

  /** Play sing animation for a direction (0=left, 1=down, 2=up, 3=right). */
  playSing(direction) {
    const anim = SING_ANIMS[direction]
    if (anim && this.sprite?.hasAnimation(anim)) {
      this.sprite.play(anim, true)
      this.isSinging = true
      this.holdTimer = 0
    }
  }

  /** Play miss animation for a direction. */
  playMiss(direction) {
    const anim = MISS_ANIMS[direction]
    if (anim && this.sprite?.hasAnimation(anim)) {
      this.sprite.play(anim, true)
      this.isSinging = true
      this.holdTimer = 0
    }
  }

  /** Dance on beat (for GF: alternate danceLeft/danceRight). */
  danceBeat(beat) {
    if (this.isSinging) return // don't interrupt singing
    if (beat % this.danceEvery !== 0) return

    if (this.sprite?.hasAnimation('danceLeft') && this.sprite?.hasAnimation('danceRight')) {
      this.danceDirection = !this.danceDirection
      this.sprite.play(this.danceDirection ? 'danceRight' : 'danceLeft', true)
    } else if (this.sprite?.hasAnimation('idle')) {
      this.sprite.play('idle', true)
    }
  }

  /** Try to revert to idle if sing timer expired. */
  tryIdle(conductor) {
    if (!this.isSinging) return
    // Check if we should be holding (hold animations exist)
    // For simplicity, just use the hold timer
  }

  /**
   * Update character state each frame.
   * @param {number} dt - Delta time in seconds
   * @param {Object} conductor - Conductor instance for step length
   * @param {boolean} isHoldingNote - Whether the player is holding a note key
   */
  update(dt, conductor, isHoldingNote = false) {
    // Update animation
    this.sprite?.update(dt)

    // Sing hold timer
    if (this.isSinging) {
      this.holdTimer += dt
      const stepLenSec = (conductor?.stepLengthMs ?? 150) / 1000
      const singDuration = this.singTimeSteps * stepLenSec

      // Miss animations get double duration
      const isMiss = this.sprite?.currentAnim?.includes('miss') ?? false
      const effectiveDuration = isMiss ? singDuration * 2 : singDuration

      // BF only reverts when not holding a note key
      const shouldRevert = this.type === 'bf' ? !isHoldingNote : true

      if (this.holdTimer > effectiveDuration && shouldRevert) {
        this.isSinging = false
        this.holdTimer = 0
        this.danceBeat(0) // force dance/idle
      }
    }
  }

  /**
   * Draw the character on a canvas context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} offsetX - Camera-adjusted x offset
   * @param {number} offsetY - Camera-adjusted y offset
   */
  draw(ctx, offsetX = 0, offsetY = 0) {
    if (!this.sprite) return
    this.sprite.draw(ctx, this.x + offsetX, this.y + offsetY, this.flipX, this.scale)
  }
}
