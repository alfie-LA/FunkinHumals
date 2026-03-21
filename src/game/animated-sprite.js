// Animated sprite using a Sparrow atlas.
// Plays named animations at configurable FPS, draws current frame to canvas.

const DEFAULT_FPS = 24

export class AnimatedSprite {
  /**
   * @param {HTMLImageElement} image - Spritesheet image
   * @param {import('./sparrow-atlas.js').SparrowAtlas} atlas - Parsed atlas
   */
  constructor(image, atlas) {
    this.image = image
    this.atlas = atlas

    // Animation registry: { name: { frames, fps, looped, offsets } }
    this.animations = new Map()
    this.currentAnim = null
    this.currentFrames = []
    this.frameIndex = 0
    this.elapsed = 0
    this.finished = false
    this.currentOffsets = [0, 0]
  }

  /**
   * Register an animation from atlas prefix.
   * @param {string} name - Animation name (e.g. "idle", "singLEFT")
   * @param {string} prefix - Atlas frame prefix
   * @param {Object} opts
   * @param {number} [opts.fps=24]
   * @param {boolean} [opts.looped=false]
   * @param {number[]} [opts.frameIndices=null]
   * @param {number[]} [opts.offsets=[0,0]]
   */
  addAnimation(name, prefix, { fps = DEFAULT_FPS, looped = false, frameIndices = null, offsets = [0, 0] } = {}) {
    const frames = this.atlas.getAnimation(prefix, frameIndices)
    if (frames.length === 0) {
      console.warn(`No frames found for animation "${name}" with prefix "${prefix}"`)
      return
    }
    this.animations.set(name, { frames, fps, looped, offsets })
  }

  /** Check if an animation exists. */
  hasAnimation(name) {
    return this.animations.has(name)
  }

  /**
   * Play an animation.
   * @param {string} name
   * @param {boolean} forceRestart - Restart even if already playing
   */
  play(name, forceRestart = false) {
    if (!this.animations.has(name)) return
    if (this.currentAnim === name && !forceRestart && !this.finished) return

    const anim = this.animations.get(name)
    this.currentAnim = name
    this.currentFrames = anim.frames
    this.currentOffsets = anim.offsets
    this.frameIndex = 0
    this.elapsed = 0
    this.finished = false
  }

  /**
   * Advance animation by delta time.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this.currentFrames.length || this.finished) return

    const anim = this.animations.get(this.currentAnim)
    if (!anim) return

    this.elapsed += dt
    const frameDuration = 1.0 / anim.fps

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration
      this.frameIndex++

      if (this.frameIndex >= this.currentFrames.length) {
        if (anim.looped) {
          this.frameIndex = 0
        } else {
          this.frameIndex = this.currentFrames.length - 1
          this.finished = true
        }
      }
    }
  }

  /**
   * Draw the current frame to a canvas context.
   * Position is the character's origin (bottom-center in FNF terms).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {boolean} flipX - Flip horizontally
   * @param {number} scale - Scale multiplier
   */
  draw(ctx, x, y, flipX = false, scale = 1) {
    if (!this.currentFrames.length) return
    const frame = this.currentFrames[this.frameIndex]
    if (!frame) return

    ctx.save()
    ctx.translate(x, y)
    if (flipX) ctx.scale(-1, 1)
    ctx.scale(scale, scale)

    // Apply animation offsets
    const ox = this.currentOffsets[0] || 0
    const oy = this.currentOffsets[1] || 0

    if (frame.rotated) {
      // Rotated frames: stored 90 CW in sheet
      ctx.save()
      ctx.translate(-frame.frameX - ox, -frame.frameY - oy)
      ctx.rotate(-Math.PI / 2)
      ctx.drawImage(this.image,
        frame.x, frame.y, frame.height, frame.width,
        -frame.height, 0, frame.height, frame.width
      )
      ctx.restore()
    } else {
      ctx.drawImage(this.image,
        frame.x, frame.y, frame.width, frame.height,
        -frame.frameX - ox, -frame.frameY - oy, frame.width, frame.height
      )
    }

    ctx.restore()
  }

  /** Get the current frame's logical dimensions (for bounding box). */
  get frameWidth() {
    if (!this.currentFrames.length) return 0
    return this.currentFrames[this.frameIndex]?.frameWidth ?? 0
  }

  get frameHeight() {
    if (!this.currentFrames.length) return 0
    return this.currentFrames[this.frameIndex]?.frameHeight ?? 0
  }
}
